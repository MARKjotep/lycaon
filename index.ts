/// <reference path="./types/types.d.ts" />
import {
  BunFile,
  file,
  Serve,
  Server,
  ServerWebSocket,
  WebSocketHandler,
  gzipSync,
  write,
  gunzipSync,
  serve,
} from "bun";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { JWTInterface, ServerInterface, ServerSide, Seshion } from "./seshion";

export interface obj<T> {
  [Key: string]: T;
}

export const $$ = {
  set p(a: any) {
    if (Array.isArray(a)) {
      console.log(...a);
    } else {
      console.log(a);
    }
  },
  textD: new TextDecoder(),
};

/*
-------------------------


-------------------------
*/
export const O = {
  vals: Object.values,
  keys: Object.keys,
  items: Object.entries,
  has: Object.hasOwn,
  define: Object.defineProperty,
  ass: Object.assign,
  length: (ob: Object) => {
    return Object.keys(ob).length;
  },
};

const generate = {
  numSequence: (length: number) => Array.from({ length }).map((_, ind) => ind),
};

export const str = {
  charU: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  charL: "abcdefghijklmnopqrstuvwxyz",
  nums: generate.numSequence(9).join(""),
  rbytes: new RegExp(/(\d+)(\d*)/, "m"),
  strip: (char: string, tostrip: string) => {
    let _char = char;
    if (_char.startsWith(tostrip)) {
      _char = _char.slice(1);
    }
    if (_char.endsWith(tostrip)) {
      _char = _char.slice(0, -1);
    }
    return _char;
  },
  decode(str: any) {
    return $$.textD.decode(str);
  },
};

export const is = {
  bool: (v: any) => typeof v === "boolean",
  str: (v: any) => typeof v === "string",
  arr: (v: any) => Array.isArray(v),
  file: async (path: string, data?: string) => {
    try {
      return statSync(path).isFile();
    } catch (err) {
      if (data !== undefined) writeFileSync(path, Buffer.from(data));
      return true;
    }
  },
  dir: (path: string) => {
    try {
      return statSync(path).isDirectory();
    } catch (err) {
      mkdirSync(path, { recursive: true });
      return true;
    }
  },
  number: (value: any) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
  dict: (val: object) => {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  },
  arraybuff: (val: any) => {
    return (
      val instanceof Uint8Array ||
      val instanceof ArrayBuffer ||
      typeof val === "string"
    );
  },
};

const path = {
  type: (wrd: string, isFinal: boolean = false) => {
    let lit_type: [any, string] | [] = [];

    if (is.number(wrd)) {
      const nm = wrd;
      if (Number.isInteger(nm)) {
        lit_type = [nm, "int"];
      } else {
        lit_type = [nm, "float"];
      }
    } else {
      if (isFinal && wrd.includes(".")) {
        lit_type = [wrd, "file"];
      } else {
        let tps = "-";
        if (wrd.length == 36) {
          const dashy = wrd.match(/\-/g);
          if (dashy && dashy.length == 4) {
            tps = "uuid";
          } else {
            tps = "string";
          }
        } else if (wrd != "/") {
          tps = "string";
        }
        lit_type = [wrd, tps];
      }
    }

    return lit_type;
  },
  parse: (path: string) => {
    const prsed = path.match(/(?<=\/)[^/].*?(?=\/|$)/g) ?? ["/"];

    const [parsed, args] = prsed.reduce<string[][]>(
      (pr, kv) => {
        const [prsd, args] = pr;
        if (kv.includes("<")) {
          const tgp = kv.match(/(?<=<)[^/].*?(?=>|$)/g);
          if (tgp?.length) {
            const [_type, _arg] = tgp[0].split(":");
            prsd.push(_type);
            args.push(_arg);
          }
        } else {
          prsd.push(kv);
        }
        return pr;
      },
      [[], []],
    );

    if (path.endsWith("/") && path.length > 1) {
      parsed.push("/");
    }

    return { parsed, args };
  },
};

