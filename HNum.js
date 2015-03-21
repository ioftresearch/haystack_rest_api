var HVal = require('./HVal');

/**
 * HNum wraps a 64-bit floating point number and optional unit name.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 * @param {number} val
 * @param {string} unit
 */
function HNum(val, unit) {
  if (!HNum.isUnitName(unit)) throw new Error("Invalid unit name: " + unit);
  this.val = val;
  this.unit = unit;
}
HNum.prototype = Object.create(HVal.prototype);
module.exports = HNum;

var unitChars = [];
{
  for (var i = 0; i < 128; i++) unitChars[i] = false;
  for (var i = HVal.cc('a'); i <= HVal.cc('z'); ++i) unitChars[i] = true;
  for (var i = HVal.cc('A'); i <= HVal.cc('Z'); ++i) unitChars[i] = true;
  unitChars[HVal.cc('_')] = true;
  unitChars[HVal.cc('$')] = true;
  unitChars[HVal.cc('%')] = true;
  unitChars[HVal.cc('/')] = true;
}

/**
 * Return true if the given string is null or contains only valid unit
 * chars.  If the unit name contains invalid chars return false.  This
 * method does *not* check that the unit name is part of the standard
 * unit database.
 * @param {string} unit
 * @return {boolean}
 */
HNum.isUnitName = function(unit) {
  if (typeof(unit) === 'undefined' || unit === null) return true;
  if (unit.length === 0) return false;
  for (var i = 0; i < unit.length; ++i) {
    var c = HVal.cc(unit.charAt(i));
    if (c < 128 && !unitChars[c]) return false;
  }
  return true;
};

/**
 * Return sort order as negative, 0, or positive
 * @param {HNum} that
 * @return {int}
 */
HVal.prototype.compareTo = function(that) {
  if (this.val < that.val) return -1;
  if (this.val === that.val) return 0;
  return 1;
};

/**
 * Encode as floating value followed by optional unit string
 * @return {string}
 */
HNum.prototype.toZinc = function() {
  var s = "";
  if (this.val === Number.POSITIVE_INFINITY) s += "INF";
  else if (this.val === Number.NEGATIVE_INFINITY) s += "-INF";
  else if (isNaN(this.val)) s += "NaN";
  else {
    // don't let fractions
    var abs = this.val;
    if (abs < 0) abs = -abs;
    if (abs > 1.0) s += parseFloat(this.val.toFixed(4).toString());
    else s += this.val;

    if (typeof(this.unit) !== 'undefined' && this.unit !== null) s += this.unit;
  }

  return s;
};

/**
 * Equals is based on val, unit (NaN == NaN)
 * @param {HNum} that
 * @return {int}
 */
HNum.prototype.equals = function(that) {
  if (!(that instanceof HNum)) return false;
  if (isNaN(this.val)) return isNaN(that.val);
  if (this.val !== that.val) return false;
  if (typeof(this.unit) === 'undefined' || this.unit === null)
    return typeof(that.unit) === 'undefined' || that.unit === null;
  if (typeof(that.unit) === 'undefined' || that.unit === null) return false;

  return this.unit === that.unit;
};

/**
 * Get this number as a duration of milliseconds.
 * Raise Error if the unit is not a duration unit.
 * @return {float}
 */
HNum.prototype.millis = function() {
  var u = this.unit;
  if (typeof(u) === 'undefined' || u === null) u = "null";
  if (u === "ms" || u === "millisecond") return this.val;
  if (u === "s" || u === "sec" || u === "millisecond") return (this.val * 1000.0);
  if (u === "min" || u === "minute") return (this.val * 1000.0 * 60.0);
  if (u === "h" || u === "hr" || u === "minute") return (this.val * 1000.0 * 60.0 * 60.0);
  throw new Error("Invalid duration unit: " + u);
};

/**
 * Singleton value for zero
 * @static
 */
HNum.ZERO = new HNum(0);
/**
 * Singleton value for positive infinity "Inf"
 * @static
 */
HNum.POS_INF = new HNum(Number.POSITIVE_INFINITY);
/**
 * Singleton value for negative infinity "-Inf"
 * @static
 */
HNum.NEG_INF = new HNum(Number.NEGATIVE_INFINITY);
/**
 * Singleton value for not-a-number "NaN"
 * @static
 */
HNum.NaN = new HNum(Number.NaN);

/**
 * Construct from numeric value and optional unit
 * @static
 * @param {number} val
 * @param {string} unit
 * @return {HNum}
 */
HNum.make = function(val, unit) {
  if (unit === null) unit = undefined;
  if (val === 0 && typeof(unit) === 'undefined') return HNum.ZERO;
  return new HNum(val, unit);
};
