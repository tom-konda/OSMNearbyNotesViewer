declare var osmAuth: osmAuthConstructor;

interface osmAuthConstructor {
  new (osmAuthConfig) : osmauthInstance
}

interface osmauthInstance {
  logout():osmauthInstance,
  authenticated():boolean,
  authenticate(callback:(err, oauth:osmauthInstance) => any),
  xhr(option:osmAuthXHROptions, callback:(err, xhr:any) => any)
  options(option:osmAuthConfig),
  bootstrapToken(oauth_token:string, callback:(err, oauth:osmauthInstance) => any)
}

interface osmAuthConfig {
  oauth_consumer_key: string,
  oauth_secret: string,
  url ?: string,
  auto?: boolean,
  loading?: (any) => any,
  done?: (any) => any,
  landing ?: string,
  singlepage ?: boolean
}

interface osmAuthXHROptions {
  path: string,
  method: string,
  content ?: string,
  options ?: {},
}