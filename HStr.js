//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HVal = require('./HVal');

/**
 * HStr wraps a java.lang.String as a tag value.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 * @param {string{ val
 */
function HStr(val) {
  // ensure singleton usage
  if (val==="" && arguments.callee._emptySingletonInstance) return arguments.callee._emptySingletonInstance;

  if (val==="") arguments.callee._emptySingletonInstance = this;

  this.val = val;
}
HStr.prototype = Object.create(HVal.prototype);
module.exports = HStr;

/**
 * Encode using double quotes and back slash escapes
 * @return {string}
 */
HStr.prototype.toZinc = function() {
  return HStr.toCode(this.val);
};

/**
 * Encode using "n:" with back slash escapes
 * @return {string}
 */
HStr.prototype.toJSON = function() {
  return "s:" + HStr.parseCode(this.val);
};

/**
 * Equals is based on reference
 * @return {boolean}
 */
HStr.prototype.equals = function(that) {
  return that instanceof HStr && this.val === that.val;
};

/**
 * String format is for human consumption only
 * @return {string}
 */
HStr.prototype.toString = function() {
  return this.val;
};

/**
 * Singleton value for empty string ""
 * @static
 * @return {HStr}
 */
HStr.EMPTY = new HStr("");
/**
 * Construct from String value
 * @static
 * @param {string} val
 * @return {HStr}
 */
HStr.make = function(val) {
  if (typeof(val) === 'undefined' || val === null) return val;
  if (val.length === 0) return HStr.EMPTY;
  return new HStr(val);
};

/**
 * Encode using double quotes and back slash escapes
 * @param {string} val
 * @return {string}
 */
HStr.toCode = function(val) {
  var s = '"';
  s += HStr.parseCode(val);
  s += '"';

  return s;
};
HStr.parseCode = function(val) {
  var s = "";
  for (var i = 0; i < val.length; ++i) {
    var c = HVal.cc(val.charAt(i));
    if (c < HVal.cc(' ') || c === HVal.cc('"') || c === HVal.cc('\\')) {
      s += '\\';
      switch (c) {
        case HVal.cc('\n'):
          s += 'n';
          break;
        case HVal.cc('\r'):
          s += 'r';
          break;
        case HVal.cc('\t'):
          s += 't';
          break;
        case HVal.cc('"'):
          s += '"';
          break;
        case HVal.cc('\\'):
          s += '\\';
          break;

        default:
          s += 'u00';
          if (c <= 0xf) s += '0';
          s += c.toString(16);
      }
    } else {
      s += String.fromCharCode(c);
    }
  }

  return s;
}
/**
 * Custom split routine to maintain compatibility with Java Haystack
 * @param {string} str
 * @param {string} sep
 * @param {boolean} trim
 * @return {string[]}
 */
HStr.split = function(str, sep, trim) {
  var s = str.split(sep);
  if (trim) {
    for (var i = 0; i < s.length; i++)
      s[i] = s[i].trim();
  }

  return s;
};
