import { Service } from '../../src/decorators/Service';

export class TestRequirement {}

@Service()
export class ExampleService {
  constructor(private test: TestRequirement) {}

  toString() {
    return this.test.constructor.name;
  }
}
