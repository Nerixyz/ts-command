import { Class } from '../types';

export type ServiceConstructor<T> = Class<T, { __registered?: true; __serviceId?: string; __filename?: string }>;

export function Service() {
  return function (target: ServiceConstructor<any>) {
    target.__registered = true;
    target.__filename = getCaller();
    target.__serviceId = `${target.name}.${target.__filename}`;
  };
}

function getCaller(): string {
  const [, ...stack] = new Error().stack.split('\n');
  const callerLine = stack.filter(x => !x.includes(__filename) && !x.includes('reflect-metadata'))[0];
  return /\((.+)(?::\d+){2}\)/.exec(callerLine)?.[1];
}
