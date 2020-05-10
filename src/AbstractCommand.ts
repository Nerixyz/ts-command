import 'reflect-metadata';

export abstract class AbstractCommand<Props = {}> {
  abstract run(props: Props, user: any): string | Promise<string>;
}
