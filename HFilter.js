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
 * HFilter models a parsed tag query string.
 * @see {@link http://project-haystack.org/doc/Filters|Project Haystack}
 *
 * @constructor
 */
function HFilter() {
  this.string = null;
}
module.exports = HFilter;

var HVal = require('./HVal'),
    HRef = require('./HRef'),
    HZincReader = require('./io/HZincReader');

/**
 * Return if given tags entity matches this query.
 * @abstract
 * @param {HDict} dict
 * @param {Pather} pather
 * @return {boolean}
 */
HFilter.prototype.include = function(dict, pather) {
  throw new Error('must be implemented by subclass!');
};
/**
 * Used to lazily build toString
 * @abstract
 * @return {string}
 */
HFilter.prototype.toStr = function(dict, pather) {
  throw new Error('must be implemented by subclass!');
};

/**
 * Decode a string into a HFilter; return null or throw
 * ParseException if not formatted correctly
 * @param {string} str
 * @param {boolean} checked
 * @return {HFilter}
 */
HFilter.make = function(str, checked) {
  if (typeof(checked) === 'undefined') checked = true;
  try {
    return new HZincReader(str).readFilter();
  } catch (err) {
    if (!checked) return null;
    throw err;
  }
};

/**
 * Match records which have the specified tag path defined.
 * @param {string} path
 * @return {HFilter}
 */
HFilter.has = function(path) {
  return new HFilter.Has(HFilter.Path.make(path));
};

/**
 * Match records which do not define the specified tag path.
 * @param {string} path
 * @return {HFilter}
 */
HFilter.missing = function(path) {
  return new HFilter.Missing(HFilter.Path.make(path));
};

/**
 * HFilter - Match records which have a tag are equal to the specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.eq = function(path, hval) {
  return new HFilter.Eq(HFilter.Path.make(path), hval);
};

/**
 * HFilter - Match records which have a tag not equal to the specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.ne = function(path, hval) {
  return new HFilter.Ne(HFilter.Path.make(path), hval);
};

/**
 * HFilter - Match records which have tags less than the specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.lt = function(path, hval) {
  return new HFilter.Lt(HFilter.Path.make(path), hval);
};

/**
 * HFilter - Match records which have tags less than or equals to specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.le = function(path, hval) {
  return new HFilter.Le(HFilter.Path.make(path), hval);
};

/**
 * HFilter - Match records which have tags greater than specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.gt = function(path, hval) {
  return new HFilter.Gt(HFilter.Path.make(path), hval);
};

/**
 * HFilter - Match records which have tags greater than or equal to specified value.
 * If the path is not defined then it is unmatched.
 * @param {string} path
 * @param {HVal} hval
 * @return {HFilter}
 */
HFilter.ge = function(path, hval) {
  return new HFilter.Ge(HFilter.Path.make(path), hval);
};

/**
 * Return a query which is the logical-and of this and that query.
 * @param {HFilter} that
 * @return {HFiter}
 */
HFilter.prototype.and = function(that) {
  return new HFilter.And(this, that);
};

/**
 * Return a query which is the logical-or of this and that query.
 * @param {HFilter} that
 * @return {HFiter}
 */
HFilter.prototype.or = function(that) {
  return new HFilter.Or(this, that);
};

/**
 * String encoding
 * @return {string}
 */
HFilter.prototype.toString = function() {
  if (typeof(this.string) === 'undefined' || this.string === null)
    this.string = this.toStr();

  return this.string;
};

/**
 * Equality is based on string encoding
 * @param {HFilter} that
 * @return {boolean}
 */
HFilter.prototype.equals = function(that) {
  if (!(that instanceof HFilter)) return false;

  return this.toString() === that.toString();
};

/** Pather is a callback interface used to resolve query paths.
 public interface Pather {
  // Given a HRef string identifier, resolve to an entity's
  // HDict respresentation or ref is not found return null.
  public HDict find(String ref);
} */

//////////////////////////////////////////////////////////////////////////
// HFilter.Path
//////////////////////////////////////////////////////////////////////////

/**
 * Path is a simple name or a complex path using the "->" separator
 */
HFilter.Path = function() {};

/**
 * Number of names in the path.
 * @return {int}
 */
HFilter.Path.prototype.size = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Get name at given index.
 * @param {int} i
 * @return {string}
 */
HFilter.Path.prototype.get = function(i) {
  throw new Error('must be implemented by subclass!');
};
/**
 * Get string encoding
 * @return {string}
 */
HFilter.Path.prototype.toString = function() {
  throw new Error('must be implemented by subclass!');
};

/** Construct a new Path from string or throw ParseException */
HFilter.Path.make = function(path) {
  try {
    // optimize for common single name case
    var dash = path.indexOf('-');
    if (dash < 0) return new HFilter.Path1(path);

    // parse
    var s = 0;
    var acc = [];
    while (true) {
      var n = path.substring(s, dash);
      if (n.length === 0) throw new Error();
      acc[acc.length] = n;
      if (HVal.cc(path.charAt(dash + 1)) !== HVal.cc('>')) throw new Error();
      s = dash + 2;
      dash = path.indexOf('-', s);
      if (dash < 0) {
        n = path.substring(s, path.length);
        if (n.length === 0) throw new Error();
        acc[acc.length] = n;
        break;
      }
    }
    return new HFilter.PathN(path, acc);
  }
  catch (e) {}

  throw new Error("Path: " + path);
};

/**
 * Equality is based on string.
 * @param {HFilter.Path} that
 * @return {boolean}
 */
HFilter.Path.prototype.equals = function(that) {
  return this.toString().equals(that.toString());
};
/**
 * @constructor
 * @extends {HFilter.Path}
 * @param {string} n
 */
HFilter.Path1 = function(n) {
  this.name = n;
};
HFilter.Path1.prototype = Object.create(HFilter.Path.prototype);
/**
 * @returns {int}
 */
HFilter.Path1.prototype.size = function() {
  return 1;
};
/**
 * @param {int} i
 * @returns {string}
 */
HFilter.Path1.prototype.get = function(i) {
  if (i === 0) return this.name;
  throw new Error("" + i);
};
/**
 * @returns {string}
 */
HFilter.Path1.prototype.toString = function() {
  return this.name;
};

/**
 * @constructor
 * @extends {HFilter.Path}
 * @param {string} str
 * @param {string[]} names
 */
HFilter.PathN = function(str, names) {
  this.string = str;
  this.names = names;
};
HFilter.PathN.prototype = Object.create(HFilter.Path.prototype);
/**
 * @returns {int}
 */
HFilter.PathN.prototype.size = function() {
  return this.names.length;
};
/**
 * @param {int} i
 * @returns {string}
 */
HFilter.PathN.prototype.get = function(i) {
  return this.names[i];
};
/**
 * @returns {string}
 */
HFilter.PathN.prototype.toString = function() {
  return this.string;
};

//////////////////////////////////////////////////////////////////////////
// PathFilter
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @abstract
 * @extends {HFilter}
 * @param {Path} path
 */
HFilter.PathFilter = function(path) {
  this.path = path;
};
HFilter.PathFilter.prototype = Object.create(HFilter.prototype);

/**
 * @param {HVal} val
 * @return {boolean}
 */
HFilter.PathFilter.prototype.doInclude = function(val) {
  throw new Error('must be implemented by subclass!');
};
/**
 * @param {HDict} dict
 * @param {Pather} pather
 * @returns {boolean}
 */
HFilter.PathFilter.prototype.include = function(dict, pather, callback) {
  var self = this;
  var val = dict.get(self.path.get(0), false);
  _include(val, self.path, dict, pather, 1, function(err, inc) {
    callback(self.doInclude(inc));
  });
};
function _include(val, path, nt, pather, count, callback) {
  if (count<path.size()) {
    if (!(val instanceof HRef)) {
      callback();
      return;
    }
    pather.find(val.val, function(err, nt) {
      if (typeof(nt) === 'undefined' || nt === null) {
        callback()
        return;
      }
      val = nt.get(path.get(count), false);
      _include(val, path, nt, pather, ++count, callback);
    });
  } else {
    callback(null, val);
  }
}

//////////////////////////////////////////////////////////////////////////
// Has
//////////////////////////////////////////////////////////////////////////
/**
 * @constructor
 * @extends {HFilter.PathFilter}
 * @param {Path} p
 */
HFilter.Has = function(p) {
  this.path = p;
};
HFilter.Has.prototype = Object.create(HFilter.PathFilter.prototype);
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Has.prototype.doInclude = function(hval) {
  return typeof(hval) !== 'undefined' && hval !== null;
};
/**
 * @returns {string}
 */
HFilter.Has.prototype.toStr = function() {
  return this.path.toString();
};

//////////////////////////////////////////////////////////////////////////
// Missing
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.PathFilter}
 * @param {Path} p
 */
