import { Command, CommandClass } from '../../src/decorators';
import { Timeout } from '../../src/decorators/Timeout';
import { AbstractCommand } from '../../src';
import { TimeoutClass } from '../../src/decorators/TimeoutClass';

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
