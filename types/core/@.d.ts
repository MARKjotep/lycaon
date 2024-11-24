export declare function Singleton<T extends {
    new (...args: any[]): any;
}>(constructor: T): {
    new (...args: any[]): {
        [x: string]: any;
    };
} & T;
export declare function Cached<T extends {
    new (...args: any[]): any;
}>(constructor: T): {
    new (...args: any[]): {
        [x: string]: any;
    };
} & T;
export declare class $$ {
    static set p(a: any);
}
export declare class Mapper<K, V> extends Map<K, V> {
    obj(obj?: object | null): void;
    map(map: Map<K, V>): void;
    ass<T>(key: K, obj: T): void;
}
export interface obj<T> {
    [Key: string]: T;
}
export type V = string | number | boolean;
export declare const numSequence: (length: number) => number[];
export declare const RBYTES: RegExp;
export declare const isFN: (v: any) => v is Function, isAsync: (v: any) => v is Function, isNumber: (value: any) => boolean, isDict: (val: object) => boolean, isArraybuff: (val: any) => val is string | Uint8Array | ArrayBuffer, isClassOrId: (k: string) => boolean, isBool: (v: any) => v is boolean, isStr: (v: any) => v is string, isArr: (v: any) => v is any[], isObj: (v: any) => v is object, isNum: (v: any) => v is number;
export declare const oVals: {
    <T>(o: {
        [s: string]: T;
    } | ArrayLike<T>): T[];
    (o: {}): any[];
}, oKeys: {
    (o: object): string[];
    (o: {}): string[];
}, oItems: {
    <T>(o: {
        [s: string]: T;
    } | ArrayLike<T>): [string, T][];
    (o: {}): [string, any][];
}, oHas: (o: object, v: PropertyKey) => boolean, oDefine: <T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T, oAss: {
    <T extends {}, U>(target: T, source: U): T & U;
    <T extends {}, U, V>(target: T, source1: U, source2: V): T & U & V;
    <T extends {}, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    (target: object, ...sources: any[]): any;
}, oLen: (ob: object) => number;
export declare const strip: (char: string, tostrip: string) => string, buffed: (str: string) => Buffer, hdigest: (...salt: string[]) => Buffer, ngify: (str: object) => string, sparse: (str: string) => any, reCamel: (_case: string) => string;
export declare const getSecret: () => string, getByteRange: (fsize: number, range: string) => [number, number, number], getArgs: (params: string[], vals: string[]) => obj<string>;
export declare const pathType: (wrd: string, isFinal?: boolean) => [any, string];
export declare function parsePath(path: string): {
    parsed: string[];
    args: string[];
};
export declare class Time {
    date: Date;
    constructor(dateMS?: number);
    delta(date2?: number | null, _Date?: boolean): number | Date;
    timed(time?: {
        year?: number;
        month?: number;
        day?: number;
        hour?: number;
        minute?: number;
        second?: number;
    }): Date;
    static delta(date1: number, date2?: number | null): number;
    static get now(): number;
}
export declare const makeID: (length: number) => string;
export declare const rand: (min?: number, max?: number) => number;