HFilter.Missing = function(p) {
  this.path = p;
};
HFilter.Missing.prototype = Object.create(HFilter.PathFilter.prototype);
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Missing.prototype.doInclude = function(hval) {
  return typeof(hval) === 'undefined' || hval === null;
}; // boolean
/**
 * @returns {string}
 */
HFilter.Missing.prototype.toStr = function() {
  return "not " + this.path.toString();
};

//////////////////////////////////////////////////////////////////////////
// CmpFilter
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @abstract
 * @extends {HFilter.PathFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.CmpFilter = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.CmpFilter.prototype = Object.create(HFilter.PathFilter.prototype);

/**
 * @return {string}
 */
HFilter.CmpFilter.prototype.cmpStr = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * @returns {string}
 */
HFilter.CmpFilter.prototype.toStr = function() {
  return this.path.toString() + this.cmpStr() + this.val.toZinc();
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.CmpFilter.prototype.sameType = function(hval) {
  return typeof(hval) !== 'undefined' && hval !== null && hval.prototype === this.val.prototype;
};

//////////////////////////////////////////////////////////////////////////
// Eq
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Eq = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Eq.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Eq.prototype.cmpStr = function() {
  return "==";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Eq.prototype.doInclude = function(hval) {
  return typeof(hval) !== 'undefined' && hval !== null && hval.equals(this.val);
};

//////////////////////////////////////////////////////////////////////////
// Ne
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Ne = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Ne.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Ne.prototype.cmpStr = function() {
  return "!=";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Ne.prototype.doInclude = function(hval) {
  return typeof(hval) !== 'undefined' && hval !== null && !hval.equals(this.val);
};

//////////////////////////////////////////////////////////////////////////
// Lt
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Lt = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Lt.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Lt.prototype.cmpStr = function() {
  return "<";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Lt.prototype.doInclude = function(hval) {
  return this.sameType(hval) && hval.compareTo(this.val) < 0;
};

//////////////////////////////////////////////////////////////////////////
// Le
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Le = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Le.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Le.prototype.cmpStr = function() {
  return "<=";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Le.prototype.doInclude = function(hval) {
  return this.sameType(hval) && hval.compareTo(this.val) <= 0;
};

//////////////////////////////////////////////////////////////////////////
// Gt
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Gt = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Gt.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Gt.prototype.cmpStr = function() {
  return ">";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Gt.prototype.doInclude = function(hval) {
  return this.sameType(hval) && hval.compareTo(this.val) > 0;
};

//////////////////////////////////////////////////////////////////////////
// Ge
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CmpFilter}
 * @param {Path} p
 * @param {HVal} hval
 */
HFilter.Ge = function(p, hval) {
  this.path = p;
  this.val = hval;
};
HFilter.Ge.prototype = Object.create(HFilter.CmpFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Ge.prototype.cmpStr = function() {
  return ">=";
};
/**
 * @param {HVal} hval
 * @returns {boolean}
 */
HFilter.Ge.prototype.doInclude = function(hval) {
  return this.sameType(hval) && hval.compareTo(this.val) >= 0;
};

//////////////////////////////////////////////////////////////////////////
// Compound
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @abstract
 * @extends {HFilter}
 * @param {HFilter} a
 * @param {HFilter} b
 */
HFilter.CompoundFilter = function(a, b) {
  this.a = a;
  this.b = b;
};
HFilter.CompoundFilter.prototype = Object.create(HFilter.prototype);

/**
 * @return {string}
 */
HFilter.CompoundFilter.prototype.keyword = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * @returns {string}
 */
HFilter.CompoundFilter.prototype.toStr = function() {
  var deep = this.a instanceof HFilter.CompoundFilter || this.b instanceof HFilter.CompoundFilter;
  var s = "";
  if (this.a instanceof HFilter.CompoundFilter) s += '(' + this.a + ')';
  else s += this.a;

  s += ' ' + this.keyword() + ' ';

  if (this.b instanceof HFilter.CompoundFilter) s += '(' + this.b + ')';
  else s += this.b;

  return s;
};

//////////////////////////////////////////////////////////////////////////
// And
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CompoundFilter}
 * @param {HFilter} a
 * @param {HFilter} b
 */
HFilter.And = function(a, b) {
  this.a = a;
  this.b = b;
};
HFilter.And.prototype = Object.create(HFilter.CompoundFilter.prototype);
/**
 * @returns {string}
 */
HFilter.And.prototype.keyword = function() {
  return "and";
};
/**
 * @param {HDict} dict
 * @param {Pather} pather
 * @returns {boolean}
 */
HFilter.And.prototype.include = function(dict, pather, callback) {
  var self = this;
  self.a.include(dict, pather, function(inc) {
    if (inc) {
      self.b.include(dict, pather, function(inc) {
        callback(inc);
      })
    } else {
      callback(false);
    }
  })
};

//////////////////////////////////////////////////////////////////////////
// Or
//////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends {HFilter.CompoundFilter}
 * @param {HFilter} a
 * @param {HFilter} b
 */
HFilter.Or = function(a, b) {
  this.a = a;
  this.b = b;
};
HFilter.Or.prototype = Object.create(HFilter.CompoundFilter.prototype);
/**
 * @returns {string}
 */
HFilter.Or.prototype.keyword = function() {
  return "or";
};
/**
 * @param {HDict} dict
 * @param {Pather} pather
 * @returns {boolean}
 */
HFilter.Or.prototype.include = function(dict, pather, callback) {
  var self = this;
  self.a.include(dict, pather, function(inc) {
    if (!inc) {
      self.b.include(dict, pather, function(inc) {
        callback(inc);
      })
    } else {
      callback(true);
    }
  })
};
