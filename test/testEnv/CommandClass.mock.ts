import { AbstractCommand, CommandClass } from '../../src';
import { RegisteredService } from './services.mock';

@CommandClass('command', 'arg')
export class CommandClassMock extends AbstractCommand {
  constructor(private service: RegisteredService) {
    super();
  }

  run({ arg }: { arg: string }): string | Promise<string> {
    return `test ${arg} ${this.service.toString()}`;
  }

  toString = () => this.service.toString();
}
