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
    HMarker = require('../HMarker'),
    HRef = require('../HRef');

//////////////////////////////////////////////////////////////////////////
//Fields
//////////////////////////////////////////////////////////////////////////

// Delimiter used to write each cell
var delimiter = ',';

/**
 * HCsvWriter is used to write grids in comma separated values
 * format as specified by RFC 4180.  Format details:
 * <ul>
 * <li>rows are delimited by a newline</li>
 * <li>cells are separated by configured delimiter char (default is comma)</li>
 * <li>cells containing the delimiter, '"' double quote, or
 *     newline are quoted; quotes are escaped as with two quotes</li>
 * </ul>
 * @see {@link http://project-haystack.org/doc/Csv|Project Haystack}
 *
 * @constructor
 * @extends {HGridWriter}
 * @param {Stream.Writable} o
 */
function HCsvWriter(o) {
  this.out = o;
}
HCsvWriter.prototype = Object.create(HGridWriter.prototype);
module.exports = HCsvWriter;

//////////////////////////////////////////////////////////////////////////
//CSV
//////////////////////////////////////////////////////////////////////////

/**
 * Write a cell
 * @param {string} cell
 */
HCsvWriter.prototype.writeCell = function(cell) {
  if (!this.isQuoteRequired(cell)) {
    this.out.write(cell);
  } else {
    this.out.write('"');
    for (var i = 0; i < cell.length; ++i) {
      var c = cell.charAt(i);
      if (c === '"') this.out.write('"');
      this.out.write(c);
    }
    this.out.write('"');
  }
};

/**
 * Return if the given cell string contains:
 * <ul>
 * <li>the configured delimiter</li>
 * <li>double quote '"' char</li>
 * <li>leading/trailing whitespace</li>
 * <li>newlines</li>
 * </ul>
 * @param {string} cell
 * @return {boolean}
 */
HCsvWriter.prototype.isQuoteRequired = function(cell) {
  if (cell.length === 0) return true;
  if (HCsvWriter.isWhiteSpace(cell.charAt(0))) return true;
  if (HCsvWriter.isWhiteSpace(cell.charAt(cell.length - 1))) return true;
  for (var i = 0; i < cell.length; ++i) {
    var c = cell.charAt(i);
    if (c === delimiter || c === '"' || c === '\n' || c === '\r') return true;
  }
  return false;
};
/**
 * @static
 * @param {string} c
 * @returns {boolean}
 */
HCsvWriter.isWhiteSpace = function(c) {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
};

//////////////////////////////////////////////////////////////////////////
//HGridWriter
//////////////////////////////////////////////////////////////////////////

/**
 * @private
 * @memberof HCsvWriter
 * @param {HVal} val
 * @return {string}
 */
function valToString(val) {
  if (typeof(val) === 'undefined' || val === null) return "";

  if (val === HMarker.VAL) return "\u2713";

  if (val instanceof HRef) {
    var s = "@" + val.val;
    if (typeof(val.disaply) !== 'undefined' && val.display !== null)
      s += " " + val.display;
    return s;
  }

  return val.toString();
}

/**
 * @private
 * @memberof HCsvWriter
 * @param {HCsvWriter} self (this)
 * @param {HGrid} grid
 * @param {HRow} row
 */
function writeRow(self, grid, row) {
  for (var i = 0; i < grid.numCols(); ++i) {
    var val = row.get(grid.col(i), false);
    if (i > 0) self.out.write(delimiter);
    self.writeCell(valToString(val));
  }
};

/**
 * Write a grid
 * @param {HGrid} grid
 */
HCsvWriter.prototype.writeGrid = function(grid, callback) {
  try {
    var i;
    // cols
    for (i = 0; i < grid.numCols(); ++i) {
      if (i > 0) this.out.write(delimiter);
      this.writeCell(grid.col(i).dis());
    }
    this.out.write('\n');

    // rows
    for (i = 0; i < grid.numRows(); ++i) {
      writeRow(this, grid, grid.row(i));
      this.out.write('\n');
    }

    callback();
  } catch(err) {
    callback(err);
  }
};

/**
 * Write a grid to a string
 * @static
 * @param {HGrid} grid
 * @return {string}
 */
HCsvWriter.gridToString = function(grid, callback) {
  var out = new Writer();
  new HCsvWriter(out).writeGrid(grid, function(err) {
    callback(err, out.toString());
  });
};
