/**
 * HDateTimeRange models a starting and ending timestamp
 * @see {@link http://project-haystack.org/doc/Ops#hisRead|Project Haystack}
 *
 * @constructor
 * @param {HDateTime} start - Inclusive starting timestamp
 * @param {HDateTime} end - Inclusive ending timestamp
 */
function HDateTimeRange(start, end) {
  this.start = start;
  this.end = end;
}
module.exports = HDateTimeRange;

var HDate = require('./HDate'),
    HDateTime = require('./HDateTime'),
    HTimeZone = require('./HTimeZone'),
    HZincReader = require('./io/HZincReader');

/**
 * Return "start to end"
 * @return {string}
 */
HDateTimeRange.prototype.toString = function() {
  return this.start.toString() + "," + this.end.toString();
};

/**
 * @param {HDate|HDate|HDateTime|string} arg1 - {HDate} Make for inclusive dates within given timezone<br/>
 *   {HDate} Make for single date within given timezone<br/>
 *   {HDateTime} Make from two timestamps<br/>
 *   {string} Parse from string using the given timezone as context for date based ranges.  The formats are:<br/>
 *     - "today"<br/>
 *     - "yesterday"<br/>
 *     - "{date}"<br/>
 *     - "{date},{date}"<br/>
 *     - "{dateTime},{dateTime}"<br/>
 *     - "{dateTime}"  // anything after given timestamp
 * @param {HDate|HTimeZone|HDateTime|HTimeZone} arg2 - {HDate} Make for inclusive dates within given timezone<br/>
 *   {HTimeZone} Make for single date within given timezone<br/>
 *   {HDateTime} Make from two timestamps<br/>
 *   {HTimeZone} Parse from string using the given timezone as context for date based ranges.
 * @param {HTimeZone} arg3 - {HTimeZone} Make for inclusive dates within given timezone<br/>
 * @return HDateTimeRange
 */
HDateTimeRange.make = function(arg1, arg2, arg3) {
  if (arg1 instanceof HDateTime) {
    /** Make from two timestamps */
    if (arg1.tz !== arg2.tz) throw new Error("arg1.tz != arg2.tz");
    return new HDateTimeRange(arg1, arg2);
  } else if (arg1 instanceof HDate) {
    /** Make for inclusive dates within given timezone */
    if (arg2 instanceof HTimeZone) {
      arg3 = arg2;
      arg2 = arg1;
    } // Make for single date within given timezone
    return HDateTimeRange.make(HDate.midnight(arg1, arg3), HDate.midnight(arg2.plusDays(1), arg3));
  } else {
    /** Parse from string using the given timezone as context for date based ranges. */
    // handle keywords
    var str = arg1.trim();
    if (str === "today") return HDateTimeRange.make(HDate.today(), arg2);
    if (str === "yesterday") return HDateTimeRange.make(HDate.today().minusDays(1), arg2);

    // parse scalars
    var comma = str.indexOf(',');
    var start, end;
    if (comma < 0) {
      start = new HZincReader(str).readScalar();
    } else {
      start = new HZincReader(str.substring(0, comma)).readScalar();
      end = new HZincReader(str.substring(comma + 1)).readScalar();
    }

    // figure out what we parsed for start,end
    if (start instanceof HDate) {
      if (typeof(end) === 'undefined' || end === null)
        return HDateTimeRange.make(start, arg2);
      if (end instanceof HDate)
        return HDateTimeRange.make(start, end, arg2);
    } else if (start instanceof HDateTime) {
      if (typeof(end) === 'undefined' || end === null)
        return HDateTimeRange.make(start, HDateTime.now(arg2));
      if (end instanceof HDateTime)
        return HDateTimeRange.make(start, end);
    }

    throw new Error("Invalid HDateTimeRange: " + str);
  }
};

/**
 * Make a range which encompasses the current week. The week is defined as Sunday thru Saturday.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.thisWeek = function(tz) {
  var today = HDate.today();
  var sun = today.minusDays(today.weekday() - 1);
  var sat = today.plusDays(7 - today.weekday());
  return HDateTimeRange.make(sun, sat, tz);
};

/**
 * Make a range which encompasses the current month.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.thisMonth = function(tz) {
  var today = HDate.today();
  var first = HDate.make(today.year, today.month, 1);
  var last = HDate.make(today.year, today.month, HDate.daysInMonth(today.year, today.month));
  return HDateTimeRange.make(first, last, tz);
};

/**
 * Make a range which encompasses the current year.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.thisYear = function(tz) {
  var today = HDate.today();
  var first = HDate.make(today.year, 1, 1);
  var last = HDate.make(today.year, 12, 31);
  return HDateTimeRange.make(first, last, tz);
};

/**
 * Make a range which encompasses the previous week. The week is defined as Sunday thru Saturday.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.lastWeek = function(tz) {
  var today = HDate.today();
  var prev = today.minusDays(7);
  var sun = prev.minusDays(prev.weekday() - 1);
  var sat = prev.plusDays(7 - prev.weekday());
  return HDateTimeRange.make(sun, sat, tz);
};

/**
 * Make a range which encompasses the previous month.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.lastMonth = function(tz) {
  var today = HDate.today();
  var year = today.year;
  var month = today.month;
  if (month === 1) {
    year--;
    month = 12;
  } else {
    month--;
  }
  var first = HDate.make(year, month, 1);
  var last = HDate.make(year, month, HDate.daysInMonth(year, month));
  return HDateTimeRange.make(first, last, tz);
};

/**
 * Make a range which encompasses the previous year.
 * @param {HTimeZone} tz
 * @return {HDateTimeRange}
 */
HDateTimeRange.lastYear = function(tz) {
  var today = HDate.today();
  var first = HDate.make(today.year - 1, 1, 1);
  var last = HDate.make(today.year - 1, 12, 31);
  return HDateTimeRange.make(first, last, tz);
};
