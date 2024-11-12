import { CryptoHasher, file, write, gzipSync, gunzipSync } from "bun";
import { str, get, is, html, Time, O, $$ } from "./index";
import { sign, verify } from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { promises as fr } from "node:fs";
import { Client } from "pg";

type sessionConfig = {
  COOKIE_NAME: string;
  COOKIE_DOMAIN: string;
  COOKIE_PATH: string;
  COOKIE_HTTPONLY: boolean;
  COOKIE_SECURE: boolean;
  REFRESH_EACH_REQUEST: boolean;
  COOKIE_SAMESITE: string;
  KEY_PREFIX: string;
  PERMANENT: boolean;
  USE_SIGNER: boolean;
  ID_LENGTH: number;
  FILE_THRESHOLD: number;
  LIFETIME: number;
  MAX_COOKIE_SIZE: number;
  INTERFACE: string;
  STORAGE: string;
  JWT_STORAGE: string;
  JWT_LIFETIME: number;
};

export class Seshion {
  type: "cached" | "postgres";
  postgresClient: Client | null = null;
  config: sessionConfig = {
    COOKIE_NAME: "session",
    COOKIE_DOMAIN: "127.0.0.1",
    COOKIE_PATH: "/",
    COOKIE_HTTPONLY: true,
    COOKIE_SECURE: true,
    REFRESH_EACH_REQUEST: false,
    COOKIE_SAMESITE: "Strict",
    KEY_PREFIX: "session:",
    PERMANENT: true,
    USE_SIGNER: false,
    ID_LENGTH: 32,
    FILE_THRESHOLD: 500,
    LIFETIME: 31,
    MAX_COOKIE_SIZE: 4093,
    INTERFACE: "fs",
    STORAGE: ".sessions",
    JWT_STORAGE: ".jwt",
    JWT_LIFETIME: 5,
  };
  constructor(type: "cached" | "postgres" = "cached") {
    this.type = type;
  }
  init(storagePath: string = "./") {
    this.config.STORAGE = storagePath + this.config.STORAGE;
    this.config.JWT_STORAGE = storagePath + this.config.JWT_STORAGE;
    return this;
  }
  get session(): ServerInterface {
    const ss = this.type;
    if (ss == "postgres") {
      const CLIENT = this.postgresClient;
      if (CLIENT) {
        return new PostgreSQL(CLIENT, this.config);
      }
    }
    return new CachedSession(this.config, this.config.STORAGE);
  }
  get jwt(): ServerInterface {
    // update and implement JWT in postgres soon.
    return new CachedSession(this.config, this.config.JWT_STORAGE, true);
  }
  getSessionID(req: Request) {
    const cookie = req.headers.get("cookie");
    if (cookie) {
      const cookies = cookie.split(";").reduce<obj<string>>((ob, d) => {
        const [key, val] = d.trim().split(/=(.*)/s);
        ob[key] = val;
        return ob;
      }, {});
      return cookies.session;
    }
  }
}

class callBack {
  data: obj<string>;
  modified: boolean;
  // accessed: boolean;
  new: boolean = true;
  length = 0;
  constructor(initial: obj<string> = {}) {
    this.modified = true;
    // this.accessed = true;
    this.data = {};
    this.length = O.length(initial);
    if (this.length) {
      this.new = false;
    }
    O.ass(this.data, initial);
  }
  set(target: any, prop: string, val: string) {
    if (target.data[prop] != val) {
      this.modified = true;
      target.data[prop] = val;
      if (!(prop in target.data)) {
        this.length++;
      }
    }
    return target;
  }
  get(target: any, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return target.data[prop];
  }
  has(target: any, prop: string) {
    if (prop in target.data) {
      return true;
    }
    return false;
  }
  deleteProperty(target: any, val: string) {
    if (val in target.data) {
      this.modified = true;
      delete target.data[val];
    }
    return true;
  }
}

// --------------
export class ServerSide extends callBack {
  [Key: string]: any;
  modified: boolean;
  sid: string;
  permanent: boolean;
  constructor(
    sid: string = "",
    permanent: boolean = false,
    initial: obj<string> = {},
  ) {
    super(initial);
    this.modified = false;
    this.sid = sid;
    this.permanent = permanent;
  }
  get session() {
    return new Proxy<ServerSide>(this, this);
  }
}

