import { Command, CommandClass, TimeoutClass, Timeout, AbstractCommand } from '../../src';

export class TimeoutCollectionMock {
  @Timeout(500)
  @Command('test')
  test() {
    return 'test';
  }
}

@TimeoutClass(500)
@CommandClass('test')
export class TimeoutClassMock extends AbstractCommand {
  run(): string {
    return 'test';
  }
}

@TimeoutClass(500)
export class TimeoutCombinedMock {
  @Timeout(250)
  @Command('test')
  test() {
    return 'test';
  }
}
