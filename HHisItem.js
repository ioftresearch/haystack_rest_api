var HDict = require('./HDict');

/**
 * HHisItem is used to model a timestamp/value pair
 * @see {@link http://project-haystack.org/doc/Ops#hisRead|Project Haystack}
 *
 * @constructor
 * @extends {HDict}
 * @param {HDateTime} ts
 * @param {HVal} val
 */
function HHisItem(ts, val) {
  /** Timestamp of history sample */
  this.ts = ts;
  /** Value of history sample */
  this.val = val;
  this.size = 2;
}
HHisItem.prototype = Object.create(HDict.prototype);
module.exports = HHisItem;

/**
 * @param {string} name
 * @param {boolean} checked
 * @returns {HVal}
 */
HHisItem.prototype.get = function(name, checked) {
  if (name === "ts") return this.ts;
  if (name === "val") return this.val;

  if (!checked) return null;
  throw new Error("Unknown Name: " + name);
};

/**
 * @memerof HHisItem
 * returns {iterator}
 */
HHisItem.prototype.iterator = function() {
  function hasNext() {
    return cur < 1;
  }

  function next() {
    ++cur;
    if (cur === 0) return new HDict.MapEntry("ts", this.ts);
    if (cur === 1) return new HDict.MapEntry("val", this.val);
    throw new Error("No Such Element");
  }

  var cur = -1;
};

/**
 * Construct from timestamp, value
 * @static
 * @param {HDateTime} ts
 * @param {HVal} val
 * @return {HHisItem}
 */
HHisItem.make = function(ts, val) {
  if (ts === 'undefined' || ts === null || val === 'undefined' || val === null)
    throw new Error("ts or val is undefined");
  return new HHisItem(ts, val);
};

/**
 * Map HGrid to HHisItem[].  Grid must have ts and val columns.
 * @static
 * @param {HGrid} grid
 * @return {HHisItem[]}
 */
HHisItem.gridToItems = function(grid) {
  var ts = grid.col("ts");
  var val = grid.col("val");
  var items = [];
  for (var i = 0; i < grid.numRows(); i++) {
    var row = grid.row(i);
    items[i] = new HHisItem(row.get(ts, true), row.get(val, false));
  }
  return items;
};
