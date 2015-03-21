var HVal = require('./HVal');

var mils; // long - millis since Epoch

/**
 * HDateTime models a timestamp with a specific timezone.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @private
 * @extends {HVal}
 * @param {HDate} date - Date component of the timestamp
 * @param {HTime} time - Time component of the timestamp
 * @param {HTimeZone} tz - Timezone as Olson database city name
 * @param {int} tzOffset - Offset in seconds from UTC including DST offset
 */
function HDateTime(date, time, tz, tzOffset) {
  this.date = date;
  this.time = time;
  this.tz = tz;
  this.tzOffset = (typeof(tzOffset) === 'undefined' ? 0 : tzOffset);
}
HDateTime.prototype = Object.create(HVal.prototype);
module.exports = HDateTime;

var moment = require('moment-timezone'),
    HDate = require('./HDate'),
    HTime = require('./HTime'),
    HTimeZone = require('./HTimeZone'),
    HZincReader = require('./io/HZincReader');

/**
 * Get this date time as Java milliseconds since epoch
 * @return {float}
 */
HDateTime.prototype.millis = function() {
  if (this.mils <= 0) {
    var d = utcDate(this.date.year, this.date.month, this.date.day, this.time.hour, this.time.min, this.time.sec, this.time.ms);
    this.mils = d.getTime();
  }
  return this.mils;
};

/**
 * Encode as "YYYY-MM-DD'T'hh:mm:ss.FFFz zzzz"
 * @return {string}
 */
HDateTime.prototype.toZinc = function() {
  var s = this.date.toZinc() + "T" + this.time.toZinc();

  if (this.tzOffset === 0) {
    s += "Z";
  } else {
    var offset = this.tzOffset;
    if (offset < 0) {
      s += "-";
      offset = -offset;
    } else {
      s += "+";
    }
    var zh = offset / 3600;
    var zm = (offset % 3600) / 60;
    if (zh < 10) s += "0";
    s += zh + ":";
    if (zm < 10) s += "0";
    s += zm;
  }
  s += " " + this.tz;

  return s;
};

/**
 * Equals is based on date, time, tzOffset, and tz
 * @param {HDateTime} that - object to be compared to
 * @return {boolean}
 */
HDateTime.prototype.equals = function(that) {
  return that instanceof HDateTime && this.date.equals(that.date) &&
      this.time.equals(that.time) && this.tzOffset === that.tzOffset && this.tz === that.tz;
};

/**
 * Comparison based on millis.
 * @param {HDateTime} that - object to be compared to
 * @return {int}
 */
HDateTime.prototype.compareTo = function(that) {
  var thisMillis = this.millis();
  var thatMillis = that.millis();
  if (thisMillis < thatMillis) return -1;
  else if (thisMillis > thatMillis) return 1;
  return 0;
};

function utcDate(year, month, day, hour, min, sec, ms) {
  var d = new Date();
  d.setUTCFullYear(year);
  d.setUTCMonth(month - 1);
  d.setUTCDate(day);
  d.setUTCHours(hour);
  d.setUTCMinutes(min);
  d.setUTCSeconds(sec);
  d.setUTCMilliseconds(ms);

  return d;
}

/**
 * Construct from various values
 * @static
 * @param {int|HDate|long|string} arg1 - {int} Four digit year - Constructor with date and time (to sec or to min) fields.<br/>
 *   {HDate} Constructor with date, time, tz, and tzOffset. If tzOffset is undefined, calculate from provided TimeZone instance<br/>
 *   {long} Constructor with millis since Epoch and TimeZone instance. If no TimeZone defined, default to HTimeZone.DEFAULT<br/>
 *   {string} Parse from string fomat "YYYY-MM-DD'T'hh:mm:ss.FFFz zzzz"
 * @param {int|HTime|HTimeZone} arg2 - {int} Month - Constructor with date and time (to sec or to min) fields.<br/>
 *   {HTime} Constructor with date, time, tz, and tzOffset. If tzOffset is undefined, calculate from provided TimeZone instance<br/>
 *   {HTimeZone} Constructor with millis since Epoch and TimeZone instance. If no TimeZone defined, default to HTimeZone.DEFAULT
 * @param {int|HTimeZone} arg3 - {int} Day - Constructor with date and time (to sec or to min) fields.<br/>
 *   {HTimeZone} Constructor with date, time, tz, and tzOffset. If tzOffset is undefined, calculate from provided TimeZone instance
 * @param {int|int} arg4 - {int} Hours - Constructor with date and time (to sec or to min) fields.<br/>
 *   {int} Constructor with date, time, tz, and tzOffset. If tzOffset is undefined, calculate from provided TimeZone instance
 * @param {int} arg5 - Minutes - Constructor with date and time (to sec or to min) fields.
 * @param {int|HTimeZone} arg6 - {int} Seconds - Constructor with date and time (to sec or to min) fields.<br/>
 *   {HTimeZone} Constructor with date and time (to sec or to min) fields.
 * @param {HTimeZone|int} arg7 - {HTimeZone} Constructor with date and time (to sec or to min) fields.<br/>
 *   {int} TimeZone Offset - Constructor with date and time (to sec or to min) fields.
 * @param {int} arg8 - TimeZone Offset - Constructor with date and time (to sec or to min) fields.
 * @return {HDateTime}
 */
HDateTime.make = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
  var d, tzOffset, ts;
  if (arg7 instanceof HTimeZone) {
    return HDateTime.make(HDate.make(arg1, arg2, arg3), HTime.make(arg4, arg5, arg6), arg7, arg8);
  } else if (arg6 instanceof HTimeZone) {
    return HDateTime.make(HDate.make(arg1, arg2, arg3), HTime.make(arg4, arg5, 0), arg6, arg7);
  } else if (arg3 instanceof HTimeZone) {
    // use Date to decode millis to fields
    d = utcDate(arg1.year, arg1.month, arg1.day, arg2.hour, arg2.min, arg2.sec, arg2.ms);
    tzOffset = arg4;
    if (typeof(tzOffset) === 'undefined') {
      // convert to designated timezone
      d = moment(d).tz(arg3.js.name);
      tzOffset = d.utcOffset() * 60;
    }

    ts = new HDateTime(arg1, arg2, arg3, tzOffset);
    ts.mils = d.valueOf() + (tzOffset * -1000);

    return ts;
  } else if (HVal.typeis(arg1, 'string', String)) {
    var val = new HZincReader(arg1).readScalar();
    if (val instanceof HDateTime)
      return val;
    throw new Error("Parse Error: " + arg1);
  } else {
    var tz = arg2;
    if (typeof(tz) === 'undefined')
      tz = HTimeZone.DEFAULT;

    d = new Date(arg1);
    // convert to designated timezone
    var m = moment(d).tz(tz.js.name);
    tzOffset = m.utcOffset() * 60;

    ts = HDateTime.make(HDate.make(m.year(), m.month() + 1, m.date()), HTime.make(m.hour(), m.minute(), m.second(), m.millisecond()), tz, tzOffset);
    ts.mils = parseInt(m.valueOf());

    return ts;
  }
};

/**
 * Get HDateTime for given timezone
 * @static
 * @param {HTimeZone} tz
 * @return {HDateTime}
 */
HDateTime.now = function(tz) {
  if (typeof(tz) === 'undefined')
    tz = HTimeZone.DEFAULT;
  var d = new Date();
  return HDateTime.make(HDate.make(d), HTime.make(d), tz);
};
