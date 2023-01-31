//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//


var os = require('os'),
  HBool = require('../HBool'),
  HDateTime = require('../HDateTime'),
  HDictBuilder = require('../HDictBuilder'),
  HGrid = require('../HGrid'),
  HHisItem = require('../HHisItem'),
  HMarker = require('../HMarker'),
  HNum = require('../HNum'),
  HRef = require('../HRef'),
  HStr = require('../HStr'),
  HUri = require('../HUri'),
  HGridBuilder = require('../HGridBuilder'),
  HServer = require('../server/HServer'),
  HStdOps = require('../server/HStdOps');
const HTimeZone = require('../HTimeZone');
const { Measurement, Site, Point } = require("../app/db/models");
const HDict = require('nodehaystack/HDict');


/**
 * TestDatabase provides a simple implementation of
 * HDatabase with some test entities.
 * @constructor
 */
function TestDatabase() {
  this.recs = {};
  /* this.addSite("A", "Richmond", "VA", 1000);
  this.addSite("B", "Richmond", "VA", 2000);
  this.addSite("C", "Washington", "DC", 3000);
  this.addSite("D", "Boston", "MA", 4000); */
}
TestDatabase.prototype = Object.create(HServer.prototype);

TestDatabase.prototype.addSite = function (dis, geoCity, geoState, area) {
  console.log("DIS", dis)
  /* var newSite = new HDictBuilder()
    .add("id", HRef.make(dis))
    .add("dis", dis)
    .add("site", HMarker.VAL)
    .add("geoCity", geoCity)
    .add("geoState", geoState)
    .add("his", HMarker.VAL)
    .add("kind", "Number")
    .add("geoAddr", "" + geoCity + "," + geoState)
    .add("tz", "New_York")
    .add("area", HNum.make(area, "ft\u00B2"))
    .toDict(); */
  console.log(HMarker.VAL)
  const m = new Site({
    id: HRef.make(dis),
    dis: dis,
    site: HMarker.VAL,
    geoCity: geoCity,
    geoState: geoState,
    geoAddr: "" + geoCity + "," + geoState,
    tz: "Testing",
    area: HNum.make(area, "ft\u00B2")
  })
  m.save((err, site) => {
    if (err) console.error(err);
    console.log(site.id + " saved to bookstore collection.");
  })
  /* this.recs[dis] = newSite; */

  /* this.addMeter(newSite, dis + "-Meter");
  this.addAhu(newSite, dis + "-AHU1");
  this.addAhu(newSite, dis + "-AHU2"); */
};


TestDatabase.prototype.addMeter = function (site, dis) {
  HServer.call(this);
  var equip = new HDictBuilder()
    .add("id", HRef.make(dis))
    .add("dis", dis)
    .add("equip", HMarker.VAL)
    .add("elecMeter", HMarker.VAL)
    .add("siteMeter", HMarker.VAL)
    .add("siteRef", site.get("id"))
    .toDict();
  this.recs[dis] = equip;
  this.addPoint(equip, dis + "-KW", "kW", "elecKw");
  this.addPoint(equip, dis + "-KWH", "kWh", "elecKwh");
};

TestDatabase.prototype.addAhu = function (site, dis) {
  var equip = new HDictBuilder()
    .add("id", HRef.make(dis))
    .add("dis", dis)
    .add("equip", HMarker.VAL)
    .add("ahu", HMarker.VAL)
    .add("siteRef", site.get("id"))
    .toDict();
  this.recs[dis] = equip;
  this.addPoint(equip, dis + "-Fan", null, "discharge air fan cmd");
  this.addPoint(equip, dis + "-Cool", null, "cool cmd");
  this.addPoint(equip, dis + "-Heat", null, "heat cmd");
  this.addPoint(equip, dis + "-DTemp", "\u00B0F", "discharge air temp sensor");
  this.addPoint(equip, dis + "-RTemp", "\u00B0F", "return air temp sensor");
  this.addPoint(equip, dis + "-ZoneSP", "\u00B0F", "zone air temp sp writable");
};

TestDatabase.prototype.addPoint = async function (equip, dis, unit, markers) {
  console.log("LLEGA")
  markers = markers.split(" ")

  var site = await Site.findOne({
    id: equip
  })
  console.log("site", site)
  if (!site) return new Error("NOT FOUND")

  var newPoint = new Point({
    id: HRef.make(dis),
    dis: dis,
    point: HMarker.VAL,
    his: HMarker.VAL,
    siteRef: equip,
    kind: "Number",
    tz: "Testing",
    tags: markers
  })

  newPoint.save((err, site) => {
    if (err) return new Error("Error Creando")
    console.log(site.id + " saved to bookstore collection.");
  })

  return true

  /* var b = new HDictBuilder()
    .add("id", HRef.make(dis))
    .add("dis", dis)
    .add("point", HMarker.VAL)
    .add("his", HMarker.VAL)
    //.add("siteRef", equip.get("siteRef"))
    .add("siteRef", equip.get("id"))
    .add("kind", typeof (unit) === 'undefined' || unit === null ? "Bool" : "Number")
    .add("tz", "New_York");
  if (typeof (unit) !== 'undefined' && unit !== null) {
    b.add("unit", unit);
    if (unit === 'kW') {
      b.add("power", HMarker.VAL);
      b.add("siteMeter", HMarker.VAL);
    }
  }
  var st = markers.split(" ");
  for (var i = 0; i < st.length; i++) {
    b.add(st[i]);
  }
  this.recs[dis] = b.toDict(); */
};


