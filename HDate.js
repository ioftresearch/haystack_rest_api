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
 * HDate models a date (day in year) tag value.
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @private
 * @extends {HVal}
 * @param {int} year - Four digit year such as 2011
 * @param {int} month - Month as 1-12 (Jan is 1, Dec is 12)
 * @param {int} day - Day of month as 1-31
 */
function HDate(year, month, day) {
  this.year = year;
  this.month = month;
  this.day = day;
}
HDate.prototype = Object.create(HVal.prototype);
module.exports = HDate;

var HDateTime = require('./HDateTime'),
    HTime = require('./HTime');

/**
 * Encode as "YYYY-MM-DD"
 * @return {string}
 */
HDate.prototype.toZinc = function() {
  var s = this.year + "-";
  if (this.month < 10) s += "0";
  s += this.month + "-";
  if (this.day < 10) s += "0";
  s += this.day;
  return s;
};

/**
 * Equals is based on year, month, day
 * @param {HDate} that - object to be compared to
 * @return {boolean}
 */
HDate.prototype.equals = function(that) {
  return that instanceof HDate && this.year === that.year && this.month === that.month && this.day === that.day;
};

/**
 * Return sort order as negative, 0, or positive
 * @param {HDate} that - object to be compared to
 * @return {boolean}
 */
HDate.prototype.compareTo = function(that) {
  if (this.year < that.year)
    return -1;
  else if (this.year > that.year)
    return 1;

  if (this.month < that.month)
    return -1;
  else if (this.month > that.month)
    return 1;

  if (this.day < that.day)
    return -1;
  else if (this.day > that.day)
    return 1;

  return 0;
};

/**
 * Return date in future given number of days
 * @param {int} numDays
 * @return {HDate}
 */
HDate.prototype.plusDays = function(numDays) {
  if (numDays === 0) return this;
  if (numDays < 0) return this.minusDays(-numDays);

  var year = this.year;
  var month = this.month;
  var day = this.day;
  for (; numDays > 0; --numDays) {
    day++;
    if (day > HDate.daysInMonth(year, month)) {
      day = 1;
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }
  return HDate.make(year, month, day);
};

/**
 * Return date in past given number of days
 * @param {int} numDays
 * @return {HDate}
 */
HDate.prototype.minusDays = function(numDays) {
  if (numDays === 0) return this;
  if (numDays < 0) return this.plusDays(-numDays);

  var year = this.year;
  var month = this.month;
  var day = this.day;
  for (; numDays > 0; --numDays) {
    day--;
    if (day <= 0) {
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
      day = HDate.daysInMonth(year, month);
    }
  }
  return HDate.make(year, month, day);
};

/**
 * Return day of week: Sunday is 1, Saturday is 7
 * @return {int}
 */
HDate.prototype.weekday = function() {
  return new Date(this.year, this.month - 1, this.day).getDay() + 1;
};

/**
 * Construct from basic fields, javascript Date instance, or String in format "YYYY-MM-DD"
 * @static
 * @param {JSDate|string|int} arg - {JSDate} build HDate based of Javascript Date. month & day should be undefined<br/>
 *   {string} build HDate from format "YYYY-MM-DD". month & day should be undefined<br/>
 *   {int} Four digit year - month & day must be defined
 * @param {int} month - Month as 1-12 (Jan is 1, Dec is 12)
 * @param {int} day - Day of month as 1-31
 * @return {HDate}
 */
HDate.make = function(arg, month, day) {
  if (arg instanceof Date) {
    return new HDate(arg.getFullYear(), arg.getMonth() + 1, arg.getDate());
  } else if (HVal.typeis(arg, 'string', String)) {
    try {
      var s = arg.split('-');
      return new HDate(parseInt(s[0]), parseInt(s[1]), parseInt(s[2]));
    } catch (err) {
      throw err;
    }
  } else {
    if (arg < 1900) throw new Error("Invalid year");
    if (month < 1 || month > 12) throw new Error("Invalid month");
    if (day < 1 || day > 31) throw new Error("Invalid day");

    return new HDate(arg, month, day);
  }
};

/**
 * Return if given year a leap year
 * @static
 * @param {int} year - Four digit year
 * @return {boolean}
 */
HDate.isLeapYear = function(year) {
  if ((year & 3) !== 0) return false;
  return (year % 100 !== 0) || (year % 400 === 0);
};

var daysInMon = [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var daysInMonLeap = [-1, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/**
 * Return number of days in given year (xxxx) and month (1-12)
 * @static
 * @param {int} year - Four digit year
 * @param {int} mon - Month as 1-12 (Jan is 1, Dec is 12)
 * @return {int}
 */
HDate.daysInMonth = function(year, mon) {
  return HDate.isLeapYear(year) ? daysInMonLeap[mon] : daysInMon[mon];
};

/**
 * Get HDate for current time in default timezone
 * @static
 * @return {HDate}
 */
HDate.today = function() {
  return HDateTime.now().date;
};

/**
 * Convert a date into HDateTime for midnight in given timezone.
 * @static
 * @param {HDate} date
 * @param {HTimeZone} tz
 * @return {HDateTime}
 */
HDate.midnight = function(date, tz) {
  return HDateTime.make(date, HTime.MIDNIGHT, tz);
};
