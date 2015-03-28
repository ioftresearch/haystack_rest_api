//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

/**
 * HStdOps defines the standard operations available.
 * @see {@link http://project-haystack.org/doc/Ops|Project Haystack}
 *
 * @constructor
 */
function HStdOp() {}
module.exports = HStdOp;

var url = require('url'),
    HOp = require('./HOp'),
    HDict = require('../HDict'),
    HGrid = require('../HGrid'),
    HGridBuilder = require('../HGridBuilder'),
    HGridFormat = require('../io/HGridFormat'),
    HHisItem = require('../HHisItem'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HStr = require('../HStr');

/**
 * @constructor
 * @extends {HOp}
 */
function AboutOp() {
  this.name = function() {
    return "about";
  };
  this.summary = function() {
    return "Summary information for server";
  };
  this.onService = function(db, req, callback) {
    db.about(function(err, dict) {
      callback(null, HGridBuilder.dictToGrid(dict));
    });
  };
}
AboutOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function OpsOp() {
  this.name = function() {
    return "ops";
  };
  this.summary = function() {
    return "Operations supported by this server";
  };
  this.onService = function(db, req, callback) {
    db.ops(function(err, ops) {
      var b = new HGridBuilder();
      b.addCol("name");
      b.addCol("summary");
      for (var i = 0; i < ops.length; ++i) {
        var op = ops[i];
        b.addRow([
          HStr.make(op.name()),
          HStr.make(op.summary())
        ]);
      }
      callback(null, b.toGrid());
    });
  };
}
OpsOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function FormatsOp() {
  this.name = function() {
    return "formats";
  };
  this.summary = function() {
    return "Grid data formats supported by this server";
  };
  this.onService = function(db, req, callback) {
    var b = new HGridBuilder();
    b.addCol("mime");
    b.addCol("read");
    b.addCol("write");
    var formats = HGridFormat.list();
    for (var i = 0; i < formats.length; ++i) {
      var format = formats[i];
      b.addRow([
        HStr.make(format.mime),
        format.reader !== null ? HMarker.VAL : null,
        format.writer !== null ? HMarker.VAL : null,
      ]);
    }
    callback(null, b.toGrid());
  };
}
FormatsOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function ReadOp() {
  this.name = function() {
    return "read";
  };
  this.summary = function() {
    return "Read entity records in database";
  };
  this.onService = function(db, req, callback) {
    // ensure we have one row
    if (req.isEmpty()) {
      callback(new Error("Request has no rows"));
      return;
    }

    // perform filter or id read
    var row = req.row(0);
    if (row.has("filter")) {
      // filter read
      var filter = row.getStr("filter");
      var limit = row.has("limit") ? row.getInt("limit") : 2147483647;
      db.readAll(filter, limit, callback);
    } else if (row.has("id")) {
      // read by ids
      this.gridToIds(db, req, function(err, ids) {
        db.readByIds(ids, false, callback);
      });
    } else {
      callback(new Error("Missing filter or id columns"));
    }
  };
}
ReadOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function NavOp() {
  this.name = function() {
    return "nav";
  };
  this.summary = function() {
    return "Navigate record tree";
  };
  this.onService = function(db, req, callback) {
    // ensure we have one row
    var navId = null;
    if (!req.isEmpty()) {
      var val = req.row(0).get("navId", false);
      if (val instanceof HStr) navId = val.val;
    }
    db.nav(navId, callback);
  };
}
NavOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function WatchSubOp() {
  this.name = function() {
    return "watchSub";
  };
  this.summary = function() {
    return "Watch subscription";
  };
  this.onService = function(db, req, callback) {
    // check for watchId or watchId
    var watchId = null;
    var watchDis = null;
    if (req.meta().has("watchId")) watchId = req.meta().getStr("watchId");
    else watchDis = req.meta().getStr("watchDis");

    // check for desired lease
    var lease = null;
    if (req.meta().has("lease")) lease = req.meta().get("lease");

    // open or lookup watch
    var watch = watchId === null ?
        db.watchOpen(watchDis, lease) :
        db.watch(watchId);

    // map grid to ids
    this.gridToIds(db, req, function(err, ids) {
      // subscribe and return resulting grid
      watch.sub(ids, callback);
    });
  };
}
WatchSubOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function WatchUnsubOp() {
  this.name = function() {
    return "watchUnsub";
  };
  this.summary = function() {
    return "Watch unsubscription";
  };
  this.onService = function(db, req, callback) {
    // lookup watch, silently ignore failure
    var watchId = req.meta().getStr("watchId");
    var watch = db.watch(watchId, false);

    // check for close or unsub
    if (watch !== null) {
      if (req.meta().has("close")) watch.close(callback);
      else {
        this.gridToIds(db, req, function(err, ids) {
          watch.unsub(ids, callback);
        });
      }
      return;
    }

    // nothing to return
    callback(null, HGrid.EMPTY);
  };
}
WatchUnsubOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function WatchPollOp() {
  this.name = function() {
    return "watchPoll";
  };
  this.summary = function() {
    return "Watch poll cov or refresh";
  };
  this.onService = function(db, req, callback) {
    // lookup watch
    var watchId = req.meta().getStr("watchId");
    var watch = db.watch(watchId);

    // poll cov or refresh
    if (req.meta().has("refresh")) watch.pollRefresh(callback);
    else watch.pollChanges(callback);
  };
}
WatchPollOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function PointWriteOp() {
  this.name = function() {
    return "pointWrite";
  };
  this.summary = function() {
    return "Read/write writable point priority array";
  };
  this.onService = function(db, req, callback) {
    // get required point id
    if (req.isEmpty()) {
      callback(new Error("Request has no rows"));
      return;
    }
    var row = req.row(0);
    this.valToId(db, row.get("id"), function(err, id) {
      // check for write
      if (row.has("level")) {
        var level = row.getInt("level");
        var who = row.getStr("who"); // be nice to have user fallback
        var val = row.get("val", false);
        var dur = row.get("duration", false);
        db.pointWrite(id, level, val, who, dur, row, function() {
          db.pointWriteArray(id, callback);
        });
      } else {
        db.pointWriteArray(id, callback);
      }
    });
  };
}
PointWriteOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function HisReadOp() {
  this.name = function() {
    return "hisRead";
  };
  this.summary = function() {
    return "Read time series from historian";
  };
  this.onService = function(db, req, callback) {
    if (req.isEmpty()) {
      callback(new Error("Request has no rows"));
      return;
    }

    var row = req.row(0);
    this.valToId(db, row.get("id"), function(err, id) {
      var range = row.getStr("range");
      db.hisRead(id, range, callback);
    });
  };
}
HisReadOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function HisWriteOp() {
  this.name = function() {
    return "hisWrite";
  };
  this.summary = function() {
    return "Write time series data to historian";
  };
  this.onService = function(db, req, callback) {
    if (req.isEmpty()) {
      callback(new Error("Request has no rows"));
      return;
    }
    this.valToId(db, req.meta().get("id"), function(err, id) {
      var items = HHisItem.gridToItems(req);
      db.hisWrite(id, items, function(err) {
        if (err) callback(err);
        else callback(null, HGrid.EMPTY);
      });
    });
  };
}
HisWriteOp.prototype = Object.create(HOp.prototype);

/**
 * @constructor
 * @extends {HOp}
 */
function InvokeActionOp() {
  this.name = function() {
    return "invokeAction";
  };
  this.summary = function() {
    return "Invoke action on target entity";
  };
  this.onService = function(db, req, callback) {
    this.valToId(db, req.meta().get("id"), function(err, id) {
      var action = req.meta().getStr("action");
      var args = HDict.EMPTY;
      if (req.numRows() > 0) args = req.row(0);
      db.invokeAction(id, action, args, callback);
    });
  };
}
InvokeActionOp.prototype = Object.create(HOp.prototype);

/** List the registered operations. */
HStdOp.about = new AboutOp();

/** List the registered operations. */
HStdOp.ops = new OpsOp();

/** List the registered grid formats. */
HStdOp.formats = new FormatsOp();

/** Read entity records in database. */
HStdOp.read = new ReadOp();

/** Navigate tree structure of database. */
HStdOp.nav = new NavOp();

/** Watch subscription. */
HStdOp.watchSub = new WatchSubOp();

/** Watch unsubscription. */
HStdOp.watchUnsub = new WatchUnsubOp();

/** Watch poll cov or refresh. */
HStdOp.watchPoll = new WatchPollOp();

/** Read/write writable point priority array. */
HStdOp.pointWrite = new PointWriteOp();

/** Read time series history data. */
HStdOp.hisRead = new HisReadOp();

/** Write time series history data. */
HStdOp.hisWrite = new HisWriteOp();

/** Invoke action. */
HStdOp.invokeAction = new InvokeActionOp();
