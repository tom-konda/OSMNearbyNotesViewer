declare var osmAuth: osmAuthConstructor;

declare module 'osm-auth' {
  export = osmAuth;
}

interface osmAuthConstructor {
  new (osmAuthConfig): osmAuthInstance
}

interface osmAuthInstance {
  logout(): osmAuthInstance,
  authenticated(): boolean,
  authenticate(callback: (err: any, oauth: osmAuthInstance) => any),
  xhr(option: osmAuthXHROptions, callback: (err, xhr: any) => any)
  options(option: osmAuthConfig),
  bootstrapToken(oauth_token: string, callback: (err, oauth: osmAuthInstance) => any)
}

interface osmAuthConfig {
  oauth_consumer_key: string,
  oauth_secret: string,
  url?: string,
  auto?: boolean,
  loading?: (any) => any,
  done?: (any) => any,
  landing?: string,
  singlepage?: boolean
}

interface osmAuthXHROptions {
  path: string,
  method: 'POST' | 'PUT' | 'GET',
  content?: string,
  options?: {},
}