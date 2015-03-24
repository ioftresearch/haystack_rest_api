//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

/**
 * HVal is the base class for representing haystack tag
 * scalar values as an immutable class.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 * 
 * @constructor
 * @private
 * @abstract
 */
function HVal() {
}
module.exports = HVal;

/**
 * String format is for human consumption only
 * @return {string}
 */
HVal.prototype.toString = function() {
  return this.toZinc();
};

/**
 * Return sort order as negative, 0, or positive
 * @param {HVal} that - HVal to compare to
 * @return {int}
 */
HVal.prototype.compareTo = function(that) {
  return this.toString().localeCompare(that);
};

/**
 * Encode value to zinc format
 * @abstract
 * @return {string}
 */
HVal.prototype.toZinc = function() {
  throw new Error('must be implemented by subclass!');
};

/**
 * Equality is value based
 * @abstract
 * @return {boolean}
 */
HVal.prototype.equals = function() {
  throw new Error('must be implemented by subclass!');
};

HVal.startsWith = function(s, prefix) {
  return s.substring(0, prefix.length) === prefix;
};
HVal.endsWith = function(s, suffix) {
  return s.substring(s.length - suffix.length) === suffix;
};
HVal.typeis = function(check, prim, obj) {
  return typeof(check) === prim || check instanceof obj;
};
HVal.cc = function(c) {
  return c.charCodeAt(0);
};
