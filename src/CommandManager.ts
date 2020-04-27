import { CommandClass, CommandContainer } from './CommandContainer';
import { ServiceConstructor } from './decorators/Service';
import { AbstractCommand } from './AbstractCommand';
import { Class } from './types';
import { CommandNotEnabled, CommandNotFoundError, IllegalFormatError } from './errors';
import { parseCommand, tokenizeMessage } from './parsing';

export class CommandManager<User = any> {
  private container = new CommandContainer();

  registerService(service: ServiceConstructor<any>): this {
    this.container.registerService(service);
    return this;
  }
  load(command: CommandClass): this {
    this.container.loadCommand(command);
    return this;
  }
  get<T extends AbstractCommand>(matcher: string | CommandClass<T>): T {
    return this.container.get(matcher);
  }
  reload(target: string | Class<AbstractCommand> | ServiceConstructor<any>) {
    this.container.reload(target);
  }
  reloadAll() {
    this.container.reloadAll();
  }

  async onCommand(message: string, user: User): Promise<string> {
    if (!message) throw new IllegalFormatError();
    const commandName = message.indexOf(' ') === -1 ? message : message.substring(0, message.indexOf(' '));
    if (!commandName) throw new IllegalFormatError();

    const command = this.container.getCommandByName(commandName);
    if (!command) throw new CommandNotFoundError(commandName.substring(0, 40));

    if (!command.isEnabled(user)) throw new CommandNotEnabled(user, command.name);

    const argsPart = message.substring(commandName.length + 1);
    const argsObj = parseCommand(argsPart, tokenizeMessage(argsPart), command.constructor.__commandInfo);

    return command.format(await command.run(argsObj, user));
  }
}
