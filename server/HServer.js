//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HProj = require('../HProj'),
    HDateTime = require('../HDateTime'),
    HDateTimeRange = require('../HDateTimeRange'),
    HDictBuilder = require('../HDictBuilder'),
    HFilter = require('../HFilter'),
    HGrid = require('../HGrid'),
    HGridBuilder = require('../HGridBuilder'),
    HRef = require('../HRef'),
    HTimeZone = require('../HTimeZone');

/**
 * HServer is the interface between HServlet and a database of
 * tag based entities.  All methods on HServer must be thread safe.
 * @see {@link http://project-haystack.org/doc/Rest|Project Haystack}
 *
 * @constructor
 */
function HServer() {
  this.bootTime = HDateTime.now();
  this.opsByName = null;
}
HServer.prototype = Object.create(HProj.prototype);
module.exports = HServer;

//////////////////////////////////////////////////////////////////////////
// Operations
//////////////////////////////////////////////////////////////////////////

/**
 * Return the operations supported by this database.
 * @abstract
 * @param {function} callback
 * @return {HOp[]}
 */
HServer.prototype.ops = function(callback) {
  callback(new Error('must be implemented by subclass!'));
};

/**
 * Lookup an operation by name.  If no operation is registered
 * for the given name, then return null or raise UnknownNameException
 * base on check flag.
 * @param {string} name
 * @param {boolean} checked
 * @param {function} callback
 * @return {HOp}
 */
HServer.prototype.op = function(name, checked, callback) {
  var self = this;
  // lazily build lookup map
  if (typeof(self.opsByName) === 'undefined' || self.opsByName === null) {
    var map = {};
    self.ops(function(err, ops) {
      if (err) callback(err);
      else {
        for (var i = 0; i < ops.length; ++i) {
          var op = ops[i];
          if (typeof(map[op.name()]) !== 'undefined' && map[op.name()] !== null)
            console.log("WARN: duplicate HOp name: " + op.name());
          map[op.name()] = op;
        }
        self.opsByName = map;
        _op(self, name, checked, callback);
      }
    });
  } else {
    _op(self, name, checked, callback);
  }
};
function _op(self, name, checked, callback) {
  // lookup
  var op = self.opsByName[name];
  if (typeof(op) !== 'undefined' && op !== null)
    callback(null, op);
  else if (checked)
    callback(new Error("Unknown Name: " + name));
  else
    callback();
}

//////////////////////////////////////////////////////////////////////////
// About
//////////////////////////////////////////////////////////////////////////

/**
 * Get the about metadata which should contain following tags:
 * @param {function} callback
 * @return {HDict}
 */
HServer.prototype.about = function(callback) {
  var self = this;
  self.onAbout(function(err, dict) {
    if (err) callback(err);
    else
      callback(null, new HDictBuilder()
          .add(dict)
          .add("haystackVersion", "2.0")
          .add("serverTime", HDateTime.now())
          .add("serverBootTime", self.bootTime)
          .add("tz", HTimeZone.DEFAULT.name)
          .toDict());
  });
};

/**
 * Implementation hook for "about" method.
 * Should return these tags:
 *   - serverName: Str
 *   - productName: Str
 *   - productVersion: Str
 *   - productUri: Uri
 *   - moduleName: Str
 *   - moduleVersion: Str
 *   - moduleUri: Uri
 * @abstract
 * @param {function} callback
 * @return {HDict}
 */
HServer.prototype.onAbout = function(callback) {
  callback(new Error('must be implemented by subclass!'));
};

//////////////////////////////////////////////////////////////////////////
// Reads
//////////////////////////////////////////////////////////////////////////

/**
 * Default implementation routes to onReadById
 * @param {HRef[]} ids
 * @param {function} callback
 * @return {HGrid}
 */
HServer.prototype.onReadByIds = function(ids, callback) {
  _readById(this, [], ids, callback);
};
function _readById(self, recs, ids, callback) {
  if (recs.length>=ids.length) {
    callback(null, HGridBuilder.dictsToGrid(recs));
  } else {
    self.onReadById(ids[recs.length], function(err, rec) {
      recs[recs.length] = rec;
      _readById(self, recs, ids, callback);
    })
  }
}

