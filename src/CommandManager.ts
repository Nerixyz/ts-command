import { Class } from './types';
import { CommandNotEnabled, NotFoundError, IllegalFormatError } from './errors';
import { parseCommand, tokenizeMessage } from './parsing';
import { CommandContainer } from './CommandContainer';
import { performance } from 'perf_hooks';

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

  reload(target: string | Class) {
    this.container.reload(target);
  }

  reloadAll() {
    this.container.reloadAll();
  }

  async onCommand<T extends string = string>(message: string, user: User): Promise<T> {
    if (!message) throw new IllegalFormatError();
    const commandName = message.indexOf(' ') === -1 ? message : message.substring(0, message.indexOf(' '));
    if (!commandName) throw new IllegalFormatError();

    const tuple = this.container.getCommandByName(commandName);
    if (!tuple && commandName === 'reload') {
      // @ts-ignore -- returns string
      return this.onReload(message, user);
    }
    if (!tuple || tuple.length !== 2 || !tuple[1]) throw new NotFoundError(commandName.substring(0, 40));
    const [wrapper, command] = tuple;

    if (command.restrict && !command.restrict(user, wrapper.instance)) throw new CommandNotEnabled(user, command.name);

    const argsPart = message.substring(commandName.length + 1);
    const argsObj = parseCommand(argsPart, tokenizeMessage(argsPart), command.arguments);

    return await wrapper.instance[command.key](argsObj, user);
  }

  private onReload(message: string, user: User): string {
    try {
      if (!this.reloadOptions.enabled || !this.reloadOptions.restrict(user))
        throw new CommandNotEnabled(user, 'reload');
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
