import * as bun from 'bun';
import { ServerWebSocket, Serve, WebSocketHandler, Server } from 'bun';
import { ServerSide, Auth } from 'authored';

interface obj<T> {
    [Key: string]: T;
}
type meta<T> = {
    charset?: T;
    content?: T;
    "http-equiv"?: T;
    name?: T;
    media?: T;
    url?: T;
};
type link<T> = {
    href?: T;
    hreflang?: T;
    media?: T;
    referrerpolicy?: T;
    rel?: "stylesheet" | "icon" | "manifest" | T;
    sizes?: T;
    title?: T;
    type?: T;
    as?: T;
};
type impmap = {
    imports?: obj<string>;
    scopes?: obj<string>;
    integrity?: obj<string>;
};
type script<T> = {
    async?: T;
    crossorigin?: T;
    defer?: T;
    integrity?: T;
    nomodule?: T;
    referrerpolicy?: T;
    src?: T;
    type?: "text/javascript" | T;
    id?: T;
    importmap?: impmap;
    body?: T;
};
type base = {
    href?: string;
    target?: "_blank" | "_parent" | "_self" | "_top";
};
interface headP {
    title?: string;
    base?: base[];
    meta?: meta<V>[];
    link?: link<V>[];
    script?: script<V>[];
}
declare class $$ {
    static set p(a: any);
    static rand(min?: number, max?: number): number;
}
type V = string | number | boolean;
declare function session(...itm: any[]): any;
declare function jwt(...itm: any[]): any;
declare function jwt_refresh(...itm: any[]): any;
declare class request {
    req: Request;
    server?: Server | undefined;
    formData?: FormData;
    headers: Headers;
    url: URL;
    __cookies: obj<string>;
    constructor(req: Request, server?: Server | undefined);
    get auth(): string | undefined;
    get accept(): string | null;
    get contentType(): string | null;
    get cookies(): obj<string>;
    form(): Promise<FormData>;
    get ip(): "" | bun.SocketAddress;
    get isForm(): boolean;
    get isEventStream(): boolean | undefined;
    get method(): string;
    get path(): string;
    get parsed(): string[];
    get searchParams(): URLSearchParams;
    get range(): string | undefined;
    authgroup(): Promise<{
        sid: string;
        jwtv: string;
        refreshjwt: string;
    }>;
    get upgrade(): string | null;
    upgraded(data?: any): boolean | undefined;
}
declare class _r {
    private headattr;
    get head(): obj<string[]>;
    set head(heads: headP);
}
declare class eStream {
    ctrl?: ReadableStreamDefaultController<any> | undefined;
    intervalID: Timer[];
    constructor(ctrl?: ReadableStreamDefaultController<any> | undefined);
    push(fn: () => {
        id: string | number;
        data: string | obj<string>;
        event?: string;
        retry?: number;
        end?: boolean;
    }, interval?: number): void;
    close(): void;
}
declare class response extends _r {
    request: request;
    [Key: string]: any;
    lang: string;
    status?: number;
    stream?: eStream;
    private headers;
    private __session;
    private __jwt;
    constructor(request: request);
    get?(...args: any[]): Promise<any>;
    post?(...args: any[]): Promise<any>;
    put?(...args: any[]): Promise<any>;
    patch?(...args: any[]): Promise<any>;
    error?(...args: any[]): Promise<any>;
    eventStream?(...args: any[]): Promise<any>;
    get session(): ServerSide;
    set session(sesh: ServerSide);
    get jwt(): ServerSide;
    set jwt(jwt: ServerSide);
    get timedJWT(): ServerSide;
    set header(head: obj<string>);
    get header(): obj<string>;
    set type(content: string);
    setCookie({ key, val, path, days, httpOnly, }: {
        key: string;
        val: string;
        path?: string;
        days?: number;
        httpOnly?: boolean;
    }): void;
    deleteCookie(key: string): void;
}
declare class wss {
    request: request;
    [Key: string]: any;
    ws: ServerWebSocket<{
        wclass: wss;
    }>;
    path: string;
    id: string;
    broadcasting: boolean;
    max: number;
    constructor(request: request);
    init?(...args: any[]): Promise<void>;
    open(): Promise<void>;
    message(message: string | Buffer | undefined): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    set send(message: string | Bun.BufferSource | undefined);
    get role(): "maker" | "joiner" | "god" | undefined;
}
declare class Yurl {
    _class: typeof response | typeof wss | null;
    url: string;
    parsedURL: string[];
    args: string[];
    isFile: boolean;
    isWS: boolean;
    fileType: string;
    bytes?: Uint8Array;
    maxClient: number;
    withSession: boolean;
    preload: boolean;
    broadcastWSS: boolean;
    constructor({ url, _class, isFile, withSession, preload, isWS, }: {
        url: string;
        _class?: typeof response | typeof wss | null;
        isFile?: boolean;
        withSession?: boolean;
        preload?: boolean;
        isWS?: boolean;
    });
    loadbytes(apt: string): void;
}
declare class Xurl {
    Yurl?: Yurl;
    status: number;
    x_args: string[];
    headers: Headers;
    constructor({ Yurl, status, headers, }: {
        Yurl?: Yurl;
        status?: number;
        headers?: obj<string>;
    }, x_args?: string[]);
    set header(head: obj<string>);
    set type(content: string);
    gzip(ctx: Uint8Array | string | ArrayBuffer): Uint8Array;
}
declare class Router {
    id: string;
    private static router;
    apt: string;
    headstr: string;
    private constructor();
    set route(yurl: Yurl);
    folder(path: string, option?: {}): void;
    private isFile;
    get({ parsed, wss, _path, }: {
        parsed: string[];
        wss?: boolean;
        _path?: string;
    }): Xurl;
    static get init(): Router;
}
declare class Render {
    private app;
    private data;
    constructor(app: any, data?: any);
    _head(path: string): string;
    render(head: string, lang: string): Promise<string>;
}
interface dev {
    url?: string;
    hostname?: string;
    method?: string;
    port?: number;
}
declare class Lycaon extends _r {
    dir: string;
    static headstr: string;
    apt: string;
    router: Router;
    constructor(dir?: string, options?: {
        envPath?: string;
        appDir?: string;
        session?: Auth;
    });
    path(path: string): <T extends typeof response>(f: T) => T;
    file(furl: string, option?: {
        session?: boolean;
        preload?: boolean;
    }): string;
    wss(url: string, opts?: {
        broadcast?: boolean;
        maxClient?: number;
        session?: boolean;
    }): <T extends typeof wss>(f: T) => T;
    folder(path: string, option?: {
        session?: boolean;
    }): void;
    folders(...paths: string[]): void;
    redirect(url: string): Response;
    serve(options: Partial<Serve> & dev, wssOptions?: Partial<WebSocketHandler>): Promise<void>;
}

export { $$, Lycaon, Render, type headP, jwt, jwt_refresh, type obj, response, session, wss };