// --------------

function str2Buffer(str: string): Buffer {
  return Buffer.from(str);
}
function hashedToken(len = 64) {
  return new CryptoHasher("sha256").update(randomBytes(len)).digest("hex");
}
function decodeSID(name: string) {
  const bkey = str2Buffer(name);
  const hash = new CryptoHasher("md5");
  hash.update(bkey);
  return hash.digest("hex");
}
function hmacDigest(salt: string) {
  const hmac = new Bun.CryptoHasher("sha256", salt + get.secret());
  // hmac.update(update);
  return hmac.digest();
}

// --------------

class signer {
  salt: string;
  constructor() {
    this.salt = "_salty_ss";
  }
  getSignature(val: string) {
    const vals = str2Buffer(val);
    return hmacDigest(this.salt).toString("base64");
  }
  deriveKey() {
    return hmacDigest(this.salt);
  }
  sign(val: string) {
    const sig = this.getSignature(val);
    const vals = str2Buffer(val + "." + sig);
    return str.decode(vals);
  }
  unsign(signedVal: string) {
    if (!(signedVal.indexOf(".") > -1)) {
      throw Error("No sep found");
    }
    const isept = signedVal.indexOf(".");
    const val = signedVal.slice(0, isept);
    const sig = signedVal.slice(isept + 1);
    return this.verifySignature(val, sig);
  }
  loadUnsign(vals: string) {
    if (this.unsign(vals)) {
      const sval = str2Buffer(vals);
      const sept = str2Buffer(".").toString()[0];
      if (!(sept in sval)) {
        throw Error("No sep found");
      }
      const isept = sval.indexOf(sept);
      const val = sval.subarray(0, isept);

      return Buffer.from(val.toString(), "base64").toString("utf-8");
    }
  }
  verifySignature(val: string, sig: string) {
    return this.getSignature(val) == sig ? true : false;
  }
  gen(len = 21) {
    const rbyte = randomBytes(len);
    let lbyte = rbyte.toString("base64");
    if (lbyte.endsWith("=")) {
      lbyte = lbyte.slice(0, -1);
    }
    return this.sign(lbyte);
  }
}

class sidGenerator {
  signer: signer;
  constructor() {
    this.signer = new signer();
  }
  generate(len = 21) {
    const rbyte = randomBytes(len);
    let lbyte = rbyte.toString("base64");
    if (lbyte.endsWith("=")) {
      lbyte = lbyte.slice(0, -1);
    }
    return this.signer.sign(lbyte);
  }
}

export class ServerInterface extends sidGenerator {
  sclass: typeof ServerSide = ServerSide;
  permanent: boolean = false;
  config: sessionConfig;
  constructor(config: sessionConfig) {
    super();
    this.config = config;
    this.permanent = config.PERMANENT;
  }
  session() {
    return new this.sclass(this.generate(), this.permanent).session;
  }
  async openSession(sid?: string): Promise<ServerSide> {
    if (sid && this.signer.unsign(sid)) {
      return await this.fetchSession(sid);
    } else {
      return this.session();
    }
  }
  async fetchSession(sid: string): Promise<ServerSide> {
    return this.session();
  }
  async saveSession(xsesh: ServerSide, rsx?: any, deleteMe: boolean = false) {
    return;
  }
  getExpiration(config: sessionConfig, xsesh: ServerSide): string | null {
    if (xsesh.permanent) {
      const now = new Date();
      const lifet = config.LIFETIME;
      return now.setDate(now.getDate() + lifet).toString();
    }
    return null;
  }
  deleteBrowserSession(xsesh: ServerSide, rsx?: any) {
    if (rsx) {
      const cookie = this.setCookie(xsesh, 0);
      rsx.header = { "Set-Cookie": cookie };
    }
  }
  setCookie(xsesh: ServerSide, life: Date | number, _sameSite = "") {
    let sameSite = null;
    let xpire: obj<any> = {};
    if (this.config.COOKIE_SAMESITE) {
      sameSite = this.config.COOKIE_SAMESITE;
    }

    if (_sameSite) {
      sameSite = _sameSite;
    }
    if (life === 0) {
      xpire.maxAge = life.toString();
    } else {
      xpire.expires = life;
    }

    return html.cookie(this.config.COOKIE_NAME!, xsesh.sid, {
      domain: "",
      path: this.config.COOKIE_PATH,
      httpOnly: this.config.COOKIE_HTTPONLY,
      secure: this.config.COOKIE_SECURE,
      sameSite: sameSite,
      ...xpire,
    });
  }
}