export const html = {
  attr: (attr: obj<V>) => {
    return O.items(attr)
      .reduce<string[]>(
        (acc, [k, v]) => {
          acc.push(is.bool(v) ? k : `${k}="${v}"`);
          return acc;
        },
        [""],
      )
      .join(" ");
  },
  head: (v?: headP) => {
    if (v) {
      return O.items(v).reduce<string[]>((acc, [kk, vv]) => {
        if (is.str(vv)) {
          acc.push(`<${kk}>${vv}</${kk}>`);
        } else if (is.arr(vv)) {
          const rdced = vv.reduce((prv, vl) => {
            let ender = "";
            if (kk == "script") {
              let scrptbdy = "";
              if ("importmap" in vl) {
                vl["type"] = "importmap";
                scrptbdy = JSON.stringify(vl.importmap);
                delete vl.importmap;
              } else if ("body" in vl) {
                scrptbdy = vl.body;
                delete vl.body;
              }
              ender = `${scrptbdy}</${kk}>`;
            }
            prv.push(`<${kk}${html.attr(vl)}>${ender}`);
            return prv;
          }, []);
          acc.push(...rdced);
        }

        return acc;
      }, []);
    }
    return [];
  },
  cookie: (
    key: string,
    value: string = "",
    {
      maxAge,
      expires,
      path,
      domain,
      secure,
      httpOnly,
      sameSite,
    }: {
      maxAge?: Date | number;
      expires?: Date | string | number;
      path?: string | null;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: string | null;
      sync_expires?: boolean;
      max_size?: number;
    },
  ) => {
    if (maxAge instanceof Date) {
      maxAge = maxAge.getSeconds();
    }

    if (expires instanceof Date) {
      expires = expires.toUTCString();
    } else if (expires === 0) {
      expires = new Date().toUTCString();
    }

    const cprops = [
      ["Domain", domain],
      ["Expires", expires],
      ["Max-Age", maxAge],
      ["Secure", secure],
      ["HttpOnly", httpOnly],
      ["Path", path],
      ["SameSite", sameSite],
    ];

    return cprops
      .reduce<string[]>(
        (acc, [kk, v]) => {
          if (v !== undefined) acc.push(`${kk}=${v}`);
          return acc;
        },
        [`${key}=${value}`],
      )
      .join("; ");
  },
};

// returns number in milliseconds format
export class Time {
  date: Date;
  constructor(dateMS?: number) {
    this.date = dateMS ? new Date(dateMS) : new Date();
  }
  delta(date2: number | null = null, _Date: boolean = false) {
    const TD = Time.delta(this.date.getTime(), date2);
    return _Date ? new Date(TD) : TD;
  }
  //
  timed(time?: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
  }) {
    const tmd = this.date.getTime();
    let endD = this.date;
    if (time) {
      const { year, month, day, hour, minute, second } = time;
      if (year) {
        endD = new Date(endD.setFullYear(endD.getFullYear() + year));
      }
      if (month) {
        endD = new Date(endD.setMonth(endD.getMonth() + month));
      }
      if (day) {
        endD = new Date(endD.setDate(endD.getDate() + day));
      }
      if (hour) {
        endD = new Date(endD.setHours(endD.getHours() + hour));
      }
      if (minute) {
        endD = new Date(endD.setMinutes(endD.getMinutes() + minute));
      }
      if (second) {
        endD = new Date(endD.setSeconds(endD.getSeconds() + second));
      }
    }
    return endD;
  }
  static delta(date1: number, date2: number | null = null) {
    if (date2) {
      return date2 - date1;
    } else {
      return date1 - Date.now();
    }
  }
  static get now() {
    return Date.now();
  }
}

export const get = {
  ok: 12,
  secret: () => {
    const sk = process.env.SECRET_KEY;
    if (!sk) throw new Error("'SECRET_KEY' not found in .env file");
    return sk;
  },
  tls: (dir: string) => {
    return O.items(process.env)
      .filter((k) => {
        if (k[0].startsWith("TLS_")) return k;
      })
      .reduce<obj<BunFile>>((ob, mt) => {
        const [kk, vv] = mt;
        if (vv) {
          const ky = kk.replace("TLS_", "").toLowerCase();
          ob[ky] = file(dir + vv);
        }
        return ob;
      }, {});
  },
  byteRange: (fsize: number, range: string) => {
    let start = 0;
    let end = fsize - 1;
    const [partialStart, partialEnd] = range.replace(/bytes=/, "").split("-");
    //
    start = parseInt(partialStart, 10);
    end = partialEnd ? parseInt(partialEnd, 10) : end;
    return [start, end, fsize];
  },
  mimeType: (fileStr: string) => {
    return file(fileStr).type;
  },
  args: (params: string[], vals: string[]) => {
    return params.reduce<obj<string>>((k, v, i) => {
      k[v] = vals[i];
      return k;
    }, {});
  },
};

