//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HGridWriter = require('./HGridWriter'),
    streams = require('memory-streams'),
    HBool = require('../HBool'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HStr = require('../HStr');

/**
 * HJsonWriter is used to write grids in JavaScript Object Notation.
 * It is a plain text format commonly used for serialization of data.
 * It is specified in RFC 4627.
 * @see {@link http://project-haystack.org/doc/Json|Project Haystack}
 *
 * @constructor
 * @extends {HGridWriter}
 * @param {Stream.Writable} o
 */
function HJsonWriter(o) {
  this.out = o;
}
HJsonWriter.prototype = Object.create(HGridWriter.prototype);
module.exports = HJsonWriter;

/**
 * @memberof HJsonWriter
 * @param {HJsonWriter} self (this)
 * @param {HVal} val
 */
function writeVal(self, val) {
  if (typeof(val) === 'undefined' || val === null) self.out.write("null");
  else if (val instanceof HMarker) self.out.write("\"\u2713\"");
  else if (val instanceof HBool) self.out.write("" + val);
  else if (val instanceof HNum) self.out.write("" + val.val);
  else if (val instanceof HRef) {
    var s = "@" + val.val;
    if (typeof(val.disaply) !== 'undefined' && val.display !== null)
      s += " " + val.display;
    self.out.write(HStr.toCode(s));
  }
  else self.out.write(HStr.toCode(val.toString()));
};
/**
 * @memberof HJsonWriter
 * @param {HJsonWriter} self (this)
 * @param {HDict} dict
 * @param {boolean} first
 */
function writeDictTags(self, dict, first) {
  for (var it = dict.iterator(); it.hasNext();) {
    if (first) first = false;
    else self.out.write(", ");
    var entry = it.next();
    var name = entry.getKey();
    var val = entry.getValue();
    self.out.write(HStr.toCode(name));
    self.out.write(":");
    writeVal(self, val);
  }
};
/**
 * @memberof HJsonWriter
 * @param {HJsonWriter} self (this)
 * @param {HDict} dict
 */
function writeDict(self, dict) {
  self.out.write("{");
  writeDictTags(self, dict, true);
  self.out.write("}");
};

/**
 * Write a grid
 *
 * @param {HGrid} grid
 */
HJsonWriter.prototype.writeGrid = function(grid, callback) {
  try {
    // grid begin
    this.out.write("{\n");

    // meta
    this.out.write("\"meta\": {\"ver\":\"2.0\"");
    writeDictTags(this, grid.meta(), false);
    this.out.write("},\n");

    var i;
    // columns
    this.out.write("\"cols\":[\n");
    for (i = 0; i < grid.numCols(); ++i) {
      if (i > 0) this.out.write(",\n");
      var col = grid.col(i);
      this.out.write("{\"name\":");
      this.out.write(HStr.toCode(col.name()));
      writeDictTags(this, col.meta(), false);
      this.out.write("}");
    }
    this.out.write("\n],\n");

    // rows
    this.out.write("\"rows\":[\n");
    for (i = 0; i < grid.numRows(); ++i) {
      if (i > 0) this.out.write(",\n");
      writeDict(this, grid.row(i));
    }
    this.out.write("\n]\n");

    // grid end
    this.out.write("}\n");
  } catch (err) {
    callback(err);
  }
};

/**
 * Write a grid to a string
 * @static
 * @param {HGrid} grid
 * @return {string}
 */
HJsonWriter.gridToString = function(grid, callback) {
  var out = new streams.WritableStream();
  new HJsonWriter(out).writeGrid(grid, function(err) {
    callback(err, out.toString());
  });
};
