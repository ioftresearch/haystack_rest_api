//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var moment = require('moment-timezone');
var Test = require('./Test');

/**
 * ValTest tests the scalar value HVal types
 * @constructor
 */
function ValTest() {}
ValTest.prototype = Object.create(Test.prototype);
module.exports = ValTest;

var HBin = require('../HBin'),
    HBool = require('../HBool'),
    HCoord = require('../HCoord'),
    HDate = require('../HDate'),
    HDateTime = require('../HDateTime'),
    HDateTimeRange = require('../HDateTimeRange'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HStr = require('../HStr'),
    HTime = require('../HTime'),
    HTimeZone = require('../HTimeZone'),
    HUri = require('../HUri'),
    HZincReader = require('../io/HZincReader');

function read(s) {
  return new HZincReader(s).readScalar();
}

function verifyZinc(val, s) {
  // Test.println(val + " :: " + s);
  // Test.println("     " + read(s).toZinc());
  Test.verifyEq(val.toZinc(), s);
  Test.verifyEq(read(s), val);
}

ValTest.testBin = function() {
  // equality
  Test.verifyEq(HBin.make("text/plain"), HBin.make("text/plain"));
  Test.verifyNotEq(HBin.make("text/plain"), HBin.make("text/xml"));

  // encoding
  verifyZinc(HBin.make("text/plain"), "Bin(text/plain)");
  verifyZinc(HBin.make("text/plain; charset=utf-8"), "Bin(text/plain; charset=utf-8)");

  // verify bad bins are caught on encoding
  try {
    HBin.make("text/plain; f()").toZinc();
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }
  try {
    read("Bin()");
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }
  try {
    read("Bin(text)");
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }
};

ValTest.testBool = function() {
  // equality
  Test.verifyEq(HBool.TRUE, HBool.TRUE);
  Test.verifyNotEq(HBool.TRUE, HBool.FALSE);
  Test.verify(HBool.make(true) === HBool.TRUE);
  Test.verify(HBool.make(false) === HBool.FALSE);

  // compare
  Test.verify(HBool.FALSE.compareTo(HBool.TRUE) < 0);
  Test.verify(HBool.TRUE.compareTo(HBool.TRUE) === 0);

  // toString
  Test.verifyEq(HBool.TRUE.toString(), "true");
  Test.verifyEq(HBool.FALSE.toString(), "false");

  // zinc
  verifyZinc(HBool.TRUE, "T");
  verifyZinc(HBool.FALSE, "F");
};

function verifyCoord(lat, lng, s) {
  var c = HCoord.make(lat, lng);
  Test.verifyEq(c.lat(), lat);
  Test.verifyEq(c.lng(), lng);
  Test.verifyEq(c.toString(), s);
  Test.verifyEq(HCoord.make(s), c);
}

ValTest.testCoord = function() {
  verifyCoord(12, 34, "C(12.0,34.0)");

  // lat boundaries
  verifyCoord(90, 123, "C(90.0,123.0)");
  verifyCoord(-90, 123, "C(-90.0,123.0)");
  verifyCoord(89.888999, 123, "C(89.888999,123.0)");
  verifyCoord(-89.888999, 123, "C(-89.888999,123.0)");

  // lon boundaries
  verifyCoord(45, 180, "C(45.0,180.0)");
  verifyCoord(45, -180, "C(45.0,-180.0)");
  verifyCoord(45, 179.999129, "C(45.0,179.999129)");
  verifyCoord(45, -179.999129, "C(45.0,-179.999129)");

  // decimal places
  verifyCoord(9.1, -8.1, "C(9.1,-8.1)");
  verifyCoord(9.12, -8.13, "C(9.12,-8.13)");
  verifyCoord(9.123, -8.134, "C(9.123,-8.134)");
  verifyCoord(9.1234, -8.1346, "C(9.1234,-8.1346)");
  verifyCoord(9.12345, -8.13456, "C(9.12345,-8.13456)");
  verifyCoord(9.123452, -8.134567, "C(9.123452,-8.134567)");

  // zero boundaries
  verifyCoord(0, 0, "C(0.0,0.0)");
  verifyCoord(0.3, -0.3, "C(0.3,-0.3)");
  verifyCoord(0.03, -0.03, "C(0.03,-0.03)");
  verifyCoord(0.003, -0.003, "C(0.003,-0.003)");
  verifyCoord(0.0003, -0.0003, "C(0.0003,-0.0003)");
  verifyCoord(0.02003, -0.02003, "C(0.02003,-0.02003)");
  verifyCoord(0.020003, -0.020003, "C(0.020003,-0.020003)");
  verifyCoord(0.000123, -0.000123, "C(0.000123,-0.000123)");
  verifyCoord(7.000123, -7.000123, "C(7.000123,-7.000123)");

  // arg errors
  Test.verifyEq(HCoord.isLat(-91.0), false);
  Test.verifyEq(HCoord.isLat(-90.0), true);
  Test.verifyEq(HCoord.isLat(-89.0), true);
  Test.verifyEq(HCoord.isLat(90.0), true);
  Test.verifyEq(HCoord.isLat(91.0), false);
  Test.verifyEq(HCoord.isLng(-181.0), false);
  Test.verifyEq(HCoord.isLng(-179.99), true);
  Test.verifyEq(HCoord.isLng(180.0), true);
  Test.verifyEq(HCoord.isLng(181.0), false);
  try {
    HCoord.make(91, 12);
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make(-90.2, 12);
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make(13, 180.009);
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make(13, -181);
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }

  // parse errs
  try {
    HCoord.make("1.0,2.0");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make("(1.0,2.0)");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make("C(1.0,2.0");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HCoord.make("C(x,9)");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

ValTest.testDate = function() {
  // equality
  Test.verifyEq(HDate.make(2011, 6, 7), HDate.make(2011, 6, 7));
  Test.verifyNotEq(HDate.make(2011, 6, 7), HDate.make(2011, 6, 8));
  Test.verifyNotEq(HDate.make(2011, 6, 7), HDate.make(2011, 2, 7));
  Test.verifyNotEq(HDate.make(2011, 6, 7), HDate.make(2009, 6, 7));

  // compare
  Test.verify(HDate.make(2011, 6, 9).compareTo(HDate.make(2011, 6, 21)) < 0);
  Test.verify(HDate.make(2011, 10, 9).compareTo(HDate.make(2011, 3, 21)) > 0);
  Test.verify(HDate.make(2010, 6, 9).compareTo(HDate.make(2000, 9, 30)) > 0);
  Test.verify(HDate.make(2010, 6, 9).compareTo(HDate.make(2010, 6, 9)) === 0);

  // plus/minus
  Test.verifyEq(HDate.make(2011, 12, 1).minusDays(0), HDate.make(2011, 12, 1));
  Test.verifyEq(HDate.make(2011, 12, 1).minusDays(1), HDate.make(2011, 11, 30));
  Test.verifyEq(HDate.make(2011, 12, 1).minusDays(-2), HDate.make(2011, 12, 3));
  Test.verifyEq(HDate.make(2011, 12, 1).plusDays(2), HDate.make(2011, 12, 3));
  Test.verifyEq(HDate.make(2011, 12, 1).plusDays(31), HDate.make(2012, 1, 1));
  Test.verifyEq(HDate.make(2008, 3, 3).minusDays(3), HDate.make(2008, 2, 29));
  Test.verifyEq(HDate.make(2008, 3, 3).minusDays(4), HDate.make(2008, 2, 28));

  // encoding
  verifyZinc(HDate.make(2011, 6, 7), "2011-06-07");
  verifyZinc(HDate.make(2011, 10, 10), "2011-10-10");
  verifyZinc(HDate.make(2011, 12, 31), "2011-12-31");
  try {
    read("2003-xx-02");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2003-02");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2003-02-xx");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }

  // leap year
  for (var y = 1900; y <= 2100; y++) {
    if (((y % 4) === 0) && (y !== 1900) && (y !== 2100)) {
      Test.verify(HDate.isLeapYear(y));
    } else {
      Test.verify(!HDate.isLeapYear(y));
    }
  }
};

ValTest.testDateTime = function() {
  // equality
  var utc = HTimeZone.UTC;
  var london = HTimeZone.make("London");

  Test.verifyEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2009, 1, 2, 3, 4, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 9, 2, 3, 4, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 9, 3, 4, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 9, 4, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 3, 9, 5, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 3, 4, 9, utc, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 3, 4, 5, london, 0));
  Test.verifyNotEq(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0), HDateTime.make(2011, 1, 2, 3, 4, 5, london, 3600));

  // compare
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0)) === 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 2, 3, 4, 6, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 2, 3, 5, 5, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 2, 4, 4, 5, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 3, 3, 4, 5, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 2, 2, 3, 4, 5, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2012, 1, 2, 3, 4, 5, utc, 0)) < 0);
  Test.verify(HDateTime.make(2011, 1, 2, 3, 4, 5, utc, 0).compareTo(HDateTime.make(2011, 1, 2, 3, 4, 0, utc, 0)) > 0);

  // encoding
  var ts = HDateTime.make(1307377618069, HTimeZone.make("New_York"));
  verifyZinc(ts, "2011-06-06T12:26:58.069-04:00 New_York");
  Test.verifyEq(ts.date.toString(), "2011-06-06");
  Test.verifyEq(ts.time.toString(), "12:26:58.069");
  Test.verifyEq(ts.tzOffset, -4 * 60 * 60);
  Test.verifyEq(ts.tz.name, "New_York");
  Test.verifyEq(ts.tz.js.name, "America/New_York");
  Test.verifyEq(ts.millis(), 1307377618069);

  // convert back to millis
  ts = HDateTime.make(ts.date, ts.time, ts.tz, ts.tzOffset);
  Test.verifyEq(ts.millis(), 1307377618069);

  // different timezones
  ts = HDateTime.make(949478640000, HTimeZone.make("New_York"));
  verifyZinc(ts, "2000-02-02T03:04:00-05:00 New_York");
  ts = HDateTime.make(949478640000, HTimeZone.make("UTC"));
  verifyZinc(ts, "2000-02-02T08:04:00Z UTC");
  ts = HDateTime.make(949478640000, HTimeZone.make("Taipei"));
  verifyZinc(ts, "2000-02-02T16:04:00+08:00 Taipei");
  verifyZinc(HDateTime.make(2011, 6, 7, 11, 3, 43, HTimeZone.make("GMT+10"), -36000),
      "2011-06-07T11:03:43-10:00 GMT+10");
  verifyZinc(HDateTime.make(HDate.make(2011, 6, 8), HTime.make(4, 7, 33, 771), HTimeZone.make("GMT-7"), 25200),
      "2011-06-08T04:07:33.771+07:00 GMT-7");

  // verify millis()
  var date = HDate.make(2014, 12, 24);
  var time = HTime.make(11, 12, 13, 456);
  var newYork = HTimeZone.make("New_York");
  var utcMillis = 1419437533456;

  var a = HDateTime.make(date, time, newYork);
  var b = HDateTime.make(date, time, newYork, a.tzOffset);
  var c = HDateTime.make(utcMillis, newYork);
  var d = HDateTime.make("2014-12-24T11:12:13.456-05:00 New_York");

  Test.verifyEq(a.millis(), utcMillis);
  Test.verifyEq(b.millis(), utcMillis);
  Test.verifyEq(c.millis(), utcMillis);
  Test.verifyEq(d.millis(), utcMillis);

  // errors
  try {
    read("2000-02-02T03:04:00-0x:00 New_York");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2000-02-02T03:04:00-05 New_York");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2000-02-02T03:04:00-05:!0 New_York");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2000-02-02T03:04:00-05:00");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("2000-02-02T03:04:00-05:00 @");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

