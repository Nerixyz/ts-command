export type Class<T, R = any> = { new (...args: any[]): T } & Function & R;
export type InstantiatedClass<T, R = any> = T & { constructor: Class<T, R> };

export type StrObject<T = any> = { [x: string]: T };
