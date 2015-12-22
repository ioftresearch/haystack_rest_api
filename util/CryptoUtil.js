//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var crypto = require('crypto'),
    HVal = require('../HVal');

/**
 * Crypto utilities
 * @constructor
 */
function CryptoUtil() {}
module.exports = CryptoUtil;

/**
 * Implementation of HMAC algorithm to comply with JAVA Haystack
 * @param {string} algorithm
 * @param {string} data
 * @param {string} key
 */
CryptoUtil.hmac = function hmac(algorithm, data, key) {
  var _key = key;
  // get digest algorithm
  var md = crypto.createHash(algorithm);
  var blockSize = 64;

  // key is greater than block size we hash it first
  var keySize = _key.length;
  if (keySize > blockSize) {
    md.update(_key, 0, keySize);
    _key = md.digest();
    keySize = _key.length;
    md = crypto.createHash("sha1");
  }

  // RFC 2104:
  //   ipad = the byte 0x36 repeated B times
  //   opad = the byte 0x5C repeated B times
  //   H(K XOR opad, H(K XOR ipad, text))

  var i;

  // inner digest: H(K XOR ipad, text)
  for (i = 0; i < blockSize; ++i) {
    if (i < keySize) md.update(String.fromCharCode(HVal.cc(_key[i]) ^ 0x36));
    else md.update(String.fromCharCode(0x36));
  }
  md.update(data, 0, data.length);
  var innerDigest = md.digest();

  // outer digest: H(K XOR opad, innerDigest)
  md = crypto.createHash("sha1");
  for (i = 0; i < blockSize; ++i) {
    if (i < keySize) md.update(String.fromCharCode(HVal.cc(_key[i]) ^ 0x5C));
    else md.update(String.fromCharCode(0x5C));
  }
  md.update(innerDigest);

  // return result
  return md.digest();
};
