/**
 * Simple test harness to avoid pulling in dependencies.
 * @constructor
 */
function Test() {}
module.exports = Test;

/** Equals taking into account nulls. */
Test.equals = function(a, b) {
  if (typeof(a) === 'undefined') {
    return typeof(b) === 'undefined';
  }
  else if (typeof(b) === 'undefined') {
    return false;
  }
  if (a === null) {
    return b === null;
  }
  else if (b === null) {
    return false;
  }

  if (a === b) {
    return true;
  }

  if (typeof(a) === 'object') {
    return a.equals(b);
  }
  /*
   if (a instanceof HNum && b instanceof HNum) {
   if (a.unit != b.unit) return false;
   return approx(a.val, b.val);
   }
   */

  return a === b;
};

/*
 Test.approx = function(a, b) {
 // need this to check +inf, -inf, and nan
 // if (compare(self, that) == 0) return true;
 var tolerance = Math.min( Math.abs(a/1e6), Math.abs(b/1e6) );
 return Math.abs(a - b) <= tolerance;
 }
 */

//////////////////////////////////////////////////////////////////////////
// Verify Utils
//////////////////////////////////////////////////////////////////////////

/** Verify the condition is true, otherwise throw an exception. */
Test.verify = function(b) {
  if (!b) {
    throw new Error("Test failed");
  }
};

/** Verify a and b are equal. */
Test.verifyEq = function(a, b) {
  if (typeof(a) === 'object' && typeof(b) === 'object') {
    /** Verify a and b are equal taking into account nulls. */
    try {
      Test.verify(Test.equals(a, b));
      if (typeof(a) !== 'undefined' && a !== null && typeof(b) !== 'undefined' && b !== null) {
        Test.verifyEq(a.toString(), b.toString());
      }
    } catch (err) {
      var aStr = "" + a;
      var bStr = "" + b;
      if (typeof(a) !== 'undefined' && a !== null) {
        aStr = aStr + " [" + a + "]";
      }
      if (typeof(b) !== 'undefined' && b !== null) {
        bStr = bStr + " [" + b + "]";
      }
      if (err.message !== "Test failed") {
        throw err;
      }
      throw new Error("Test failed " + aStr + " != " + bStr);
    }
  } else {
    if (a !== b) {
      throw new Error("Test failed: " + a + " != " + b);
    }
  }
};

/** Verify a and b are not equal taking into account nulls. */
Test.verifyNotEq = function(a, b) {
  try {
    Test.verify(!Test.equals(a, b));
  } catch (err) {
    if (err.message !== "Test failed") {
      throw err;
    }
    throw new Error("Test failed: " + a + " == " + b);
  }
};

/** Force test failure */
Test.fail = function() {
  Test.verify(false);
};

/** Check that exception wasn't test failure itself */
Test.verifyException = function(err) {
  Test.verify(err.message.indexOf("Test failed") < 0);
};

//////////////////////////////////////////////////////////////////////////
// Misc Utils
//////////////////////////////////////////////////////////////////////////

/** Print a line to standard out. */
Test.println = function(s) {
  console.log(s);
};


//////////////////////////////////////////////////////////////////////////
// Main
//////////////////////////////////////////////////////////////////////////

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
//  "ServerTest"
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