/*
-------------------------
local CACHE
-------------------------
*/

export class Session extends ServerSide {}

// Cache the folder contents in JSON
interface ffcache {
  [key: string]: string | undefined | boolean | number;
  f_timed?: number;
  data: string;
  life: number;
}
class FFCached<T extends bs> {
  path: string;
  data: Map<any, T>;
  constructor(folderpath: string) {
    this.data = new Map();
    this.path = folderpath + "/";
  }
  async init(val: string): Promise<T | null> {
    const fname = decodeSID(val);
    const fpath = this.path + fname;

    const FL = file(fpath);
    if (await FL.exists()) {
      const data = await FL.arrayBuffer();
      try {
        const GX = JSON.parse(str.decode(gunzipSync(data)));
        GX.f_timed = Date.now();
        this.data.set(fname, GX);
        return GX;
      } catch (error) {}
    }
    return null;
  }
  async checkLast(time: number) {
    const xl = new Date(time);
    xl.setMinutes(xl.getMinutes() + 60);
    if (xl.getTime() < Date.now()) {
      return true;
    }
    return false;
  }
  async get(val: string | undefined): Promise<T | null> {
    if (val) {
      const hdat = this.data.get(val);
      if (hdat == undefined) {
        return await this.init(val);
      } else {
        if (hdat && "f_timed" in hdat) {
          const atv = await this.checkLast(hdat.f_timed!);
          if (atv) {
            return await this.init(val);
          }
        }
        return hdat;
      }
    }
    return null;
  }
  async set(val: string, data: T) {
    const fname = decodeSID(val);
    const fpath = this.path + fname;
    await is.file(fpath, "");
    await write(fpath, gzipSync(JSON.stringify(data)));
    data.f_timed = Date.now();
    this.data.set(val, data);
  }
  async delete(key: string) {
    const fname = decodeSID(key);
    this.data.delete(fname);
    const fpath = this.path + fname;
    file(fpath)
      .exists()
      .then(async (e) => {
        await fr.unlink(fpath);
      })
      .catch();
  }
}

class CachedSession extends ServerInterface {
  ffcache: FFCached<ffcache>;
  sclass = Session;
  isJWT: boolean;
  constructor(
    config: sessionConfig,
    cacherpath = ".sessions",
    isJWT: boolean = false,
  ) {
    super(config);
    this.ffcache = new FFCached(cacherpath);
    this.isJWT = isJWT;
  }
  life(key: string, lstr: number) {
    const { LIFETIME, JWT_LIFETIME } = this.config;
    const NT = new Time(lstr).timed({
      day: this.isJWT ? JWT_LIFETIME : LIFETIME,
    });
    if (NT.getTime() - new Date().getTime() > 0) {
      return true;
    } else {
      this.ffcache.delete(key);
      return false;
    }
  }
  async fetchSession(sid: string) {
    const prefs = this.config.KEY_PREFIX + sid;
    const dt = await this.ffcache.get(prefs);
    let _data = {};
    if (dt) {
      let isL = true;
      if ("life" in dt) {
        isL = this.life(prefs, dt.life);
      }
      _data = isL ? JSON.parse(dt.data) : {};
    }
    return new this.sclass(sid, this.config.PERMANENT, _data).session;
  }
  async saveSession(xsesh: ServerSide, rsx?: any, deleteMe: boolean = false) {
    const prefs = this.config.KEY_PREFIX + xsesh.sid;
    if (!Object.entries(xsesh.data).length) {
      if (xsesh.modified || deleteMe) {
        this.ffcache.delete(prefs);
        this.deleteBrowserSession(xsesh, rsx);
      }
      return;
    }
    const life = new Time().timed({ day: this.config.LIFETIME });
    const data = JSON.stringify(xsesh.data);

    await this.ffcache.set(prefs, {
      data,
      life: Time.now,
    });

    if (rsx) {
      const cookie = this.setCookie(xsesh, life);
      rsx.header = { "Set-Cookie": cookie };
    }
  }
}

