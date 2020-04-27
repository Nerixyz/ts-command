import 'reflect-metadata';
import { AbstractCommand } from '../AbstractCommand';
import { StrObject } from '../types';

export type CommandEntry<T> = {
  type: 'string' | 'flag' | 'number' | 'toEnd';
  name: keyof T;
  optional?: true;
};

export type CommandInfo<T extends StrObject> = Array<CommandEntry<T>>;

export type CommandTarget<T = {}> = Function & { new (...args: any[]): AbstractCommand<T> } & {
  __filename?: string;
  // {Name}.{Filename}
  __commandId?: string;
  __commandInfo?: CommandInfo<T>;
};

export function Command<T = {}>(args: CommandInfo<T>) {
  return function (target: CommandTarget<T>) {
    const targetFilename = getCaller();
    const [, file] = /\\([^\\]+\.ts)$/.exec(targetFilename);
    target.__filename = targetFilename;
    target.__commandId = `${file}.${targetFilename}`;
    target.__commandInfo = args;
  };
}

function getCaller(): string {
  const [, ...stack] = new Error().stack.split('\n');
  const callerLine = stack.filter(x => !x.includes(__filename) && !x.includes('reflect-metadata'))[0];
  return /\((.+)(?::\d+){2}\)/.exec(callerLine)?.[1];
}
