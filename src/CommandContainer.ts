import { AbstractCommand } from './AbstractCommand';
import { CommandTarget } from './decorators/Command';
import { ServiceConstructor } from './decorators/Service';
import { pull } from 'lodash';
import { Class, InstantiatedClass } from './types';


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
    if(typeof service === 'function') {
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
    if(!target) {
      throw new Error('No service with this constructor is registered');
    }
    target.value = service;
    this.reloadDependents(target);
  }

  private instantiateCommand(cmd: CommandClass): void {
    this.commands.push(this.injectServices(cmd));
  }

  private injectServices<T>(target: Class<T>): InstantiatedClass<T> {
    if (target.length && Reflect && Reflect.getMetadata) {
      const meta: ServiceConstructor<any>[] = Reflect.getMetadata('design:paramtypes', target);
      const params = meta.map(t => {
        if(!t.length)
          return new t();

        let service = this.services.find(s => s.type === t);
        if (!service) {
          // this is temporary and only in dev
          service = this.services.find(s => s.type.__serviceId === t.__serviceId);
          if(!service)
            return undefined;
        }
        if(target.__commandId && !service.dependents.includes(target)) {
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
      new target();
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
    if(typeof target === 'string') {
      target = target.toLowerCase();
      const command = this.commands.find(x => x.name.toLowerCase() === target || x.constructor.name.toLowerCase() === target);
      if(command) {
        return this.reloadCommand(command);
      }
      const service = this.services.find(x => x.type.name.toLowerCase() === target);
      if(service) {
        return this.registerService(service);
      }
      throw new Error('No command or service found.');
    } else if(target.__commandId) {
      // is command
      const command = this.commands.find(x => x.constructor.__commandId === target.__commandId);
      if(command) {
        return this.reloadCommand(command);
      }
      throw new Error('No command found.');
    } else {
      // is service
      const service = this.services.find(x => x.type.__serviceId === target.__serviceId);
      if(service) {
        return this.reloadService(service);
      }
      throw new Error('No service found.');
    }
  }

  reloadAll() {
    const services = this.services.map(s => [s.type.__filename, s.type.name]);
    this.services = [];
    for(const [file, name] of services) {
      this.registerService(CommandContainer.findClassInModule(CommandContainer.reloadFile(file), name));
    }
    const commands = this.commands.map(c => [c.constructor.__filename, c.constructor.name]);
    this.commands = [];
    for(const [file, name] of commands) {
      this.loadCommand(CommandContainer.findClassInModule(CommandContainer.reloadFile(file), name));
    }

  }

  private reloadCommand(cmd: InstantiatedCommand) {
    this.commands = pull(this.commands, cmd);

    const reloaded = CommandContainer.reloadFile(cmd.constructor.__filename);
    this.instantiateCommand(CommandContainer.findClassInModule(reloaded, cmd.constructor.name));
  }
  private reloadService(service: Service<any>) {
    this.services = pull(this.services, service);

    const reloaded = CommandContainer.reloadFile(service.type.__filename);
    this.registerService(CommandContainer.findClassInModule(reloaded, service.type.name));
    this.reloadDependents(service);
  }

  private reloadDependents(service: Service<any>) {
    for(const dependent of this.commands.filter(c => service.dependents.includes(c.constructor))) {
      this.reloadCommand(dependent);
    }
  }

  private static reloadFile(file: string) {
    if (!require.cache[require.resolve(file)]) {
      throw new Error(`No cache for ${file}`);
    }
    delete require.cache[require.resolve(file)];
    return require(file);
  }

  private static findClassInModule(module: any, name: string): CommandClass {
    if (module.default && typeof module.default === 'function') return module.default;

    for (const [, value] of Object.entries(module)) {
      if (typeof value === 'function' && value.name === name) {
        return value as CommandClass;
      }
    }
    throw new Error('No class found in module');
  }
}
