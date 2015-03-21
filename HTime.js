var HVal = require('./HVal');

/**
 * HTime models a time of day tag value.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 * @param {int} hour
 * @param {int} min
 * @param {int} sec
 * @param {int} ms
 */
function HTime(hour, min, sec, ms) {
  /** int - Hour of day as 0-23 */
  this.hour = hour;
  /** int - Minute of hour as 0-59 */
  this.min = min;
  /** int - Second of minute as 0-59 */
  this.sec = (typeof(sec) === 'undefined' ? 0 : sec);
  /** int - Fractional seconds in milliseconds 0-999 */
  this.ms = (typeof(ms) === 'undefined' ? 0 : ms);
}
HTime.prototype = Object.create(HVal.prototype);
module.exports = HTime;

var HZincReader = require('./io/HZincReader');

/**
 * Equals is based on hour, min, sec, ms
 * @param {HTime}
 * @return {boolean}
 */
HTime.prototype.equals = function(that) {
  return that instanceof HTime && this.hour === that.hour &&
      this.min === that.min && this.sec === that.sec && this.ms === that.ms;
};

/**
 * Return sort order as negative, 0, or positive
 * @param {HTime}
 * @return {int}
 */
HTime.prototype.compareTo = function(that) {
  if (this.hour < that.hour) return -1;
  else if (this.hour > that.hour) return 1;

  if (this.min < that.min) return -1;
  else if (this.min > that.min) return 1;

  if (this.sec < that.sec) return -1;
  else if (this.sec > that.sec) return 1;

  if (this.ms < that.ms) return -1;
  else if (this.ms > that.ms) return 1;

  return 0;
};

/**
 * Encode as "hh:mm:ss.FFF"
 * @return {string}
 */
HTime.prototype.toZinc = function() {
  var s = "";
  if (this.hour < 10) s += "0";
  s += this.hour + ":";
  if (this.min < 10) s += "0";
  s += this.min + ":";
  if (this.sec < 10) s += "0";
  s += this.sec;
  if (this.ms !== 0) {
    s += ".";
    if (this.ms < 10) s += "0";
    if (this.ms < 100) s += "0";
    s += this.ms;
  }

  return s;
};

/**
 * Singleton for midnight 00:00
 * @static
 * @return {HTime}
 */
HTime.MIDNIGHT = new HTime(0, 0, 0, 0);

/**
 * Construct with all fields, with Javascript Date object, or Parse from string format "hh:mm:ss.FF"
 * @static
 * @param {int} hour
 * @param {int} min
 * @param {int} sec
 * @param {int} ms
 * @return {HTime}
 */
HTime.make = function(arg1, min, sec, ms) {
  if (HVal.typeis(arg1, 'string', String)) {
    var val = new HZincReader(arg1).readScalar();
    if (val instanceof HTime) return val;
    throw new Error("Parse Error: " + arg1);
  } else if (arg1 instanceof Date) {
    return new HTime(arg1.getHours(), arg1.getMinutes(), arg1.getSeconds(), arg1.getMilliseconds());
  } else {
    return new HTime(arg1, min, sec, ms);
  }
};
