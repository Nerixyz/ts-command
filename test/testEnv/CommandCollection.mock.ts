import { Command } from '../../src/decorators';

export class CommandCollectionMock {
  @Command('test', 'arg1')
  test({ arg1 }: { arg1: string }): string {
    return arg1;
  }

  @Command('test2', 'arg2')
  test2({ arg2 }: { arg2: string }): string {
    return arg2;
  }
}
