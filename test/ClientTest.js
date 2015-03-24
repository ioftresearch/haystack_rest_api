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
    HTimeZone = require('../HTimeZone'),
    HDate = require('../HDate'),
    HDateTime = require('../HDateTime'),
    HGrid = require('../HGrid'),
    HHisItem = require('../HHisItem'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HStr = require('../HStr'),
    HTime = require('../HTime'),
    HVal = require('../HVal'),
    HClient = require('../client/HClient');

/**
 * ClientTest -- this test requires an instance of SkySpark
 * running localhost port 8080 with the standard demo project
 * and a user account "haystack/testpass".
 * @constructor
 */
function ClientTest() {}
ClientTest.prototype = Object.create(Test.prototype);
module.exports = ClientTest;

//////////////////////////////////////////////////////////////////////////
//Utils
//////////////////////////////////////////////////////////////////////////

function verifyGridContains(g, col, val) {
  if (!(val instanceof HVal)) {
    val = HStr.make(val);
  }
  var found = false;
  for (var i = 0; i < g.numRows(); ++i) {
    var x = g.row(i).get(col, false);
    if (x !== null && x.equals(val)) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.log("verifyGridContains " + col + "=" + val + " failed!");
    Test.fail();
  }
}

var uri = "http://localhost:8080/api/demo";
var user = "haystack";
var pass = "testpass";
var client, tests, funcs, args, cb;

function runTests() {
  var test = tests.shift();
  test();
}
function runFuncs() {
  var func = funcs.shift();
  var arg = args.shift();
  func.apply(this, arg);
}
var testError = function(err) {
  try {
    if (err) throw err;
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
  }
};
var authError = function(err) {
  try {
    if (err) throw err;
    Test.fail();
  } catch (e) {
    Test.verifyException(e);
    runFuncs();
  }
};

function verifyAuth() {
  funcs = [HClient.open, HClient.open, HClient.open];
  args = [
    [uri, "baduser", "badpass", authError],
    [uri, "haystack", "badpass", authError],
    [uri, user, pass, function(err, res) {
      if (err) throw err;
      client = res;
      runTests();
    }]
  ];

  runFuncs();
}

function verifyAbout() {
  client.about(function(err, r) {
    if (err) throw err;
    Test.verifyEq(r.getStr("haystackVersion"), "2.0");
    Test.verifyEq(r.getStr("productName"), "SkySpark");
    // we need to verify against offset since our default time will be
    // in GMT format and Skyspark will be based on City Name
    Test.verifyEq(
        HTimeZone.make(r.getStr("tz")).js.offset(new Date().getTime()),
        HTimeZone.DEFAULT.js.offset(new Date().getTime())
    );

    runTests();
  });
}

//////////////////////////////////////////////////////////////////////////
// Ops
//////////////////////////////////////////////////////////////////////////

function verifyOps() {
  client.ops(function(err, g) {
    if (err) throw err;
    // verify required columns
    Test.verify(g.col("name") !== null);
    Test.verify(g.col("summary") !== null);

    // verify required ops
    verifyGridContains(g, "name", "about");
    verifyGridContains(g, "name", "ops");
    verifyGridContains(g, "name", "formats");
    verifyGridContains(g, "name", "read");

    runTests();
  });
}

//////////////////////////////////////////////////////////////////////////
// Formats
//////////////////////////////////////////////////////////////////////////

function verifyFormats() {
  client.formats(function(err, g) {
    if (err) throw err;
    // verify required columns
    Test.verify(g.col("mime") !== null);
    Test.verify(g.col("receive") !== null);
    Test.verify(g.col("send") !== null);

    // verify required ops
    verifyGridContains(g, "mime", "text/plain");
    verifyGridContains(g, "mime", "text/zinc");

    runTests();
  });
}

//////////////////////////////////////////////////////////////////////////
// Reads
//////////////////////////////////////////////////////////////////////////

function verifyRead() {
  // read
  var disA = "Gaithersburg";
  var disB = "Carytown";
  client.read("site and dis==\"" + disA + "\"", function(err, recA) {
    if (err) throw err;
    Test.verifyEq(recA.dis(), disA);

    client.read("site and dis==\"" + disB + "\"", function(err, recB) {
      if (err) throw err;
      client.read("badTagShouldBeThere", false, function(err, r1) {
        if (err) throw err;
        Test.verifyEq(r1, null);
        client.read("badTagShouldBeThere", function(err, r2) {
          testError(err, r2);
          // readAll
          client.readAll("site", function(err, grid) {
            if (err) throw err;
            verifyGridContains(grid, "dis", disA);
            verifyGridContains(grid, "dis", disB);
            verifyGridContains(grid, "id", recA.id());
            verifyGridContains(grid, "id", recB.id());

            // readAll limit
            Test.verify(grid.numRows() > 2);
            client.readAll("site", 2, function(err, r3) {
              if (err) throw err;
              Test.verifyEq(r3.numRows(), 2);

              // readById
              client.readById(recA.id(), function(err, rec) {
                if (err) throw err;
                Test.verifyEq(rec.dis(), disA);
                var badId = HRef.make("badBadId");
                client.readById(badId, false, function(err, r4) {
                  if (err) throw err;
                  Test.verifyEq(r4, null);
                  client.readById(badId, function(err, r5) {
                    testError(err, r5);

                    // readByIds
                    client.readByIds([recA.id(), recB.id()], false, function(err, grid) {
                      if (err) throw err;
                      Test.verifyEq(grid.numRows(), 2);
                      Test.verifyEq(grid.row(0).dis(), disA);
                      Test.verifyEq(grid.row(1).dis(), disB);
                      client.readByIds([recA.id(), badId, recB.id()], false, function(err, grid) {
                        if (err) throw err;
                        Test.verifyEq(grid.numRows(), 3);
                        Test.verifyEq(grid.row(0).dis(), disA);
                        Test.verifyEq(grid.row(1).missing("id"), true);
                        Test.verifyEq(grid.row(2).dis(), disB);
                        client.readByIds([recA.id(), badId], function(err, r6) {
                          testError(err, r6);
                        });

                        runTests();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

//////////////////////////////////////////////////////////////////////////
// Eval
//////////////////////////////////////////////////////////////////////////

function verifyEval() {
  client.evaluate("today()", function(err, g) {
    if (err) throw err;
    Test.verifyEq(g.row(0).get("val"), HDate.today());

    client.evaluate("readAll(ahu)", function(err, g) {
      if (err) throw err;
      Test.verify(g.numRows() > 0);
      verifyGridContains(g, "navName", "RTU-1");

      client.evalAll(["today()", "[10, 20, 30]", "readAll(site)"], function(err, grids) {
        if (err) throw err;
        Test.verifyEq(grids.length, 3);
        g = grids[0];
        Test.verifyEq(g.numRows(), 1);
        Test.verifyEq(g.row(0).get("val"), HDate.today());
        g = grids[1];
        Test.verifyEq(g.numRows(), 3);
        Test.verifyEq(g.row(0).get("val"), HNum.make(10));
        Test.verifyEq(g.row(1).get("val"), HNum.make(20));
        Test.verifyEq(g.row(2).get("val"), HNum.make(30));
        g = grids[2];
        Test.verify(g.numRows() > 2);
        verifyGridContains(g, "dis", "Carytown");

        client.evalAll(["today()", "readById(@badBadBadId)"], false, function(err, grids) {
          if (err) throw err;
          // for (int i=0; i<grids.length; ++i) grids[i].dump();
          Test.verifyEq(grids.length, 2);
          Test.verifyEq(grids[0].isErr(), false);
          Test.verifyEq(grids[0].row(0).get("val"), HDate.today());
          Test.verifyEq(grids[1].isErr(), true);
          client.evalAll(["today()", "readById(@badBadBadId)"], function(err, g) {
            testError(err, g);
            runTests();
          });
        });
      });
    });
  });
}

//////////////////////////////////////////////////////////////////////////
// Watches
//////////////////////////////////////////////////////////////////////////

function verifyWatches() {
  var watchDis = "Node Haystack Test " + new Date().getTime();

  // create new watch
  var w = client.watchOpen(watchDis, HNum.make(3, "min"));
  Test.verifyEq(w.id(), null);
  Test.verifyEq(w.dis(), watchDis);
  Test.verifyEq(w.lease(), null);

  // do query to get some recs
  client.readAll("ahu", function(err, recs) {
    if (err) throw err;
    Test.verify(recs.numRows() >= 4);
    var a = recs.row(0);
    var b = recs.row(1);
    var c = recs.row(2);
    var d = recs.row(3);

    // do first sub
    w.sub([a.id(), b.id()], function(err, sub) {
      if (err) throw err;
      Test.verifyEq(sub.numRows(), 2);
      Test.verifyEq(sub.row(0).dis(), a.dis());
      Test.verifyEq(sub.row(1).dis(), b.dis());

      // now add c, bad, d
      var badId = HRef.make("badBadBad");
      w.sub([badId], function(err, s) {
        testError(err, s);
        try {
          s.dump();
          Test.fail();
        } catch (err) {
          Test.verifyException(err);
        }

        w.sub([c.id(), badId, d.id()], false, function(err, sub) {
          if (err) throw err;
          Test.verifyEq(sub.numRows(), 3);
          Test.verifyEq(sub.row(0).dis(), c.dis());
          Test.verifyEq(sub.row(1).missing("id"), true);
          Test.verifyEq(sub.row(2).dis(), d.dis());

          // verify state of watch now
          Test.verify(client.watch(w.id()) === w);
          Test.verifyEq(client.watches().length, 1);
          Test.verify(client.watches()[0] === w);
          Test.verifyEq(w.lease().millis(), 180000);

          // poll for changes (should be none yet)
          w.pollChanges(function(err, poll) {
            if (err) throw err;
            Test.verifyEq(poll.numRows(), 0);

            // make change to b and d
            Test.verifyEq(b.has("nodeTest"), false);
            Test.verifyEq(d.has("nodeTest"), false);
            client.evaluate("commit(diff(readById(@" + b.id().val + "), {nodeTest:123}))", function(err) {
              if (err) throw err;
              client.evaluate("commit(diff(readById(@" + d.id().val + "), {nodeTest:456}))", function(err) {
                if (err) throw err;
                w.pollChanges(function(err, poll) {
                  if (err) throw err;
                  Test.verifyEq(poll.numRows(), 2);
                  var newb, newd;
                  if (poll.row(0).id().equals(b.id())) {
                    newb = poll.row(0);
                    newd = poll.row(1);
                  }
                  else {
                    newb = poll.row(1);
                    newd = poll.row(0);
                  }
                  Test.verifyEq(newb.id(), b.id());
                  Test.verifyEq(newd.id(), d.id());
                  Test.verifyEq(newb.get("nodeTest"), HNum.make(123));
                  Test.verifyEq(newd.get("nodeTest"), HNum.make(456));

                  // poll refresh
                  w.pollRefresh(function(err, poll) {
                    if (err) throw err;
                    Test.verifyEq(poll.numRows(), 4);
                    verifyGridContains(poll, "id", a.id());
                    verifyGridContains(poll, "id", b.id());
                    verifyGridContains(poll, "id", c.id());
                    verifyGridContains(poll, "id", d.id());

                    // remove d, and then poll changes
                    w.unsub([d.id()], function(err) {
                      if (err) throw err;
                      client.evaluate("commit(diff(readById(@" + b.id().val + "), {-nodeTest}))", function(err) {
                        if (err) throw err;
                        client.evaluate("commit(diff(readById(@" + d.id().val + "), {-nodeTest}))", function(err) {
                          if (err) throw err;
                          w.pollChanges(function(err, poll) {
                            if (err) throw err;
                            Test.verifyEq(poll.numRows(), 1);
                            Test.verifyEq(poll.row(0).id(), b.id());
                            Test.verifyEq(poll.row(0).has("nodeTest"), false);

                            // remove a and c and poll refresh
                            w.unsub([a.id(), c.id()], function(err) {
                              if (err) throw err;
                              w.pollRefresh(function(err, poll) {
                                if (err) throw err;
                                Test.verifyEq(poll.numRows(), 1);
                                Test.verifyEq(poll.row(0).id(), b.id());

                                // close
                                var expr = "folioDebugWatches().findAll(x=>x->dis.contains(\"" + watchDis + "\")).size";
                                client.evaluate(expr, function(err, r) {
                                  if (err) throw err;
                                  Test.verifyEq(r.row(0).getInt("val"), 1);
                                  w.close(function(err) {
                                    if (err) throw err;
                                    w.pollRefresh(function(err, poll) {
                                      testError(err, poll);
                                      client.evaluate(expr, function(err, s) {
                                        if (err) throw err;
                                        Test.verifyEq(s.row(0).getInt("val"), 0);
                                        Test.verifyEq(client.watch(w.id(), false), null);
                                        Test.verifyEq(client.watches().length, 0);

                                        runTests();
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

//////////////////////////////////////////////////////////////////////////
// His Reads
//////////////////////////////////////////////////////////////////////////

function ts(r, col) {
  if (typeof(col) === 'undefined') {
    col = "ts";
  }
  return r.get(col);
}
function numVal(r) {
  return r.get("val");
}

function verifyHisRead() {
  client.read("power and siteMeter", function(err, kw) {
    if (err) throw err;
    client.hisRead(kw.id(), "yesterday", function(err, his) {
      if (err) throw err;
      Test.verifyEq(his.meta().id(), kw.id());
      Test.verifyEq(ts(his.meta(), "hisStart").date, HDate.today().minusDays(1));
      Test.verifyEq(ts(his.meta(), "hisEnd").date, HDate.today());
      Test.verify(his.numRows() > 90);
      var last = his.numRows() - 1;
      Test.verifyEq(ts(his.row(0)).date, HDate.today().minusDays(1));
      Test.verifyEq(ts(his.row(0)).time, HTime.make(0, 15));
      Test.verifyEq(ts(his.row(last)).date, HDate.today());
      Test.verifyEq(ts(his.row(last)).time, HTime.make(0, 0));
      Test.verifyEq(numVal(his.row(0)).unit, "kW");

      runTests();
    });
  });
}

//////////////////////////////////////////////////////////////////////////
// His Reads
//////////////////////////////////////////////////////////////////////////

function clearHisWrite(rec, callback) {
  // existing data and verify we don't have any data for 7 June 20120
  var expr = "hisClear(@" + rec.id().val + ", 2010-06)";
  client.evaluate(expr, function(err) {
    if (err) throw err;
    client.hisRead(rec.id(), "2010-06-07", function(err, his) {
      if (err) throw err;
      Test.verifyEq(his.numRows(), 0);
      callback();
    });
  });
}

function verifyHisWrite() {
  // setup test
  client.read("power and not siteMeter", function(err, kw) {
    if (err) throw err;
    clearHisWrite(kw, function() {
      // create some items
      var date = HDate.make(2010, 6, 7);
      var tz = HTimeZone.make(kw.getStr("tz"));
      var write = [];
      for (var i = 0; i < 5; ++i) {
        var ts = HDateTime.make(date, HTime.make(i + 1, 0), tz);
        var val = HNum.make(i, "kW");
        write[i] = HHisItem.make(ts, val);
      }

      // write and verify
      client.hisWrite(kw.id(), write, function(err) {
        if (err) throw err;
        setTimeout(function() {
          client.hisRead(kw.id(), "2010-06-07", function(err, read) {
            if (err) throw err;
            Test.verifyEq(read.numRows(), write.length);
            for (var i = 0; i < read.numRows(); ++i) {
              Test.verifyEq(read.row(i).get("ts"), write[i].ts);
              Test.verifyEq(read.row(i).get("val"), write[i].val);
            }

            // clean test
            clearHisWrite(kw, cb);
          });
        }, 200);
      });
    });
  });
}

ClientTest.test = function(callback) {
  cb = callback;

  tests = [
    verifyAuth,
    verifyAbout,
    verifyOps,
    verifyFormats,
    verifyRead,
    verifyEval,
    verifyWatches,
    verifyHisRead,
    verifyHisWrite
  ];

  runTests();
};
