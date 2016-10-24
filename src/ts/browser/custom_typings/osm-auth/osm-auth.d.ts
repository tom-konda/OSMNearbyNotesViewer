declare var osmAuth: osmAuthConstructor;

declare module "osm-auth" {
  export = osmAuth
}

interface osmAuthConstructor {
  new (osmAuthConfig: osmAuthConfig): osmAuthInstance
}

interface osmAuthInstance {
  logout(): osmAuthInstance,
  authenticated(): boolean,
  authenticate(callback: (err?: any, oauth?: osmAuthInstance) => any): any,
  xhr(options: osmAuthXHROptions, callback: (err: null | ErrorEvent | XMLHttpRequest, xhr: any) => any): any
  options(): osmAuthConfig,
  options(option: osmAuthOptions): any,
  bootstrapToken(oauth_token: string, callback: (err: any, oauth: osmAuthInstance) => any): any
  preauth(options: osmAuthConfig): any
}

interface osmAuthConfig {
  oauth_consumer_key: string,
  oauth_secret: string,
  url?: string,
  auto?: boolean,
  loading?: (args: any) => any,
  done?: (args: any) => any,
  landing?: string,
  singlepage?: boolean
}

interface osmAuthOptions {
  oauth_consumer_key?: string,
  oauth_secret?: string,
  url?: string,
  auto?: boolean,
  loading?: (args: any) => any,
  done?: (args: any) => any,
  landing?: string,
  singlepage?: boolean
}

interface osmAuthXHROptions {
  path: string,
  method: 'POST' | 'PUT' | 'GET',
  content?: string,
  prefix?: boolean,
  options?: any,
}
