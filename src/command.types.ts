import { Class, StrObject } from './types';
import { AbstractCommand } from './AbstractCommand';

export type CommandEntry<T> = {
  type: 'string' | 'flag' | 'number' | 'toEnd';
  name: keyof T;
  optional?: true;
};

export type CommandArguments<T = any> = Array<CommandEntry<T>>;
export type CommandCreateInfo<T> = Array<keyof T | CommandEntry<T>>;

export type CommandFn<T extends StrObject> = (args: T, user: any) => string | Promise<string>;
export type CommandClassConstructor<T extends StrObject> = Class<AbstractCommand<T>>;

export type RestrictFunction = (user: any, instance: any) => boolean;

export interface CommandFnInfo {
  key: string;
  name: string;
  aliases: string[];
  arguments: CommandArguments<any>;
  restrict?: RestrictFunction;
}
