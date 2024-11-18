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
import { config } from "dotenv";

import { O, str, is, path, html, get, Time, make, headP } from "./tl";
import { Auth, AuthInterface, ServerSide, JWTInterface } from "authored";

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
future --
Implement CSRF using Authored -- http-only and in header if a page requires post / delete

-------------------------
*/

/*
-------------------------
DECORATORS
-------------------------
*/

export function session(...itm: any[]) {
  const [_, __, c] = itm;

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
  const [_, __, c] = itm;
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
  const [_, __, c] = itm;
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
  formData?: FormData;
  headers: Headers;
  url: URL;
  __cookies: obj<string> = {};
  constructor(
    public req: Request,
    public server?: Server,
  ) {
    this.headers = req.headers ?? new Headers();
    this.url = new URL(req.url);
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
    if (!O.length(this.__cookies)) {
      const cookie = this.headers.get("cookie");
      if (cookie) {
        this.__cookies = cookie.split(";").reduce<obj<string>>((ob, d) => {
          const [key, val] = d.trim().split(/=(.*)/s);
          ob[key] = val;
          return ob;
        }, {});
      }
    }
    return this.__cookies;
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
  async authgroup() {
    const { cookies: cookies, auth } = this;
    let sid = cookies.session ?? "";
    let jwtv = auth ?? "";
    let refreshjwt: string = "";

    const tf = this.isForm ? await this.form() : undefined;
    if (tf) {
      const rt = tf.get("refresh_token");
      refreshjwt = rt ? rt.toString() : "";
    }

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
  intervalID: Timer[] = [];
  constructor(public ctrl?: ReadableStreamDefaultController<any>) {}
  push(
    fn: () => {
      id: string | number;
      data: string | obj<string>;
      event?: string;
      retry?: number;
      end?: boolean;
    },
    interval: number = 2000,
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
        interval > 1000 ? interval : 1000,
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
  status?: number;
  stream?: eStream;
  private headers: obj<string> = {};
  private __session!: ServerSide;
  private __jwt!: ServerSide;
  constructor(public request: request) {
    super();
  }
  async get?(...args: any[]): Promise<any>;
  async post?(...args: any[]): Promise<any>;
  async put?(...args: any[]): Promise<any>;
  async patch?(...args: any[]): Promise<any>;
  async error?(...args: any[]): Promise<any>;
  async eventStream?(...args: any[]): Promise<any>;
  get session() {
    if (!this.__session) {
      this.__session = S.session.new;
    }
    return this.__session;
  }
  set session(sesh: ServerSide) {
    this.__session = sesh;
  }
  get jwt() {
    if (!this.__jwt) {
      this.__jwt = S.jwt.new;
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
  path: string;
  id: string;
  broadcasting = false;
  max: number = 0;

  constructor(public request: request) {
    this.path = request.path;
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

const Paths: Map<string, Yurl> = new Map();
const FPaths: Map<string, Yurl> = new Map();
const WPaths: Map<string, Yurl> = new Map();
const ZPaths: Map<string, obj<string>> = new Map();
const TPS = ["string", "int", "float", "file", "uuid"];

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
  Yurl?: Yurl;
  status: number = 404;
  x_args: string[];
  headers: Headers = new Headers({
    "Content-Type": "text/plain",
  });
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
    });
    if (headers) this.header = headers;
    this.x_args = x_args ?? [];
  }
  set header(head: obj<string>) {
    O.items(head).forEach(([k, v]) => {
      this.headers.set(k, v);
    });
  }
  set type(content: string) {
    this.headers.set("Content-Type", content);
  }
  gzip(ctx: Uint8Array | string | ArrayBuffer) {
    const buffd = gzipSync(ctx);
    this.header = {
      "Content-Length": buffd.byteLength.toString(),
      "Content-Encoding": "gzip",
    };
    return buffd;
  }
}

// Singleton
class Router {
  private static router: Router;
  apt: string = "";
  headstr: string = "";
  private constructor(public id: string) {}
  set route(yurl: Yurl) {
    const { url, isFile, isWS, parsedURL, _class } = yurl;
    let RT = isWS ? WPaths : isFile ? FPaths : Paths;
    const sp = str.stringify(parsedURL);
    const ISP = RT.get(sp);
    if (!ISP) {
      RT.set(sp, yurl);
    } else {
      if (!isFile) {
        throw `URL: ${url} already used in class < ${_class!.name} >`;
      }
    }
  }
  folder(path: string, option = {}) {
    path = str.strip(path, ".");
    path = str.strip(path, "/");
    ZPaths.set(path, option);
  }
  private isFile(
    isFile: boolean,
    { parsed, _path }: { parsed: string[]; _path?: string },
  ) {
    if (isFile) {
      const pp = parsed.slice(0, -1).join("/");
      let fses = false;
      const fldrs = [...ZPaths.keys()];
      const inFolder = fldrs.some((ff) => {
        if (pp.startsWith(ff)) {
          const zp = ZPaths.get(ff);
          fses = zp ? !!zp.session : false;
        }
        return pp.startsWith(ff);
      });
      if (inFolder) {
        return new Xurl({
          Yurl: new Yurl({
            url: `.${_path}`,
            isFile: true,
            withSession: fses,
          }),
          status: 200,
        });
      }
    }
    return new Xurl({});
  }
  get({
    parsed,
    wss = false,
    _path,
  }: {
    parsed: string[];
    wss?: boolean;
    _path?: string;
  }) {
    let isFile: boolean = false;
    const ppop = parsed.slice().pop();
    if (ppop) isFile = path.type(ppop, true).pop() == "file";
    const args: string[] = [];
    const RT = wss ? WPaths : isFile ? FPaths : Paths;
    let YURL: Yurl | undefined = RT.get(str.stringify(parsed));
    //
    if (!YURL) {
      const mtch: string[] = [];
      for (const rr of RT.keys()) {
        const STP = str.parse(rr) as string[];
        const STLen = STP.length;
        if (parsed.length === STLen) {
          for (let i = 0; i < STLen; i++) {
            if (STP[i] === parsed[i]) {
              mtch[i] = parsed[i];
            } else {
              const STT = STP[i];
              if (TPS.includes(STT)) {
                mtch[i] = STP[i];
                args.push(parsed[i]);
              }
            }
          }
        }
      }
      YURL = RT.get(str.stringify(mtch));
    }

    //
    if (YURL) {
      //
      return new Xurl({ Yurl: YURL, status: 200 }, args);
    } else return this.isFile(isFile, { parsed, _path });
  }
  static get init() {
    if (!Router.router) {
      Router.router = new Router(make.ID(7));
    }
    return Router.router;
  }
}

/*
-------------------------

-------------------------
*/

export class Fsyt {
  constructor(
    public rpath: string,
    public data: any = {},
  ) {}
  _head() {
    return `<script type="module">import x from "${this.rpath}";x.dom(${str.stringify(this.data)});</script>`;
  }
}

class Session {
  session!: AuthInterface;
  jwt!: AuthInterface;
  jwtInt!: JWTInterface;
  constructor() {
    this.jwtInt = new JWTInterface();
  }
  init(sh: Auth) {
    this.session = sh.session;
    this.jwt = sh.jwt;
  }
}
const S = new Session();
/*
-------------------------

-------------------------
*/
type responseBody =
  | string
  | Uint8Array
  | ArrayBuffer
  | ReadableStream<Uint8Array>
  | null;

class Runner {
  req: request;
  X: Xurl;
  Y?: Yurl;
  isWSS: boolean;
  x_args: string[];
  method: string;
  apt: string;
  constructor(req: Request, server?: Server) {
    this.req = new request(req, server);
    const { upgrade, parsed, method, path } = this.req;
    this.isWSS = !!upgrade;
    this.X = Router.init.get({ parsed, wss: this.isWSS, _path: path });
    this.apt = Router.init.apt;
    const { Yurl, x_args } = this.X;
    this.Y = Yurl;
    this.x_args = x_args;
    this.method = method;
  }
  push(body: responseBody = "", _status?: number) {
    const { status, headers } = this.X;
    return new Response(body, { status: _status ?? status, headers });
  }
  file(bytes: Uint8Array | BunFile, size: number, fileType: string) {
    this.X.type = fileType;
    const range = this.req.range;
    if (range) {
      const [_s, _e, _z] = get.byteRange(size, range);
      this.X.header = {
        "Content-Range": `bytes ${_s}-${_e}/${_z}`,
        "Content-Length": size.toString(),
      };
      this.X.status = 206;
      return bytes.slice(_s, _e + 1);
    } else {
      // 1 day -- in seconds
      this.X.header = {
        "Cache-Control": "max-age=86400, must-revalidate",
      };
      return is.arraybuff(bytes) ? this.X.gzip(bytes) : bytes;
    }
  }
  async isFile() {
    const { url, bytes, fileType } = this.Y!;
    let CTX: string | Uint8Array | BunFile = url + " file note found.";
    if (bytes) {
      CTX = this.file(bytes, bytes.byteLength, fileType);
    } else {
      const FL = file(this.apt + url);
      try {
        const isMedia = fileType.startsWith("video/");
        CTX = this.file(isMedia ? FL : await FL.bytes(), FL.size, fileType);
      } catch (error) {
        this.X.status = 404;
      }
    }
    //
    const { headers, status } = this.X;
    return new Response(CTX, { headers, status });
  }
  async upgrade() {
    const { Yurl, headers, x_args } = this.X;
    let status = 500;
    if (Yurl) {
      const { _class, args, broadcastWSS, maxClient, withSession } = Yurl;
      if (_class) {
        let allowUpgrade = true;

        const z_args = get.args(args, x_args);
        const FS = new _class(this.req) as wss;

        const { sid } = await this.req.authgroup();

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
          this.req.upgraded({
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
  async auth(FS: response, z_args: obj<string>) {
    const a_args: obj<boolean> = {};

    const { sid, jwtv, refreshjwt } = await this.req.authgroup();

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

    return;
  }
  async ctx(CTX: any, head: string, lang: string, _status?: number) {
    if (CTX instanceof Response) {
      this.X.status = CTX.status;
      this.X.header = CTX.headers.toJSON();
      return await CTX.arrayBuffer();
    } else if (is.dict(CTX as obj<string>) && !(CTX instanceof Fsyt)) {
      //
      this.X.type = "application/json";
      return this.X.gzip(JSON.stringify(CTX));
    } else {
      let bscr = "",
        _ctx = "";
      if (CTX instanceof Fsyt) {
        bscr = CTX._head();
      } else {
        _ctx = CTX as string;
      }
      this.X.type = "text/html";
      const _HT = html.html(_ctx, head + bscr, lang);
      return this.X.gzip(_HT);
    }
  }
  async jwt(JWT: ServerSide) {
    const { jwtv, refreshjwt } = await this.req.authgroup();
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
      await S.jwt.saveSession(_JWT, this.X.headers);
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
          await S.jwt.saveSession(rjwt, undefined, true);
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

    return this.X.gzip(JSON.stringify(resp));
  }
  async estream(req: request, FS: response, z_args: obj<string>) {
    this.X.header = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    FS.stream = new eStream();
    const CTX = await FS["eventStream"]!(z_args);
    if (is.dict(CTX) && "error" in CTX) {
      this.X.status = CTX.error;
      return "";
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
    return stream;
  }
  async response() {
    if (this.isWSS) return await this.upgrade();
    /*
    -------------------------
    
    -------------------------
    */
    if (this.Y) {
      const { isFile, _class, args } = this.Y;
      if (isFile) {
        //
        return this.isFile();
      } else if (_class) {
        //
        const FS = new _class(this.req) as response;
        const z_args = get.args(args, this.x_args);
        // check for valid session or jwt and return error: code if not.

        await this.auth(FS, z_args);

        if (this.req.isEventStream && typeof FS["eventStream"] === "function") {
          // return
          return this.push(await this.estream(this.req, FS, z_args));
        } else if (typeof FS[this.method] === "function") {
          const CTX = await FS[this.method](z_args);
          //
          const { header, status, head, lang } = FS;
          //
          this.X.header = header;
          //
          // Process CTX
          if (CTX) {
            //
            if (this.method === "post" && CTX instanceof ServerSide) {
              //
              return this.push(await this.jwt(CTX), status);
            } else if (is.dict(CTX) && "error" in CTX) {
              //
              this.X.status = CTX.error as number;
            } else {
              const SS = FS["__session"];
              if (SS) {
                await S.session.saveSession(SS, this.X.headers);
              }
              //
              return this.push(
                await this.ctx(
                  CTX,
                  Lycaon.headstr + html.head(head).join(""),
                  lang,
                ),
                status,
              );
            }
          } else {
            // No response -- could be 204 - unless FS.status has value, return 204 - no Content
            this.X.status = status ?? 204;
          }
        }
        //
      }
    }
    return this.push();
  }
}

/*
-------------------------
use function.apply(),if the function doesn't change anything in "this"

kk
-------------------------
*/

// const R = new Router(make.ID(7));

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
interface dev {
  url?: string;
  hostname?: string;
  method?: string;
  port?: number;
}

export class Lycaon extends _r {
  static headstr: string = "";
  apt: string;
  router: Router;
  constructor(
    public dir: string = "./",
    options: { envPath?: string; appDir?: string; session?: Auth } = {},
  ) {
    super();
    this.router = Router.init;
    const PRIV = this.dir + "/.private";
    const { envPath, appDir, session } = options;
    //
    if (!envPath) {
      is.dir(PRIV);
      is.file(PRIV + "/.env", `SECRET_KEY="${make.ID(20)}"`);
    }
    this.apt = dir + "/" + (appDir ?? "app") + "/";

    this.router.apt = this.apt;
    //

    config({ path: (envPath ? envPath : PRIV) + "/.env" });

    //

    const SH = session ?? new Auth({ dir: this.dir });
    S.init(SH);

    //
    this.file("./fsyt.js");
    //
  }
  /**
   * string | int | float | uuid | file
   * * /path/\<string:args>
   */
  path(path: string) {
    return <T extends typeof response>(f: T) => {
      this.router.route = new Yurl({ url: path, _class: f });
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
    const fs = str.strip(furl, ".");
    let rr = fs.startsWith("/") ? fs : "/" + fs;

    this.router.route = new Yurl({
      url: rr,
      isFile: true,
      withSession: option.session,
      preload: option.preload,
    });

    return rr;
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
      this.router.route = _fr;
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
    this.router.folder(path, option);
  }
  folders(...paths: string[]) {
    paths.forEach((pt) => {
      this.router.folder(pt);
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

    Lycaon.headstr = html.head(this.head).join("");

    if (url) {
      const CTX = await new Runner({
        url: `http://${hostname}:${port}${url ?? "/"}`,
        method: method,
      } as Request).response();
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
          //

          return await new Runner(req, server).response();
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