ValTest.testMarker = function() {
  // equality
  Test.verifyEq(HMarker.VAL, HMarker.VAL);

  // toString
  Test.verifyEq(HMarker.VAL.toString(), "marker");

  // zinc
  verifyZinc(HMarker.VAL, "M");
};

function verifyMidnight(date, tzName, str) {
  var ts = HDate.midnight(date, HTimeZone.make(tzName));
  Test.verifyEq(ts.date, date);
  Test.verifyEq(ts.time.hour, 0);
  Test.verifyEq(ts.time.min, 0);
  Test.verifyEq(ts.time.sec, 0);
  Test.verifyEq(ts.toString(), str);
  Test.verifyEq(ts, read(ts.toZinc()));
  Test.verifyEq(ts.millis(), read(str).millis());
}

ValTest.testMidnight = function() {
  verifyMidnight(HDate.make(2011, 11, 3), "UTC", "2011-11-03T00:00:00Z UTC");
  verifyMidnight(HDate.make(2011, 11, 3), "New_York", "2011-11-03T00:00:00-04:00 New_York");
  verifyMidnight(HDate.make(2011, 12, 15), "Chicago", "2011-12-15T00:00:00-06:00 Chicago");
  verifyMidnight(HDate.make(2008, 2, 29), "Phoenix", "2008-02-29T00:00:00-07:00 Phoenix");
  verifyMidnight(HDate.make(2008, 2, 29), "Melbourne", "2008-02-29T00:00:00+11:00 Melbourne");
};