const make = {
  ID: (length: number) => {
    const { charU, charL, nums } = str;
    const _chars = charU + charL;
    let result: string = "",
      counter: number = 0;

    while (counter < length) {
      let chars = _chars + (counter == 0 ? "" : nums);
      const charactersLength = chars.length;
      result += chars.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  },
};

// Group of useful or useless decorators
const at = {
  readOnly: (target: any, key: string | symbol) => {
    O.define(target, key, {
      writable: false,
      configurable: false,
    });
  },
};

/*
-------------------------
DECORATORS
-------------------------
*/

export function session(...itm: any[]) {
  const [a, b, c] = itm;

  const OG: () => any = c.value;

  c.value = async function (args: any = {}) {
    if ("session" in args && args.session) {
      const nms: any = [args];
      return OG.apply(this, nms);
    }
    return {
      error: 401,
    };
  };
  return c;
}
export function jwt(...itm: any[]) {
  const [a, b, c] = itm;
  const OG: () => any = c.value;
  c.value = async function (args: any = {}) {
    if ("jwt" in args) {
      const nms: any = [args];
      return OG.apply(this, nms);
    }
    return {
      error: 401,
    };
  };
  return c;
}
export function jwt_refresh(...itm: any[]) {
  const [a, b, c] = itm;
  const OG: () => any = c.value;
  c.value = async function (args: any = {}) {
    if ("jwt_refresh" in args) {
      const nms: any = [args];
      return OG.apply(this, nms);
    }
    return {
      error: 401,
    };
  };
  return c;
}

/*
-------------------------
RESPONSE = REQUEST = WSS
-------------------------
*/

class request {
  req: Request;
  server?: Server;
  formData?: FormData;
  constructor(req: Request, server?: Server) {
    this.req = req;
    this.server = server;
  }
  get auth() {
    const auth = this.headers.get("authorization");
    if (auth) {
      const [bear, token] = auth.split(" ", 2);
      if (bear.trim() == "Bearer") {
        return token.trim();
      }
    }
  }
  get accept() {
    return this.headers.get("accept");
  }
  get contentType() {
    return this.headers.get("content-type");
  }
  get cookies() {
    const cookie = this.headers.get("cookie");
    if (cookie) {
      return cookie.split(";").reduce<obj<string>>((ob, d) => {
        const [key, val] = d.trim().split(/=(.*)/s);
        ob[key] = val;
        return ob;
      }, {});
    }
    return {};
  }
  async form(): Promise<FormData> {
    if (this.isForm) {
      if (!this.formData) {
        this.formData = await this.req.formData();
      }
      return this.formData;
    }
    return new FormData();
  }
  get headers(): Headers {
    return this.req.headers ?? new Headers();
  }
  get ip() {
    return this.server?.requestIP(this.req) ?? "";
  }
  get isForm() {
    const ctype = this.contentType;
    return ctype
      ? ctype.indexOf("multipart/form-data") >= 0 ||
          ctype.indexOf("x-www-form-urlencoded") >= 0
      : false;
  }
  get isEventStream() {
    const f = "text/event-stream";
    return this.accept?.includes(f);
  }
  get method() {
    return this.req.method.toLowerCase();
  }
  get path() {
    return this.url.pathname;
  }
  get parsed() {
    const { parsed } = path.parse(this.path);
    return parsed;
  }
  get searchParams() {
    return this.url.searchParams;
  }
  get range() {
    return this.headers.get("range") ?? undefined;
  }
  get url() {
    return new URL(this.req.url);
  }
  async authgroup() {
    const { cookies, auth } = this;
    let sid = cookies.session ?? "";
    let jwtv = auth ?? "";

    const tf = await this.form();
    const rt = tf.get("refresh_token");
    let refreshjwt: string = rt ? rt.toString() : "";
    return { sid, jwtv, refreshjwt };
  }
  get upgrade() {
    return this.headers.get("upgrade");
  }
  upgraded(data: any = {}) {
    return this.server?.upgrade(this.req, data);
  }
}

class _r {
  private headattr: obj<string[]> = {};
  /**
   * html head
   */
  get head(): obj<string[]> {
    return this.headattr;
  }
  set head(heads: headP) {
    O.items(heads).forEach(([k, v]) => {
      if (k == "title" || k == "base") {
        this.headattr[k] = v;
      } else {
        if (!(k in this.headattr)) {
          this.headattr[k] = v;
        } else {
          this.headattr[k].push(...v);
        }
      }
    });
  }
}

class eStream {
  ctrl?: ReadableStreamDefaultController<any>;
  intervalID: Timer[] = [];
  constructor(ctrl?: ReadableStreamDefaultController<any>) {
    this.ctrl = ctrl;
  }
  push(
    fn: () => {
      id: string | number;
      data: string | obj<string>;
      event?: string;
      retry?: number;
      end?: boolean;
    },
    interval: number = 3000,
  ) {
    if (this.ctrl) {
      const intervalID = setInterval(
        () => {
          const { id, retry, data, event, end } = fn();
          if (this.ctrl) {
            let _data = end ? "end" : data;
            if (retry) {
              let rt = retry > 2000 ? retry : 2000;
              this.ctrl.enqueue(`retry: ${rt}\n`);
            }
            this.ctrl.enqueue(`id: ${id}\n`);
            event && this.ctrl.enqueue(`event: ${event}\n`);
            if (typeof _data == "object") {
              this.ctrl.enqueue("data: " + JSON.stringify(_data) + "\n\n");
            } else {
              this.ctrl.enqueue("data: " + _data + "\n\n");
            }
            end && this.close();
          }
        },
        interval > 2000 ? interval : 2000,
      );
      this.intervalID.push(intervalID);
    }
  }
  close() {
    if (this.intervalID.length) {
      this.intervalID.forEach((ff) => {
        clearInterval(ff);
      });
      this.intervalID = [];
    }
    this.ctrl?.close();
  }
}

export class response extends _r {
  [Key: string]: any;
  lang: string = "en";
  request!: request;
  status?: number;
  stream?: eStream;
  private headers: obj<string> = {};
  private __session!: ServerSide;
  private __jwt!: ServerSide;
  constructor(req: request) {
    super();
    this.request = req;
  }
  async get?(...args: any[]): Promise<any>;
  async post?(...args: any[]): Promise<any>;
  async put?(...args: any[]): Promise<any>;
  async patch?(...args: any[]): Promise<any>;
  async error?(...args: any[]): Promise<any>;
  async eventStream?(...args: any[]): Promise<any>;
  get session() {
    if (!this.__session) {
      this.__session = S.session.session();
    }
    return this.__session;
  }
  set session(sesh: ServerSide) {
    this.__session = sesh;
  }
  get jwt() {
    if (!this.__jwt) {
      this.__jwt = S.jwt.session();
    }
    return this.__jwt;
  }
  set jwt(jwt: ServerSide) {
    this.__jwt = jwt;
  }
  get timedJWT() {
    return S.jwtInt.jwt();
  }
  set header(head: obj<string>) {
    O.ass(this.headers, head);
  }
  get header() {
    return this.headers;
  }
  set type(content: string) {
    this.header = { "Content-Type": content };
  }
  setCookie({
    key,
    val,
    path = "/",
    days = 31,
    httpOnly = false,
  }: {
    key: string;
    val: string;
    path?: string;
    days?: number;
    httpOnly?: boolean;
  }) {
    const cd = html.cookie(key, val, {
      expires: new Time().timed({ day: days }),
      path: path,
      httpOnly: httpOnly,
      sameSite: "Strict",
    });
    this.header = { "Set-Cookie": cd };
  }
  deleteCookie(key: string) {
    this.setCookie({ key: key, val: "", days: 0 });
  }
}

interface repsWSS {
  role: "maker" | "joiner" | "god";
}

const wssClients: Map<string, obj<repsWSS>> = new Map();
export class wss {
  [Key: string]: any;
  ws!: ServerWebSocket<{ wclass: wss }>;
  request: request;
  path: string;
  id: string;
  broadcasting = false;
  max: number = 0;
  // session?: ServerSide;
  constructor(req: request) {
    this.request = req;
    this.path = req.path;
    // Use BODY id instead? but how
    this.id = make.ID(10);
  }
  async init?(...args: any[]): Promise<void>;
  async open() {}
  async message(message: string | Buffer | undefined) {}
  async close(code: number, reason: string) {}

  set send(message: string | Bun.BufferSource | undefined) {
    if (message)
      if (this.broadcasting) {
        this.ws.publish(this.path, message);
      } else {
        this.ws.send(message);
      }
  }
  get role() {
    const WT = wssClients.get(this.path);
    if (WT && this.id in WT) {
      return WT[this.id].role;
    }
  }
}

/*
-------------------------
these are really not exposed --- so, I'm not sure what's the best way to store these.
-------------------------
*/
const PRoutes: obj<any> = {};
const FRoutes: obj<any> = {};
const WRoutes: obj<any> = {};
const ZFolders: obj<any> = {};

class Yurl {
  _class: typeof response | typeof wss | null;
  url: string;
  parsedURL: string[];
  args: string[] = [];
  isFile: boolean;
  isWS: boolean;
  fileType: string = "text/plain";
  bytes?: Uint8Array;
  maxClient: number = 0;
  withSession: boolean = false;
  preload: boolean = false;
  broadcastWSS = false;
  constructor({
    url,
    _class = null,
    isFile = false,
    withSession = false,
    preload = false,
    isWS = false,
  }: {
    url: string;
    _class?: typeof response | typeof wss | null;
    isFile?: boolean;
    withSession?: boolean;
    preload?: boolean;
    isWS?: boolean;
  }) {
    const { parsed, args } = path.parse(url);
    this.url = url;
    this.parsedURL = parsed;
    this.args = args;
    this._class = _class;
    this.isFile = isFile;
    this.isWS = isWS;

    if (isFile) {
      this.preload = preload;
      this.withSession = withSession;
      this.fileType = get.mimeType(url);
    }
  }
  loadbytes(apt: string) {
    if (this.preload) {
      file(apt + this.url)
        .bytes()
        .then((e) => {
          this.bytes = e;
        })
        .catch((e) => {
          throw `error: can't preload ${this.url}. File not found.`;
        });
    }
  }
}

class Xurl {
  Yurl?: Yurl | null;
  status: number = 404;
  x_args: string[] = [];
  headers: obj<string> = {
    "Content-Type": "text/plain",
  };
  constructor(
    {
      Yurl,
      status = 404,
      headers = {},
    }: {
      Yurl?: Yurl;
      status?: number;
      headers?: obj<string>;
    },
    x_args?: string[],
  ) {
    O.ass(this, {
      Yurl,
      status,
      headers,
    });

    x_args && (this.x_args = x_args);
  }
  set header(head: obj<string>) {
    O.ass(this.headers, head);
  }
  set type(content: string) {
    O.ass(this.headers, { "Content-Type": content });
  }
}

/*
-------------------------

-------------------------
*/

export class Fsyt {
  rpath: string;
  data: string;
  constructor(rpath: string, data: any = {}) {
    this.rpath = rpath;
    this.data = JSON.stringify(data);
  }
  _head() {
    return `<script type="module">import x from "${this.rpath}";x.dom(${this.data});</script>`;
  }
}

class fileXP {
  Y: Yurl;
  X: Xurl;
  range?: string;
  apt: string;
  constructor(X: Xurl, Y: Yurl, apt: string, range?: string) {
    this.X = X;
    this.Y = Y;
    this.range = range;
    this.apt = apt;
    //
  }
  gzip(ctx: Uint8Array | string | ArrayBuffer) {
    const buffd = gzipSync(ctx);
    this.X.header = {
      "Content-Length": buffd.byteLength.toString(),
      "Content-Encoding": "gzip",
    };
    return buffd;
  }
  file(bytes: Uint8Array | BunFile, size: number, fileType: string) {
    this.X.type = fileType;
    if (this.range) {
      const [_s, _e, _z] = get.byteRange(size, this.range);
      this.X.header = {
        "Content-Range": `bytes ${_s}-${_e}/${_z}`,
        "Content-Length": size.toString(),
      };
      this.X.status = 206;
      //
      return bytes.slice(_s, _e + 1);
    } else {
      this.X.header = { "Cache-Control": "max-age=31536000" };
      return is.arraybuff(bytes) ? this.gzip(bytes) : bytes;
    }
  }
  async response() {
    const { url, bytes, fileType } = this.Y;
    let CTX: string | Uint8Array | BunFile = url + " file note found.";
    if (bytes) {
      CTX = this.file(bytes, bytes.byteLength, fileType);
    } else {
      const FL = file(this.apt + url);
      if (await FL.exists()) {
        const isMedia = fileType.startsWith("video/");
        CTX = this.file(isMedia ? FL : await FL.bytes(), FL.size, fileType);
      } else {
        this.X.status = 404;
      }
    }
    //
    const { headers, status } = this.X;
    return new Response(CTX, { headers, status });
  }
}

class ctxXP {
  X: Xurl;
  constructor(X: Xurl) {
    this.X = X;
  }
  gzip(ctx: Uint8Array | string | ArrayBuffer, headers: obj<string>) {
    const buffd = gzipSync(ctx);
    O.ass(headers, {
      "Content-Length": buffd.byteLength,
      "Content-Encoding": "gzip",
    });
    return buffd;
  }
  html(CTX: any, head: string, lang: string) {
    //
    let bscr = "",
      _ctx = "";

    if (CTX instanceof Fsyt) {
      bscr = CTX._head();
    } else {
      _ctx = CTX;
    }

    const ID = make.ID(5);
    const hdr = head + bscr;
    let TX = `<!DOCTYPE html><html lang="${lang}">`;
    TX += `<head>${hdr}</head>`;
    TX += `<body id="${ID}">${_ctx}</body>`;
    TX += "</html>";

    this.X.type = "text/html";
    const { status, headers } = this.X;

    return new Response(this.gzip(TX, headers), {
      status,
      headers,
    });
  }
  response(CTX: any, head: string, lang: string, _status?: number) {
    if (CTX instanceof Response) {
      return CTX;
    } else if (is.dict(CTX) && !(CTX instanceof Fsyt)) {
      //
      this.X.type = "application/json";
      const { status, headers } = this.X;

      return new Response(this.gzip(JSON.stringify(CTX), headers), {
        status: _status ?? status,
        headers,
      });
    } else return this.html(CTX, head, lang);
  }
  async jwt(
    JWT: ServerSide,
    jwtv?: string,
    refreshjwt?: string,
    _status?: number,
  ) {
    let resp = {};

    const err = (error: string) => {
      this.X.status = 403;
      resp = {
        error,
      };
    };

    const ref = async (_JWT: ServerSide) => {
      const FJWT = S.jwtInt.save(_JWT);
      _JWT.access_token = FJWT;
      await S.jwt.saveSession(_JWT, this.X);
      resp = {
        access_token: FJWT,
        refresh_token: _JWT.sid,
        status: "ok",
      };
    };

    if (refreshjwt) {
      const rjwt = await S.jwt.openSession(refreshjwt);
      const RTK = rjwt.data.access_token;
      if (jwtv == RTK) {
        // change this -- it's using the accee_token instead of the refresh_token life
        if (S.jwtInt.verify(RTK, { days: 5 })) {
          await ref(rjwt);
        } else {
          await S.jwt.saveSession(rjwt, null, true);
          err("expired refresh_token");
        }
        //
      } else {
        err("tokens don't match.");
      }
      //
    } else if (!jwtv && JWT.modified) {
      await ref(JWT);
    } else {
      // Return no content
      this.X.status = 204;
    }
    //
    this.X.type = "application/json";
    const { status, headers } = this.X;
    return new Response(this.gzip(JSON.stringify(resp), headers), {
      status: _status ?? status,
      headers,
    });
  }
}

class Session {
  session!: ServerInterface;
  jwt!: ServerInterface;
  jwtInt!: JWTInterface;
  constructor() {
    this.jwtInt = new JWTInterface();
  }
  init(sh: Seshion) {
    this.session = sh.session;
    this.jwt = sh.jwt;
  }
  get() {}
}

class Router {
  id: string;
  apt: string = "";
  headstr: string = "";
  constructor(id: string) {
    this.id = id;
  }
  set route(yurl: Yurl) {
    const { url, isFile, isWS, parsedURL } = yurl;
    let RT = isWS ? WRoutes : isFile ? FRoutes : PRoutes;
    const RID = this.id;
    parsedURL.forEach((v, i) => {
      if (!(v in RT)) RT[v] = {};
      RT = RT[v];
      if (parsedURL.length - 1 == i) {
        if (!(RID in RT)) {
          isFile && yurl.loadbytes(this.apt);
          RT[RID] = yurl;
        } else {
          if (!isFile) {
            throw `URL: ${url} already used in class < ${RT[RID]._class.name} >`;
          }
        }
      }
    });
  }
  folder(path: string, option = {}) {
    path = str.strip(path, ".");
    path = str.strip(path, "/");
    if (!(path in ZFolders)) {
      ZFolders[path] = option;
    }
  }
  get({ parsed, wss = false }: { parsed: string[]; wss?: boolean }) {
    let isFile: boolean = false;
    let ppop = parsed.slice().pop();
    if (ppop) isFile = path.type(ppop, true).pop() == "file";

    const lenn = parsed.length;
    const args: string[] = [];
    let routeUpdate: number = 0;
    let RT = wss ? WRoutes : isFile ? FRoutes : PRoutes;

    parsed.forEach((v, i) => {
      const TP = path.type(v, lenn - 1 == i ? true : false);
      for (let i = 0; i < TP.length; i++) {
        let TPX = TP[i];
        if (TPX in RT) {
          RT = RT[TPX];
          routeUpdate += 1;
          break;
        } else {
          if (TPX != "/" && TPX != "-") {
            args.push(TPX);
          }
        }
      }
    });

    if (routeUpdate != lenn) {
      RT = {};
    }

    if (this.id in RT) {
      return new Xurl({ Yurl: RT[this.id], status: 200 }, args);
    } else if (isFile) {
      const pp = parsed.slice(0, -1).join("/");
      let fses = false;
      const inFolder = O.items(ZFolders).some(([ff, vv]) => {
        fses = vv.session ?? false;
        return pp.startsWith(ff);
      });

      if (inFolder) {
        //
        return new Xurl({
          Yurl: new Yurl({
            url: `.${path}`,
            isFile: true,
            withSession: fses,
          }),
          status: 200,
        });
      }
    }
    return new Xurl({});
  }
  async auth(FS: response, z_args: obj<string>, grp: obj<string> = {}) {
    const a_args: obj<boolean> = {};
    const { sid, jwtv, refreshjwt } = grp;
    if (sid) {
      FS.session = await S.session.openSession(sid);
      if (!FS.session.new) {
        a_args["session"] = true;
      }
    }
    if (jwtv) {
      FS.jwt = S.jwtInt.open(jwtv, { hours: 6 });

      if (!FS.jwt.new) {
        a_args["jwt"] = true;
      }

      if (refreshjwt) {
        const rjwt = await S.jwt.openSession(refreshjwt);
        if (!rjwt.new) {
          a_args["jwt_refresh"] = true;
        }
      }
    }

    if (O.length(a_args)) {
      O.ass(z_args, a_args);
    }
  }
  async upgrade(req: request) {
    const X = this.get({ parsed: req.parsed, wss: true });
    const { Yurl, headers, x_args } = X;
    let status = 500;
    if (Yurl) {
      const { url, _class, args, broadcastWSS, maxClient, withSession } = Yurl;

      if (_class) {
        let allowUpgrade = true;

        const z_args = get.args(args, x_args);
        const FS = new _class(req) as wss;

        const { sid } = await req.authgroup();

        if (withSession) {
          if (sid) {
            const SS = await S.session.openSession(sid);
            if (!SS.new) {
              FS.session = SS;
            } else {
              status = 401;
              allowUpgrade = false;
            }
          } else {
            status = 401;
            allowUpgrade = false;
          }
        }

        FS.broadcasting = broadcastWSS;
        FS.max = maxClient;
        const rurl = FS.path;
        //
        let _WS = wssClients.get(rurl);
        if (!_WS) wssClients.set(rurl, {});
        _WS = wssClients.get(rurl) ?? {};
        const clen = O.length(_WS);

        if (allowUpgrade && maxClient && clen >= maxClient) {
          allowUpgrade = false;
        }

        allowUpgrade &&
          req.upgraded({
            data: {
              wclass: FS,
              z_args,
              client: _WS,
            },
          });
      }
    }

    return new Response("upgrade error", { status, headers });
  }
  async estream(req: request, FS: response, X: Xurl, z_args: obj<string>) {
    X.header = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    FS.stream = new eStream();
    const CTX = await FS["eventStream"]!(z_args);
    if (is.dict(CTX) && "error" in CTX) {
      return new Response("", { status: CTX.error });
    }
    //
    const stream = new ReadableStream({
      async start(controller) {
        //
        FS.stream = new eStream(controller);
        await FS["eventStream"]!(z_args);
        req.req.signal.addEventListener("abort", () => {
          FS.stream?.close();
          if (FS.stream?.intervalID.length) {
            controller.close();
          }
        });
      },
    });

    return new Response(stream, { headers: X.headers });
  }
  async response(req: request) {
    const { parsed, method, isEventStream } = req;
    const X = this.get({ parsed });
    const { Yurl, x_args } = X;
    if (Yurl) {
      const { isFile, _class, args } = Yurl;
      const { sid, jwtv, refreshjwt } = await req.authgroup();
      if (isFile) {
        /*
        -------------------------
        Process all the sesions or anything here before returning the FileRouter
        -------------------------
        */
        // include the apt
        return await new fileXP(X, Yurl, this.apt, req.range).response();
      } else if (_class) {
        /*
        -------------------------
        What if can just combine WSS and RESPONSE here by checking the instance that created it?
        -------------------------
        */
        const FS = new _class(req) as response;

        const z_args = get.args(args, x_args);
        await this.auth(FS, z_args, { sid, jwtv, refreshjwt });
        if (isEventStream && typeof FS["eventStream"] === "function") {
          // return

          return await this.estream(req, FS, X, z_args);
        } else if (typeof FS[method] === "function") {
          const CTX = await FS[method](z_args);
          // Reassign the proccesses happened in method calls
          const { header, status, head, lang } = FS;

          X.header = header;
          //
          if (CTX) {
            if (method === "post" && CTX instanceof ServerSide) {
              //
              return await new ctxXP(X).jwt(CTX, jwtv, refreshjwt, status);
            } else if (is.dict(CTX) && "error" in CTX) {
              //
              X.status = CTX.error as number;
            } else {
              /*
              -------------------------
              Check the session
              -------------------------
              */
              const SS = FS["__session"];
              if (SS) {
                if (SS.modified) {
                  await S.session.saveSession(SS, X);
                } else if (sid && SS.new) {
                  S.session.deleteBrowserSession(SS, X);
                }
              }
              //
              return new ctxXP(X).response(
                CTX,
                this.headstr + html.head(head).join(""),
                lang,
                status,
              );
              // Process CTX now
            }
            //
          } else {
            // No response -- could be 204 - unless FS.status has value, return 204 - no Content
            X.status = status ?? 204;
          }
        }
      }
      //
    }

    const { status, headers } = X;
    return new Response("", { status, headers });
  }
}

/*
-------------------------
use function.apply(),if the function doesn't change anything in "this"
-------------------------
*/
const R = new Router(make.ID(7));
const S = new Session();

const LSocket = {
  async open(
    ws: ServerWebSocket<{
      wclass: wss;
      z_args: obj<string>;
      client: obj<repsWSS>;
    }>,
  ) {
    const WC = ws.data.wclass;
    const { z_args, client } = ws.data;
    if (WC) {
      WC.ws = ws;
      const cid = WC.id;
      const clen = O.length(client);
      if (!(cid in client)) {
        const role = clen ? "joiner" : "maker";
        client[cid] = {
          role: role,
        };
      }
      if (typeof WC["init"] == "function") await WC.init(z_args);
      if (WC.broadcasting) {
        WC.ws.subscribe(WC.path);
      }
      await WC.open();
    } else {
      ws.close();
    }
  },
  async message(
    ws: ServerWebSocket<{ wclass: wss; client: obj<repsWSS> }>,
    message: string | Buffer,
  ) {
    const WC = ws.data.wclass;
    if (WC) {
      await WC.message(message);
    }
  },
  async close(
    ws: ServerWebSocket<{ wclass: wss; client: obj<repsWSS> }>,
    code: number,
    reason: string,
  ) {
    const WC = ws.data.wclass;
    const client = ws.data.client;
    if (WC) {
      await WC.close(code, reason);

      if (WC.broadcasting) {
        WC.ws.unsubscribe(WC.path);
      }

      const wid = WC.id;
      delete client[wid];

      if (O.length(client) === 1) {
        O.keys(client).forEach((c, indx) => {
          client[c].role = "maker";
        });
      }
    }
  },
};
export class Lycaon extends _r {
  dir: string = "./";
  apt: string;

  constructor(
    dir: string,
    options: { envPath?: string; appDir?: string; session?: Seshion } = {},
  ) {
    super();
    this.dir = dir + "/";
    const PRIV = this.dir + ".private";
    const { envPath, appDir, session } = options;
    //
    if (!envPath) {
      is.dir(PRIV);
      is.file(PRIV + "/.env", `SECRET_KEY="${make.ID(20)}"`);
    }
    this.apt = this.dir + (appDir ?? "app") + "/";
    R.apt = this.apt;
    //
    require("dotenv").config({
      path: (envPath ? envPath : PRIV) + "/.env",
    });
    //
    const SH = session ?? new Seshion("cached");
    S.init(SH.init(this.dir));

    //
    this.file("./fsyt.js", { preload: true });
    //
  }
  /**
   * string | int | float | uuid | file
   * * /path/\<string:args>
   */
  path(path: string) {
    return <T extends typeof response>(f: T) => {
      R.route = new Yurl({ url: path, _class: f });
      return f;
    };
  }
  file(
    furl: string,
    option: { session?: boolean; preload?: boolean } = {
      session: false,
      preload: false,
    },
  ) {
    R.route = new Yurl({
      url: furl,
      isFile: true,
      withSession: option.session,
      preload: option.preload,
    });
    return furl;
  }
  wss(
    url: string,
    opts: { broadcast?: boolean; maxClient?: number; session?: boolean } = {},
  ) {
    const ins = <T extends typeof wss>(f: T) => {
      const _fr = new Yurl({
        url: url,
        _class: f,
        isWS: true,
      });
      _fr.broadcastWSS = opts.broadcast ?? false;
      _fr.withSession = opts.session ?? false;
      if (opts.maxClient) {
        _fr.maxClient = opts.maxClient;
      }
      R.route = _fr;
      return f;
    };
    return ins;
  }
  folder(
    path: string,
    option: { session?: boolean } = {
      session: false,
    },
  ) {
    R.folder(path, option);
  }
  folders(...paths: string[]) {
    paths.forEach((pt) => {
      R.folder(pt);
    });
  }
  redirect(url: string) {
    return new Response("", { status: 302, headers: { Location: url } });
  }
  async serve(
    options: Partial<Serve> & dev,
    wssOptions: Partial<WebSocketHandler> = {},
  ) {
    let { url, hostname, method, port } = options;
    method ??= "GET";
    hostname ??= "127.0.0.1";
    port ??= 3000;

    R.headstr = html.head(this.head).join("");

    if (url) {
      const RQ = new request({
        url: `http://${hostname}:${port}${url ?? "/"}`,
        method: method,
      } as Request);
      //

      const CTX = await R.response(RQ);
      const ARB = await CTX.arrayBuffer();
      ARB.byteLength && write(this.apt + "index.html", gunzipSync(ARB));

      //
    } else {
      //
      serve({
        port: port,
        tls: get.tls(this.dir),
        ...(hostname && { hostname }),
        fetch: async (req, server) => {
          const RQ = new request(req, server);
          // return RQ.upgrade ? await R.upgrade(RQ) : await R.response(RQ);
          return RQ.upgrade ? await R.upgrade(RQ) : await R.response(RQ);
        },
        websocket: {
          sendPings: true,
          perMessageDeflate: true,
          ...wssOptions,
          ...LSocket,
        },
        ...(options as any),
      });
    }
  }
}
