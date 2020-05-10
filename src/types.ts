export type Class<T = any> = Function & { new (...args: any[]): T };

export type StrObject<T = any> = { [x: string]: T };
