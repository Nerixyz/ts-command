import 'reflect-metadata';

export abstract class AbstractCommand<Props = {}, R extends string = string> {
  abstract run(props: Props, user: any): R | Promise<R>;
}
