//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HVal = require('../HVal');

/**
 * Base64 handles various methods of encoding and decoding
 * base 64 format.
 * 
 * @constructor
 * @param {string} alphabet
 * @param {string} adding
 */
function Base64(alphabet, padding) {
  this.alphabet = alphabet;
  this.charIdx = [];
  for (var i = 0; i < alphabet.length; i++)
    this.charIdx[HVal.cc(alphabet.charAt(i))] = i;

  this.padding = padding;
  this.pad1 = padding;
  this.pad2 = padding + padding;
}
module.exports = Base64;

/**
 * Return a Base64 codec that uses standard Base64 format.
 */
Base64.STANDARD = new Base64(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    '=');

/**
 * Return a Base64 codec that uses a custom, Uri-friendly Base64 format.
 * <p>
 * This codec <i>mostly</i> follows the RFC 3548 standard for Base64.
 * It uses '-' and '_' instead of '+' and '/' (as per RFC 3548),
 * but uses use '~' as padding instead of '=' (this is the non-standard part).
 * <p>
 * This approach allows us to encode and decode HRef instances.
 * HRef has five special chars available for us to use: ':', '.', '-', '_', '~'.
 * We are using three of them here, leaving two still available: ':' and '.'
 */
Base64.URI = new Base64(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    '~');

/**
 * Encode the string to base 64, using the platform's default charset.
 * @param {string} str
 * @return {string}
 */
Base64.prototype.encode = function(str) {
  return this.encodeBytes(str);
};

/**
 * Encode the string to base 64, using the UTF8 charset.
 * @param {string} str
 * @return {string}
 */
Base64.prototype.encodeUTF8 = function(str) {
  return this.encodeBytes(new Buffer(str).toString("UTF-8"));
};

/**
 * Decode the string from base 64, using the platform's default charset.
 * @param {string} str
 * @return {string}
 */
Base64.prototype.decode = function(str) {
  return this.decodeBytes(str);
};

/**
 * Decode the string from base 64, using the UTF8 charset.
 * @param {string} str
 * @return {string}
 */
Base64.prototype.decodeUTF8 = function(str) {
  return this.decodeBytes(new Buffer(str).toString("UTF-8"));
};

/**
 * Encode the byte array to base 64.
 * @param {Buffer} bytes
 * @return {string}
 */
Base64.prototype.encodeBytes = function(bytes) {
  if (typeof(bytes) === 'string' || bytes instanceof String) {
    bytes = new Buffer(bytes);
  }
  var size = bytes.length;
  var arr = "";

  var i = 0;
  while (i < size) {
    var b0 = bytes[i++];
    var b1 = (i < size) ? bytes[i++] : 0;
    var b2 = (i < size) ? bytes[i++] : 0;

    var mask = 0x3F;
    arr += this.alphabet.charAt((b0 >> 2) & mask);
    arr += this.alphabet.charAt(((b0 << 4) | ((b1 & 0xFF) >> 4)) & mask);
    arr += this.alphabet.charAt(((b1 << 2) | ((b2 & 0xFF) >> 6)) & mask);
    arr += this.alphabet.charAt(b2 & mask);
  }

  switch (size % 3) {
    case 1: // replace the last 2 chars with pad2
      arr = arr.substring(0, arr.length - 2) + this.pad2;
      break;
    case 2: // replace the last char with pad1
      arr = arr.substring(0, arr.length - 1) + this.pad1;
      break;
  }

  return arr;
};

/**
 * Decode the byte array from base 64.
 * @param {string} str
 * @return {string}
 */
Base64.prototype.decodeBytes = function(str) {
  var delta = HVal.endsWith(str, this.pad2) ? 2 : HVal.endsWith(str, this.pad1) ? 1 : 0;
  var bytes = str.length * 3 / 4 - delta;
  var s = "";

  var mask = 0xFF;
  var index = 0;
  for (var i = 0; i < str.length; i += 4) {
    var c0 = this.charIdx[HVal.cc(str.charAt(i))];
    var c1 = this.charIdx[HVal.cc(str.charAt(i + 1))];
    s += String.fromCharCode(((c0 << 2) | (c1 >> 4)) & mask);
    index++;
    if (index >= bytes) return s;

    var c2 = this.charIdx[HVal.cc(str.charAt(i + 2))];
    s += String.fromCharCode(((c1 << 4) | (c2 >> 2)) & mask);
    index++;
    if (index >= bytes) return s;

    var c3 = this.charIdx[HVal.cc(str.charAt(i + 3))];
    s += String.fromCharCode(((c2 << 6) | c3) & mask);
    index++;
  }

  return s;
};