/*
-------------------------
Postgres
-------------------------
*/

// Single query --
export class PGCache<T extends bs> {
  client: Client;
  query: string;
  f_timed: number;
  data: Map<any, T>;
  key: string;
  constructor(client: Client, key: string, query: string) {
    this.query = query;
    this.key = key;
    this.f_timed = Date.now();
    this.data = new Map();
    this.client = client;
  }
  async init(val: string): Promise<T | null> {
    const TQ = await this.client.query({
      text: this.query + ` where ${this.key} = $1`,
      values: [val],
    });
    // Delete keys with no value
    for (const [k, v] of this.data) {
      if (!v) {
        this.data.delete(k);
      }
    }
    if (TQ.rowCount) {
      const tr = TQ.rows[0];
      tr.f_timed = Date.now();
      this.data.set(val, tr);
      return tr;
    } else {
      this.data.set(val, null as any);
      return null;
    }
  }
  async checkLast(time: number) {
    const xl = new Date(time);
    xl.setMinutes(xl.getMinutes() + 15);
    if (xl.getTime() < Date.now()) {
      return true;
    }
    return false;
  }
  async get(val: string | undefined): Promise<T | null> {
    if (val) {
      const hdat = this.data.get(val);
      if (hdat == undefined) {
        return await this.init(val);
      } else {
        if (hdat && "f_timed" in hdat) {
          const atv = await this.checkLast(hdat.f_timed!);
          if (atv) {
            return await this.init(val);
          }
        }
        return hdat;
      }
    }
    return null;
  }
  async set(data: T) {
    if (this.key in data) {
      data.f_timed = Date.now();
      this.data.set(data[this.key], data);
    }
  }
  async delete(key: string) {
    this.data.delete(key);
  }
}

class postgreSession extends ServerSide {}

class PostgreSQL extends ServerInterface {
  sclass: typeof ServerSide = postgreSession;
  client: Client;
  pgc: PGCache<sesh_db>;
  constructor(client: Client, config: sessionConfig) {
    super(config);
    this.client = client;
    this.pgc = new PGCache<sesh_db>(client, "sid", `SELECT * FROM session`);
  }
  async fetchSession(sid: string) {
    const prefs = this.config.KEY_PREFIX + sid;
    const itms = await this.pgc.get(prefs);
    let data = {};
    if (itms) {
      data = JSON.parse(itms.data);
    }
    return new this.sclass(sid, this.config.PERMANENT, data).session;
  }
  async saveSession(
    xsesh: ServerSide,
    rsx?: any,
    deleteMe?: boolean,
    sameSite: string = "",
  ): Promise<void> {
    const prefs = this.config.KEY_PREFIX + xsesh.sid;
    if (!Object.entries(xsesh.data).length) {
      if (xsesh.modified || deleteMe) {
        if (rsx) {
          await this.client.query({
            text: `DELETE FROM session WHERE sid = $1`,
            values: [prefs],
          });

          await this.pgc.delete(prefs);
          const cookie = this.setCookie(xsesh, 0);
          rsx.header = { "Set-Cookie": cookie };
        }
      }
      return;
    }

    const life = new Time().timed({ day: this.config.LIFETIME });
    const data = JSON.stringify(xsesh.data);

    if (rsx) {
      const expre = this.getExpiration(this.config, xsesh);
      await this.client.query({
        text: `INSERT INTO session(sid, data, expiration) VALUES($1, $2, $3)`,
        values: [prefs, data, expre ? expre : null],
      });
      await this.pgc.set({
        sid: prefs,
        data: data,
        expiration: expre ?? "",
        life: Time.now,
      });
      const cookie = this.setCookie(xsesh, life);
      rsx.header = { "Set-Cookie": cookie };
    }
  }
}

