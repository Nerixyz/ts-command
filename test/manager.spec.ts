import * as assert from 'assert';
import { CommandManager } from '../src';
import { RegisteredService } from './testEnv/services.mock';
import { CommandClassMock } from './testEnv/CommandClass.mock';

describe('CommandManager', () => {
  it('runs commands', async () => {
    const manager = new CommandManager().registerService(RegisteredService).load(CommandClassMock);
    const message = 'command test';
    assert.strictEqual(await manager.onCommand(message, null), 'test test test');
  });
});
