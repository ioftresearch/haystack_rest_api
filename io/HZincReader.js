//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HGridReader = require('./HGridReader'),
    Reader = require('./Streams').Reader,
    Stream = require('stream'),
    HVal = require('../HVal');

/**
 * @memberof HZincReader
 * @return {Error}
 */
function err(msg, ex) {
  if (msg instanceof Error) {
    ex = msg;
    msg = ex.message;
  } else if (typeof(ex) === 'undefined' || ex === null) {
    ex = new Error(msg);
  }

  ex.message = msg;
  return ex;
}

function consume(self) {
  try {
    self.cur = self.peek;
    self.peek = self.input.read(1);
    if (self.cur === '\n') self.lineNum++;
  } catch (e) {
    throw err(e);
  }
}

function init(self) {
  consume(self);
  consume(self);
}

function done(c) {
  if (c===null) return true;
  return (isNaN(HVal.cc(c)) || HVal.cc(c) < 0);
}
function notdone(c, eq) {
  if (c===null) return false;
  if (eq) return (!isNaN(HVal.cc(c)) && HVal.cc(c) >= 0);
  return (!isNaN(HVal.cc(c)) && HVal.cc(c) > 0);
}

/**
 * HZincReader reads grids using the Zinc format.
 * @see {@link http://project-haystack.org/doc/Zinc|Project Haystack}
 *
 * @constructor
 * @extends {HGridReader}
 * @param {Stream.Readable} i - if string is passed, it is converted to a {Reader}
 */
function HZincReader(i) {
  var inp = i;
  if (!(inp instanceof Stream.Readable)) {
    inp = new Reader(inp);
  }

  this.cur = null;
  this.peek = null;
  this.version = null;
  this.lineNum = 1;
  this.isFilter = false;
  this.input = inp;

  init(this);
}
HZincReader.prototype = Object.create(HGridReader.prototype);
module.exports = HZincReader;

var HBin = require('../HBin'),
    HBool = require('../HBool'),
    HCoord = require('../HCoord'),
    HDate = require('../HDate'),
    HDateTime = require('../HDateTime'),
    HDictBuilder = require('../HDictBuilder'),
    HFilter = require('../HFilter'),
    HGrid = require('../HGrid'),
    HGridBuilder = require('../HGridBuilder'),
    HMarker = require('../HMarker'),
    HNum = require('../HNum'),
    HRef = require('../HRef'),
    HRemove = require('../HRemove'),
    HStr = require('../HStr'),
    HTime = require('../HTime'),
    HTimeZone = require('../HTimeZone'),
    HUri = require('../HUri');

//////////////////////////////////////////////////////////////////////////
//Char Types
//////////////////////////////////////////////////////////////////////////

var charTypes = [];
var DIGIT = 0x01;
var ALPHA_LO = 0x02;
var ALPHA_UP = 0x04;
var ALPHA = ALPHA_UP | ALPHA_LO;
var UNIT = 0x08;
var TZ = 0x10;
var ID_START = 0x20;
var ID = 0x40;

for (var i = 0; i < 128; i++) charTypes[i] = undefined;
for (var i = HVal.cc('0'); i <= HVal.cc('9'); ++i) charTypes[i] = (DIGIT | TZ | ID);
for (var i = HVal.cc('a'); i <= HVal.cc('z'); ++i) charTypes[i] = (ALPHA_LO | UNIT | TZ | ID_START | ID);
for (var i = HVal.cc('A'); i <= HVal.cc('Z'); ++i) charTypes[i] = (ALPHA_UP | UNIT | TZ | ID);
charTypes[HVal.cc('%')] = UNIT;
charTypes[HVal.cc('_')] = UNIT | TZ | ID;
charTypes[HVal.cc('/')] = UNIT;
charTypes[HVal.cc('$')] = UNIT;
charTypes[HVal.cc('-')] = TZ;
charTypes[HVal.cc('+')] = TZ;

