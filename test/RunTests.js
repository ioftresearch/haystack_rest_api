//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

// Test Case List
var TESTS = [
  "ValTest",
  "DictTest",
  "FilterTest",
  "GridTest",
  "ZincTest",
  "UtilTest",
  "CsvTest",
  "JsonTest"
//  "ClientTest", // ClientTest is run asynchronously
//  "ServerTest"  // ServerTest is run asynchronously
];

function runTest(testName) {
  try {
    var obj = require("./" + testName);
    var funcs = Object.getOwnPropertyNames(obj).filter(function(property) {
      return typeof obj[property] === 'function';
    });

    var start = new Date().getTime();
    for (var i = 0; i < funcs.length; ++i) {
      if (funcs[i].substring(0, 4) !== "test") {
        continue;
      }
      console.log("-- Run:  " + testName + "." + funcs[i] + "...");
      eval("obj." + funcs[i] + "();");
      console.log("   Pass: " + testName + "." + funcs[i]); // + " [" + obj.verified + "]");
    }

    var end = new Date().getTime();
    console.log("Time for tests: " + ((end - start) / 1000.0) + " secs");

    return true;
  } catch (err) {
    console.log("### Failed: " + testName);
    console.log(err.stack);

    return false;
  }
}

function runTests(tests) {
  var allPassed = true;
  var testCount = 0;

  for (var i = 0; i < tests.length; ++i) {
    testCount++;
    if (!runTest(tests[i])) {
      allPassed = false;
    }
  }

  var testClient = true;

  // run async tests
  if (testClient) {
    var obj = require("./ClientTest");
    var start = new Date().getTime();
    console.log("-- Run:  ClientTest.test...");
    obj.test(function() {
      console.log("   Pass: ClientTest.test");
      var end = new Date().getTime();
      console.log("Time for tests: " + ((end - start) / 1000.0) + " secs");
    });
  } else {
    var obj = require("./ServerTest");
    var start = new Date().getTime();
    console.log("-- Run:  ServerTest.test...");
    obj.test(function() {
      console.log("   Pass: ServerTest.test");
      var end = new Date().getTime();
      console.log("Time for tests: " + ((end - start) / 1000.0) + " secs");
    });
  }

  return allPassed;
}

runTests(TESTS);
