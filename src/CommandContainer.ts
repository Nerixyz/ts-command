import { pull } from 'lodash';
import { Class } from './types';
import { IllegalArgumentError, NotFoundError } from './errors';
import * as assert from 'assert';
import { getMetadata, hasMetadata, MetadataKey } from './decorators';
import { CommandFnInfo } from './command.types';
import { injectServices } from './injection';

export type CommandInstanceInfo<T = any> = {
  filename: string;
  commandId: string;
  name: string;
  instance: T;
  class: Class<T>;
  commands: CommandFnInfo[];
};

export type ServiceInfo<T> = {
  type: Class<T>;
  value: T | null;
  // true => do not save the value
  forceCompute: boolean | null;
  dependents: Array<string>;
  invalid: boolean;
  filename: string | null;
  serviceId: string | null;
};
export class CommandContainer {
  commands: CommandInstanceInfo[] = [];
  services: ServiceInfo<any>[] = [];

  loadCommand(cmd: Class): this {
    this.instantiateCommand(cmd);
    return this;
  }

  registerService(service: any | Class, forceCompute = false): this {
    if (typeof service === 'function') {
      // assume it's a constructor
      this.services.push({
        type: service,
        forceCompute,
        dependents: [],
        filename: getMetadata(service, MetadataKey.Filename),
        serviceId: getMetadata(service, MetadataKey.ServiceId),
        value: null,
        invalid: false,
      });
    } else {
      // assume it's a class
      this.services.push({
        type: service.constructor,
        value: service,
        forceCompute,
        dependents: [],
        filename: getMetadata(service.constructor, MetadataKey.Filename),
        serviceId: getMetadata(service.constructor, MetadataKey.ServiceId),
        invalid: false,
      });
    }
    return this;
  }

  hasService(service: any | Class): boolean {
    if (typeof service === 'object') service = service.constructor;
    return !!this.services.find(s => s.type == service);
  }

  updateService(service: any): void {
    const target = this.services.find(s => s.type == service.constructor);
    if (!target) {
      this.registerService(service);
      return;
    }
    target.value = service;
    if (target.invalid) target.invalid = false;
    this.reloadDependents(target);
  }

  private instantiateCommand(cmd: Class): void {
    assert(
      hasMetadata(cmd, MetadataKey.Filename) &&
        hasMetadata(cmd, MetadataKey.CommandId) &&
        hasMetadata(cmd, MetadataKey.Info),
      'The CommandClass has to be registered',
    );
    const instance = injectServices(cmd, this.services);
    if (!instance) throw new IllegalArgumentError('Command is undefined or null');
    const upperRestrict = getMetadata(cmd, MetadataKey.Restriction);
    const upperTimeout: number | undefined = getMetadata(cmd, MetadataKey.Timeout);
    const info = getMetadata<CommandFnInfo[]>(cmd, MetadataKey.Info).map<CommandFnInfo>(i => ({
      ...i,
      restrict:
        // use IIFE to pre get the metadata
        (() => {
          const ownRestrict = getMetadata(cmd.prototype, i.key, MetadataKey.Restriction);
          return ownRestrict
            ? upperRestrict
              ? // combine restrictions
                (user: any, instance: any) => upperRestrict(user, instance) && ownRestrict(user, instance)
              : // use own function
                ownRestrict
            : // use upper function or undefined
              upperRestrict;
        })(),
      timeout: Math.max(upperTimeout || 0, getMetadata(cmd.prototype, i.key, MetadataKey.Timeout) || 0),
    }));
    this.commands.push({
      filename: getMetadata(cmd, MetadataKey.Filename),
      commandId: getMetadata(cmd, MetadataKey.CommandId),
      commands: info,
      name: cmd.name,
      class: cmd,
      instance,
    });
  }

  get<T>(matcher: string | Class<T>): T {
    let command;
    if (typeof matcher === 'string') {
      matcher = matcher.toLowerCase();
      command = this.commands.find(c => c.name.toLowerCase() === matcher);
    } else {
      command = this.commands.find(c => c.class === matcher);
      const matcherId = getMetadata(matcher, MetadataKey.CommandId);
      if (!command && matcherId) {
        // search by id
        command = this.commands.find(c => c.commandId === matcherId);
      }
    }
    return command?.instance;
  }

  getService<T = any>(matcher: string | Class<T>): T {
    if (typeof matcher === 'string') {
      matcher = matcher.toLowerCase();
      return this.services.find(c => c.type.name.toLowerCase() === matcher)?.value as T;
    } else if (typeof matcher === 'function') {
      const serviceId = getMetadata(matcher, MetadataKey.ServiceId);
      assert(serviceId);
      return this.services.find(c => c.serviceId === serviceId)?.value as T;
    } else {
      throw new IllegalArgumentError('matcher');
    }
  }