ValTest.testNum = function() {
  // equality
  Test.verifyEq(HNum.make(2), HNum.make(2.0, null));
  Test.verifyNotEq(HNum.make(2), HNum.make(2, "%"));
  Test.verifyNotEq(HNum.make(2, "%"), HNum.make(2));
  Test.verify(HNum.make(0) === HNum.make(0.0));

  // compare
  Test.verify(HNum.make(9).compareTo(HNum.make(11)) < 0);
  Test.verify(HNum.make(-3).compareTo(HNum.make(-4)) > 0);
  Test.verify(HNum.make(-23).compareTo(HNum.make(-23)) === 0);

  // zinc
  verifyZinc(HNum.make(123), "123");
  verifyZinc(HNum.make(123.4, "m/s"), "123.4m/s");
  verifyZinc(HNum.make(9.6, "m/s"), "9.6m/s");
  verifyZinc(HNum.make(-5.2, "\u00b0F"), "-5.2\u00b0F");
  verifyZinc(HNum.make(23, "%"), "23%");
  verifyZinc(HNum.make(2.4e-3, "fl_oz"), "0.0024fl_oz");
  verifyZinc(HNum.make(2.4e5, "$"), "240000$");
  Test.verifyEq(read("1234.56fl_oz"), HNum.make(1234.56, "fl_oz"));
  Test.verifyEq(read("0.000028fl_oz"), HNum.make(0.000028, "fl_oz"));

  // specials
  verifyZinc(HNum.make(Number.NEGATIVE_INFINITY), "-INF");
  verifyZinc(HNum.make(Number.POSITIVE_INFINITY), "INF");
  verifyZinc(HNum.make(Number.NaN), "NaN");

  // verify units never serialized for special values
  Test.verifyEq(HNum.make(Number.NaN, "ignore").toZinc(), "NaN");
  Test.verifyEq(HNum.make(Number.POSITIVE_INFINITY, "%").toZinc(), "INF");
  Test.verifyEq(HNum.make(Number.NEGATIVE_INFINITY, "%").toZinc(), "-INF");

  // verify bad unit names
  Test.verifyEq(HNum.isUnitName(null), true);
  Test.verifyEq(HNum.isUnitName(""), false);
  Test.verifyEq(HNum.isUnitName("x_z"), true);
  Test.verifyEq(HNum.isUnitName("x z"), false);
  try {
    HNum.make(123.4, "foo bar");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HNum.make(123.4, "foo,bar");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }

  // verify we format decimal with dot
  // TODO: Figure out if we need to test Locale
  //Locale locale = Locale.getDefault();
  //Locale.setDefault(new Locale("fr"));
  verifyZinc(HNum.make(2.4), "2.4");
  //Locale.setDefault(locale);
};

