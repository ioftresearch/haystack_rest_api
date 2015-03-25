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
 * DictTest tests the HDict class
 * @constructor
 */
function DictTest() {}
DictTest.prototype = Object.create(Test.prototype);
module.exports = DictTest;

var HDate = require('../HDate'),
    HDict = require('../HDict'),
    HDictBuilder = require('../HDictBuilder'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HStr = require('../HStr'),
    HZincReader = require('../io/HZincReader');

DictTest.testEmpty = function() {
  var tags = new HDictBuilder().toDict();
  Test.verify(tags === HDict.EMPTY);
  Test.verifyEq(tags, HDict.EMPTY);

  // size
  Test.verifyEq(tags.size(), 0);
  Test.verifyEq(tags.isEmpty(), true);

  // missing tag
  Test.verifyEq(tags.has("foo"), false);
  Test.verifyEq(tags.missing("foo"), true);
  Test.verifyEq(tags.get("foo", false), null);
  try {
    tags.get("foo");
    Test.fail();
  } catch (e) {
    Test.verify(true);
  }
  try {
    tags.get("foo", true);
    Test.fail();
  } catch (e) {
    Test.verify(true);
  }
};

DictTest.testIsTagName = function() {
  Test.verifyEq(HDict.isTagName(""), false);
  Test.verifyEq(HDict.isTagName("A"), false);
  Test.verifyEq(HDict.isTagName(" "), false);
  Test.verifyEq(HDict.isTagName("a"), true);
  Test.verifyEq(HDict.isTagName("a_B_19"), true);
  Test.verifyEq(HDict.isTagName("a b"), false);
  Test.verifyEq(HDict.isTagName("a\u0128"), false);
  Test.verifyEq(HDict.isTagName("a\u0129x"), false);
  Test.verifyEq(HDict.isTagName("a\uabcdx"), false);
};

DictTest.testBasics = function() {
  var tags = new HDictBuilder()
      .add("id", HRef.make("aaaa-bbbb"))
      .add("site")
      .add("geoAddr", "Richmond, Va")
      .add("area", 1200, "ft")
      .add("date", HDate.make(2000, 12, 3))
      .toDict();

  // size
  Test.verifyEq(tags.size(), 5);
  Test.verifyEq(tags.isEmpty(), false);

  // configured tags
  Test.verifyEq(tags.get("id"), HRef.make("aaaa-bbbb"));
  Test.verifyEq(tags.get("site"), HMarker.VAL);
  Test.verifyEq(tags.get("geoAddr"), HStr.make("Richmond, Va"));
  Test.verifyEq(tags.get("area"), HNum.make(1200, "ft"));
  Test.verifyEq(tags.get("date"), HDate.make(2000, 12, 3));

  // missing tag
  Test.verifyEq(tags.has("foo"), false);
  Test.verifyEq(tags.missing("foo"), true);
  Test.verifyEq(tags.get("foo", false), null);
  try {
    tags.get("foo");
    Test.fail();
  } catch (e) {
    Test.verify(true);
  }
  try {
    tags.get("foo", true);
    Test.fail();
  } catch (e) {
    Test.verify(true);
  }
};

DictTest.testEquality = function() {
  var a = new HDictBuilder().add("x").toDict();
  Test.verifyEq(a, new HDictBuilder().add("x").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x", 3).toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("y").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x").add("y").toDict());

  a = new HDictBuilder().add("x").add("y", "str").toDict();
  Test.verifyEq(a, new HDictBuilder().add("x").add("y", "str").toDict());
  Test.verifyEq(a, new HDictBuilder().add("y", "str").add("x").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x", "str").add("y", "str").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x").add("y", "strx").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("y", "str").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x").toDict());
  Test.verifyNotEq(a, new HDictBuilder().add("x").add("yy", "str").toDict());
};

function verifyZinc(s, tags) {
  new HZincReader(s).readDict(function(err, dict) {
    if (tags.size() <= 1) {
      Test.verifyEq(tags.toZinc(), s);
    }
    Test.verifyEq(dict, tags);
  });
}

DictTest.testZinc = function() {
  verifyZinc("",
      HDict.EMPTY);
  verifyZinc("foo_12",
      new HDictBuilder().add("foo_12").toDict());
  verifyZinc("fooBar:123ft",
      new HDictBuilder().add("fooBar", 123, "ft").toDict());
  verifyZinc("dis:\"Bob\" bday:1970-06-03 marker",
      new HDictBuilder().add("dis", "Bob").add("bday", HDate.make(1970, 6, 3)).add("marker").toDict());
  verifyZinc("dis  :  \"Bob\"  bday : 1970-06-03  marker",
      new HDictBuilder().add("dis", "Bob").add("bday", HDate.make(1970, 6, 3)).add("marker").toDict());
};

DictTest.testDis = function() {
  Test.verifyEq(new HDictBuilder().add("id", HRef.make("a")).toDict().dis(), "a");
  Test.verifyEq(new HDictBuilder().add("id", HRef.make("a", "b")).toDict().dis(), "b");
  Test.verifyEq(new HDictBuilder().add("id", HRef.make("a")).add("dis", "d").toDict().dis(), "d");
};
