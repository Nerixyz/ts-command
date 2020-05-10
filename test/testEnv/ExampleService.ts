import { Service } from '../../src/decorators';

export class TestRequirement {}

@Service
export class ExampleService {
  constructor(private test: TestRequirement) {}

  toString() {
    return this.test.constructor.name;
  }
}