function verifyRange(r, start, end) {
  if (start instanceof HDate) {
    Test.verifyEq(r.start.date, start);
    Test.verifyEq(r.start.time, HTime.MIDNIGHT);
    Test.verifyEq(r.start.tz.name, "New_York");
    Test.verifyEq(r.end.date, end.plusDays(1));
    Test.verifyEq(r.end.time, HTime.MIDNIGHT);
    Test.verifyEq(r.end.tz.name, "New_York");
  } else {
    Test.verifyEq(r.start, start);
    Test.verifyEq(r.end, end);
  }
}

ValTest.testRange = function() {
  var ny = HTimeZone.make("New_York");
  var today = HDate.today();
  var yesterday = today.minusDays(1);
  var x = HDate.make(2011, 7, 4);
  var y = HDate.make(2011, 11, 4);
  var xa = HDateTime.make(x, HTime.make(2, 30), ny);
  var xb = HDateTime.make(x, HTime.make(22, 5), ny);

  verifyRange(HDateTimeRange.make("today", ny), today, today);
  verifyRange(HDateTimeRange.make("yesterday", ny), yesterday, yesterday);
  verifyRange(HDateTimeRange.make("2011-07-04", ny), x, x);
  verifyRange(HDateTimeRange.make("2011-07-04,2011-11-04", ny), x, y);
  verifyRange(HDateTimeRange.make("" + xa + "," + xb, ny), xa, xb);

  var r = HDateTimeRange.make(xb.toString(), ny);
  Test.verifyEq(r.start, xb);
  Test.verifyEq(r.end.date, today);
  Test.verifyEq(r.end.tz, ny);

  // this week
  var sun = today;
  var sat = today;
  while (sun.weekday() > 1) {
    sun = sun.minusDays(1);
  }
  while (sat.weekday() < 7) {
    sat = sat.plusDays(1);
  }
  verifyRange(HDateTimeRange.thisWeek(ny), sun, sat);

  // this month
  var first = today;
  var last = today;
  while (first.day > 1) {
    first = first.minusDays(1);
  }
  while (last.day < HDate.daysInMonth(today.year, today.month)) {
    last = last.plusDays(1);
  }
  verifyRange(HDateTimeRange.thisMonth(ny), first, last);

  // this year
  first = HDate.make(today.year, 1, 1);
  last = HDate.make(today.year, 12, 31);
  verifyRange(HDateTimeRange.thisYear(ny), first, last);

  // last week
  var prev = today.minusDays(7);
  sun = prev;
  sat = prev;
  while (sun.weekday() > 1) {
    sun = sun.minusDays(1);
  }
  while (sat.weekday() < 7) {
    sat = sat.plusDays(1);
  }
  verifyRange(HDateTimeRange.lastWeek(ny), sun, sat);

  // last month
  last = today;
  while (last.month === today.month) {
    last = last.minusDays(1);
  }
  first = HDate.make(last.year, last.month, 1);
  verifyRange(HDateTimeRange.lastMonth(ny), first, last);

  // last year
  first = HDate.make(today.year - 1, 1, 1);
  last = HDate.make(today.year - 1, 12, 31);
  verifyRange(HDateTimeRange.lastYear(ny), first, last);
};