  /**
   * Get a command by name (case-insensitive)
   * @param {string} name
   * @returns {AbstractCommand | undefined}
   */
  getCommandByName(name: string): [CommandInstanceInfo, CommandFnInfo] | undefined {
    name = name.toLowerCase();
    for (const wrapper of this.commands) {
      for (const command of wrapper.commands) {
        if (command.name.toLowerCase() === name || command.aliases?.find(a => a.toLowerCase() === name))
          return [wrapper, command];
      }
    }
    return undefined;
  }

  reload(target: string | Class): void {
    if (typeof target === 'string') {
      target = target.toLowerCase();
      const command = this.commands.find(
        x =>
          x.name.toLowerCase() === target ||
          x.class.name.toLowerCase() === target ||
          x.commands.find(c => c.name.toLowerCase() === target),
      );
      if (command) {
        return this.reloadCommand(command);
      }
      const service = this.services.find(x => x.filename && x.type.name.toLowerCase() === target);
      if (service) {
        return this.reloadService(service);
      }
      throw new NotFoundError(target);
    } else if (hasMetadata(target, MetadataKey.CommandId)) {
      // is command
      const commandId = getMetadata(target, MetadataKey.CommandId);
      const command = this.commands.find(x => x.commandId === commandId);
      if (command) {
        return this.reloadCommand(command);
      }
      throw new NotFoundError(target.name);
    } else if (hasMetadata(target, MetadataKey.ServiceId)) {
      // is service
      const serviceId = getMetadata(target, MetadataKey.ServiceId);
      const service = this.services.find(x => x.serviceId === serviceId);
      if (service) {
        return this.reloadService(service);
      }
      throw new NotFoundError(target.name);
    }
    throw new IllegalArgumentError('target has to be a reloadable service or command');
  }

  reloadAll() {
    const services = singleKey(
      this.services
        .filter(s => s.filename)
        // @ts-ignore -- the filename is defined
        .map<[string, string]>(s => [s.filename, s.type.name]),
    );
    // keep non reloadable services
    this.services = this.services.filter(s => !s.filename);
    for (const [file, names] of services) {
      for (const name of names) this.registerService(findClassInModule(reloadFile(file), name));
    }
    const commands = singleKey(this.commands.map(c => [c.filename, c.class.name]));
    this.commands = [];
    for (const [file, names] of commands) {
      for (const name of names) this.loadCommand(findClassInModule(reloadFile(file), name));
    }
  }

  private reloadCommand(cmd: CommandInstanceInfo) {
    const toReload = this.commands.filter(c => c.filename === cmd.filename);
    const names = toReload.map(c => c.class.name);
    this.commands = pull(this.commands, ...toReload);

    const reloaded = reloadFile(cmd.filename);
    for (const name of names) {
      this.instantiateCommand(findClassInModule(reloaded, name));
    }
  }

  private reloadService(service: ServiceInfo<any>) {
    if (!service.filename) throw new IllegalArgumentError('service');
    const toReload = this.services.filter(s => s.filename === service.filename);
    const infos: [string, Array<string>][] = toReload.map(c => [c.type.name, c.dependents]);
    this.services = pull(this.services, ...toReload);

    const reloaded = reloadFile(service.filename);
    for (const [name, dependents] of infos) {
      this.registerService(findClassInModule(reloaded, name));
      this.reloadDependents(dependents);
    }
  }

  private reloadDependents(service: ServiceInfo<any> | Array<string>) {
    const dependents = Array.isArray(service) ? service : service.dependents;
    for (const dependent of this.commands.filter(c => dependents.includes(c.filename))) {
      this.reloadCommand(dependent);
    }
  }
}

/**
 *
 * @param {[string, string][]} arr
 * @returns {[string, string[]][]}
 *
 * @example
 *
 * [ [1, 2], [1,3],[1,4] ] => [ [1, [2, 3, 4] ] ]
 */
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
    throw new NotFoundError(file);
  }
  delete require.cache[require.resolve(file)];
  return require(file);
}

function findClassInModule(module: any, name: string): Class {
  if (module.default && typeof module.default === 'function') return module.default;

  for (const [, value] of Object.entries(module)) {
    if (typeof value === 'function' && value.name === name) {
      return value as Class;
    }
  }
  throw new NotFoundError(name);
}
