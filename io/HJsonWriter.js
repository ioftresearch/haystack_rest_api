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
    Writer = require('./Streams').Writer,
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
  else if (val instanceof HBool) self.out.write("" + val.val);
  else self.out.write('"' + val.toJSON() + '"');
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
  var cb = true;
  try {
    // grid begin
    this.out.write("{");

    // meta
    this.out.write("\"meta\": {\"ver\":\"2.0\"");
    writeDictTags(this, grid.meta(), false);
    this.out.write("},\n");

    var i;
    // columns
    this.out.write("\"cols\":[");
    for (i = 0; i < grid.numCols(); ++i) {
      if (i > 0) this.out.write(", ");
      var col = grid.col(i);
      this.out.write("{\"name\":");
      this.out.write(HStr.toCode(col.name()));
      writeDictTags(this, col.meta(), false);
      this.out.write("}");
    }
    this.out.write("],\n");

    // rows
    this.out.write("\"rows\":[\n");
    for (i = 0; i < grid.numRows(); ++i) {
      if (i > 0) this.out.write(",\n");
      writeDict(this, grid.row(i));
    }
    this.out.write("\n]");

    // grid end
    this.out.write("}\n");
    this.out.end();
    cb = false;
    callback();
  } catch (err) {
    this.out.end();
    if (cb) callback(err);
  }
};

/**
 * Write a grid to a string
 * @static
 * @param {HGrid} grid
 * @return {string}
 */
HJsonWriter.gridToString = function(grid, callback) {
  var out = new Writer();
  new HJsonWriter(out).writeGrid(grid, function(err) {
    callback(err, out.toString());
  });
};