//////////////////////////////////////////////////////////////////////////
//Ops
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.ops = function (callback) {
  callback(null, [
    HStdOps.about,
    HStdOps.ops,
    HStdOps.formats,
    HStdOps.read,
    HStdOps.nav,
    HStdOps.pointWrite,
    HStdOps.hisWrite,
    HStdOps.hisRead,
    HStdOps.invokeAction,
    HStdOps.addsite,
    HStdOps.addPoint
  ]);
};

TestDatabase.hostName = function () {
  try {
    return os.hostname();
  }
  catch (e) {
    return "Unknown";
  }
};

TestDatabase.prototype.onAbout = function (callback) {
  callback(null, aboutdict);
};
var aboutdict = new HDictBuilder()
  .add("serverName", TestDatabase.hostName())
  .add("vendorName", "Lynxspring, Inc.")
  .add("vendorUri", HUri.make("http://www.lynxspring.com/"))
  .add("productName", "Node Haystack Toolkit")
  .add("productVersion", "2.0.0")
  .add("productUri", HUri.make("https://bitbucket.org/lynxspring/nodehaystack/"))
  .toDict();

//////////////////////////////////////////////////////////////////////////
//Reads
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.onReadById = async function (id, callback) {
  console.log("ID", id.val)
  var point = await Point.findOne({
    "id.val": id.val
  })
  console.log(point)
  point = new HDictBuilder()
    .add("id", HRef.make(point.id.val))
    .add("dis", HStr.make(point.dis))
    .add("point", HMarker.VAL)
    .add("his", HMarker.VAL)
    .add("kind", HStr.make(point.kind))
    .add("tz", point.tz)
    .add("tags", HStr.make(point.tags.join(" ")))
    .toDict()
  callback(null, point);
};

TestDatabase.prototype.iterator = function (callback) {
  callback(null, _iterator(this));
};
var _iterator = function (self) {
  var index = 0;
  var recs = self.recs;
  var keys = Object.keys(recs);
  var length = keys.length;
  return {
    next: function () {
      var elem;
      if (!this.hasNext()) {
        return null;
      }
      elem = recs[keys[index]];
      index++;
      return elem;
    },
    hasNext: function () {
      return index < length;
    }
  };
};

//////////////////////////////////////////////////////////////////////////
//Navigation
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.onNav = async function (navId, type, callback) {
  var self = this;
  var rows = []
  switch (type["val"] || "") {
    case "site":
      var data = await Site.find({})
      data.forEach((row) => {
        const dict = new HDictBuilder()
          .add("id", HRef.make(row.id.val))
          //.add("dis", HStr.male(row.dis))
          .add("geoCity", HStr.make(row.geoCity))
          .add("geoState", HStr.make(row.geoState))
          .add("geoAddr", HStr.make(row.geoAddr))
          .add("tz", HStr.make(row.tz))
          .add("area", HNum.make(row.area.val, row.area.unit))
          .toDict()
        rows.push(dict)
      })
      break
    case "point":
      var data = await Point.find({})
      data.forEach((row) => {
        const dict = new HDictBuilder()
          .add("id", HRef.make(row.id.val))
          //.add("dis", HStr.male(row.dis))
          .add("dis", HStr.make(row.dis))
          .add("point", HMarker.VAL)
          .add("his", HMarker.VAL)
          .add("kind", HStr.make(row.kind))
          .add("siteRef", HRef.make(row.siteRef.val))
          .add("tags", HStr.make(row.tags.join(" ")))
          .toDict()
        rows.push(dict)
      })
      break
  }
  callback(null, HGridBuilder.dictsToGrid(rows));
  // test database navId is record id
  /* if (typeof (navId) !== 'undefined' && navId !== null) {
    self.readById(HRef.make(navId), function (err, base) {
      console.log("CALLBACK ", base)
      if (err) callback(err)
      else _onNav(self, base, callback);
    });
  } else {
    _onNav(self, null, callback);
  } */
};
function _onNav(self, base, callback) {
  console.log("_ONNAV", base)
  // map base record to site, equip, or point
  var filter = "site";
  if (typeof (base) !== 'undefined' && base !== null) {
    if (base.has("site")) {
      filter = "equip and siteRef==" + base.id().toCode();
    }
    else if (base.has("equip")) {
      filter = "point and equipRef==" + base.id().toCode();
    }
    else {
      filter = "navNoChildren";
    }
  }
  console.log("FILTER", filter)
  // read children of base record
  self.readAll(filter, function (err, grid) {
    if (err) callback(err);
    else {
      // add navId column to results
      var i;
      var rows = [];
      var it = grid.iterator();
      for (i = 0; it.hasNext();) {
        rows[i++] = it.next();
      }
      for (i = 0; i < rows.length; ++i) {
        rows[i] = new HDictBuilder().add(rows[i]).add("navId", rows[i].id().val).toDict();
      }
      callback(null, HGridBuilder.dictsToGrid(rows));
    }
  });
}
TestDatabase.prototype.onNavReadByUri = function (uri, callback) {
  // return null;
};

