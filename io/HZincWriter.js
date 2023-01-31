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
  HMarker = require('../HMarker'),
  HGrid = require('../HGrid'),
  Writer = require('./Streams').Writer;

/**
 * HZincWriter is used to write grids in the Zinc format
 * @see {@link http://project-haystack.org/doc/Zinc|Project Haystack}
 *
 * @constructor
 * @extends {HGridWriter}
 * @param {Stream.Writable} o
 */
function HZincWriter(o) {
  this.out = o;
}
HZincWriter.prototype = Object.create(HGridWriter.prototype);
module.exports = HZincWriter;

/**
 * @memberof HZincWriter
 * @param {HDict} meta
 */
function writeMeta(self, meta) {
  if (meta.isEmpty()) return;
  for (var it = meta.iterator(); it.hasNext();) {
    var entry = it.next();
    var name = entry.getKey();
    var val = entry.getValue();
    self.out.write(' ');
    self.out.write(name);
    if (val !== HMarker.VAL) {
      self.out.write(':');
      self.out.write(val.toZinc());
    }
  }
}
/**
 * @memberof HZincWriter
 * @param {HCol} col
 */
function writeCol(self, col) {
  self.out.write(col.name());
  writeMeta(self, col.meta());
}
/**
 * @memberof HZincWriter
 * @param {HGrid} grid
 * @param {HRow} row
 */
function writeRow(self, grid, row) {
  for (var i = 0; i < grid.numCols(); ++i) {
    var val = row.get(grid.col(i), false);
    if (i > 0) self.out.write(',');
    if (typeof (val) === 'undefined' || val === null) {
      if (i === 0) self.out.write('N');
    }
    else {
      self.out.write(val.toZinc());
    }
  }
}

/**
 * Write a grid
 * @param {HGrid} grid
 */
HZincWriter.prototype.writeGrid = function (grid, callback) {
  var cb = true;
  try {
    // meta
    this.out.write("ver:\"2.0\"");
    writeMeta(this, grid.meta());
    this.out.write('\n');

    var i;
    // cols
    for (i = 0; i < grid.numCols(); ++i) {
      if (i > 0) this.out.write(',');
      writeCol(this, grid.col(i));
    }
    this.out.write('\n');

    // rows
    for (i = 0; i < grid.numRows(); ++i) {
      writeRow(this, grid, grid.row(i));
      this.out.write('\n');
    }

    cb = false;
    this.out.end();
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
HZincWriter.gridToString = function (grid, callback) {
  var out = new Writer();
  new HZincWriter(out).writeGrid(grid, function (err) {
    callback(err, out.toString());
  });
};
