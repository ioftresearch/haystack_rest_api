//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HDictBuilder = require('./HDictBuilder');

/**
 * HGridBuilder is used to construct an immutable HGrid instance.
 * @see {@link http://project-haystack.org/doc/Grids|Project Haystack}
 * @constructor
 */
function HGridBuilder() {
  this.dict = new HDictBuilder();
  this.cols = [];
  this.rows = [];

}
module.exports = HGridBuilder;

var HCol = require('./HCol'),
    HDict = require('./HDict'),
    HGrid = require('./HGrid');

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////
/**
 * @returns {HDictBuilder}
 */
HGridBuilder.prototype.meta = function() {
  return this.dict;
};

/**
 * Convenience to build one row grid from HDict.
 * @return {HGrid}
 */
HGridBuilder.dictToGrid = function(dict) {
  return HGridBuilder.dictsToGrid([dict]);
};

/**
 * Convenience to build grid from array of HDict.
 * Any null entry will be row of all null cells.
 * @return {HGrid}
 */
HGridBuilder.dictsToGrid = function(dicts, dict) {
  if (typeof(dict) === 'undefined') dict = HDict.EMPTY;

  if (dicts.length === 0) return new HGrid(dict, [new HCol(0, "empty", HDict.EMPTY)], []);

  var b = new HGridBuilder();
  b.dict.add(dict);

  // collect column names
  var colsByName = {};
  var hasId, hasMod;
  for (var i = 0; i < dicts.length; ++i) {
    dict = dicts[i];
    if (typeof(dict) === 'undefined' || dict === null) continue;
    var it = dict.iterator();
    while (it.hasNext()) {
      var entry = it.next();
      var name = entry.getKey();
      var cn = colsByName[name];
      if (typeof(cn) === 'undefined' || cn === null) {
        colsByName[name] = name;
        if (name==='id') hasId = true;
        else if (name==='mod') hasMod = true;
      }
    }
  }

  // sort column names
  var names = Object.keys(colsByName);
  names.sort();
  // move id and mod columns
  if (hasId || hasMod) {
    var movedId, movedMod;
    for (var i=0; i<names.length; i++) {
      if (names[i]==='id' && i>0) {
        // move id to the front
        for (var j=i; j>0; ) names[j] = names[--j];
        names[0] = 'id';
        if (!hasMod || (hasMod && movedMod)) break;
      } else if (names[i]==='mod' && i<(names.length-1)) {
        // move mod to the end
        for (var j=i; j<names.length; ) names[j] = names[++j];
        names[names.length-1] = 'mod';
        if (!hasId || (hasId && movedId)) break;
      }
    }
  }

  // add sorted columns to grid
  for (var i=0; i<names.length; i++)
    b.addCol(names[i]);

  // if all dicts were null, handle special case
  // by creating a dummy column
  if (Object.keys(colsByName).length === 0) {
    colsByName.empty = "empty";
    b.addCol("empty");
  }

  // now map rows
  var numCols = b.cols.length;
  for (var ri = 0; ri < dicts.length; ++ri) {
    dict = dicts[ri];
    var cells = [];
    for (var ci = 0; ci < numCols; ++ci) {
      if (typeof(dict) === 'undefined' || dict === null)
        cells[ci] = null;
      else {
        cells[ci] = dict.get(b.cols[ci].name, false);
      }
    }
    b.rows[b.rows.length] = cells;
  }

  return b.toGrid();
};

/**
 * Convenience to build an error grid from exception
 * @return {HGrid}
 */
HGridBuilder.errToGrid = function(e) {
  var trace = e.stack;
  var temp = "";
  for (var i = 0; i < trace.length; ++i) {
    var ch = trace.charAt(i);
    if (ch === '\t') temp += "  ";
    else if (ch !== '\r') temp += ch;
  }
  trace = temp;

  var b = new HGridBuilder();
  b.dict.add("err")
      .add("dis", e.toString())
      .add("errTrace", trace);
  b.addCol("empty");
  return b.toGrid();
};

/**
 * Convenience to build grid from array of HHisItem
 * @param {HDict} dict
 * @param {HHistItem[]} items
 * @return {HGrid}
 */
HGridBuilder.hisItemsToGrid = function(dict, items) {
  var b = new HGridBuilder();
  b.dict.add(dict);
  b.addCol("ts");
  b.addCol("val");
  for (var i = 0; i < items.length; ++i)
    b.rows[b.rows.length] = [items[i].ts, items[i].val];

  return b.toGrid();
};

//////////////////////////////////////////////////////////////////////////
// Building
//////////////////////////////////////////////////////////////////////////

/**
 * Add new column and return builder for column metadata.
 * Columns cannot be added after adding the first row.
 * @return {HDictBuilder}
 */
HGridBuilder.prototype.addCol = function(name) {
  if (this.rows.length > 0) throw new Error("Cannot add cols after rows have been added");
  if (!HDict.isTagName(name)) throw new Error("Invalid column name: " + name);
  var col = new HGridBuilder.BCol(name);
  this.cols[this.cols.length] = col;
  return col.meta;
};

/**
 * Add new row with array of cells which correspond to column
 * order.  Return this.
 * @return {HGridBuilder}
 */
HGridBuilder.prototype.addRow = function(cells) {
  if (this.cols.length !== cells.length) throw new Error("Row cells size != cols size");
  this.rows[this.rows.length] = cells.slice();
  return this;
};

/**
 * Convert current state to an immutable HGrid instance
 * @return {HGrid}
 */
HGridBuilder.prototype.toGrid = function() {
  // meta
  var dict = this.dict.toDict();
  // cols
  var hcols = [];
  for (var i = 0; i < this.cols.length; ++i) {
    var bc = this.cols[i];
    hcols[i] = new HCol(i, bc.name, bc.meta.toDict());
  }

  // let HGrid constructor do the rest...
  return new HGrid(dict, hcols, this.rows);
};

//////////////////////////////////////////////////////////////////////////
// BCol
//////////////////////////////////////////////////////////////////////////
/**
 * @constructor
 * @param {string} name
 */
HGridBuilder.BCol = function(name) {
  this.name = name;
  this.meta = new HDictBuilder();
};
