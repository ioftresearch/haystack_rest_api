//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

/**
 * HDict is an immutable map of name/HVal pairs.  Use HDictBuilder
 * to construct a HDict instance.
 * @see {@link http://project-haystack.org/doc/TagModel#tags|Project Haystack}
 *
 * @constructor
 */
function HDict() { }
module.exports = HDict;

var HMarker = require('./HMarker'),
  HBool = require('./HBool'),
  HNum = require('./HNum'),
  HRef = require('./HRef'),
  HStr = require('./HStr'),
  HVal = require('./HVal');

/**
 * Return if size is zero
 * @return {boolean}
 */
HDict.prototype.isEmpty = function () {
  return this.size() === 0;
};

/**
 * Return if the given tag is present
 * @param {string} name
 * @return {boolean}
 */
HDict.prototype.has = function (name) {
  var t = this.get(name, false);
  return typeof (t) !== 'undefined' && t !== null;
};

/**
 * Return if the given tag is not present
 * @param {string} name
 * @return {boolean}
 */
HDict.prototype.missing = function (name) {
  var t = this.get(name, false);
  return typeof (t) === 'undefined' || t === null;
};

/**
 * Get the "id" tag as HRef.
 * @return {HRef}
 */
HDict.prototype.id = function () {
  return this.getRef("id");
};

/**
 * Get display string for this entity:
 *   - dis tag
 *   - id tag
 * @return {string}
 */
HDict.prototype.dis = function () {
  var v = this.get("dis", false);
  if (v instanceof HStr) return v.val;

  v = this.get("id", false);
  if (typeof (v) !== 'undefined' && v !== null) return v.dis();

  return "????";
};

/**
 * Return number of tag name/value pairs
 * @abstract
 * @return {int}
 */
HDict.prototype.size = function () {
  throw new Error('must be implemented by subclass!');
};
/**
 * Get a tag by name.  If not found and checked if false then return null, otherwise throw Error
 * @abstract
 * @param {string} name
 * @param {boolean} checked
 * @return {HVa}
 */
HDict.prototype.get = function (name, checked) {
  throw new Error('must be implemented by subclass!');
};
/**
 * Create Map.Entry iteratator to walk each name/tag pair
 * @abstract
 * @return {Iterator}
 */
HDict.prototype.iterator = function () {
  throw new Error('must be implemented by subclass!');
};

//////////////////////////////////////////////////////////////////////////
// Get Conveniences
//////////////////////////////////////////////////////////////////////////

/**
 * Get tag as HBool or raise Error.
 * @param {string} name
 * @return {HBool}
 */
HDict.prototype.getBool = function (name) {
  var v = this.get(name);
  if (!(v instanceof HBool)) throw Error("ClassCastExcetion: " + name);
  return v.val;
};

/**
 * Get tag as HStr or raise Error.
 * @param {string} name
 * @return {HStr}
 */
HDict.prototype.getStr = function (name) {
  var v = this.get(name);
  if (!(v instanceof HStr)) throw Error("ClassCastExcetion: " + name);
  return v.val;
};

/**
 * Get tag as HRef or raise Error.
 * @param {string} name
 * @return {HRef}
 */
HDict.prototype.getRef = function (name) {
  var v = this.get(name);
  if (!(v instanceof HRef)) throw Error("ClassCastExcetion: " + name);
  return v;
};

/**
 * Get tag as HNum or raise Error.
 * @param {string} name
 * @return {int}
 */
HDict.prototype.getInt = function (name) {
  var v = this.get(name);
  if (!(v instanceof HNum)) throw Error("ClassCastExcetion: " + name);
  return v.val;
};

/**
 * Get tag as HNum or raise Error.
 * @param {string} name
 * @return {float}
 */
HDict.prototype.getDouble = function (name) {
  var v = this.get(name);
  if (!(v instanceof HNum)) throw Error("ClassCastExcetion: " + name);
  return v.val;
};

//////////////////////////////////////////////////////////////////////////
// Identity
//////////////////////////////////////////////////////////////////////////

/**
 * String format is always "toZinc"
 * @return {string}
 */
HDict.prototype.toString = function () {
  return this.toZinc();
};