/**
 * Default implementation scans all records using "iterator"
 * @param {string} filter
 * @param {int} limit
 * @param {function} callback
 * @return HGrid
 */
HServer.prototype.onReadAll = function(filter, limit, callback) {
  var self = this;
  self.iterator(function(err, it) {
    if (err) {
      callback(err);
    } else {
        if (!it.hasNext()) {
          callback(null, HGrid.EMPTY);
        } else {
          _iterate(self, it, limit, HFilter.make(filter), [], function(err, acc) {
            if (err)
              callback(HGridBuilder.errToGrid(err));
            else
              callback(null, HGridBuilder.dictsToGrid(acc));
          })
        }
    }
  });
};
function _iterate(self, it, limit, f, acc, callback) {
  var rec = it.next();
  f.include(rec, self.filterPather(), function(inc) {
    try {
      if (inc)
        acc[acc.length] = rec;

      if (acc.length < limit && it.hasNext()) {
        setImmediate(function() {
          _iterate(self, it, limit, f, acc, callback);
        });
      } else {
        callback(null, acc);
      }
    } catch (err) {
      callback(err);
    }
  });
}
HServer.prototype.filterPather = function() {
  var self = this;
  return {
    find: function(id, callback) {
      self.readById(HRef.make(id), callback);
    }
  };
};

/**
 * Implementation hook to iterate every entity record in
 * the database as a HDict.
 * @abstract
 * @param {function} callback
 * @return {Iterator}
 */
HServer.prototype.iterator = function(callback) {
  callback(new Error('must be implemented by subclass!'));
};

//////////////////////////////////////////////////////////////////////////
// Navigation
//////////////////////////////////////////////////////////////////////////

/**
 * Return navigation children for given navId.
 * @param {string} navId
 * @param {function} callback
 * @return {HGrid}
 */
HServer.prototype.nav = function(navId, callback) {
  this.onNav(navId, callback);
};

/**
 * Return navigation tree children for given navId.
 * The grid must define the "navId" column.
 * @abstract
 * @param {string} navId
 * @param {function} callback
 * @return HGrid
 */
HServer.prototype.onNav = function(navId, callback) {
  callback(new Error('must be implemented by subclass!'));
};

/**
 * Read a record from the database using a navigation path.
 * If not found then return null or raise UnknownRecException
 * base on checked flag.
 * @param {HUri} uri
 * @param {boolean} checked
 * @param {function} callback
 * @return HDict
 */
HServer.prototype.navReadByUri = function(uri, checked, callback) {
  this.onNavReadByUri(uri, function(err, rec) {
    if (err) callback(err);
    else if (typeof(rec) !== 'undefined' && rec !== null) callback(null, rec);
    else if (checked) callback( new Error("Unknown Rec: " + uri.toString()));
  });
};

/**
 * Implementation hook for navReadByUri.  Return null if not
 * found.  Do NOT raise any exceptions.
 * @param {HUri} uri
 * @param {function} callback
 * @return {HDict}
 */
HServer.prototype.onNavReadByUri = function(uri, callback) {
  callback(new Error('must be implemented by subclass!'));
};

/**
 * Create a new watch with an empty subscriber list.  The dis
 * string is a debug string to keep track of who created the watch.
 * The lease is the requested lease time or null if not specified.
 * @param {string} dis
 * @param {HNum} lease
 * @return HWatch
 */
HServer.prototype.watchOpen = function(dis, lease) {
  var _dis = dis.trim();
  if (_dis.length === 0) throw new Error("dis is empty");
  return this.onWatchOpen(_dis, lease);
};

/**
 * List the open watches.
 * @return {HWatch[]}
 */
HServer.prototype.watches = function() {
  return this.onWatches();
};

/**
 * Lookup a watch by its unique identifier.  If not found then
 * raise UnknownWatchErr or return null based on checked flag.
 * @param {string} id
 * @param {boolean} checked
 * @return HWatch
 */
HServer.prototype.watch = function(id, checked) {
  var w = this.onWatch(id);
  if (typeof(w) !== 'undefined' && w !== null) return w;
  if (checked) throw new Error("Unknown Watch: " + id);
  return null;
};

/**
 * Implementation hook for watchOpen.
 * If the client requested a specific lease time it is provided, otherwise
 * it is null if a default should be used.  The actual lease time in
 * effect should be reflected via HWatch.lease.
 * @abstract
 * @param {string} dis
 * @param {HNum} lease
 * @return {HWatch}
 */
