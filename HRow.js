//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HDict = require('./HDict'),
    HCol = require('./HCol');

/**
 * HRow is a row in a HGrid.  It implements the HDict interface also.
 * @see <a href='http://project-haystack.org/doc/Grids'>Project Haystack</a>
 *
 * @constructor
 * @extends {HDict}
 * @param {HGrid} grid
 * @param {HVal[]} cells
 */
function HRow(grid, cells) {
  this.ugrid = grid;
  this.cells = cells;
}
HRow.prototype = Object.create(HDict.prototype);
module.exports = HRow;

/**
 * Get the grid associated with this row
 * @return {HGrid}
 */
HRow.prototype.grid = function() {
  return this.ugrid;
};

/**
 * Number of columns in grid (which may map to null cells)
 * @return {int}
 */
HRow.prototype.size = function() {
  return this.ugrid.cols.length;
};

/**
 * Get a cell by column.  If cell is null then raise
 * Error or return  null based on checked flag.
 * @param {string|HCol} col
 * @param {boolean} checked
 * @return {HVal}
 */
HRow.prototype.get = function(col, checked) {
  if (typeof(checked) === 'undefined') checked = true;
  if (col instanceof HCol) {
    var val = this.cells[col.index];
    if (typeof(val) !== 'undefined' && val !== null) return val;
    if (checked) throw new Error(col.name());
    return null;
  } else {
    // Get a cell by column name
    var name = col;
    var col = this.ugrid.col(name, false);
    if (col !== null) {
      var val = this.cells[col.index];
      if (typeof(val) !== 'undefined' && val !== null) return val;
    }
    if (checked) throw new Error(name);
    return null;
  }
};

/**
 * Return Map.Entry name/value iterator which only includes non-null cells
 * @return {iterator}
 */
HRow.prototype.iterator = function() {
  var col = 0;
  for (; col < this.ugrid.cols.length; ++col) {
    if (typeof(this.cells[col]) !== 'undefined' && this.cells[col] !== null)
      break;
  }

  var grid = this.ugrid;
  var cells = this.cells;
  return {
    next: function() {
      if (col >= grid.cols.length) throw new Error("No Such Element");
      var name = grid.col(col).name();
      var val = cells[col];
      for (col++; col < grid.cols.length; ++col) {
        if (typeof(cells[col]) !== 'undefined' && cells[col] !== null)
          break;
      }
      return new HDict.MapEntry(name, val);
    },
    hasNext: function() {
      return col < grid.cols.length;
    }
  };
};
