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
 * GridTest tests the HGrid class
 * @constructor
 */
function GridTest() {}
GridTest.prototype = Object.create(Test.prototype);
module.exports = GridTest;

var HDict = require('../HDict'),
    HGridBuilder = require('../HGridBuilder'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HStr = require('../HStr');

function verifyCol(g, i, n) {
  var col = g.col(i);
  Test.verify(g.col(i) === g.col(n));
  Test.verifyEq(col.name(), n);
  return col;
}

function verifyRowIterator(it, name, val) {
  Test.verifyEq(it.hasNext(), true);
  var entry = it.next();
  Test.verifyEq(entry.getKey(), name);
  Test.verifyEq(entry.getValue(), val);
}

function verifyGridIterator(g) {
  var it = g.iterator();
  var c = 0;
  while (c < g.numRows()) {
    Test.verifyEq(it.hasNext(), true);
    Test.verify(it.next() === g.row(c++));
  }
  Test.verifyEq(it.hasNext(), false);
  Test.verifyEq(c, g.numRows());
}

GridTest.testEmpty = function() {
  var g = new HGridBuilder().toGrid();
  Test.verifyEq(g.meta(), HDict.EMPTY);
  Test.verifyEq(g.numRows(), 0);
  Test.verifyEq(g.isEmpty(), true);
  Test.verifyEq(g.col("foo", false), null);
  try {
    g.col("foo");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};

GridTest.testNoRows = function() {
  var b = new HGridBuilder();
  b.meta().add("dis", "Title");
  b.addCol("a").add("dis", "Alpha");
  b.addCol("b");
  var g = b.toGrid();
  // meta
  Test.verifyEq(g.meta().size(), 1);
  Test.verifyEq(g.meta().get("dis"), HStr.make("Title"));

  // cols
  Test.verifyEq(g.numCols(), 2);
  var c = verifyCol(g, 0, "a");
  Test.verifyEq(c.dis(), "Alpha");
  Test.verifyEq(c.meta().size(), 1);
  Test.verifyEq(c.meta().get("dis"), HStr.make("Alpha"));

  // rows
  Test.verifyEq(g.numRows(), 0);
  Test.verifyEq(g.isEmpty(), true);

  // iterator
  verifyGridIterator(g);
};

GridTest.testSimple = function() {
  var b = new HGridBuilder();
  b.addCol("id");
  b.addCol("dis");
  b.addCol("area");
  b.addRow([HRef.make("a"), HStr.make("Alpha"), HNum.make(1200)]);
  b.addRow([HRef.make("b"), HStr.make("Beta"), null]);

  // meta
  var g = b.toGrid();
  Test.verifyEq(g.meta().size(), 0);

  // cols
  Test.verifyEq(g.numCols(), 3);
  verifyCol(g, 0, "id");
  verifyCol(g, 1, "dis");
  verifyCol(g, 2, "area");

  // rows
  Test.verifyEq(g.numRows(), 2);
  Test.verifyEq(g.isEmpty(), false);
  var r = g.row(0);
  Test.verifyEq(r.get("id"), HRef.make("a"));
  Test.verifyEq(r.get("dis"), HStr.make("Alpha"));
  Test.verifyEq(r.get("area"), HNum.make(1200));
  r = g.row(1);
  Test.verifyEq(r.get("id"), HRef.make("b"));
  Test.verifyEq(r.get("dis"), HStr.make("Beta"));
  Test.verifyEq(r.get("area", false), null);
  try {
    r.get("area");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
  Test.verifyEq(r.get("fooBar", false), null);
  try {
    r.get("fooBar");
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }

  // HRow.iterator no-nulls
  var it = g.row(0).iterator();
  verifyRowIterator(it, "id", HRef.make("a"));
  verifyRowIterator(it, "dis", HStr.make("Alpha"));
  verifyRowIterator(it, "area", HNum.make(1200));
  Test.verifyEq(it.hasNext(), false);

  // HRow.iterator with nulls
  it = g.row(1).iterator();
  verifyRowIterator(it, "id", HRef.make("b"));
  verifyRowIterator(it, "dis", HStr.make("Beta"));
  Test.verifyEq(it.hasNext(), false);

  // iterator
  verifyGridIterator(g);
};