/*
-------------------------
JWT
-------------------------
*/

// export class JWT extends ServerSide {}

export class JWTInterface extends sidGenerator {
  salt: string;
  constructor() {
    super();
    this.salt = "salty_jwt";
  }
  sign(payload: obj<any>) {
    const options = {
      issuer: this.salt, // Issuer of the token
    };
    const datax = {
      data: payload,
    };

    return sign(datax, get.secret(), options);
  }
  get random() {
    const options = {
      issuer: this.salt, // Issuer of the token
    };
    const datax = {
      data: hashedToken(),
    };
    return sign(datax, get.secret(), options);
  }
  jwt() {
    //
    const rid = this.generate();
    return new ServerSide(rid).session;
  }
  verify(
    payload: string,
    time?: {
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    },
  ): obj<string> | null {
    try {
      const ever = verify(payload, get.secret());

      if (ever) {
        const { data, iat, iss } = ever as any;
        if (iss == this.salt) {
          if (time) {
            const { days, hours, minutes, seconds } = time;
            let endD = new Date(iat * 1000);
            if (days) {
              endD = new Date(endD.setDate(endD.getDate() + days));
            } else if (hours) {
              endD = new Date(endD.setHours(endD.getHours() + hours));
            } else if (minutes) {
              endD = new Date(endD.setMinutes(endD.getMinutes() + minutes));
            } else if (seconds) {
              endD = new Date(endD.setSeconds(endD.getSeconds() + seconds));
            }
            if (endD.getTime() - Date.now() > 0) {
              return data as obj<string>;
            }
          } else {
            return data as obj<string>;
          }
        }
      }
    } catch (e) {}

    return null;
  }
  open(
    token: string,
    time?: {
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    },
  ): ServerSide {
    if (token) {
      const tv = this.verify(token, time);
      if (tv) {
        return new ServerSide(token, true, tv).session;
      }
    }

    return this.jwt();
  }
  save(xjwts: ServerSide) {
    const data = xjwts.data;
    if ("access_token" in data) {
      delete data["access_token"];
    }
    return this.sign(data);
  }
  new(payload: obj<any>) {
    return this.sign(payload);
  }
}

// json files CACHED reader --
export class Fjson<T extends fs> {
  fs: string;
  f_timed: number;
  data: Map<any, T>;
  key: string;
  dir: string;
  constructor({ dir, fs, key }: { dir: string; fs: string; key: string }) {
    this.dir = dir + "/ffs";
    this.key = key;
    this.f_timed = Date.now();
    this.data = new Map();
    this.fs = this.dir + `/${fs}.json`;
  }
  async init() {
    if (is.dir(this.dir) && (await is.file(this.fs, "{}"))) {
      file(this.fs)
        .text()
        .then((e) => {
          const FJSON = JSON.parse(e);
          this.data = new Map(O.items(FJSON));
        })
        .catch((e) => {
          e;
        });
    }
  }
  async get(val: string | undefined): Promise<T | null> {
    const hdat = this.data.get(val);
    if (hdat) return hdat;
    return null;
  }
  async set(data: T) {
    if (this.key in data) {
      const frr = await file(this.fs).text();
      if (frr) {
        const FJSON = JSON.parse(frr);
        const dtk = data[this.key] as string;
        FJSON[dtk] = data;
        await write(this.fs, JSON.stringify(FJSON));
      }
      this.data.set(data[this.key], data);
    }
  }
  async delete(key: string) {
    if (await this.get(key)) {
      const frr = await file(this.fs).text();
      if (frr) {
        const FJSON = JSON.parse(frr.toString());
        if (key in FJSON) {
          delete FJSON[key];
          await write(this.fs, JSON.stringify(FJSON));
        }
        this.data.delete(key);
      }
    }
  }
  async json() {
    const fraw = await file(this.fs).text();
    const JPR = JSON.parse(fraw);
    return O.vals(JPR);
  }
}
