import { BunFile, CryptoHasher, file } from "bun";
import { mkdirSync, statSync, writeFileSync } from "node:fs";

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

export const generate = {
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
  buffer(str: string): Buffer {
    return Buffer.from(str);
  },
  digest(salt: string) {
    const hmac = new Bun.CryptoHasher("sha256", salt);
    hmac.update("hello");
    return hmac.digest();
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

export const path = {
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

export function decodeSID(name: string) {
  const bkey = str.buffer(name);
  const hash = new CryptoHasher("md5");
  hash.update(bkey);
  return hash.digest("hex");
}
