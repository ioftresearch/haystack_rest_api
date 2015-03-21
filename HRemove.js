var HVal = require('./HVal');

/**
 * HRemove is the singleton value used to indicate a tag remove.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 */
function HRemove() {}
HRemove.prototype = Object.create(HVal.prototype);
module.exports = HRemove;

/**
 * Equals is based on reference
 * @param {HRemove} that
 * @return {boolean}
 */
HRemove.prototype.equals = function(that) {
  return that instanceof HRemove && this === that;
};

/**
 * Encode as "remove"
 * @return {string}
 */
HRemove.prototype.toString = function() {
  return "remove";
};

/**
 * Encode as "R"
 * @return {string}
 */
HRemove.prototype.toZinc = function() {
  return "R";
};

/**
 * Singleton value
 * @static
 */
HRemove.VAL = new HRemove();
