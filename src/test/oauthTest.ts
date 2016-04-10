'use strict';
const https = require('https');
const mocha = require('mocha');
const assert = require('power-assert');
let osmAuthconfig = <oauthJSONConfig>require('../../config/test.config.json');
let xml2js = require('xml2js');

describe(
  'OSM OAuth',
  function () {
    let OAuth = require('OAuth');
    let oauth = new OAuth.OAuth(
      `${osmAuthconfig.url}/oauth/request_token`,
      `${osmAuthconfig.url}/oauth/access_token`,
      osmAuthconfig.oauth_consumer_key,
      osmAuthconfig.oauth_secret,
      '1.0',
      null,
      'HMAC-SHA1'
    );

    let oauthToken:string;
    let oauthSecret:string;
    let accessToken:string;
    let accessTokenSecret:string;

    it(
      'Get request token test',
      function (done) {
        oauth.getOAuthRequestToken(function(err, oauth_token, oauth_token_secret, results ){
            oauthToken = oauth_token;
            oauthSecret = oauth_token_secret;
            assert.deepEqual(oauthToken.length, 40, 'Token Length is mismatched');
            done();
        });
      }
    ).timeout(5000);

    it(
      'Get OSM notes test',
      function (done) {
        oauth.get(
          `${osmAuthconfig.url}/api/0.6/notes?limit=1000&bbox=140.0,40.0,140.1,40.1`, oauthToken, oauthSecret, function(error, data, res){

          xml2js.parseString(data, function (err, result) {
              assert.deepEqual(Object.keys(result), ['osm'], 'Failure')
              done();
          });
        });
      }
    ).timeout(5000);
  }
)

