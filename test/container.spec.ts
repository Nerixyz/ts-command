import { CommandContainer } from '../src';
import { RegisteredService, UnregisteredService } from './testEnv/services.mock';
import { CommandClassMock } from './testEnv/CommandClass.mock';
import * as assert from 'assert';
import { MultiExport1, MultiExport2 } from './testEnv/MultiExport.mock';

describe('CommandContainer', () => {
  it('registers services', () => {
    const container = new CommandContainer().registerService(RegisteredService);
    assert.strictEqual(container.services?.length, 1, 'There should be at exactly one service');
    assert.strictEqual(container.services[0]?.value, undefined, 'The value should not be computed yet');
    assert.strictEqual(container.services[0]?.type, RegisteredService, 'The type should be RegisteredService');
  });

  it('gets registered services', () => {
    const container = new CommandContainer().registerService(new RegisteredService(new UnregisteredService()));
    assert.notStrictEqual(container.getService(RegisteredService), undefined, 'It should be defined');
    assert.strictEqual(
      container.services[0]?.value,
      container.getService(RegisteredService),
      'It should return the registered service',
    );
    assert.strictEqual(container.getService(RegisteredService), container.getService(RegisteredService.name));
  });

  it('registers services by instance', () => {
    const unregistered = new UnregisteredService();
    unregistered.toString = () => 'changed';
    const myService = new RegisteredService(unregistered);
    const container = new CommandContainer().registerService(myService);
    assert.strictEqual(container.getService(RegisteredService), myService, 'The instance should be the value');
    assert.strictEqual(container.getService(RegisteredService).toString(), 'changed');
  });

  it('registers services by updateService()', () => {
    const value = new RegisteredService(new UnregisteredService());
    const container = new CommandContainer();
    container.updateService(value);
    assert.strictEqual(container.services?.length, 1, 'There should be at exactly one service');
    assert.strictEqual(container.getService(RegisteredService), value, 'The value should be computed');
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
    const container = new CommandContainer();
    const instance = container.loadCommand(CommandClassMock).get(CommandClassMock);
    container.reloadAll();
    assertDifferentInstances(instance, container.get(CommandClassMock));
  });

  it('reloads commands by class', () => {
    const container = new CommandContainer();
    const instance = container.loadCommand(CommandClassMock).get(CommandClassMock);
    container.reload(CommandClassMock);
    assertDifferentInstances(instance, container.get(CommandClassMock));
    assert(container.get(CommandClassMock).toString());
  });

  it('reloads commands by name', () => {
    const container = new CommandContainer();
    const instance = container.registerService(CommandClassMock).loadCommand(CommandClassMock).get(CommandClassMock);
    container.reload('CommandClassMock');
    assertDifferentInstances(instance, container.get(CommandClassMock));
  });

  it('reloads multiExport files', () => {
    const container = new CommandContainer();
    const instanceOne = container.loadCommand(MultiExport1).get(MultiExport1);
    const instanceTwo = container.loadCommand(MultiExport2).get(MultiExport2);
    container.reload(MultiExport1);
    assertDifferentInstances(instanceOne, container.get(MultiExport1));
    assertDifferentInstances(instanceTwo, container.get(MultiExport2));
  });

  it('reloads all multiExport files', () => {
    const container = new CommandContainer();
    const instanceOne = container.loadCommand(MultiExport1).get(MultiExport1);
    const instanceTwo = container.loadCommand(MultiExport2).get(MultiExport2);
    container.reloadAll();
    assertDifferentInstances(instanceOne, container.get(MultiExport1));
    assertDifferentInstances(instanceTwo, container.get(MultiExport2));
  });
});
