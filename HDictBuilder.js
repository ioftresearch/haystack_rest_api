/**
 * HDictBuilder is used to construct an immutable HDict instance.
 * @see {@link http://project-haystack.org/doc/TagModel#tags|Project Haystack}
 *
 * @constructor
 */
function HDictBuilder() {
  this.map = {};
}
module.exports = HDictBuilder;

var HBool = require('./HBool'),
    HDict = require('./HDict'),
    HMarker = require('./HMarker'),
    HNum = require('./HNum'),
    HStr = require('./HStr'),
    util = require('util');

/**
 * Return if size is zero
 * @return {boolean}
 */
HDictBuilder.prototype.isEmpty = function() {
  return this.size() === 0;
};

/**
 * Return if the given tag is present
 * @param {string} name
 * @return {boolean}
 */
HDictBuilder.prototype.has = function(name) {
  var t = this.get(name, false);
  return typeof(t) !== 'undefined' && t !== null;
};

/**
 * Return if the given tag is not present
 * @param {string} name
 * @return {boolean}
 */
HDictBuilder.prototype.missing = function(name) {
  var t = this.get(name, false);
  return typeof(t) === 'undefined' || t === null;
};

/**
 * Return number of tag name/value pairs
 * @return {int}
 */
HDictBuilder.prototype.size = function() {
  return Object.keys(this.map).length;
};

/**
 * Get a tag by name.  If not found and checked is false then
 * return null, otherwise throw Error
 * @param {string} name
 * @param {boolean} checked
 * @return {HVal}
 */
HDictBuilder.prototype.get = function(name, checked) {
  if (typeof(checked) === 'undefined') checked = false;

  var val = this.map[name];
  if (typeof(val) !== 'undefined' && val !== null)
    return val;
  if (!checked) return null;
  throw new Error("Unknown Name: " + name);
};

/**
 * Convert current state to an immutable HDict instance
 * @return {HDict}
 */
HDictBuilder.prototype.toDict = function() {
  if (typeof(this.map) === 'undefined' || this.map === null || this.isEmpty())
    return HDict.EMPTY;
  var dict = new HDict.MapImpl(this.map);
  this.map = null;
  return dict;
};

/**
 * Add to this and return this
 * @param {HDict|string} name
 *   - HDict: Add all the name/value pairs in given HDict.
 *   - string: Add tag name and value
 * @param {boolean|number|string|HVal} val - not required for HDict and HMarkers
 * @param {string} unit - only used with numbers
 * @returns {HDictBuilder}
 */
HDictBuilder.prototype.add = function(name, val, unit) {
  if (typeof(val) === 'undefined' || val === null) {
    if (name instanceof HDict) {
      for (var it = name.iterator(); it.hasNext();) {
        var entry = it.next();
        this.add(entry.getKey(), entry.getValue());
      }
      return this;
    } else {
      return this.add(name, HMarker.VAL);
    }
  } else {
    if (!HDict.isTagName(name)) throw new Error("Invalid tag name: " + name);

    // handle primitives
    if (typeof(val) === 'number' || val instanceof Number)
      return this.add(name, HNum.make(val, unit));
    if (typeof(val) === 'string' || val instanceof String)
      return this.add(name, HStr.make(val));
    if (typeof(val) === 'boolean' || val instanceof Boolean)
      return this.add(name, HBool.make(val));

    if (typeof(this.map) === 'undefined' || this.map === null)
      this.map = {};

    this.map[name] = val;
    return this;
  }
};