/**
 * Equality is tags
 * @param {HDict} that
 * @return {boolean}
 */
HDict.prototype.equals = function (that) {
  if (!(that instanceof HDict)) return false;
  if (this.size() !== that.size()) return false;

  for (var it = this.iterator(); it.hasNext();) {
    var entry = it.next();
    var name = entry.getKey();
    var val = entry.getValue();
    var tval = that.get(name, false);
    var neq;
    try {
      neq = !val.equals(tval);
    } catch (err) {
      neq = (val !== tval);
    }

    if (neq) return false;
  }
  return true;
};

//////////////////////////////////////////////////////////////////////////
// Encoding
//////////////////////////////////////////////////////////////////////////

function cc(c) {
  return HVal.cc(c);
}

var tagChars = [];
for (var i = cc("a"); i <= cc("z"); ++i) tagChars[i] = true;
for (var i = cc("A"); i <= cc("Z"); ++i) tagChars[i] = true;
for (var i = cc("0"); i <= cc("9"); ++i) tagChars[i] = true;
tagChars[cc("_")] = true;
tagChars[cc("-")] = true;

/**
 * Return if the given string is a legal tag name.  The
 * first char must be ASCII lower case letter.  Rest of
 * chars must be ASCII letter, digit, or underbar.
 * @param {string} n
 * @return {boolean}
 */
HDict.isTagName = function (n) {
  if (n.length === 0) return false;
  var first = n.charCodeAt(0);
  if (first < cc("a") || first > cc("z")) return false;
  for (var i = 0; i < n.length; ++i) {
    var c = n.charCodeAt(i);
    if (c >= 128 || !tagChars[c]) return false;
  }

  return true;
};

/**
 * Encode value to zinc format
 * @return {string}
 */
HDict.prototype.toZinc = function () {
  var s = "";
  var first = true;
  for (var it = this.iterator(); it.hasNext();) {
    var entry = it.next();
    var name = entry.getKey();
    var val = entry.getValue();
    if (first) first = false;
    else s += " ";
    s += name;
    if (val !== HMarker.VAL)
      s += ":" + val.toZinc();
  }

  return s;
};

//////////////////////////////////////////////////////////////////////////
// MapImpl
//////////////////////////////////////////////////////////////////////////

HDict.MapImpl = function (map) {
  this.map = map;
  this.size = function () {
    return Object.keys(this.map).length;
  };
  this.get = function (name, checked) {
    var val = this.map[name];
    if (typeof (val) !== 'undefined' && val !== null) return val;
    if (!checked) return null;
    throw new Error("Unknown name: " + name);
  };
  this.iterator = function () {
    var index = 0;
    var map = this.map;
    var keys = Object.keys(map);
    keys.sort();
    var length = keys.length;

    return {
      next: function () {
        var elem;
        if (!this.hasNext()) return null;
        elem = keys[index];
        index++;
        return new HDict.MapEntry(elem, map[elem]);
      },
      hasNext: function () {
        return index < length;
      }
    };
  };
};
HDict.MapImpl.prototype = Object.create(HDict.prototype);

//////////////////////////////////////////////////////////////////////////
// MapEntry
//////////////////////////////////////////////////////////////////////////

/**
 * Create Map.Entry for given name/value tag pair
 * @param {string} key
 * @param {HVal} val
 * @return {HDict.MapEntry}
 */
HDict.prototype.toEntry = function (key, val) {
  return new HDict.MapEntry(key, val);
};
/**
 * @constructor
 * @param {string} key
 * @param {object} val
 */
HDict.MapEntry = function (key, val) {
  this.key = key;
  this.val = val;

  this.getKey = function () {
    return this.key;
  };
  this.getValue = function () {
    return this.val;
  };
  this.equals = function (that) {
    return (typeof (this.key) === 'undefined' || this.key === null ?
      typeof (that.key) === 'undefined' || this.key === null : this.key === that.key) &&
      (typeof (this.val) === 'undefined' || this.val === null ?
        typeof (that.val) === 'undefined' || that.val === null : this.val === that.val);
  };
};

HDict.EMPTY = new HDict.MapImpl({});