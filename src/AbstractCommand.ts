import 'reflect-metadata';

export abstract class AbstractCommand<Props = {}, Result = string> {
  abstract get name(): string;
  get aliases(): string[] {
    return [];
  }

  /**
   * Do the main work
   * @param {Props} props
   * @returns {Promise<Result> | Result}
   */
  abstract run(props: Props): Result | Promise<Result>;

  /**
   * Format to a string if needed
   * @param {Result} result
   * @returns {string}
   */
  format(result: Result): string {
    return result.toString();
  }
}
