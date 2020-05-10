import { addMetadata, getCaller, hasMetadata, MetadataKey, setMetadata } from './metadata';
import { Class } from '../types';
import { AbstractCommand } from '../AbstractCommand';
import { CommandClassConstructor, CommandCreateInfo, RestrictFunction } from '../command.types';

export function CommandClass<T = {}>(name: string | string[], ...args: CommandCreateInfo<T>) {
  return function (target: CommandClassConstructor<T>) {
    if (!hasMetadata(target, MetadataKey.Filename) || !hasMetadata(target, MetadataKey.CommandId)) {
      const caller = getCaller(__filename);
      setMetadata(target, MetadataKey.Filename, caller);
      setMetadata(target, MetadataKey.CommandId, `${target.name}.${caller}`);
    }
    addMetadata(target, MetadataKey.Info, {
      name: typeof name === 'string' ? name : name[0],
      key: 'run',
      aliases: typeof name === 'string' ? [] : name.slice(1),
      arguments: (args ?? []).map(a => (typeof a === 'string' ? { name: a, type: 'string' } : a)),
    });
  };
}

export function RestrictClass<T>(fn: RestrictFunction) {
  return function (target: Class<T>) {
    setMetadata(target, MetadataKey.Restriction, fn);
  };
}
