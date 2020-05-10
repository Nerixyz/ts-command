import { Command } from '../../src/decorators';

export class MultiExport1 {
  @Command('multiExport1')
  hello(): string {
    return '1';
  }
}

export class MultiExport2 {
  @Command('multiExport2')
  hello(): string {
    return '2';
  }
}