HServer.prototype.onWatchOpen = function(dis, lease) {
  throw new Error('must be implemented by subclass!');
};

/**
 * Implementation hook for watches.
 * @abstract
 * @return {HWatch[]}
 */
HServer.prototype.onWatches = function() {
  throw new Error('must be implemented by subclass!');
};

/**
 * Implementation hook for watch lookup, return null if not found.
 * @abstract
 * @param {string} id
 * @return {HWatch}
 */
HServer.prototype.onWatch = function(id) {
  throw new Error('must be implemented by subclass!');
};

//////////////////////////////////////////////////////////////////////////
// Point Writes
//////////////////////////////////////////////////////////////////////////

/**
 * Return priority array for writable point identified by id.
 * The grid contains 17 rows with following columns:
 *   - level: number from 1 - 17 (17 is default)
 *   - levelDis: human description of level
 *   - val: current value at level or null
 *   - who: who last controlled the value at this level
 * @param {HRef} id
 * @param {function} callback
 * @return HGrid
 */
HServer.prototype.pointWriteArray = function(id, callback) {
  var self = this;
  // lookup entity
  self.readById(id, function(err, rec) {
    if (err) callback(err);
    else {
      // check that entity has "writable" tag
      if (rec.missing("writable")) callback(new Error("Rec missing 'writable' tag: " + rec.dis()));
      else self.onPointWriteArray(rec, callback);
    }
  });
};

/**
 * Write to the given priority array level.
 * @param {HRef} id
 * @param {int} level
 * @oaram {HVal} val
 * @param {string} who
 * @param {HNum} dur
 * @param {HDict} opts
 * @param {function} callback
 */
HServer.prototype.pointWrite = function(id, level, val, who, dur, opts, callback) {
  var self = this;
  // argument checks
  if (level < 1 || level > 17) callback(new Error("Invalid level 1-17: " + level));
  else if (typeof(who) === 'undefined' || who === null) callback(new Error("who is null"));
  else {
    // lookup entity
    self.readById(id, function(err, rec) {
      if (err) callback(err);
      else {
        // check that entity has "writable" tag
        if (rec.missing("writable")) callback(new Error("Rec missing 'writable' tag: " + rec.dis()));
        else self.onPointWrite(rec, level, val, who, dur, opts, callback);
      }
    });
  }
};

/**
 * Implementation hook for pointWriteArray
 * @param {HDict} rec
 * @param {function} callback
 * @return {HGrid}
 */
HServer.prototype.onPointWriteArray = function(rec, callback) {
  callback(new Error('must be implemented by subclass!'));
};

/**
 * Write to the given priority array level.
 * @abstract
 * @param {HRef} id
 * @param {int} level
 * @oaram {HVal} val
 * @param {string} who
 * @param {HNum} dur
 * @param {HDict} opts
 * @param {function} callback
 */
HServer.prototype.onPointWrite = function(id, level, val, who, dur, opts, callback) {
  callback(new Error('must be implemented by subclass!'));
};

//////////////////////////////////////////////////////////////////////////
// History
//////////////////////////////////////////////////////////////////////////

/**
 * Read history time-series data for given record and time range. The
 * items returned are exclusive of start time and inclusive of end time.
 * Raise exception if id does not map to a record with the required tags
 * "his" or "tz".  The range may be either a String or a HDateTimeRange.
 * If HTimeDateRange is passed then must match the timezone configured on
 * the history record.  Otherwise if a String is passed, it is resolved
 * relative to the history record's timezone.
 * @param {HRef} id
 * @param {object} range
 * @param {function} callback
 * @return HGrid
 */
