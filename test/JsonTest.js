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
    HJsonWriter = require('../io/HJsonWriter'),
    HZincWriter = require('../io/HZincWriter'),
    HJsonReader = require('../io/HJsonReader');

function isNull(obj) {
  return typeof(obj) === 'undefined' || obj === null;
}
function verifyGridWrite(zinc, json) {
  // read from zinc
  new HZincReader(zinc).readGrid(function(err, grid) {
    HJsonWriter.gridToString(grid, function(err, jsonString) {
      try {
        Test.verifyEq(jsonString, json);
        count++;
        _test();
      } catch (err) {
        console.log(err);
          console.log(err.stack);
        callback();
      }
    });
  });
}
function verifyGridRead(zinc, json) {
  // read from JSON
  new HJsonReader(json).readGrid(function(err, grid) {
    HZincWriter.gridToString(grid, function(err, zincString) {
      try {
        Test.verifyEq(zincString, zinc);
        count++;
        if (count<22)
          _test();
        else
          callback();
      } catch (err) {
        console.log(err);
        callback();
      }
    });
  });
}

JsonTest.test = function(cb) {
  callback = cb;
  _test();
};

var callback;
var count = 0;
function _test() {
  switch (count) {
    case 0:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "fooBar33\n" +
          "\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[" +
          "{\"name\":\"fooBar33\"}" +
          "],\n" +
          "\"rows\":[\n\n" +
          "]}\n"
      );
      break;
    case 1:
      verifyGridWrite(
          "ver:\"2.0\" tag foo:\"bar\"\n" +
          "xyz\n" +
          "\"val\"\n" +
          "\n",
          "{\"meta\": {\"ver\":\"2.0\", \"foo\":\"s:bar\", \"tag\":\"m:\"},\n" +
          "\"cols\":[{\"name\":\"xyz\"}],\n" +
          "\"rows\":[\n" +
          "{\"xyz\":\"s:val\"}\n" +
          "]}\n"
      );
      break;
    case 2:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "val\n" +
          "N\n" +
          "\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"val\"}],\n" +
          "\"rows\":[\n" +
          "{}\n" +
          "]}\n"
      );
      break;
    case 3:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "foo\n" +
          "`foo$20bar`\n" +
          "`foo\\`bar`\n" +
          "`file \\#2`\n" +
          "\"$15\"\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"foo\"}],\n" +
          "\"rows\":[\n" +
          "{\"foo\":\"u:foo$20bar\"},\n" +
          "{\"foo\":\"u:foo\\`bar\"},\n" +
          "{\"foo\":\"u:file \\#2\"},\n" +
          "{\"foo\":\"s:$15\"}\n" +
          "]}\n"
      );
      break;
    case 4:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "a,b\n" +
          "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          "{\"a\":\"t:2010-03-01T23:55:00.013-05:00 GMT+5\", \"b\":\"t:2010-03-01T23:55:00.013+10:00 GMT-10\"}\n" +
          "]}\n"
      );
      break;
    case 5:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "a,b\n" +
          "1,2\n" +
          "3,4\n" +
          "\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          '{"a":"n:1", "b":"n:2"},\n' +
          '{"a":"n:3", "b":"n:4"}\n' +
          "]}\n"
      );
      break;
    case 6:
      verifyGridWrite(
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
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, " +
          "{\"name\":\"b\"}, " +
          "{\"name\":\"c\"}, " +
          "{\"name\":\"d\"}],\n" +
          "\"rows\":[\n" +
          '{"a":true, "b":false, "d":"n:-99"},\n' +
          '{"a":"n:2.3", "b":"n:-5e-10", "c":"n:240000000000000000000", "d":"n:1.23e-8"},\n' +
          '{"a":"s:", "b":"s:a", "c":"s:\\" \\\\ \\t \\n \\r", "d":"s:\uabcd"},\n' +
          '{"a":"u:path", "b":"r:12cbb082-0c02ae73", "c":"n:4 s", "d":"n:-2.5 min"},\n' +
          '{"a":"m:", "b":"x:", "c":"b:image/png", "d":"b:image/png"},\n' +
          '{"a":"d:2009-12-31", "b":"h:23:59:01", "c":"h:01:02:03.123", "d":"t:2009-02-03T04:05:06Z UTC"},\n' +
          '{"a":"n:INF", "b":"n:-INF", "c":"s:", "d":"n:NaN"},\n' +
          '{"a":"c:12.0,-34.0", "b":"c:0.123,-0.789", "c":"c:84.5,-77.45", "d":"c:-90.0,180.0"}\n' +
          "]}\n"
      );
      break;
    case 7:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "a, b\n" +
          "-3.1kg,4kg\n" +
          "5%,3.2%\n" +
          "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
          "123e+12kJ/kg_dry,74\u0394\u00b0F\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          '{"a":"n:-3.1 kg", "b":"n:4 kg"},\n' +
          '{"a":"n:5 %", "b":"n:3.2 %"},\n' +
          '{"a":"n:5 kWh/ft\u00b2", "b":"n:-15 kWh/m\u00b2"},\n' +
          '{"a":"n:123000000000000 kJ/kg_dry", "b":"n:74 \u0394\u00b0F"}\n' +
          "]}\n"
      );
      break;
    case 8:
      verifyGridWrite(
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
          '{"meta": {"ver":"2.0", "a":"t:2009-02-03T04:05:06Z UTC", "b":"t:2010-02-03T04:05:06Z UTC", "bar":"m:", "baz":"m:", "c":"t:2009-12-03T04:05:06Z London", "foo":"m:"},\n' +
          '"cols":[{"name":"a"}],\n' +
          '"rows":[\n' +
          '{"a":"n:0.000003814697265625"},\n' +
          '{"a":"t:2010-12-18T14:11:30.924Z UTC"},\n' +
          '{"a":"t:2010-12-18T14:11:30.925Z UTC"},\n' +
          '{"a":"t:2010-12-18T14:11:30.925Z London"},\n' +
          '{"a":"n:45 $"},\n' +
          '{"a":"n:33 \u00a3"},\n' +
          '{"a":"r:12cbb08e-0c02ae73"},\n' +
          '{"a":"n:0.000715625 kWh/ft\u00b2"}\n' +
          "]}\n"
      );
      break;
    case 9:
      verifyGridWrite(
          "ver:\"2.0\" bg: Bin(image/jpeg) mark\n" +
          "file1 dis:\"F1\" icon: Bin(image/gif), file2 icon: Bin(image/jpg)\n" +
          "Bin(text/plain),N\n" +
          "4,Bin(image/png)\n" +
          "Bin(text/html; a=foo; bar=\"sep\"),Bin(text/html; charset=utf8)\n",
          '{"meta": {"ver":"2.0", "bg":"b:image/jpeg", "mark":"m:"},\n' +
          '"cols":[{"name":"file1", "dis":"s:F1", "icon":"b:image/gif"}, ' +
          '{"name":"file2", "icon":"b:image/jpg"}],\n' +
          '"rows":[\n' +
          '{"file1":"b:text/plain"},\n' +
          '{"file1":"n:4", "file2":"b:image/png"},\n' +
          '{"file1":"b:text/html; a=foo; bar="sep"", "file2":"b:text/html; charset=utf8"}\n' +
          "]}\n"
      );
      break;
    case 10:
      verifyGridWrite(
          "ver:\"2.0\"\n" +
          "a, b, c\n" +
          ", 1, 2\n" +
          "3, , 5\n" +
          "6, 7_000,\n" +
          ",,10\n" +
          ",,\n" +
          "14,,\n" +
          "\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          '"cols":[{"name":"a"}, {"name":"b"}, {"name":"c"}],\n' +
          '"rows":[\n' +
          '{"b":"n:1", "c":"n:2"},\n' +
          '{"a":"n:3", "c":"n:5"},\n' +
          '{"a":"n:6", "b":"n:7000"},\n' +
          '{"c":"n:10"},\n' +
          '{},\n' +
          '{"a":"n:14"}\n' +
          "]}\n"
      );
      break;
    case 11:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "fooBar33\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[" +
          "{\"name\":\"fooBar33\"}" +
          "],\n" +
          "\"rows\":[\n\n" +
          "]}\n"
      );
      break;
    case 12:
      verifyGridRead(
          "ver:\"2.0\" foo:\"bar\" tag\n" +
          "xyz\n" +
          "\"val\"\n",
          "{\"meta\": {\"ver\":\"2.0\", \"foo\":\"s:bar\", \"tag\":\"m:\"},\n" +
          "\"cols\":[{\"name\":\"xyz\"}],\n" +
          "\"rows\":[\n" +
          "{\"xyz\":\"s:val\"}\n" +
          "]}\n"
      );
      break;
    case 13:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "val\n" +
          "N\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"val\"}],\n" +
          "\"rows\":[\n" +
          "{}\n" +
          "]}\n"
      );
      break;
    case 14:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "foo\n" +
          "`foo$20bar`\n" +
            //"`foo\\`bar`\n" +
            //"`file \\#2`\n" +
          "`foo\\`bar`\n" +
          "`file #2`\n" +
          "\"$15\"\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"foo\"}],\n" +
          "\"rows\":[\n" +
          "{\"foo\":\"u:foo$20bar\"},\n" +
            //"{\"foo\":\"u:foo\\`bar\"},\n" +
            //"{\"foo\":\"u:file \\#2\"},\n" +
          "{\"foo\":\"u:foo`bar\"},\n" +
          "{\"foo\":\"u:file #2\"},\n" +
          "{\"foo\":\"s:$15\"}\n" +
          "]}\n"
      );
      break;
    case 15:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "a,b\n" +
          "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          "{\"a\":\"t:2010-03-01T23:55:00.013-05:00 GMT+5\", \"b\":\"t:2010-03-01T23:55:00.013+10:00 GMT-10\"}\n" +
          "]}\n"
      );
      break;
    case 16:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "a,b\n" +
          "1,2\n" +
          "3,4\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          '{"a":"n:1", "b":"n:2"},\n' +
          '{"a":"n:3", "b":"n:4"}\n' +
          "]}\n"
      );
      break;
    case 17:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "a,b,c,d\n" +
          "T,F,,-99\n" +
          "2.3,-5e-10,240000000000000000000,1.23e-8\n" +
          "\"\",\"a\",\"\\\" \\\\ \\t \\n \\r\",\"\uabcd\"\n" +
          "`path`,@12cbb082-0c02ae73,4s,-2.5min\n" +
          "M,R,Bin(image/png),Bin(image/png)\n" +
          "2009-12-31,23:59:01,01:02:03.123,2009-02-03T04:05:06Z UTC\n" +
          "INF,-INF,\"\",NaN\n" +
          "C(12.0,-34.0),C(0.123,-0.789),C(84.5,-77.45),C(-90.0,180.0)\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, " +
          "{\"name\":\"b\"}, " +
          "{\"name\":\"c\"}, " +
          "{\"name\":\"d\"}],\n" +
          "\"rows\":[\n" +
          '{"a":true, "b":false, "d":"n:-99"},\n' +
          '{"a":"n:2.3", "b":"n:-5e-10", "c":"n:240000000000000000000", "d":"n:1.23e-8"},\n' +
          '{"a":"s:", "b":"s:a", "c":"s:\\" \\\\ \\t \\n \\r", "d":"s:\uabcd"},\n' +
          '{"a":"u:path", "b":"r:12cbb082-0c02ae73", "c":"n:4 s", "d":"n:-2.5 min"},\n' +
          '{"a":"m:", "b":"x:", "c":"b:image/png", "d":"b:image/png"},\n' +
          '{"a":"d:2009-12-31", "b":"h:23:59:01", "c":"h:01:02:03.123", "d":"t:2009-02-03T04:05:06Z UTC"},\n' +
          '{"a":"n:INF", "b":"n:-INF", "c":"s:", "d":"n:NaN"},\n' +
          '{"a":"c:12.0,-34.0", "b":"c:0.123,-0.789", "c":"c:84.5,-77.45", "d":"c:-90.0,180.0"}\n' +
          "]}\n"
      );
      break;
    case 18:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "a,b\n" +
          "-3.1kg,4kg\n" +
          "5%,3.2%\n" +
          "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
          "123000000000000kJ/kg_dry,74\u0394\u00b0F\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          "\"cols\":[{\"name\":\"a\"}, {\"name\":\"b\"}],\n" +
          "\"rows\":[\n" +
          '{"a":"n:-3.1 kg", "b":"n:4 kg"},\n' +
          '{"a":"n:5 %", "b":"n:3.2 %"},\n' +
          '{"a":"n:5 kWh/ft\u00b2", "b":"n:-15 kWh/m\u00b2"},\n' +
          '{"a":"n:123000000000000 kJ/kg_dry", "b":"n:74 \u0394\u00b0F"}\n' +
          "]}\n"
      );
      break;
    case 19:
      verifyGridRead(
          "ver:\"2.0\" a:2009-02-03T04:05:06Z UTC b:2010-02-03T04:05:06Z UTC bar baz c:2009-12-03T04:05:06Z London foo\n" +
          "a\n" +
          "0.000003814697265625\n" +
          "2010-12-18T14:11:30.925Z UTC\n" +
          "2010-12-18T14:11:30.925Z London\n" +
          "45$\n" +
          "33\u00a3\n" +
          "@12cbb08e-0c02ae73\n" +
          "0.000715625kWh/ft\u00b2\n",
          '{"meta": {"ver":"2.0", "a":"t:2009-02-03T04:05:06Z UTC", "b":"t:2010-02-03T04:05:06Z UTC", "bar":"m:", "baz":"m:", "c":"t:2009-12-03T04:05:06Z London", "foo":"m:"},\n' +
          '"cols":[{"name":"a"}],\n' +
          '"rows":[\n' +
          '{"a":"n:0.000003814697265625"},\n' +
          '{"a":"t:2010-12-18T14:11:30.925Z UTC"},\n' +
          '{"a":"t:2010-12-18T14:11:30.925Z London"},\n' +
          '{"a":"n:45 $"},\n' +
          '{"a":"n:33 \u00a3"},\n' +
          '{"a":"r:12cbb08e-0c02ae73"},\n' +
          '{"a":"n:0.000715625 kWh/ft\u00b2"}\n' +
          "]}\n"
      );
      break;
    case 20:
      verifyGridRead(
          "ver:\"2.0\" bg:Bin(image/jpeg) mark\n" +
          "file1 dis:\"F1\" icon:Bin(image/gif),file2 icon:Bin(image/jpg)\n" +
            //"file1,file2\n" +
          "Bin(text/plain),\n" +
          "4,Bin(image/png)\n" +
          "Bin(text/html; a=foo; bar=\"sep\"),Bin(text/html; charset=utf8)\n",
          '{"meta": {"ver":"2.0", "bg":"b:image/jpeg", "mark":"m:"},\n' +
          '"cols":[{"name":"file1", "dis":"s:F1", "icon":"b:image/gif"}, ' +
          '{"name":"file2", "icon":"b:image/jpg"}],\n' +
          '"rows":[\n' +
          '{"file1":"b:text/plain"},\n' +
          '{"file1":"n:4", "file2":"b:image/png"},\n' +
          '{"file1":"b:text/html; a=foo; bar=\\"sep\\"", "file2":"b:text/html; charset=utf8"}\n' +
          "]}\n"
      );
      break;
    case 21:
      verifyGridRead(
          "ver:\"2.0\"\n" +
          "a,b,c\n" +
          "N,1,2\n" +
          "3,,5\n" +
          "6,7000,\n" +
          "N,,10\n" +
          "N,,\n" +
          "14,,\n",
          "{\"meta\": {\"ver\":\"2.0\"},\n" +
          '"cols":[{"name":"a"}, {"name":"b"}, {"name":"c"}],\n' +
          '"rows":[\n' +
          '{"b":"n:1", "c":"n:2"},\n' +
          '{"a":"n:3", "c":"n:5"},\n' +
          '{"a":"n:6", "b":"n:7000"},\n' +
          '{"c":"n:10"},\n' +
          '{},\n' +
          '{"a":"n:14"}\n' +
          "]}\n"
      );
      break;
  }
}