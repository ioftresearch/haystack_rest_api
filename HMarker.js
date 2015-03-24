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
 * HMarker is the singleton value for a marker tag.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 */
function HMarker() {}
HMarker.prototype = Object.create(HVal.prototype);
module.exports = HMarker;

/**
 * Equals is based on reference
 * @param {HMarker} that
 * @return {boolean}
 */
HMarker.prototype.equals = function(that) {
  return that instanceof HMarker && this === that;
};

/**
 * Encode as "marker"
 * @return {string}
 */
HMarker.prototype.toString = function() {
  return "marker";
};

/**
 * Encode as "M"
 * @return {string}
 */
HMarker.prototype.toZinc = function() {
  return "M";
};

/**
 * Singleton value
 * @static
 */
HMarker.VAL = new HMarker();
