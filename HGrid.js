//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HRow = require('./HRow');

/**
 * HGrid is an immutable two dimension data structure of cols and rows.
 * Use HGridBuilder to construct a HGrid instance.
 * @see {@link http://project-haystack.org/doc/Grids|Project Haystack}
 *
 * @constructor
 * @param {HDict} dict
 * @param {HCol[]} cols
 * @param {array} rowList
 */
function HGrid(dict, cols, rowList) {
  this.dict = dict;
  this.cols = cols;

  if (typeof (dict) === 'undefined' || dict === null) throw new Error("metadata cannot be null");

  var i;
  this.rows = [];
  for (i = 0; i < rowList.length; ++i) {
    var cells = rowList[i];
    if (cols.length !== cells.length) throw new Error("Row cells size != cols size");
    this.rows[i] = new HRow(this, cells);
  }

  this.colsByName = {};
  for (i = 0; i < cols.length; ++i) {
    var col = cols[i];
    var colName = col.name();
    var cn = this.colsByName[colName];
    if (typeof (cn) !== 'undefined' && cn !== null) throw new Error("Duplicate col name: " + colName);
    this.colsByName[colName] = col;
  }
}
module.exports = HGrid;

var HCol = require('./HCol'),
  HDict = require('./HDict'),
  HZincWriter = require('./io/HZincWriter');

/**
 * Empty grid with one column called "empty" and zero rows
 */
HGrid.EMPTY = new HGrid(HDict.EMPTY, [new HCol(0, "empty", HDict.EMPTY)], []);

//////////////////////////////////////////////////////////////////////////
// Access
//////////////////////////////////////////////////////////////////////////

/**
 * Return grid level meta
 * @return {HDict}
 */
HGrid.prototype.meta = function () {
  return this.dict;
};

/**
 * Error grid have the dict.err marker tag
 * @return {boolean}
 */
HGrid.prototype.isErr = function () {
  return this.dict.has("err");
};

/**
 * Return if number of rows is zero
 * @return {boolean}
 */
HGrid.prototype.isEmpty = function () {
  return this.numRows() === 0;
};

/**
 * Return number of rows
 * @return {int}
 */
HGrid.prototype.numRows = function () {
  return this.rows.length;
};

/**
 * Get a row by its zero based index
 * @return {HRow}
 */
HGrid.prototype.row = function (row) {
  return this.rows[row];
};

/**
 * Get number of columns
 * @return {int}
 */
HGrid.prototype.numCols = function () {
  return this.cols.length;
};

/**
 * Get a column by name.  If not found and checked if false then
 * return null, otherwise throw UnknownNameException
 * @return {HCol}
 */
HGrid.prototype.col = function (name, checked) {
  // Get a column by its index
  if (typeof (name) === 'number') return this.cols[name];
  var _checked = checked;
  if (typeof (_checked) === 'undefined') _checked = true;
  var col = this.colsByName[name];
  if (typeof (col) !== 'undefined' && col !== null) return col;
  if (_checked) throw new Error(name);
  return null;
};

/**
 * Create iteratator to walk each row
 * @return {iterator}
 */
HGrid.prototype.iterator = function () {
  console.log("ITERATOR IN HGRID")
  var pos = 0;
  var r = this.rows;
  return {
    next: function () {
      if (this.hasNext()) return r[pos++];
      throw new Error("No Such Element");
    },
    hasNext: function () {
      return pos < r.length;
    }
  };
};

//////////////////////////////////////////////////////////////////////////
// Debug
//////////////////////////////////////////////////////////////////////////

/** Debug dump - this is Zinc right now. */
HGrid.prototype.dump = function (out) {
  var _out = out;
  if (typeof (_out) === 'undefined') _out = console;
  HZincWriter.gridToString(this, function (err, str) {
    _out.log(str);
  });
};
