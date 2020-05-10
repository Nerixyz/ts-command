import * as assert from 'assert';

export function Injectable() {
  return function (target: any) {
    assert(target);
  };
}
