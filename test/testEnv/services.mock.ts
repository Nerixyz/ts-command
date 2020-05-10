import { Service } from '../../src/decorators';

export class UnregisteredService {
  toString = () => 'test';
}

@Service()
export class RegisteredService {
  constructor(public service: UnregisteredService) {}

  toString = () => this.service?.toString();
}
