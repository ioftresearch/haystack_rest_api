var HVal = require('./HVal');

/**
 * HBool defines singletons for true/false tag values.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @private
 * @extends {HVal}
 * @param {boolean} val - Boolean value
 */
function HBool(val) {
  this.val = val;
}
HBool.prototype = Object.create(HVal.prototype);
module.exports = HBool;

/**
 * Construct from boolean value
 * @param {boolean} val
 * @return {HBool}
 */
HBool.make = function(val) {
  if (!HVal.typeis(val, 'boolean', Boolean))
    throw new Error("Invalid boolean val: \"" + val + "\"");

  return val ? HBool.TRUE : HBool.FALSE;
};

/**
 * Encode as T/F
 * @return {string}
 */
HBool.prototype.toZinc = function() {
  return this.val ? "T" : "F";
};

/**
 * Equals is based on reference
 * @param {HBool} that - object to be compared to
 * @return {boolean}
 */
HBool.prototype.equals = function(that) {
  return that instanceof HBool && this === that;
};

/**
 * Encode as "true" or "false"
 * @return {string}
 */
HBool.prototype.toString = function() {
  return this.val ? "true" : "false";
};

/**
 * Singleton value for true
 * @static
 * @return {HBool}
 */
HBool.TRUE = new HBool(true);
/**
 * Singleton value for false
 * @static
 * @return {HBool}
 */
HBool.FALSE = new HBool(false);
