interface obj<T> {
  [Key: string]: T;
}

type V = string | number | boolean;
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

interface fs {
  [key: string]: string | undefined | boolean | number;
}
interface bs {
  f_timed?: number;
  [key: string]: string | undefined | boolean | number;
}
interface sesh_db {
  sid: string;
  data: string;
  expiration: string;
  f_timed?: number;
  [key: string]: string | undefined | boolean | number;
}

interface dev {
  url?: string;
  hostname?: string;
  method?: string;
  port?: number;
}