function isDigit(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && c < 128 && (charTypes[c] & DIGIT) !== 0;
}
function isAlpha(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && c < 128 && (charTypes[c] & ALPHA) !== 0;
}
function isUnit(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && (c >= 128 || (charTypes[c] & UNIT) !== 0);
}
function isTz(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && c < 128 && (charTypes[c] & TZ) !== 0;
}
function isIdStart(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && c < 128 && (charTypes[c] & ID_START) !== 0;
}
function isId(c) {
  if (c===null) return false;
  c = HVal.cc(c);
  return c > 0 && c < 128 && (charTypes[c] & ID) !== 0;
}

//////////////////////////////////////////////////////////////////////////
//Char Reads
//////////////////////////////////////////////////////////////////////////

function errChar(self, msg) { // String
  if (done(self.cur)) msg += " (end of stream)";
  else {
    msg += " (char=0x" + HVal.cc(self.cur).toString(16);
    if (self.cur >= ' ') msg += " '" + self.cur + "'";
    msg += ")";
  }
  return err(msg, null);
}

function skipSpace(self) {
  while (self.cur === ' ' || self.cur === '\t') consume(self);
}

function consumeNewline(self) {
  if (self.cur !== '\n') throw errChar(self, "Expecting newline");
  consume(self);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readBinVal(self) {
  if (done(self.cur)) throw err("Expected '(' after Bin");
  consume(self);
  var s = "";
  while (self.cur !== ')') {
    if (done(self.cur)) throw err("Unexpected end of bin literal");
    if (self.cur === '\n' || self.cur === '\r') throw err("Unexpected newline in bin literal");
    s += self.cur;
    consume(self);
  }
  consume(self);
  return HBin.make(s);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readCoordVal(self) {
  if (done(self.cur)) throw err("Expected '(' after Coord");
  consume(self);
  var s = "C(";
  while (self.cur !== ')') {
    if (done(self.cur)) throw err("Unexpected end of coord literal");
    if (self.cur === '\n' || self.cur === '\r') throw err("Unexpected newline in coord literal");
    s += self.cur;
    consume(self);
  }
  consume(self);
  s += ")";
  return HCoord.make(s);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readWordVal(self) {
  // read into string
  var s = "";
  do {
    s += self.cur;
    consume(self);
  } while (isAlpha(self.cur));

  // match identifier
  if (self.isFilter) {
    if (s === "true") return HBool.TRUE;
    if (s === "false") return HBool.FALSE;
  } else {
    if (s === "N") return null;
    if (s === "M") return HMarker.VAL;
    if (s === "R") return HRemove.VAL;
    if (s === "T") return HBool.TRUE;
    if (s === "F") return HBool.FALSE;
    if (s === "Bin") return readBinVal(self);
    if (s === "C") return readCoordVal(self);
  }
  if (s === "NaN") return HNum.NaN;
  if (s === "INF") return HNum.POS_INF;
  if (s === "-INF") return HNum.NEG_INF;
  throw err("Unknown value identifier: " + s);
}

/**
 * @memberof HZincReader
 * @return {int}
 */
function readTwoDigits(self, errMsg) { // String
  if (!isDigit(self.cur)) throw errChar(self, errMsg);
  var tens = (HVal.cc(self.cur) - HVal.cc('0')) * 10;
  consume(self);
  if (!isDigit(self.cur)) throw errChar(self, errMsg);
  var val = tens + (HVal.cc(self.cur) - HVal.cc('0'));
  consume(self);
  return val;
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readNumVal(self) {
  // parse numeric part
  var s = self.cur;
  consume(self);
  while (isDigit(self.cur) || self.cur === '.' || self.cur === '_') {
    if (self.cur !== '_') s += self.cur;
    consume(self);
    if (self.cur === 'e' || self.cur === 'E') {
      if (self.peek === '-' || self.peek === '+' || isDigit(self.peek)) {
        s += self.cur;
        consume(self);
        s += self.cur;
        consume(self);
      }
    }
  }
  var val = parseFloat(s);

  // HDate - check for dash
  var date = null;
  var time = null;
  var hour = -1;
  if (self.cur === '-') {
    var year;
    try {
      year = parseInt(s);
    }
    catch (e) {
      throw err("Invalid year for date value: " + s);
    }
    consume(self); // dash
    var month = readTwoDigits(self, "Invalid digit for month in date value");
    if (self.cur !== '-') throw errChar(self, "Expected '-' for date value");
    consume(self);
    var day = readTwoDigits(self, "Invalid digit for day in date value");
    date = HDate.make(year, month, day);

    // check for 'T' date time
    if (self.cur !== 'T') return date;

    // parse next two digits and drop down to HTime parsing
    consume(self);
    hour = readTwoDigits(self, "Invalid digit for hour in date time value");
  }

  // HTime - check for colon
  if (self.cur === ':') {
    // hour (may have been parsed already in date time)
    if (hour < 0) {
      if (s.length !== 2) throw err("Hour must be two digits for time value: " + s);
      try {
        hour = parseInt(s);
      }
      catch (e) {
        throw err("Invalid hour for time value: " + s);
      }
    }
    consume(self); // colon
    var min = readTwoDigits(self, "Invalid digit for minute in time value");
    if (self.cur !== ':') throw errChar(self, "Expected ':' for time value");
    consume(self);
    var sec = readTwoDigits(self, "Invalid digit for seconds in time value");
    var ms = 0;
    if (self.cur === '.') {
      consume(self);
      var places = 0;
      while (isDigit(self.cur)) {
        ms = (ms * 10) + (HVal.cc(self.cur) - HVal.cc('0'));
        consume(self);
        places++;
      }
      switch (places) {
        case 1:
          ms *= 100;
          break;
        case 2:
          ms *= 10;
          break;
        case 3:
          break;
        default:
          throw err("Too many digits for milliseconds in time value");
      }
    }
    time = HTime.make(hour, min, sec, ms);
    if (date === null) return time;
  }

  // HDateTime (if we have date and time)
  var zUtc = false;
  if (date !== null) {
    // timezone offset "Z" or "-/+hh:mm"
    var tzOffset = 0;
    if (self.cur === 'Z') {
      consume(self);
      zUtc = true;
    }
    else {
      var neg = (self.cur === '-');
      if (self.cur !== '-' && self.cur !== '+') {
        throw errChar(self, "Expected -/+ for timezone offset");
      }
      consume(self);
      var tzHours = readTwoDigits(self, "Invalid digit for timezone offset");
      if (self.cur !== ':') {
        throw errChar(self, "Expected colon for timezone offset");
      }
      consume(self);
      var tzMins = readTwoDigits(self, "Invalid digit for timezone offset");
      tzOffset = (tzHours * 3600) + (tzMins * 60);
      if (neg) tzOffset = -tzOffset;
    }

    // timezone name
    var tz;
    if (self.cur !== ' ') {
      if (!zUtc) throw errChar(self, "Expected space between timezone offset and name");
      else tz = HTimeZone.UTC;
    } else if (zUtc && !(HVal.cc('A') <= HVal.cc(self.peek) && HVal.cc(self.peek) <= HVal.cc('Z'))) {
      tz = HTimeZone.UTC;
    } else {
      consume(self);
      var tzBuf = "";
      if (!isTz(self.cur)) throw errChar(self, "Expected timezone name");
      while (isTz(self.cur)) {
        tzBuf += self.cur;
        consume(self);
      }
      tz = HTimeZone.make(tzBuf);
    }
    return HDateTime.make(date, time, tz, tzOffset);
  }

  // if we have unit, parse that
  var unit = null;
  if (isUnit(self.cur)) {
    s = "";
    while (isUnit(self.cur)) {
      s += self.cur;
      consume(self);
    }
    unit = s;
  }

  return HNum.make(val, unit);
}

/**
 * @memberof HZincReader
 * @return {int}
 */
function readTimeMs() {
  var ms = 0;
  return ms;
}

/**
 * @memberof HZincReader
 * @return {int}
 */
function toNibble(c) {
  c = HVal.cc(c);
  if (HVal.cc('0') <= c && c <= HVal.cc('9')) return c - HVal.cc('0');
  if (HVal.cc('a') <= c && c <= HVal.cc('f')) return c - HVal.cc('a') + 10;
  if (HVal.cc('A') <= c && c <= HVal.cc('F')) return c - HVal.cc('A') + 10;
  throw errChar(self, "Invalid hex char");
}

/**
 * @memberof HZincReader
 * @return {int}
 */
function readEscChar(self) {
  consume(self);  // back slash

  // check basics
  switch (HVal.cc(self.cur)) {
    case HVal.cc('b'):
      consume(self);
      return HVal.cc('\b');
    case HVal.cc('f'):
      consume(self);
      return HVal.cc('\f');
    case HVal.cc('n'):
      consume(self);
      return HVal.cc('\n');
    case HVal.cc('r'):
      consume(self);
      return HVal.cc('\r');
    case HVal.cc('t'):
      consume(self);
      return HVal.cc('\t');
    case HVal.cc('"'):
      consume(self);
      return HVal.cc('"');
    case HVal.cc('$'):
      consume(self);
      return HVal.cc('$');
    case HVal.cc('\\'):
      consume(self);
      return HVal.cc('\\');
  }

  // check for uxxxx
  if (self.cur === 'u') {
    consume(self);
    var n3 = toNibble(self.cur);
    consume(self);
    var n2 = toNibble(self.cur);
    consume(self);
    var n1 = toNibble(self.cur);
    consume(self);
    var n0 = toNibble(self.cur);
    consume(self);
    return (n3 << 12) | (n2 << 8) | (n1 << 4) | (n0);
  }

  throw err("Invalid escape sequence: \\" + self.cur);
}

/**
 * @memberof HZincReader
 * @return {string}
 */
function readStrLiteral(self) {
  consume(self); // opening quote
  var s = "";
  while (self.cur !== '"') {
    if (done(self.cur)) throw err("Unexpected end of str literal");
    if (self.cur === '\n' || self.cur === '\r') throw err("Unexpected newline in str literal");
    if (self.cur === '\\') {
      s += String.fromCharCode(readEscChar(self));
    } else {
      s += self.cur;
      consume(self);
    }
  }
  consume(self); // closing quote
  return s;
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readRefVal(self) {
  consume(self); // opening @
  var s = "";
  while (HRef.isIdChar(HVal.cc(self.cur))) {
    if (done(self.cur)) throw err("Unexpected end of ref literal");
    if (self.cur === '\n' || self.cur === '\r') throw err("Unexpected newline in ref literal");
    s += self.cur;
    consume(self);
  }
  skipSpace(self);

  var dis = null;
  if (self.cur === '"') dis = readStrLiteral(self);

  return HRef.make(s, dis);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readStrVal(self) {
  return HStr.make(readStrLiteral(self));
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readUriVal(self) {
  consume(self); // opening backtick
  var s = "";

  while (true) {
    if (done(self.cur)) throw err("Unexpected end of uri literal");
    if (self.cur === '\n' || self.cur === '\r') throw err("Unexpected newline in uri literal");
    if (self.cur === '`') break;
    if (self.cur === '\\') {
      switch (HVal.cc(self.peek)) {
        case HVal.cc(':'):
        case HVal.cc('/'):
        case HVal.cc('?'):
        case HVal.cc('#'):
        case HVal.cc('['):
        case HVal.cc(']'):
        case HVal.cc('@'):
        case HVal.cc('\\'):
        case HVal.cc('&'):
        case HVal.cc('='):
        case HVal.cc(';'):
          s += self.cur;
          s += self.peek;
          consume(self);
          consume(self);
          break;
        case HVal.cc('`'):
          s += '`';
          consume(self);
          consume(self);
          break;
        default:
          if (self.peek === 'u' || self.peek === '\\') s += readEscChar(self);
          else throw err("Invalid URI escape sequence \\" + self.peek);
          break;
      }
    } else {
      s += self.cur;
      consume(self);
    }
  }
  consume(self); // closing backtick
  return HUri.make(s);
}

/**
 * Read a single scalar value from the stream.
 * @memberof HZincReader
 * @return {HVal}
 */
function readVal(self) {
  if (isDigit(self.cur)) return readNumVal(self);
  if (isAlpha(self.cur)) return readWordVal(self);

  switch (HVal.cc(self.cur)) {
    case HVal.cc('@'):
      return readRefVal(self);
    case HVal.cc('"'):
      return readStrVal(self);
    case HVal.cc('`'):
      return readUriVal(self);
    case HVal.cc('-'):
      if (HVal.cc(self.peek) === HVal.cc('I')) return readWordVal(self);
      return readNumVal(self);
    default:
      throw errChar(self, "Unexpected char for start of value");
  }
}

/**
 * Read a scalar value.
 * @return {HVal}
 */
HZincReader.prototype.readScalar = function() {
  var val = readVal(this);
  if (notdone(this.cur, true)) throw errChar(this, "Expected end of stream");
  return val;
};

/**
 * @memberof HZincReader
 * @return {string}
 */
function readId(self) {
  if (!isIdStart(self.cur)) throw errChar(self, "Invalid name start char");
  var s = "";
  while (isId(self.cur)) {
    s += self.cur;
    consume(self);
  }
  return s;
}

function readVer(self) {
  var id = readId(self);
  if (id !== "ver") throw err("Expecting zinc header 'ver:2.0', not '" + id + "'");
  if (self.cur !== ':') throw err("Expecting ':' colon");
  consume(self);
  var ver = readStrLiteral(self);
  if (ver === "2.0") self.version = 2;
  else throw err("Unsupported zinc self.version: " + ver);
  skipSpace(self);
}

/**
 * @memberof HZincReader
 * @param {HDictBuilder} b
 */
function readMeta(self, b) {
  // parse pairs
  while (isIdStart(self.cur)) {
    // name
    var name = readId(self);

    // marker or :val
    var val = HMarker.VAL;
    skipSpace(self);
    if (self.cur === ':') {
      consume(self);
      skipSpace(self);
      val = readVal(self);
      skipSpace(self);
    }
    b.add(name, val);
    skipSpace(self);
  }
}

/** Read grid from the stream.
 * @return {HGrid}
 */
HZincReader.prototype.readGrid = function(callback) {
  var cb = true;
  try {
    var b = new HGridBuilder();

    // meta line
    readVer(this);
    readMeta(this, b.meta());
    consumeNewline(this);

    // read cols
    var numCols = 0;
    while (true) {
      var name = readId(this);
      skipSpace(this);
      numCols++;
      readMeta(this, b.addCol(name));
      if (this.cur !== ',') break;
      consume(this);
      skipSpace(this);
    }
    consumeNewline(this);

    // rows
    while (this.cur !== '\n' && notdone(this.cur, false)) {
      var cells = [];
      var i;
      for (i = 0; i < numCols; ++i) cells[i] = null;
      for (i = 0; i < numCols; ++i) {
        skipSpace(this);
        if (this.cur !== ',' && this.cur !== '\n') cells[i] = readVal(this);
        skipSpace(this);
        if (i + 1 < numCols) {
          if (this.cur !== ',') throw errChar(this, "Expecting comma in row");
          consume(this);
        }
      }
      consumeNewline(this);
      b.addRow(cells);
    }
    if (this.cur === '\n') consumeNewline(this);

    cb = false;
    callback(null, b.toGrid());
  } catch (err) {
    if (cb) callback(err);
  }
};

/** Read list of grids from the stream.
 * @return {HGrid[]}
 */
HZincReader.prototype.readGrids = function(callback) {
  _readGrid(this, [], callback);
};
function _readGrid(self, acc, callback) {
  if (notdone(this.cur, false)) {
    self.readGrid(function(err, grid) {
      if (err) {
        callback(err);
      } else {
        acc[acc.length] = grid;
        _readGrid(self, acc, callback);
      }
    });
  } else {
    callback(null, acc);
  }
}

/** Read set of name/value tags as dictionary
 * @return {HDict}
 */
HZincReader.prototype.readDict = function(callback) {
  try {
    var b = new HDictBuilder();
    readMeta(this, b);
    if (notdone(this.cur, true)) throw errChar(this, "Expected end of stream");
    callback(null, b.toDict());
  } catch (err) {
    callback(err);
  }
};

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterAnd(self) {
  var q = readFilterAtomic(self);
  skipSpace(self);
  if (self.cur !== 'a') return q;
  if (readId(self) !== "and") throw err("Expecting 'and' keyword");
  skipSpace(self);
  return q.and(readFilterAnd(self));
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterOr(self) {
  var q = readFilterAnd(self);
  skipSpace(self);
  if (self.cur !== 'o') return q;
  if (readId(self) !== "or") throw err("Expecting 'or' keyword");
  skipSpace(self);
  return q.or(readFilterOr(self));
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterParens(self) {
  consume(self);
  skipSpace(self);
  var q = readFilterOr(self);
  if (self.cur !== ')') throw err("Expecting ')'");
  consume(self);
  return q;
}

function consumeCmp(self) {
  consume(self);
  if (self.cur === '=') consume(self);
  skipSpace(self);
}

/**
 * @memberof HZincReader
 * @return {string}
 */
function readFilterPath(self) {
  // read first tag name
  var id = readId(self);

  // if not pathed, optimize for common case
  if (self.cur !== '-' || self.peek !== '>') return id;

  // parse path
  var s = id;
  var acc = [];
  acc[acc.length] = id;
  while (self.cur === '-' || self.peek === '>') {
    consume(self);
    consume(self);
    id = readId(self);
    acc[acc.length] = id;
    s += '-' + '>' + id;
  }
  return s;
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterAtomic(self) {
  skipSpace(self);
  if (self.cur === '(') return readFilterParens(self);

  var path = readFilterPath(self);
  skipSpace(self);

  if (path.toString() === "not") return HFilter.missing(readFilterPath(self));

  if (self.cur === '=' && self.peek === '=') {
    consumeCmp(self);
    return HFilter.eq(path, readVal(self));
  }
  if (self.cur === '!' && self.peek === '=') {
    consumeCmp(self);
    return HFilter.ne(path, readVal(self));
  }
  if (self.cur === '<' && self.peek === '=') {
    consumeCmp(self);
    return HFilter.le(path, readVal(self));
  }
  if (self.cur === '>' && self.peek === '=') {
    consumeCmp(self);
    return HFilter.ge(path, readVal(self));
  }
  if (self.cur === '<') {
    consumeCmp(self);
    return HFilter.lt(path, readVal(self));
  }
  if (self.cur === '>') {
    consumeCmp(self);
    return HFilter.gt(path, readVal(self));
  }

  return HFilter.has(path);
}

/** Never use directly.  Use "HFilter.make"
 * @return {HFilter}
 */
HZincReader.prototype.readFilter = function() {
  this.isFilter = true;
  skipSpace(this);
  var q = readFilterOr(this);
  skipSpace(this);
  if (notdone(this.cur, true)) throw errChar(this, "Expected end of stream");
  return q;
};