import osmAuth = require('osm-auth');
const authConfig = <oauthJSONConfig>require('../../config/config.json');

exports.OAuth = new osmAuth(authConfig);