ValTest.testRef = function() {
  // equality (ignore dis)
  Test.verifyEq(HRef.make("foo"), HRef.make("foo"));
  Test.verifyEq(HRef.make("foo"), HRef.make("foo", "Foo"));
  Test.verifyNotEq(HRef.make("foo"), HRef.make("Foo"));

  // encoding
  verifyZinc(HRef.make("1234-5678.foo:bar"), "@1234-5678.foo:bar");
  verifyZinc(HRef.make("1234-5678", "Foo Bar"), "@1234-5678 \"Foo Bar\"");
  verifyZinc(HRef.make("1234-5678", "Foo \"Bar\""), "@1234-5678 \"Foo \\\"Bar\\\"\"");

  // verify bad refs are caught on encoding
  Test.verifyEq(HRef.isId(""), false);
  Test.verifyEq(HRef.isId("%"), false);
  Test.verifyEq(HRef.isId("a"), true);
  Test.verifyEq(HRef.isId("a-b:c"), true);
  Test.verifyEq(HRef.isId("a b"), false);
  Test.verifyEq(HRef.isId("a\u0129b"), false);
  try {
    HRef.make("@a");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HRef.make("a b");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    HRef.make("a\n");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("@");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

ValTest.testStr = function() {
  // equality
  Test.verifyEq(HStr.make("a"), HStr.make("a"));
  Test.verifyNotEq(HStr.make("a"), HStr.make("b"));
  Test.verify(HStr.make("") === HStr.make(""));

  // compare
  Test.verify(HStr.make("abc").compareTo(HStr.make("z")) < 0);
  Test.verify(HStr.make("Foo").compareTo(HStr.make("Foo")) === 0);

  // encoding
  verifyZinc(HStr.make("hello"), "\"hello\"");
  verifyZinc(HStr.make("_ \\ \" \n \r \t \u0011 _"), "\"_ \\\\ \\\" \\n \\r \\t \\u0011 _\"");
  verifyZinc(HStr.make("\u0abc"), "\"\u0abc\"");

  // hex upper and lower case
  Test.verifyEq(read("\"[\\uabcd \\u1234]\""), HStr.make("[\uabcd \u1234]"));
  Test.verifyEq(read("\"[\\uABCD \\u1234]\""), HStr.make("[\uABCD \u1234]"));
  try {
    read("\"end...");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("\"end...\n\"");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("\"\\u1x34\"");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("\"hi\" ");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

ValTest.testTime = function() {
  // equality
  Test.verifyEq(HTime.make(1, 2, 3, 4), HTime.make(1, 2, 3, 4));
  Test.verifyNotEq(HTime.make(1, 2, 3, 4), HTime.make(9, 2, 3, 4));
  Test.verifyNotEq(HTime.make(1, 2, 3, 4), HTime.make(1, 9, 3, 4));
  Test.verifyNotEq(HTime.make(1, 2, 3, 4), HTime.make(1, 2, 9, 9));

  // compare
  Test.verify(HTime.make(0, 0, 0, 0).compareTo(HTime.make(0, 0, 0, 9)) < 0);
  Test.verify(HTime.make(0, 0, 0, 0).compareTo(HTime.make(0, 0, 1, 0)) < 0);
  Test.verify(HTime.make(0, 1, 0, 0).compareTo(HTime.make(0, 0, 0, 0)) > 0);
  Test.verify(HTime.make(0, 0, 0, 0).compareTo(HTime.make(2, 0, 0, 0)) < 0);
  Test.verify(HTime.make(2, 0, 0, 0).compareTo(HTime.make(2, 0, 0, 0)) === 0);

  // encoding
  verifyZinc(HTime.make(2, 3), "02:03:00");
  verifyZinc(HTime.make(2, 3, 4), "02:03:04");
  verifyZinc(HTime.make(2, 3, 4, 5), "02:03:04.005");
  verifyZinc(HTime.make(2, 3, 4, 56), "02:03:04.056");
  verifyZinc(HTime.make(2, 3, 4, 109), "02:03:04.109");
  verifyZinc(HTime.make(2, 3, 10, 109), "02:03:10.109");
  verifyZinc(HTime.make(2, 10, 59), "02:10:59");
  verifyZinc(HTime.make(10, 59, 30), "10:59:30");
  verifyZinc(HTime.make(23, 59, 59, 999), "23:59:59.999");
  try {
    read("3:20:00");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("13:xx:00");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("13:45:0x");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("13:45:00.4561");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

function verifyTz(name, jsId) {
  var tz = HTimeZone.make(name);
  var js = moment.tz.zone(jsId);
  Test.verifyEq(tz.name, name);
  Test.verifyEq(tz.js, js);
  Test.verifyEq(tz, HTimeZone.make(js));
}

ValTest.testTz = function() {
  verifyTz("New_York", "America/New_York");
  verifyTz("Chicago", "America/Chicago");
  verifyTz("Phoenix", "America/Phoenix");
  verifyTz("London", "Europe/London");
  verifyTz("UTC", "Etc/UTC");
  verifyTz("GMT-6", "Etc/GMT-6");
};

ValTest.testUri = function() {
  // equality
  Test.verifyEq(HUri.make("a"), HUri.make("a"));
  Test.verifyNotEq(HUri.make("a"), HUri.make("b"));
  Test.verify(HUri.make("") === HUri.make(""));

  // compare
  Test.verify(HUri.make("abc").compareTo(HUri.make("z")) < 0);
  Test.verify(HUri.make("Foo").compareTo(HUri.make("Foo")) === 0);

  // encoding
  verifyZinc(HUri.make("http://foo.com/f?q"), "`http://foo.com/f?q`");
  verifyZinc(HUri.make("a$b"), "`a$b`");
  verifyZinc(HUri.make("a`b"), "`a\\`b`");
  verifyZinc(HUri.make("http\\:a\\?b"), "`http\\:a\\?b`");
  verifyZinc(HUri.make("\u01ab.txt"), "`\u01ab.txt`");

  // errors
  try {
    read("`no end");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  try {
    read("`new\nline`");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};
