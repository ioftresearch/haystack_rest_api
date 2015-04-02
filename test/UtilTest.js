//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var Test = require('./Test'),
    HGridFormat = require('../io/HGridFormat'),
    Base64 = require('../util/Base64');

/**
 * UtilTest tests the Base64 encoder and HGridFormat
 * @constructor
 */
function UtilTest() {}
UtilTest.prototype = Object.create(Test.prototype);
module.exports = UtilTest;

function randomString() {
  var chars = parseInt(Math.random() * 100) + 1;
  var s = "";

  for (var i = 0; i < chars; i++) {
    s += String.fromCharCode(parseInt(Math.random() * (127 - 32)) + 32);
  }

  return s;
}

UtilTest.testBase64 = function() {
  for (var i = 0; i < 1000; i++) {
    var s1 = randomString();

    var enc = Base64.STANDARD.encodeUTF8(s1);
    var s2 = Base64.STANDARD.decodeUTF8(enc);
    Test.verifyEq(s1, s2);

    enc = Base64.STANDARD.encode(s1);
    s2 = Base64.STANDARD.decode(enc);
    Test.verifyEq(s1, s2);

    enc = Base64.URI.encodeUTF8(s1);
    s2 = Base64.URI.decodeUTF8(enc);
    Test.verifyEq(s1, s2);

    enc = Base64.URI.encode(s1);
    s2 = Base64.URI.decode(enc);
    Test.verifyEq(s1, s2);
  }
};

function testFormat(mime, reader, writer) {
  var format = HGridFormat.find(mime, true);
  Test.verifyEq(format.mime, mime);
  Test.verifyEq((format.reader === null ? null : format.reader.name), reader);
  Test.verifyEq((format.writer === null ? null : format.writer.name), writer);
}
UtilTest.testGridFormat = function() {
  var format = testFormat("text/plain", "HZincReader", "HZincWriter");
  format = testFormat("text/zinc", "HZincReader", "HZincWriter");
  format = testFormat("text/csv", null, "HCsvWriter");
  format = testFormat("application/json", "HJsonReader", "HJsonWriter");

  var h = HGridFormat.find("invalid", false);
  try {
    HGridFormat.find("invalid", true);
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }
  try {
    h.makeReader(null);
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }
  try {
    h.makeWriter(null);
    Test.fail();
  } catch (err) {
    Test.verifyException(err);
  }

};