HServer.prototype.hisRead = function(id, range, callback) {
  // lookup entity
  var self = this;
  self.readById(id, function(err, rec) {
    if (err) callback(err)
    else {
      // check that entity has "his" tag
      if (rec.missing("his")) callback(new Error("Rec missing 'his' tag: " + rec.dis()));
      else {
        // lookup "tz" on entity
        var tz = null;
        if (rec.has("tz")) tz = HTimeZone.make(rec.getStr("tz"), false);
        if (tz === null) callback(new Error("Rec missing or invalid 'tz' tag: " + rec.dis()));
        else {
          // check or parse date range
          var r = null;
          if (range instanceof HDateTimeRange) {
            r = range;
          } else {
            try {
              r = HDateTimeRange.make(range.toString(), tz);
            } catch (e) {
              callback(new Error("Invalid date time range: " + range));
              return;
            }
          }

          // checking
          if (!r.start.tz.equals(tz)) callback(new Error("range.tz != rec: " + r.start.tz + " != " + tz));
          else {
            // route to subclass
            self.onHisRead(rec, r, function(err, items) {
              if (err) callback(err)
              else {
                // check items
                if (items.length > 0) {
                  if (r.start.millis() >= items[0].ts.millis()) {
                    callback(new Error("start range not met"));
                    return;
                  }
                  if (r.end.millis() < items[items.length - 1].ts.millis()) {
                    callback(new Error("end range not met"));
                    return;
                  }
                }

                // build and return result grid
                var meta = new HDictBuilder()
                    .add("id", id)
                    .add("hisStart", r.start)
                    .add("hisEnd", r.end)
                    .toDict();
                callback(null, HGridBuilder.hisItemsToGrid(meta, items));
              }
            });
          }
        }
      }
    }
  });
};

/**
 * Implementation hook for hisRead.  The items must be exclusive
 * of start and inclusive of end time.
 * @abstract
 * @param {HDict} rec
 * @param {HDateTimeRange} range
 * @param {function} callback
 * @return {HHisItem[]}
 */
HServer.prototype.onHisRead = function(rec, range, callback) {
  callback(new Error('must be implemented by subclass!'));
};

/**
 * Write a set of history time-series data to the given point record.
 * The record must already be defined and must be properly tagged as
 * a historized point.  The timestamp timezone must exactly match the
 * point's configured "tz" tag.  If duplicate or out-of-order items are
 * inserted then they must be gracefully merged.
 * @param {HRef} id
 * @param {HHisItem[]}
 * @param {function} callback
 */
HServer.prototype.hisWrite = function(id, items, callback) {
  // lookup entity
  var self = this;
  self.readById(id, function(err, rec) {
    if (err) callback(err);
    else {
      // check that entity has "his" tag
      if (rec.missing("his")) callback(new Error("Entity missing 'his' tag: " + rec.dis()));
      else {
        // lookup "tz" on entity
        var tz = null;
        if (rec.has("tz")) tz = HTimeZone.make(rec.getStr("tz"), false);
        if (typeof(tz) === 'undefined' || tz === null) callback(new Error("Rec missing or invalid 'tz' tag: " + rec.dis()));
        else {
          // check tz of items
          if (items.length === 0) return;
          for (var i = 0; i < items.length; ++i) {
            if (!items[i].ts.tz.equals(tz)) {
              callback(new Error("item.tz != rec.tz: " + items[i].ts.tz + " != " + tz));
              return;
            }
          }

          // route to subclass
          self.onHisWrite(rec, items, callback);
        }
      }
    }
  });
};

/**
 * Implementation hook for onHisWrite.
 * @abstract
 * @param {HDict} rec
 * @param {HHisItem[]} items
 * @param {function} callback
 * @return {HHisItem[]}
 */
HServer.prototype.onHisRead = function(rec, items, callback) {
  callback(new Error('must be implemented by subclass!'));
};

//////////////////////////////////////////////////////////////////////////
// Actions
//////////////////////////////////////////////////////////////////////////

/**
 * Invoke an action identified by id and action.
 * @param {HRef} id
 * @param {string} action
 * @param {HDict} args
 * @param {function} callback
 * @return {HGrid}
 */
HServer.prototype.invokeAction = function(id, action, args, callback) {
  // lookup entity
  var self = this;
  self.readById(id, function(err, rec) {
    if (err) callback(err)
    // route to subclass
    else self.onInvokeAction(rec, action, args, callback);
  });
};

/**
 * Implementation hook for invokeAction
 * @abstract
 * @param {HDict} rec
 * @param {string} action
 * @param {HDict} args
 * @param {function} callback
 * @return {HGrid}
 */
HServer.prototype.onHisRead = function(rec, items, callback) {
  callback(new Error('must be implemented by subclass!'));
};
