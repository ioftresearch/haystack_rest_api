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

//////////////////////////////////////////////////////////////////////////
//Fields
//////////////////////////////////////////////////////////////////////////

var out;

/**
 * HZincWriter is used to write grids in the Zinc format
 * @see {@link http://project-haystack.org/doc/Zinc|Project Haystack}
 *
 * @constructor
 * @extends {HGridWriter}
 * @param {Stream.Writable} o
 */
function HZincWriter(o) {
  out = o;
}
HZincWriter.prototype = Object.create(HGridWriter.prototype);
module.exports = HZincWriter;

/**
 * @memberof HZincWriter
 * @param {HDict} meta
 */
function writeMeta(meta) {
  if (meta.isEmpty()) return;
  for (var it = meta.iterator(); it.hasNext();) {
    var entry = it.next();
    var name = entry.getKey();
    var val = entry.getValue();
    out.write(' ');
    out.write(name);
    if (val !== HMarker.VAL) {
      out.write(':');
      out.write(val.toZinc());
    }
  }
}
/**
 * @memberof HZincWriter
 * @param {HCol} col
 */
function writeCol(col) {
  out.write(col.name());
  writeMeta(col.meta());
}
/**
 * @memberof HZincWriter
 * @param {HGrid} grid
 * @param {HRow} row
 */
function writeRow(grid, row) {
  for (var i = 0; i < grid.numCols(); ++i) {
    var val = row.get(grid.col(i), false);
    if (i > 0) out.write(',');
    if (typeof(val) === 'undefined' || val === null) {
      if (i === 0) out.write('N');
    }
    else {
      out.write(val.toZinc());
    }
  }
}

/**
 * Write a grid
 * @param {HGrid} grid
 */
HZincWriter.prototype.writeGrid = function(grid, callback) {
  var cb = true;
  try {
    // meta
    out.write("ver:\"2.0\"");
    writeMeta(grid.meta());
    out.write('\n');

    var i;
    // cols
    for (i = 0; i < grid.numCols(); ++i) {
      if (i > 0) out.write(',');
      writeCol(grid.col(i));
    }
    out.write('\n');

    // rows
    for (i = 0; i < grid.numRows(); ++i) {
      writeRow(grid, grid.row(i));
      out.write('\n');
    }

    cb = false;
    callback();
  } catch (err) {
    if (cb) callback(err);
  }
};

/**
 * Write a grid to a string
 * @static
 * @param {HGrid} grid
 * @return {string}
 */
HZincWriter.gridToString = function(grid, callback) {
  var out = new Writer();
  new HZincWriter(out).writeGrid(grid, function(err) {
    callback(err, out.toString());
  });
};
