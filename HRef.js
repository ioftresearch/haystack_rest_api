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
 * HRef wraps a string reference identifier and optional display name.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 * 
 * @constructor
 * @extends {HVal}
 * @param {string} val
 * @param {string} dis
 */
function HRef(val, dis) {
  /** String identifier for reference */
  this.val = val;
  /** Display name for reference or null */
  this.display = dis;
}
HRef.prototype = Object.create(HVal.prototype);
module.exports = HRef;

var HStr = require('./HStr');

/**
 * Encode as "@id <dis>"
 * @return {string}
 */
HRef.prototype.toZinc = function() {
  var s = "@" + this.val;
  if (typeof(this.display) !== 'undefined' && this.display !== null)
    s += " " + HStr.toCode(this.display);

  return s;
};

/**
 * Equals is based on val field only
 * @param {HRef}
 * @return {boolean}
 */
HRef.prototype.equals = function(that) {
  return that instanceof HRef && this.val === that.val;
};

/**
 * Return the val string
 * @return {string}
 */
HRef.prototype.toString = function() {
  return this.val;
};

/**
 * Encode as "@id"
 * @return {string}
 */
HRef.prototype.toCode = function() {
  return "@" + this.val;
};

/**
 * Return display string which is dis field if non-null, val field otherwise
 * @return {string}
 */
HRef.prototype.dis = function() {
  return typeof(this.display) === 'undefined' || this.display === null ? this.val : this.display;
};

/**
 * Construct for string identifier and optional display
 * @static
 * @param {string} val
 * @param {string} dis
 */
HRef.make = function(val, dis) {
  if (typeof(val) === 'undefined' || val === null || !HRef.isId(val))
    throw new Error("Invalid id val: \"" + val + "\"");

  return new HRef(val, dis);
};

/**
 * Return if the given string is a valid id for a reference
 * @param {string} id
 * @return {boolean}
 */
HRef.isId = function(id) {
  if (id.length === 0) return false;
  for (var i = 0; i < id.length; ++i) {
    if (!HRef.isIdChar(HVal.cc(id.charAt(i))))
      return false;
  }

  return true;
};

var idChars = [];
{
  for (var i = 0; i < 127; i++) idChars[i] = false;
  for (var i = HVal.cc('a'); i <= HVal.cc('z'); ++i) idChars[i] = true;
  for (var i = HVal.cc('A'); i <= HVal.cc('Z'); ++i) idChars[i] = true;
  for (var i = HVal.cc('0'); i <= HVal.cc('9'); ++i) idChars[i] = true;
  idChars[HVal.cc('_')] = true;
  idChars[HVal.cc(':')] = true;
  idChars[HVal.cc('-')] = true;
  idChars[HVal.cc('.')] = true;
  idChars[HVal.cc('~')] = true;
}

/**
 * Is the given character valid in the identifier part
 * @param {int} ch
 * @return {boolean}
 */
HRef.isIdChar = function(ch) {
  return ch >= 0 && ch < idChars.length && idChars[ch];
};
