import 'reflect-metadata';
import { CommandArguments, CommandCreateInfo, CommandFn, CommandFnInfo, RestrictFunction } from '../command.types';
import { addMetadata, getCaller, hasMetadata, MetadataKey, setMetadata } from './metadata';
import * as assert from 'assert';

export function Command<T = {}, R extends string = string>(name: string | string[], ...args: CommandCreateInfo<T>) {
  // the descriptor is necessary for type checking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, descriptor: TypedPropertyDescriptor<CommandFn<T, R>>) {
    assert(target.constructor, 'The @Command() decorator can only be used on a class-method');
    // target: Class.prototype;
    // Class.prototype: { constructor: Class };
    // why? pepeLaugh I'm no aware
    target = target.constructor;
    if (!hasMetadata(target, MetadataKey.Filename) || !hasMetadata(target, MetadataKey.CommandId)) {
      const caller = getCaller(__filename);
      setMetadata(target, MetadataKey.Filename, caller);
      setMetadata(target, MetadataKey.CommandId, `${target.name}.${caller}`);
    }
    addMetadata<CommandFnInfo>(target, MetadataKey.Info, {
      name: typeof name === 'string' ? name : name[0],
      key,
      aliases: typeof name === 'string' ? [] : name.slice(1),
      arguments: (args ?? []).map(a => (typeof a === 'string' ? { name: a, type: 'string' } : a)) as CommandArguments,
    });
  };
}

export function Restrict(fn: RestrictFunction) {
  // only on command function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function <K extends string>(target: any, key: K, descriptor: TypedPropertyDescriptor<CommandFn<any, any>>) {
    setMetadata(target, key, MetadataKey.Restriction, fn);
  };
}
