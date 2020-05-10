import { Class } from '../types';
import { MetadataKey, setMetadata } from './metadata';

export function TimeoutClass<T>(ms: number) {
  return function (target: Class<T>) {
    setMetadata(target, MetadataKey.Timeout, ms);
  };
}
