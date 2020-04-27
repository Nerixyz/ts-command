import { AbstractCommand } from '../../src/AbstractCommand';
import { ExampleService } from './ExampleService';
import { Command } from '../../src/decorators/Command';

@Command([
  { name: 'prop', type: 'string' },
  { name: 'flag', type: 'flag' },
])
export default class Test extends AbstractCommand {
  constructor(private service: ExampleService) {
    super();
  }

  get name(): string {
    return 'test';
  }

  get aliases(): string[] {
    return ['command'];
  }

  run({ prop, flag }: { prop: string; flag: boolean }): Promise<string> | string {
    return `${prop} ${flag} ${this.service.toString()}`;
  }
}
