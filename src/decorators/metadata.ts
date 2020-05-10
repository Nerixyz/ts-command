import * as assert from 'assert';
import 'reflect-metadata';
import { Class } from '../types';

type MetadataHolder = Function | Class | any;

export function addMetadata<T = any>(target: MetadataHolder, key: MetadataKey, obj: T): void;
export function addMetadata<T = any>(target: MetadataHolder, propertyKey: string, key: MetadataKey, obj: T): void;
export function addMetadata(
  target: MetadataHolder,
  propertyKey: string | undefined,
  key: string | any,
  obj?: any,
): void {
  if (!obj) {
    obj = key;
    key = propertyKey;
    propertyKey = undefined;
  }
  assert(Reflect && Reflect.defineMetadata);
  // @ts-ignore -- overload
  const array: any[] = Reflect.getMetadata(key, target, propertyKey) ?? [];
  array.push(obj);
  // @ts-ignore -- overload
  Reflect.defineMetadata(key, array, target, propertyKey);
}

export function setMetadata<T = any>(target: MetadataHolder, key: MetadataKey, obj: T): void;
export function setMetadata<T = any>(target: MetadataHolder, propertyKey: string, key: MetadataKey, obj: T): void;
export function setMetadata(
  target: MetadataHolder,
  propertyKey: string | undefined,
  key: string | any,
  obj?: any,
): void {
  if (!obj) {
    obj = key;
    key = propertyKey;
    propertyKey = undefined;
  }
  assert(Reflect && Reflect.defineMetadata);
  // @ts-ignore -- overload
  Reflect.defineMetadata(key, obj, target, propertyKey);
}

export function hasMetadata(target: MetadataHolder, key: MetadataKey): boolean;
export function hasMetadata(target: MetadataHolder, propertyKey: string, key: MetadataKey): boolean;
export function hasMetadata(
  target: MetadataHolder,
  propertyKey: string | MetadataKey | undefined,
  key?: string | MetadataKey,
): boolean {
  if (!key) {
    key = propertyKey;
    propertyKey = undefined;
  }
  // @ts-ignore -- overload
  return Reflect.hasMetadata(key, target, propertyKey);
}

export function getMetadata<T = any>(target: MetadataHolder, key: MetadataKey): T;
export function getMetadata<T = any>(target: MetadataHolder, propertyKey: string, key: MetadataKey): T;
export function getMetadata(
  target: MetadataHolder,
  propertyKey: string | MetadataKey | undefined,
  key?: string | MetadataKey,
): any {
  if (!key) {
    key = propertyKey;
    propertyKey = undefined;
  }
  // @ts-ignore -- overload
  return Reflect.getMetadata(key, target, propertyKey);
}

export function getCaller(preFile: string): string {
  const error = new Error();
  const [, ...stack] = error.stack.split('\n');
  const callerLine = stack.filter(
    x => !x.includes(__filename) && !x.includes(preFile) && !x.includes('reflect-metadata'),
  )[0];
  return /\((.+)(?::\d+){2}\)/.exec(callerLine)?.[1] ?? '';
}

export enum MetadataKey {
  Filename = 'cmd:filename',
  ServiceId = 'cmd:service-id',
  Info = 'cmd:info',
  Restriction = 'cmd:restriction',
  CommandId = 'cmd:command-id',
}
