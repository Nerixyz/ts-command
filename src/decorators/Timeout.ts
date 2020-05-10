import { CommandFn } from '../command.types';
import { MetadataKey, setMetadata } from './metadata';

export function Timeout(ms: number) {
  return function <K extends string>(target: any, key: K, descriptor: TypedPropertyDescriptor<CommandFn<any>>) {
    setMetadata(target, key, MetadataKey.Timeout, ms);
  };
}
