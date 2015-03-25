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
 * ZincTest tests the zinc reader/writer
 * @constructor
 */
function ZincTest() {}
ZincTest.prototype = Object.create(Test.prototype);
module.exports = ZincTest;

var HBin = require('../HBin'),
    HBool = require('../HBool'),
    HCoord = require('../HCoord'),
    HDate = require('../HDate'),
    HDateTime = require('../HDateTime'),
    HDict = require('../HDict'),
    HDictBuilder = require('../HDictBuilder'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HRemove = require('../HRemove'),
    HStr = require('../HStr'),
    HTime = require('../HTime'),
    HTimeZone = require('../HTimeZone'),
    HUri = require('../HUri'),
    HZincReader = require('../io/HZincReader'),
    HZincWriter = require('../io/HZincWriter');

function isNull(obj) {
  return typeof(obj) === 'undefined' || obj === null;
}

function verifyGridEq(grid, meta, cols, rows) {
  // meta
  Test.verifyEq(grid.meta(), meta);

  // cols
  Test.verifyEq(grid.numCols(), cols.length / 2);
  for (var i = 0; i < grid.numCols(); ++i) {
    Test.verifyEq(grid.col(i).name(), cols[i * 2 + 0]);
    Test.verifyEq(grid.col(i).meta(), cols[i * 2 + 1]);
  }

  // rows
  Test.verifyEq(grid.numRows(), rows.length);
  for (var ri = 0; ri < rows.length; ++ri) {
    var expected = rows[ri];
    var actual = grid.row(ri);
    for (var ci = 0; ci < expected.length; ++ci) {
      Test.verifyEq(expected[ci], actual.get(grid.col(ci).name(), false));
    }
  }
}

function verifyGrid(str, meta, cols, rows) {
  // normalize nulls
  if (isNull(meta)) {
    meta = HDict.EMPTY;
  }
  for (var i = 0; i < cols.length; ++i) {
    if (isNull(cols[i])) {
      cols[i] = HDict.EMPTY;
    }
  }
  // read from zinc
  new HZincReader(str).readGrid(function(err, grid) {
    verifyGridEq(grid, meta, cols, rows);

    // write grid and verify we can parse that too
    HZincWriter.gridToString(grid, function(err, writeStr) {
      new HZincReader(writeStr).readGrid(function(err, writeGrid) {
        verifyGridEq(writeGrid, meta, cols, rows);
      });
    });
  });
}

ZincTest.test = function() {

  verifyGrid(
      "ver:\"2.0\"\n" +
      "fooBar33\n" +
      "\n",
      null,
      ["fooBar33", null],
      []
  );

  verifyGrid(
      "ver:\"2.0\" tag foo:\"bar\"\n" +
      "xyz\n" +
      "\"val\"\n" +
      "\n",
      new HDictBuilder().add("tag", HMarker.VAL).add("foo", HStr.make("bar")).toDict(),
      ["xyz", null],
      [[HStr.make("val")]]
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "val\n" +
      "N\n" +
      "\n",
      null,
      ["val", null],
      [[null]]
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "1,2\n" +
      "3,4\n" +
      "\n",
      null,
      ["a", null,
        "b", null],
      [[HNum.make(1.0), HNum.make(2.0)],
        [HNum.make(3.0), HNum.make(4.0)]]
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
      null,
      ["a", null,
        "b", null,
        "c", null,
        "d", null],
      [[HBool.TRUE, HBool.FALSE, null, HNum.make(-99.0)],
        [HNum.make(2.3), HNum.make(-5.0E-10), HNum.make(2.4E20), HNum.make(1.23E-8)],
        [HStr.make(""), HStr.make("a"), HStr.make("\" \\ \t \n \r"), HStr.make("\uabcd")],
        [HUri.make("path"), HRef.make("12cbb082-0c02ae73", null), HNum.make(4.0, "s"), HNum.make(-2.5, "min")],
        [HMarker.VAL, HRemove.VAL, HBin.make("image/png"), HBin.make("image/png")],
        [HDate.make(2009, 12, 31), HTime.make(23, 59, 1, 0), HTime.make(1, 2, 3, 123), HDateTime.make(HDate.make(2009, 2, 3), HTime.make(4, 5, 6, 0), HTimeZone.make("UTC"))],
        [HNum.POS_INF, HNum.NEG_INF, HStr.make(""), HNum.NaN],
        [HCoord.make(12.0, -34.0), HCoord.make(0.123, -0.789), HCoord.make(84.5, -77.45), HCoord.make(-90.0, 180.0)]]
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "foo\n" +
      "`foo$20bar`\n" +
      "`foo\\`bar`\n" +
      "`file \\#2`\n" +
      "\"$15\"\n",
      null,
      ["foo", null],
      [[HUri.make("foo$20bar")],
        [HUri.make("foo`bar")],
        [HUri.make("file \\#2")],
        [HStr.make("$15")]]
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a, b\n" +
      "-3.1kg,4kg\n" +
      "5%,3.2%\n" +
      "5kWh/ft\u00b2,-15kWh/m\u00b2\n" +
      "123e+12kJ/kg_dry,74\u0394\u00b0F\n",
      null,
      ["a", null,
        "b", null],
      [[HNum.make(-3.1, "kg"), HNum.make(4.0, "kg")],
        [HNum.make(5.0, "%"), HNum.make(3.2, "%")],
        [HNum.make(5.0, "kWh/ft\u00b2"), HNum.make(-15.0, "kWh/m\u00b2")],
        [HNum.make(1.23E14, "kJ/kg_dry"), HNum.make(74.0, "\u0394\u00b0F")]]
  );

  verifyGrid(
      "ver:\"2.0\"\n" +
      "a,b\n" +
      "2010-03-01T23:55:00.013-05:00 GMT+5,2010-03-01T23:55:00.013+10:00 GMT-10\n",
      null,
      ["a", null,
        "b", null],
      [[HDateTime.make(HDate.make(2010, 3, 1), HTime.make(23, 55, 0, 13), HTimeZone.make("GMT+5")), HDateTime.make(HDate.make(2010, 3, 1), HTime.make(23, 55, 0, 13), HTimeZone.make("GMT-10"))]]
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
      new HDictBuilder().add("b", HDateTime.make(HDate.make(2010, 2, 3), HTime.make(4, 5, 6, 0), HTimeZone.make("UTC"))).add("baz", HMarker.VAL).add("c", HDateTime.make(HDate.make(2009, 12, 3), HTime.make(4, 5, 6, 0), HTimeZone.make("London"))).add("a", HDateTime.make(HDate.make(2009, 2, 3), HTime.make(4, 5, 6, 0), HTimeZone.make("UTC"))).add("foo", HMarker.VAL).add("bar", HMarker.VAL).toDict(),
      ["a", null],
      [[HNum.make(3.814697265625E-6)],
        [HDateTime.make(HDate.make(2010, 12, 18), HTime.make(14, 11, 30, 924), HTimeZone.make("UTC"))],
        [HDateTime.make(HDate.make(2010, 12, 18), HTime.make(14, 11, 30, 925), HTimeZone.make("UTC"))],
        [HDateTime.make(HDate.make(2010, 12, 18), HTime.make(14, 11, 30, 925), HTimeZone.make("London"))],
        [HNum.make(45.0, "$")],
        [HNum.make(33.0, "\u00a3")],
        [HRef.make("12cbb08e-0c02ae73", null)],
        [HNum.make(7.15625E-4, "kWh/ft\u00b2")]]
  );

  verifyGrid(
      "ver:\"2.0\" bg: Bin(image/jpeg) mark\n" +
      "file1 dis:\"F1\" icon: Bin(image/gif),file2 icon: Bin(image/jpg)\n" +
      "Bin(text/plain),N\n" +
      "4,Bin(image/png)\n" +
      "Bin(text/html; a=foo; bar=\"sep\"),Bin(text/html; charset=utf8)\n",
      new HDictBuilder().add("bg", HBin.make("image/jpeg")).add("mark", HMarker.VAL).toDict(),
      ["file1", new HDictBuilder().add("icon", HBin.make("image/gif")).add("dis", HStr.make("F1")).toDict(),
        "file2", new HDictBuilder().add("icon", HBin.make("image/jpg")).toDict()],
      [[HBin.make("text/plain"), null],
        [HNum.make(4.0), HBin.make("image/png")],
        [HBin.make("text/html; a=foo; bar=\"sep\""), HBin.make("text/html; charset=utf8")]]
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
      null,
      ["a", null,
        "b", null,
        "c", null],
      [[null, HNum.make(1.0), HNum.make(2.0)],
        [HNum.make(3.0), null, HNum.make(5.0)],
        [HNum.make(6.0), HNum.make(7000.0), null],
        [null, null, HNum.make(10.0)],
        [null, null, null],
        [HNum.make(14.0), null, null]]
  );
};
