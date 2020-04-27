import Test from './testEnv/test';
import { CommandManager } from '../src/CommandManager';
import * as assert from 'assert';
import { ExampleService } from './testEnv/ExampleService';
import { Cmd1, Cmd2 } from './testEnv/multiExport';

describe('CommandManager', () => {
  it('supports services', () => {
    const manager = new CommandManager();
    const instance = manager.registerService(ExampleService).load(Test).get(Test);
    assert(instance.name, 'The name should be defined (every dependency is injected)');
  });
  const assertDifferentInstances = <T>(instance: T, postInstance: T) => {
    assert(instance, 'Instance should be defined');
    assert(postInstance, 'PostInstance should be defined');
    assert.notStrictEqual(
      instance,
      postInstance,
      'Both should be different as they are loaded from different "files".',
    );
  };
  it('reloads all', () => {
    const manager = new CommandManager();
    const instance = manager.load(Test).get(Test);
    manager.reloadAll();
    assertDifferentInstances(instance, manager.get(Test));
  });
  it('reloads commands by class', () => {
    const manager = new CommandManager();
    const instance = manager.load(Test).get(Test);
    manager.reload(Test);
    assertDifferentInstances(instance, manager.get(Test));
  });
  it('reloads commands by name', () => {
    const manager = new CommandManager();
    const instance = manager.registerService(ExampleService).load(Test).get(Test);
    manager.reload('Test');
    assertDifferentInstances(instance, manager.get(Test));
  });
  it('reloads all multiExports', () => {
    const manager = new CommandManager();
    const cmd1 = manager.load(Cmd1).get(Cmd1);
    const cmd2 = manager.load(Cmd2).get(Cmd2);
    manager.reloadAll();
    assertDifferentInstances(cmd1, manager.get(Cmd1));
    assertDifferentInstances(cmd2, manager.get(Cmd2));
  });
  it('reloads single multiExport', () => {
    const manager = new CommandManager();
    const cmd1 = manager.load(Cmd1).get(Cmd1);
    const cmd2 = manager.load(Cmd2).get(Cmd2);
    manager.reload(Cmd1);
    assertDifferentInstances(cmd1, manager.get(Cmd1));
    assertDifferentInstances(cmd2, manager.get(Cmd2));
  });
  it('runs commands', async () => {
    const manager = new CommandManager().registerService(ExampleService).load(Test);
    const message = 'command cool';
    assert.strictEqual(await manager.onCommand(message), 'cool undefined TestRequirement');
  });
});
