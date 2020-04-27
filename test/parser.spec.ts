import * as assert from 'assert';
import { CommandInfo } from '../src/decorators/Command';
import { IllegalArgumentError } from '../src/errors';
import { parseCommand, tokenizeMessage } from '../src/parsing';

describe('Parser', () => {
  it('tokenized', () => {
    assert.deepStrictEqual(tokenizeMessage('command stringA stringB 1234.6 "string C" -flagA \'string D\''), [
      ['command', 0],
      ['stringA', 8],
      ['stringB', 16],
      ['1234.6', 24],
      ['string C', 31],
      ['-flagA', 42],
      ['string D', 49],
    ]);
  });
  it('parses strings', () => {
    const config: CommandInfo<any> = [
      { name: 'first', type: 'string' },
      { name: 'second', type: 'string' },
      { name: 'optional', type: 'string', optional: true },
      { name: 'optional2', type: 'string', optional: true },
      { name: 'optional3', type: 'string', optional: true },
    ];
    let message = 'first second';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      first: 'first',
      second: 'second',
    });
    message = 'first second opt1';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      first: 'first',
      second: 'second',
      optional: 'opt1',
    });
    message = 'first second opt1 opt2';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      first: 'first',
      second: 'second',
      optional: 'opt1',
      optional2: 'opt2',
    });
    message = 'first second opt1 opt2 opt3';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      first: 'first',
      second: 'second',
      optional: 'opt1',
      optional2: 'opt2',
      optional3: 'opt3',
    });
  });
  it('parses numbers', () => {
    const config: CommandInfo<any> = [
      { name: 'first', type: 'number' },
      { name: 'second', type: 'number' },
    ];
    const message = '1.234 1234';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      first: 1.234,
      second: 1234,
    });
  });
  it('parses flags', () => {
    const config: CommandInfo<any> = [
      { name: 'flag', type: 'flag' },
      { name: 'flag2', type: 'flag' },
      { name: 'flag3', type: 'flag' },
      { name: 'flag4', type: 'flag' },
    ];
    const message = '-flag -flag3';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      flag: true,
      flag3: true,
    });
  });
  it('parses long text', () => {
    const config: CommandInfo<any> = [
      { name: 'flag', type: 'flag' },
      { name: 'num', type: 'number' },
      { name: 'str', type: 'string' },
      { name: 'long', type: 'toEnd' },
    ];
    const message = '123.456 abc This is my text :) very cool';
    assert.deepStrictEqual(parseCommand(message, tokenizeMessage(message), config), {
      num: 123.456,
      str: 'abc',
      long: 'This is my text :) very cool'
    });
  });
  it('fails on invalid input', () => {
    const config: CommandInfo<any> = [
      { name: 'flag', type: 'flag' },
      { name: 'num', type: 'number' },
      { name: 'str', type: 'string' },
    ];
    const message = '123';
    assert.throws(() => {
        parseCommand(message, tokenizeMessage(message), config);
    }, IllegalArgumentError);
  });
});
