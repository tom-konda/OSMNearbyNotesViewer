import * as osmAuth from 'osm-auth';
const authConfig = <oauthJSConfig>require('../../config/config.js');

export const OAuth = new osmAuth(authConfig);