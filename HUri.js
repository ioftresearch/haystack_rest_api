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
 * HUri models a URI as a string.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 * @param {string} val
 */
function HUri(val) {
  this.val = val;
}
HUri.prototype = Object.create(HVal.prototype);
module.exports = HUri;

/**
 * Equals is based on string value
 * @param {HUri}
 * @return {boolean}
 */
HUri.prototype.equals = function(that) {
  return that instanceof HUri && this.val === that.val;
};

/**
 * String format is for human consumption only
 * @return {string}
 */
HUri.prototype.toString = function() {
  return this.val;
};

/**
 * Encode using "`" back ticks
 * @return {string}
 */
HUri.prototype.toZinc = function() {
  var s = "`";
  s += parse(this);
  s += "`";
  return s;
};

/**
 * Encode as "h:hh:mm:ss.FFF"
 * @return {string}
 */
HUri.prototype.toJSON = function() {
  return "u:" + parse(this);
};
function parse(self) {
  var s = "";
  for (var i = 0; i < self.val.length; ++i) {
    var c = self.val.charAt(i);
    if (HVal.cc(c) < HVal.cc(" "))
      throw new Error("Invalid URI char '" + self.val + "', char='" + c + "'");
    if (c === "`") s += "\\";
    s += c;
  }

  return s;
}

/**
 * Singleton value for empty URI
 * @static
 * @return {HUri}
 */
HUri.EMPTY = new HUri("");
/**
 * Construct from string value
 * @static
 * @param {string} val
 * @return {HUri}
 */
HUri.make = function(val) {
  if (val.length === 0) {
    return HUri.EMPTY;
  }
  return new HUri(val);
};
