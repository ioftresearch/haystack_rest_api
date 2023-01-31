//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//


var HGridReader = require('./HGridReader'),
  Stream = require('stream'),
  HVal = require('../HVal');

/**
 * @memberof HJsonReader
 * @return {Error}
 */
function err(msg, ex) {
  var _msg = msg;
  var _ex = ex;
  if (_msg instanceof Error) {
    _ex = _msg;
    _msg = _ex.message;
  } else if (typeof (_ex) === 'undefined' || _ex === null) {
    _ex = new Error(_msg);
  }

  _ex.message = _msg;
  return _ex;
}
function _json(obj) {
  return JSON.stringify(obj);
}

/**
 * HJsonReader is used to read grids in JSON format
 * @see {@link http://project-haystack.org/doc/Json|Project Haystack}
 *
 * @constructor
 * @extends {HGridReader}
 * @param {Stream.Readable} i - if anything other than a Readable is passed, it is converted
 */
function HJsonReader(i) {
  this.input = i;
}
HJsonReader.prototype = Object.create(HGridReader.prototype);
module.exports = HJsonReader;

var HBin = require('../HBin'),
  HBool = require('../HBool'),
  HCoord = require('../HCoord'),
  HDate = require('../HDate'),
  HDateTime = require('../HDateTime'),
  HDictBuilder = require('../HDictBuilder'),
  HFilter = require('../HFilter'),
  HGrid = require('../HGrid'),
  HGridBuilder = require('../HGridBuilder'),
  HMarker = require('../HMarker'),
  HNum = require('../HNum'),
  HRef = require('../HRef'),
  HRemove = require('../HRemove'),
  HStr = require('../HStr'),
  HTime = require('../HTime'),
  HTimeZone = require('../HTimeZone'),
  HUri = require('../HUri');

function parseVal(val) {
  if (val === null) return null;
  else if (val === true || val === false) return HBool.make(val);
  else {
    console.log(val)
    var type = val.substring(0, 2);
    var val = val.substring(2);
    if (type === 'b:') return HBin.make(val);
    else if (type === 'c:') { var v = val.split(','); return HCoord.make(parseFloat(v[0]), parseFloat(v[1])); }
    else if (type === 'd:') return HDate.make(val);
    else if (type === 't:') return HDateTime.make(val);
    else if (type === 'm:') return HMarker.VAL;
    else if (type === 'x:') return HRemove.VAL;
    else if (type === 's:') return HStr.make(val);
    else if (type === 'h:') return HTime.make(val);
    else if (type === 'u:') return HUri.make(val);
    else if (type === 'n:') {
      var v = val.split(' ');
      if (v[0] === 'INF') v[0] = Number.POSITIVE_INFINITY;
      else if (v[0] === '-INF') v[0] = Number.NEGATIVE_INFINITY;
      if (v[0] === 'NaN') v[0] = Number.NaN;
      return HNum.make(parseFloat(v[0]), v[1]);
    }
    else if (type === 'r:') {
      var v = val.split(' ');
      console.log("ID")
      console.log(v[1])
      for (var i = 2; i < v.length; i++) v[1] += ' ' + v[i];
      return HRef.make(v[0], v[1]);
    }
    else if (type === 'a:') {
      console.log("TAGS")
      console.log(val)
      return val.split(" ")
    }
    else {
      throw new Error("Invalid Type Reference: '" + type + val + "'");
    }
  }
}
function readDict(meta, dict) {
  var keys = Object.keys(meta);
  for (var i = 0; i < keys.length; i++)
    dict.add(keys[i], parseVal(meta[keys[i]]));
}

/**
 * Read grid from the stream.
 * @abstract
 * @return {HGrid}
 */
HJsonReader.prototype.readGrid = function (callback) {
  if (!(this.input instanceof Stream.Readable)) { // this.input is our entire string
    var json = (typeof (this.input) === 'string' || this.input instanceof String ? JSON.parse(this.input) : this.input);
    _readGrid(json, callback);
  } else {
    var data = "";

    this.input.on('data', function (d) {
      data += d.toString();
    });
    this.input.on('end', function () {
      _readGrid(JSON.parse(data), callback);
    });
  }
};

function _readGrid(json, callback) {
  var cb = true;
  try {
    var b = new HGridBuilder();
    // meta line
    var ver = json.meta.ver;
    if (typeof (ver) === 'undefined' || ver !== '2.0') throw err("Expecting JSON header { ver: '2.0' }, not '" + _json(json.meta) + "'");
    // remove ver so it is not parsed
    delete json.meta.ver;
    readDict(json.meta, b.meta());

    // read cols
    for (var i = 0; i < json.cols.length; i++) {
      var dict = b.addCol(json.cols[i].name);
      var keys = Object.keys(json.cols[i]);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k] === 'name') continue;
        dict.add(keys[k], parseVal(json.cols[i][keys[k]]));
      }
    }

    // rows
    for (var i = 0; i < json.rows.length; i++) {
      var cells = [];
      for (var c = 0; c < json.cols.length; c++) {
        var val = json.rows[i][json.cols[c].name];
        if (typeof (val) !== 'undefined' && val !== null) cells[c] = parseVal(val);
        else cells[c] = null;
      }

      b.addRow(cells);
    }

    cb = false;
    callback(null, b.toGrid());
  } catch (err) {
    if (cb) callback(err);
  }
}

/**
 * Read a scalar value.
 * @return {HVal}
 */
HJsonReader.prototype.readScalar = function () {
  return parseVal(this.input);
};
