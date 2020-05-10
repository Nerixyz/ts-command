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

export class NotFoundError extends Error {
  constructor(name: string) {
    super(`${name} could not be found.`);
  }
}

export class CommandNotEnabledError extends Error {
  constructor(public readonly user: any, command: string) {
    super(`${command} is not enabled.`);
  }
}

export class CommandTimeoutError extends Error {
  constructor(command: string) {
    super(`${command} is not enabled.`);
  }
}