//////////////////////////////////////////////////////////////////////////
//Watches
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.onWatchOpen = function (dis, lease, callback) {
  callback(new Error("Unsupported Operation"));
};

TestDatabase.prototype.onWatches = function (callback) {
  callback(new Error("Unsupported Operation"));
};

TestDatabase.prototype.onWatch = function (id, callback) {
  callback(new Error("Unsupported Operation"));
};

//////////////////////////////////////////////////////////////////////////
//Point Write
//////////////////////////////////////////////////////////////////////////

var writeArrays = {};
var WriteArray = function () {
  this.val = [];
  this.who = [];
};

TestDatabase.prototype.onPointWriteArray = function (rec, callback) {
  var array = writeArrays[rec.id()];
  if (typeof (array) === 'undefined' || array === null) {
    writeArrays[rec.id()] = array = new WriteArray();
  }

  var b = new HGridBuilder();
  b.addCol("level");
  b.addCol("levelDis");
  b.addCol("val");
  b.addCol("who");

  for (var i = 0; i < 17; ++i) {
    b.addRow([
      HNum.make(i + 1),
      HStr.make("" + (i + 1)),
      array.val[i],
      HStr.make(array.who[i]),
    ]);
  }

  callback(null, b.toGrid());
};

TestDatabase.prototype.onPointWrite = function (rec, level, val, who, dur, opts, callback) {
  console.log("onPointWrite: " + rec.dis() + "  " + val + " @ " + level + " [" + who + "]");
  var array = writeArrays[rec.id()];
  if (typeof (array) === 'undefined' || array === null) {
    writeArrays[rec.id()] = array = new WriteArray();
  }
  array.val[level - 1] = val;
  array.who[level - 1] = who;
  callback();
};

//////////////////////////////////////////////////////////////////////////
//History
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.onHisRead = async function (entity, range, callback) {
  var data = await Measurement.find({
    id: entity.map.id, "ts.date": {
      $gte: range.start.date,
      $lte: range.end.date

    }
  })
  var acc = [];
  //console.log("DATA", data)
  data.forEach((measurement) => {
    var value = measurement.val.val
    value = HNum.make(value, measurement.val.unit)
    var ts = measurement.ts
    var date = ts.date
    var time = ts.time
    var tz = ts.tz
    tz = new HTimeZone(tz.name, tz.js)
    //console.log("TZ", tz)
    ts = HDateTime.make(date.year, date.month, date.day, time.hour, time.min, time.sec, tz, ts.tzOffset)
    console.log("TS", ts)
    var item = HHisItem.make(ts, value)
    acc.push(item)
  })

  //console.log("ACC", acc)
  // generate dummy 15min data

  /* var ts = range.start;
  var unit = entity.get("unit");
  var isBool = entity.get("kind").val === "Bool";
  while (ts.compareTo(range.end) <= 0) {
    var val = isBool ?
      HBool.make(acc.length % 2 === 0) :
      HNum.make(acc.length, unit);
    var item = HHisItem.make(ts, val);
    if (ts !== range.start) {
      acc[acc.length] = item;
    }
    ts = HDateTime.make(ts.millis() + 15 * 60 * 1000, ts.tz);
  } */

  callback(null, acc);
};

TestDatabase.prototype.onHisWrite = function (rec, items, callback) {
  console.log(rec.map.id)
  console.log("Escritura")
  items.forEach(item => {
    const m = new Measurement({ id: rec.map.id, ts: item.ts, val: item.val })
    m.save((err, measurement) => {
      if (err) console.error(err);
      console.log(measurement.id + " saved to bookstore collection.");
      callback(null, measurement);
    })
  })
  //console.log(rec)
  //onsole.log(items[0].ts)
  //console.log(callback)

};

//////////////////////////////////////////////////////////////////////////
//Actions
//////////////////////////////////////////////////////////////////////////

TestDatabase.prototype.onInvokeAction = function (rec, action, args, callback) {
  console.log("-- invokeAction \"" + rec.dis() + "." + action + "\" " + args);
  callback(null, HGrid.EMPTY);
};
module.exports = TestDatabase;