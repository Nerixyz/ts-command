export class IllegalArgumentError extends Error {
  constructor(name: string, message?: string) {
    super(`${name}: ${message ?? 'Invalid.'}`);
  }
}

export class IllegalFormatError extends Error {
  constructor() {
    super('The supplied message has an invalid format.');
  }
}

export class CommandNotFoundError extends Error {
  constructor(name: string) {
    super(`${name} could not be found.`);
  }
}
