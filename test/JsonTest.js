//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var Test = require('./Test');

/**
 * JsonTest tests the zinc reader/writer
 * @constructor
 */
function JsonTest() {}
JsonTest.prototype = Object.create(Test.prototype);
module.exports = JsonTest;

var HZincReader = require('../io/HZincReader'),
    HJsonWriter = require('../io/HJsonWriter');

function isNull(obj) {
  return typeof(obj) === 'undefined' || obj === null;
}
function verifyGrid(zinc, json) {
  // read from zinc
  var grid = new HZincReader(zinc).readGrid();
  var jsonString = HJsonWriter.gridToString(grid);
  Test.verifyEq(jsonString, json);
}

JsonTest.test = function() {

  verifyGrid(
      "ver:\"2.0\"\n" +
      "fooBar33\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"fooBar33\"}\n" +
      "],\n" +
      "\"rows\":[\n\n" +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\" tag foo:\"bar\"\n" +
      "xyz\n" +
      "\"val\"\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\", \"foo\":\"bar\", \"tag\":\"\u2713\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"xyz\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      "{\"xyz\":\"val\"}\n" +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "val\n" +
      "N\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"val\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      "{}\n" +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "foo\n" +
      "`foo$20bar`\n" +
      "`foo\\`bar`\n" +
      "`file \\#2`\n" +
      "\"$15\"\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"foo\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      "{\"foo\":\"foo$20bar\"},\n" +
      "{\"foo\":\"foo`bar\"},\n" +
      "{\"foo\":\"file \\\\#2\"},\n" +
      "{\"foo\":\"$15\"}\n" +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"a\"},\n" +
      "{\"name\":\"b\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      "{\"a\":\"2010-03-01T23:55:00.013-05:00 GMT+5\", \"b\":\"2010-03-01T23:55:00.013+10:00 GMT-10\"}\n" +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "1,2\n" +
      "3,4\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"a\"},\n" +
      "{\"name\":\"b\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      '{"a":1, "b":2},\n' +
      '{"a":3, "b":4}\n' +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,    b,      c,      d\n" +
      "T,    F,      N,   -99\n" +
      "2.3,  -5e-10, 2.4e20, 123e-10\n" +
      "\"\",   \"a\",   \"\\\" \\\\ \\t \\n \\r\", \"\\uabcd\"\n" +
      "`path`, @12cbb082-0c02ae73, 4s, -2.5min\n" +
      "M,R,Bin(image/png),Bin(image/png)\n" +
      "2009-12-31, 23:59:01, 01:02:03.123, 2009-02-03T04:05:06Z\n" +
      "INF, -INF, \"\", NaN\n" +
      "C(12,-34),C(0.123,-.789),C(84.5,-77.45),C(-90,180)\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"a\"},\n" +
      "{\"name\":\"b\"},\n" +
      "{\"name\":\"c\"},\n" +
      "{\"name\":\"d\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      '{"a":true, "b":false, "d":-99},\n' +
      '{"a":2.3, "b":-5e-10, "c":240000000000000000000, "d":1.23e-8},\n' +
      '{"a":"", "b":"a", "c":"\\" \\\\ \\t \\n \\r", "d":"\uabcd"},\n' +
      '{"a":"path", "b":"@12cbb082-0c02ae73", "c":4, "d":-2.5},\n' +
      '{"a":"\u2713", "b":"remove", "c":"Bin(image/png)", "d":"Bin(image/png)"},\n' +
      '{"a":"2009-12-31", "b":"23:59:01", "c":"01:02:03.123", "d":"2009-02-03T04:05:06Z UTC"},\n' +
      '{"a":Infinity, "b":-Infinity, "c":"", "d":NaN},\n' +
      '{"a":"C(12.0,-34.0)", "b":"C(0.123,-0.789)", "c":"C(84.5,-77.45)", "d":"C(-90.0,180.0)"}\n' +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a, b\n" +
      "-3.1kg,4kg\n" +
      "5%,3.2%\n" +
      "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
      "123e+12kJ/kg_dry,74\u0394\u00b0F\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      "{\"name\":\"a\"},\n" +
      "{\"name\":\"b\"}\n" +
      "],\n" +
      "\"rows\":[\n" +
      '{"a":-3.1, "b":4},\n' +
      '{"a":5, "b":3.2},\n' +
      '{"a":5, "b":-15},\n' +
      '{"a":123000000000000, "b":74}\n' +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\" a: 2009-02-03T04:05:06Z foo b: 2010-02-03T04:05:06Z UTC bar c: 2009-12-03T04:05:06Z London baz\n" +
      "a\n" +
      "3.814697265625E-6\n" +
      "2010-12-18T14:11:30.924Z\n" +
      "2010-12-18T14:11:30.925Z UTC\n" +
      "2010-12-18T14:11:30.925Z London\n" +
      "45$\n" +
      "33\u00a3\n" +
      "@12cbb08e-0c02ae73\n" +
      "7.15625E-4kWh/ft\u00b2\n",
      "{\n" +
      '"meta": {"ver":"2.0", "a":"2009-02-03T04:05:06Z UTC", "b":"2010-02-03T04:05:06Z UTC", "bar":"\u2713", "baz":"\u2713", "c":"2009-12-03T04:05:06Z London", "foo":"\u2713"},\n' +
      '"cols":[\n' +
      '{"name":"a"}\n' +
      '],\n' +
      '"rows":[\n' +
      '{"a":0.000003814697265625},\n' +
      '{"a":"2010-12-18T14:11:30.924Z UTC"},\n' +
      '{"a":"2010-12-18T14:11:30.925Z UTC"},\n' +
      '{"a":"2010-12-18T14:11:30.925Z London"},\n' +
      '{"a":45},\n' +
      '{"a":33},\n' +
      '{"a":"@12cbb08e-0c02ae73"},\n' +
      '{"a":0.000715625}\n' +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\" bg: Bin(image/jpeg) mark\n" +
      "file1 dis:\"F1\" icon: Bin(image/gif),file2 icon: Bin(image/jpg)\n" +
      "Bin(text/plain),N\n" +
      "4,Bin(image/png)\n" +
      "Bin(text/html; a=foo; bar=\"sep\"),Bin(text/html; charset=utf8)\n",
      "{\n" +
      '"meta": {"ver":"2.0", "bg":"Bin(image/jpeg)", "mark":"\u2713"},\n' +
      '"cols":[\n' +
      '{"name":"file1", "dis":"F1", "icon":"Bin(image/gif)"},\n' +
      '{"name":"file2", "icon":"Bin(image/jpg)"}\n' +
      '],\n' +
      '"rows":[\n' +
      '{"file1":"Bin(text/plain)"},\n' +
      '{"file1":4, "file2":"Bin(image/png)"},\n' +
      '{"file1":"Bin(text/html; a=foo; bar=\\"sep\\")", "file2":"Bin(text/html; charset=utf8)"}\n' +
      "]\n}\n"
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a, b, c\n" +
      ", 1, 2\n" +
      "3, , 5\n" +
      "6, 7_000,\n" +
      ",,10\n" +
      ",,\n" +
      "14,,\n" +
      "\n",
      "{\n" +
      "\"meta\": {\"ver\":\"2.0\"},\n" +
      "\"cols\":[\n" +
      '{"name":"a"},\n' +
      '{"name":"b"},\n' +
      '{"name":"c"}\n' +
      '],\n' +
      '"rows":[\n' +
      '{"b":1, "c":2},\n' +
      '{"a":3, "c":5},\n' +
      '{"a":6, "b":7000},\n' +
      '{"c":10},\n' +
      '{},\n' +
      '{"a":14}\n' +
      "]\n}\n"
  );
};
