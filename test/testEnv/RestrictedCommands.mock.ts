import { AbstractCommand, Command, CommandClass, Restrict, RestrictClass, Injectable } from '../../src';
import { RegisteredService } from './services.mock';
import 'reflect-metadata';

@RestrictClass((user, instance: RestrictedCommandsMockClass) => instance.service && user.auth)
@CommandClass('restrictedClass')
export class RestrictedCommandsMockClass extends AbstractCommand {
  constructor(private service: RegisteredService) {
    super();
  }

  run(): string {
    return 'test';
  }
}

@Injectable()
@RestrictClass((_, instance: RestrictedCommandsMockCollection) => !!instance.service)
export class RestrictedCommandsMockCollection {
  constructor(private service: RegisteredService) {}

  @Restrict(user => user.auth)
  @Command('restrictedCommand')
  test() {
    return 'test';
  }
}
