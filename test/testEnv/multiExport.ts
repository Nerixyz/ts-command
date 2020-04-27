import { AbstractCommand } from '../../src/AbstractCommand';
import { Command } from '../../src/decorators/Command';

@Command([])
export class Cmd1 extends AbstractCommand {
  get name(): string {
    return 'cmd1';
  }

  run(props: {}): Promise<string> | string {
    return undefined;
  }
}

@Command([])
export class Cmd2 extends AbstractCommand {
  get name(): string {
    return 'cmd2';
  }

  run(props: {}): Promise<string> | string {
    return undefined;
  }
}
