import { AbstractCommand } from './AbstractCommand';
import { CommandTarget } from './decorators/Command';
import { ServiceConstructor } from './decorators/Service';
import { pull } from 'lodash';
import { Class, InstantiatedClass } from './types';
import { IllegalArgumentError } from './errors';

type Service<T> = {
  type: ServiceConstructor<T>;
  value?: T;
  // true => do not save the value
  forceCompute?: boolean;
  dependents: Class<AbstractCommand>[];
};
type InstantiatedCommand = InstantiatedClass<AbstractCommand, CommandTarget>;
export type CommandClass<T extends AbstractCommand = AbstractCommand> = Class<T, CommandTarget>;

export class CommandContainer {
  commands: InstantiatedCommand[] = [];
  services: Service<any>[] = [];

  loadCommand(cmd: CommandClass): this {
    this.instantiateCommand(cmd);
    return this;
  }

  registerService(service: InstantiatedClass<any> | Class<any>, forceCompute = false): this {
    if (typeof service === 'function') {
      // assume it's a constructor
      this.services.push({
        type: service,
        forceCompute,
        dependents: [],
      });
    } else {
      // assume it's a class
      this.services.push({
        type: service.constructor,
        value: service,
        forceCompute,
        dependents: [],
      });
    }
    return this;
  }

  updateService(service: InstantiatedClass<any>): void {
    const target = this.services.find(s => s.type == service.constructor);
    if (!target) {
      throw new Error('No service with this constructor is registered');
    }
    target.value = service;
    this.reloadDependents(target);
  }

  private instantiateCommand(cmd: CommandClass): void {
    const instance = this.injectServices<AbstractCommand>(cmd);
    if (!instance) throw new IllegalArgumentError('Command is undefined or null');
    this.commands.push(instance);
  }

  private injectServices<T>(target: Class<T>): InstantiatedClass<T> {
    if (target.length && Reflect && Reflect.getMetadata) {
      const meta: ServiceConstructor<any>[] = Reflect.getMetadata('design:paramtypes', target);
      const params = meta.map(t => {
        if (!t.length) return new t();

        let service = this.services.find(s => s.type === t);
        if (!service) {
          // this is temporary and only in dev
          service = this.services.find(s => s.type.__serviceId === t.__serviceId);
          if (!service) return undefined;
        }
        if (target.__commandId && !service.dependents.includes(target)) {
          // it's a command constructor
          service.dependents.push(target);
        }
        if (service.value) return service.value;

        const instance = this.injectServices(service.type);
        if (!service.forceCompute) service.value = instance;

        return instance;
      });
      return new target(...params);
    } else {
      return new target();
    }
  }

  get<T extends AbstractCommand>(matcher: string | CommandClass<T>): T {
    if (typeof matcher === 'string') {
      // @ts-ignore -- assume the user knows the name and type
      return this.commands.find(c => c.name === matcher);
    } else if (typeof matcher === 'function') {
      // @ts-ignore -- assume the user knows the name and type -- the class MUST have __filename
      return this.commands.find(c => c.constructor.__commandId === matcher.__commandId);
    } else {
      throw new Error('Unknown matcher');
    }
  }

  getService<T = any>(matcher: string | ServiceConstructor<T>): T {
    if (typeof matcher === 'string') {
      return this.services.find(c => c.type.name.toLowerCase() === matcher.toLowerCase())?.value as T;
    } else if (typeof matcher === 'function') {
      return this.services.find(c => c.type.__serviceId === matcher.__serviceId)?.value as T;
    } else {
      throw new Error('Unknown matcher');
    }
  }

  /**
   * Get a command by name (case-insensitive)
   * @param {string} name
   * @returns {AbstractCommand | undefined}
   */
  getCommandByName(name: string): InstantiatedCommand | undefined {
    name = name.toLowerCase();
    return this.commands.find(c => c.name.toLowerCase() === name || c.aliases?.find(a => a.toLowerCase() === name));
  }

  reload(target: string | Class<AbstractCommand> | ServiceConstructor<any>) {
    if (typeof target === 'string') {
      target = target.toLowerCase();
      const command = this.commands.find(
        x => x.name.toLowerCase() === target || x.constructor.name.toLowerCase() === target,
      );
      if (command) {
        return this.reloadCommand(command);
      }
      const service = this.services.find(x => x.type.name.toLowerCase() === target);
      if (service) {
        return this.registerService(service);
      }
      throw new Error('No command or service found.');
    } else if (target.__commandId) {
      // is command
      const command = this.commands.find(x => x.constructor.__commandId === target.__commandId);
      if (command) {
        return this.reloadCommand(command);
      }
      throw new Error('No command found.');
    } else {
      // is service
      const service = this.services.find(x => x.type.__serviceId === target.__serviceId);
      if (service) {
        return this.reloadService(service);
      }
      throw new Error('No service found.');
    }
  }

  reloadAll() {
    const services = singleKey(this.services.map(s => [s.type.__filename, s.type.name]));
    this.services = [];
    for (const [file, names] of services) {
      for (const name of names) this.registerService(findClassInModule(reloadFile(file), name));
    }
    const commands = singleKey(this.commands.map(c => [c.constructor.__filename, c.constructor.name]));
    this.commands = [];
    for (const [file, names] of commands) {
      for (const name of names) this.loadCommand(findClassInModule(reloadFile(file), name));
    }
  }

  private reloadCommand(cmd: InstantiatedCommand) {
    const toReload = this.commands.filter(c => c.constructor.__filename === cmd.constructor.__filename);
    const names = toReload.map(c => c.constructor.name);
    this.commands = pull(this.commands, ...toReload);

    const reloaded = reloadFile(cmd.constructor.__filename);
    for (const name of names) {
      this.instantiateCommand(findClassInModule(reloaded, name));
    }
  }

  private reloadService(service: Service<any>) {
    const toReload = this.services.filter(c => c.type.__filename === service.type.__filename);
    const infos: [string, Array<Class<AbstractCommand>>][] = toReload.map(c => [c.type.name, c.dependents]);
    this.services = pull(this.services, ...toReload);

    const reloaded = reloadFile(service.type.__filename);
    for (const [name, dependents] of infos) {
      this.registerService(findClassInModule(reloaded, name));
      this.reloadDependents(dependents);
    }
  }

  private reloadDependents(service: Service<any> | Array<Class<AbstractCommand>>) {
    const dependents = Array.isArray(service) ? service : service.dependents;
    for (const dependent of this.commands.filter(c => dependents.includes(c.constructor))) {
      this.reloadCommand(dependent);
    }
  }
}

function singleKey(arr: [string, string][]): [string, string[]][] {
  const obj: { [x: string]: string[] } = {};
  for (const [k, v] of arr) {
    if (obj[k]) {
      obj[k].push(v);
    } else {
      obj[k] = [v];
    }
  }
  return Object.entries(obj);
}

function reloadFile(file: string) {
  if (!require.cache[require.resolve(file)]) {
    throw new Error(`No cache for ${file}`);
  }
  delete require.cache[require.resolve(file)];
  return require(file);
}

function findClassInModule(module: any, name: string): CommandClass {
  if (module.default && typeof module.default === 'function') return module.default;

  for (const [, value] of Object.entries(module)) {
    if (typeof value === 'function' && value.name === name) {
      return value as CommandClass;
    }
  }
  throw new Error('No class found in module');
}
