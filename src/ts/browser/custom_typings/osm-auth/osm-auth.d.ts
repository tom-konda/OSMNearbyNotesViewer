export interface Window {
  osmAuth : {};
}

interface osmAuthConfig {
  oauth_consumer_key: string,
  oauth_secret: string,
  url ?: string,
  auto?: boolean,
  landing ?: string,
  singlepage ?: boolean
}