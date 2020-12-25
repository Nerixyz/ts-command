import { StrObject } from './types';
import { IllegalArgumentError } from './errors';
import { CommandArguments } from './command.types';

/**
 *
 * @param {string} message
 * @param {string[]} splitted - everything w/o the initial command
 * @param {CommandArguments<T>} info
 * @returns {T}
 */
export function parseCommand<T extends StrObject>(
  message: string,
  splitted: [string, number][],
  info: CommandArguments<T>,
): T {
  const obj: any = {};

  let msgIdx = 0;
  const next = () => splitted[msgIdx++];
  for (let infoIdx = 0; infoIdx < info.length; infoIdx++) {
    const { name, type, optional } = info[infoIdx];
    if (type === 'flag') {
      const current = splitted[msgIdx]?.[0];
      // check if it's the flag
      if (current?.toLowerCase() === `-${name.toString().toLowerCase()}`) {
        obj[name] = true;
        msgIdx++;
      }
      // if it's not set do nothing
    } else if (type === 'toEnd') {
      // simply read the message to end :)
      obj[name] = message.substring(next()?.[1]);
      break;
    } else if (optional) {
      // check if last or next is also optional
      if (infoIdx + 1 === info.length || info[infoIdx + 1].optional) {
        obj[name] = next()?.[0];
      } else {
        throw new IllegalArgumentError(name.toString(), 'Invalid optional item');
      }
    } else {
      // type: string | number
      const item = next()?.[0];
      obj[name] = type === 'number' ? Number(item) : item;
    }
    if (msgIdx >= splitted.length) break;
  }
  checkObject(obj, info);
  return obj;
}

function checkObject(obj: any, info: CommandArguments): void {
  for (const arg of info) {
    if (arg.optional || arg.type === 'flag') continue;

    if (typeof obj[arg.name])
      if (typeof obj[arg.name] === 'undefined')
        throw new IllegalArgumentError(arg.name.toString(), 'not supplied; required');
  }
}

function readUntil(str: string, start: number, stop: string): [string, number] {
  let buffer = '';
  let escaped = false;
  for (let i = start; i < str.length; i++) {
    const current = str.charAt(i);
    if (!escaped && current === stop) return [buffer, i];
    else if (escaped) {
      buffer += current;
      escaped = false;
    } else if (/["']/.exec(current)) {
      i++;
      const [res, mod] = readUntil(str, i, current);
      buffer += res;
      i = mod;
    } else if (current === '\\') {
      escaped = true;
    } else {
      buffer += current;
    }
  }
  return [buffer, str.length];
}

// todo: /(?:([^ "']+)|"([^"]+)"|'([^']+)')(?: |$)/g
export function tokenizeMessage(target: string): [string, number][] {
  target = target.trim();
  const results: [string, number][] = [];
  for (let i = 0; i < target.length; i++) {
    const [res, mod] = readUntil(target, i, ' ');
    results.push([res, i]);
    i = mod;
  }
  return results;
}
