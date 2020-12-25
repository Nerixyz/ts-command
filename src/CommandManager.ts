import { Class } from './types';
import { CommandNotEnabledError, NotFoundError, IllegalFormatError, CommandTimeoutError } from './errors';
import { parseCommand, tokenizeMessage } from './parsing';
import { CommandContainer } from './CommandContainer';
import { performance } from 'perf_hooks';
import { CommandFn, CommandFnInfo } from './command.types';

export interface ReloadOptions<User = any> {
  enabled: boolean;
  restrict?: (user: User) => boolean;
}

export class CommandManager<User = any> {
  private container = new CommandContainer();
  private reloadOptions: ReloadOptions<User>;

  constructor(reload?: ReloadOptions<User> | boolean) {
    this.reloadOptions = reload
      ? typeof reload === 'boolean'
        ? { enabled: false }
        : {
            enabled: true,
            restrict: () => true,
            ...reload,
          }
      : { enabled: false };
  }

  registerService(service: any | Class): this {
    this.container.registerService(service);
    return this;
  }

  updateService(service: any) {
    return this.container.updateService(service);
  }

  hasService(service: any): boolean {
    return this.container.hasService(service);
  }

  load(command: Class): this {
    this.container.loadCommand(command);
    return this;
  }

  get<T>(matcher: string | Class<T>): T {
    return this.container.get(matcher);
  }

  getService<T>(matcher: string | Class<T>): T {
    return this.container.getService(matcher);
  }

  injectServices<T>(target: Class<T>): T {
    return this.container.injectServices(target);
  }

  reload(target: string | Class) {
    this.container.reload(target);
  }

  reloadAll() {
    this.container.reloadAll();
  }

  getAllCommands(): CommandFnInfo[] {
    return this.container.getAllCommands();
  }

  /**
   * @throws {IllegalFormatError|CommandNotEnabledError|CommandTimeoutError|NotFoundError|IllegalArgumentError}
   * @param {string} message
   * @param {User} user
   * @param {() => void} preCommand
   * @returns {Promise<T & string>}
   */
  async onCommand<T = string>(message: string, user: User, preCommand?: () => void): Promise<T & string> {
    if (!message) throw new IllegalFormatError();
    const commandName = message.indexOf(' ') === -1 ? message : message.substring(0, message.indexOf(' '));
    if (!commandName) throw new IllegalFormatError();

    const tuple = this.container.getCommandByName(commandName);
    if (!tuple && commandName === 'reload') {
      // @ts-ignore -- returns string as base
      return this.onReload(message, user);
    }
    if (!tuple || tuple.length !== 2 || !tuple[1]) throw new NotFoundError(commandName.substring(0, 40));
    const [wrapper, command] = tuple;

    if (command.restrict && !command.restrict(user, wrapper.instance))
      throw new CommandNotEnabledError(user, command.name);
    if (command.timeout) {
      const now = Date.now();
      if (now - command.lastTimestamp < command.timeout) {
        throw new CommandTimeoutError(command.name);
      }
      command.lastTimestamp = now;
    }

    const argsPart = message.substring(commandName.length + 1).trim();
    const argsObj = parseCommand(argsPart, tokenizeMessage(argsPart), command.arguments);

    preCommand?.();
    // noinspection ES6RedundantAwait
    return await (wrapper.instance[command.key] as CommandFn<any, T & string>)(argsObj, user, {
      commandInfo: command,
      commandName,
      message,
      rawArgs: argsPart,
    });
  }

  private onReload(message: string, user: User): string {
    try {
      if (!this.reloadOptions.enabled || !this.reloadOptions.restrict(user))
        throw new CommandNotEnabledError(user, 'reload');
      const argsPart = message.substring('reload'.length + 1);
      const { arg } = parseCommand(argsPart, tokenizeMessage(argsPart), [{ type: 'string', name: 'arg' }]);
      const start = performance.now();
      this.reload(arg);
      const end = performance.now();
      return `Reloaded ${arg} in ${end - start}ms.`;
    } catch (e) {
      if (e instanceof NotFoundError) {
        return e.message;
      }
      throw e;
    }
  }
}
