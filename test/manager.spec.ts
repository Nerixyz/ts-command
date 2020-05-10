import * as assert from 'assert';
import { CommandManager, CommandTimeoutError } from '../src';
import { RegisteredService } from './testEnv/services.mock';
import { CommandClassMock } from './testEnv/CommandClass.mock';
import { TimeoutClassMock, TimeoutCollectionMock, TimeoutCombinedMock } from './testEnv/TimeoutCommands.mock';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CommandManager', () => {
  it('runs commands', async () => {
    const manager = new CommandManager().registerService(RegisteredService).load(CommandClassMock);
    const message = 'command test';
    assert.strictEqual(await manager.onCommand(message, null), 'test test test');
  });
  it('times out collections', async () => {
    const manager = new CommandManager().load(TimeoutCollectionMock);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
    await assert.rejects(() => manager.onCommand('test', null), CommandTimeoutError);
    await sleep(500);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
  });
  it('times out classes', async () => {
    const manager = new CommandManager().load(TimeoutClassMock);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
    await assert.rejects(() => manager.onCommand('test', null), CommandTimeoutError);
    await sleep(500);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
  });
  it('times out combined collections', async () => {
    const manager = new CommandManager().load(TimeoutCombinedMock);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
    await assert.rejects(() => manager.onCommand('test', null), CommandTimeoutError);
    await sleep(250);
    await assert.rejects(() => manager.onCommand('test', null), CommandTimeoutError);
    await sleep(250);
    assert.strictEqual(await manager.onCommand('test', null), 'test');
  });
});
