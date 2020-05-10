import { Class } from '../types';
import 'reflect-metadata';
import { getCaller, MetadataKey, setMetadata } from './metadata';

export const Service = () => (target: Class) => {
  const caller = getCaller(__filename);
  setMetadata(target, MetadataKey.Filename, caller);
  setMetadata(target, MetadataKey.ServiceId, `${target.name}.${caller}`);
};
