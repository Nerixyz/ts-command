import { CommandManager } from '../src';
import { RestrictedCommandsMockClass, RestrictedCommandsMockCollection } from './testEnv/RestrictedCommands.mock';
import * as assert from 'assert';
import { RegisteredService } from './testEnv/services.mock';
import 'reflect-metadata';

describe('Restrictions', () => {
  it('restricts classes', async () => {
    const manager = new CommandManager().registerService(RegisteredService).load(RestrictedCommandsMockClass);
    await assert.rejects(() => manager.onCommand('test', {}));
    assert.strictEqual(await manager.onCommand('restrictedClass', { auth: true }), 'test');
  });

  it('restricts commands', async () => {
    const manager = new CommandManager().registerService(RegisteredService).load(RestrictedCommandsMockCollection);
    await assert.rejects(() => manager.onCommand('test', {}));
    assert.strictEqual(await manager.onCommand('restrictedCommand', { auth: true }), 'test');
  });
});
