/**
 * HCol is a column in a HGrid.
 * @see {@link http://project-haystack.org/doc/Grids|Project Haystack}
 *
 * @constructor
 * @private
 * @param {int} index
 * @param {string} uname
 * @param {HDict} dict
 */
function HCol(index, uname, dict) {
  this.index = index;
  this.uname = uname;
  this.dict = dict;
}
module.exports = HCol;

var HStr = require('./HStr');

/**
 * Return programmatic name of column
 * @return {string}
 */
HCol.prototype.name = function() {
  return this.uname;
};

/**
 * Column meta-data tags
 * @return {HDict}
 */
HCol.prototype.meta = function() {
  return this.dict;
};

/**
 * Return display name of column which is dict.dis or uname
 * @return {string}
 */
HCol.prototype.dis = function() {
  var dis = this.dict.get("dis", false);
  if (dis instanceof HStr)
    return dis.val;

  return this.uname;
};

/**
 * Equality is name and meta
 * @param {HCol} that - object to be compared to
 * @return {boolean}
 */
HCol.prototype.equals = function(that) {
  return that instanceof HCol && this.uname === that.uname && this.dict.equals(that.dict);
};
