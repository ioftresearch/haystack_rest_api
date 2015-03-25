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
    StringStream = require('string-stream'),
    HVal = require('../HVal');

//////////////////////////////////////////////////////////////////////////
//Fields
//////////////////////////////////////////////////////////////////////////

var cur;
var peek;
var lineNum = 1;
var version;
var isFilter = false;
var input;

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

function consume() {
  try {
    cur = peek;
    peek = input.read(1);
    if (cur === '\n') lineNum++;
  } catch (e) {
    throw err(e);
  }
}

function init() {
  consume();
  consume();
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
 * @param {Stream.Readable} i - if string is passed, it is converted to a {StringStream}
 */
function HZincReader(i) {
  if (typeof(i) === 'string' || i instanceof String)
    i = new StringStream(i);

  isFilter = false;
  input = i;
  init();
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

{
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
}

//////////////////////////////////////////////////////////////////////////
//Char Reads
//////////////////////////////////////////////////////////////////////////

function errChar(msg) { // String
  if (done(cur)) msg += " (end of stream)";
  else {
    msg += " (char=0x" + HVal.cc(cur).toString(16);
    if (cur >= ' ') msg += " '" + cur + "'";
    msg += ")";
  }
  return err(msg, null);
}

function skipSpace() {
  while (cur === ' ' || cur === '\t') consume();
}

function consumeNewline() {
  if (cur !== '\n') throw errChar("Expecting newline");
  consume();
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readBinVal() {
  if (done(cur)) throw err("Expected '(' after Bin");
  consume();
  var s = "";
  while (cur !== ')') {
    if (done(cur)) throw err("Unexpected end of bin literal");
    if (cur === '\n' || cur === '\r') throw err("Unexpected newline in bin literal");
    s += cur;
    consume();
  }
  consume();
  return HBin.make(s);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readCoordVal() {
  if (done(cur)) throw err("Expected '(' after Coord");
  consume();
  var s = "C(";
  while (cur !== ')') {
    if (done(cur)) throw err("Unexpected end of coord literal");
    if (cur === '\n' || cur === '\r') throw err("Unexpected newline in coord literal");
    s += cur;
    consume();
  }
  consume();
  s += ")";
  return HCoord.make(s);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readWordVal() {
  // read into string
  var s = "";
  do {
    s += cur;
    consume();
  } while (isAlpha(cur));

  // match identifier
  if (isFilter) {
    if (s === "true") return HBool.TRUE;
    if (s === "false") return HBool.FALSE;
  } else {
    if (s === "N") return null;
    if (s === "M") return HMarker.VAL;
    if (s === "R") return HRemove.VAL;
    if (s === "T") return HBool.TRUE;
    if (s === "F") return HBool.FALSE;
    if (s === "Bin") return readBinVal();
    if (s === "C") return readCoordVal();
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
function readTwoDigits(errMsg) { // String
  if (!isDigit(cur)) throw errChar(errMsg);
  var tens = (HVal.cc(cur) - HVal.cc('0')) * 10;
  consume();
  if (!isDigit(cur)) throw errChar(errMsg);
  var val = tens + (HVal.cc(cur) - HVal.cc('0'));
  consume();
  return val;
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readNumVal() {
  // parse numeric part
  var s = cur;
  consume();
  while (isDigit(cur) || cur === '.' || cur === '_') {
    if (cur !== '_') s += cur;
    consume();
    if (cur === 'e' || cur === 'E') {
      if (peek === '-' || peek === '+' || isDigit(peek)) {
        s += cur;
        consume();
        s += cur;
        consume();
      }
    }
  }
  var val = parseFloat(s);

  // HDate - check for dash
  var date = null;
  var time = null;
  var hour = -1;
  if (cur === '-') {
    var year;
    try {
      year = parseInt(s);
    }
    catch (e) {
      throw err("Invalid year for date value: " + s);
    }
    consume(); // dash
    var month = readTwoDigits("Invalid digit for month in date value");
    if (cur !== '-') throw errChar("Expected '-' for date value");
    consume();
    var day = readTwoDigits("Invalid digit for day in date value");
    date = HDate.make(year, month, day);

    // check for 'T' date time
    if (cur !== 'T') return date;

    // parse next two digits and drop down to HTime parsing
    consume();
    hour = readTwoDigits("Invalid digit for hour in date time value");
  }

  // HTime - check for colon
  if (cur === ':') {
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
    consume(); // colon
    var min = readTwoDigits("Invalid digit for minute in time value");
    if (cur !== ':') throw errChar("Expected ':' for time value");
    consume();
    var sec = readTwoDigits("Invalid digit for seconds in time value");
    var ms = 0;
    if (cur === '.') {
      consume();
      var places = 0;
      while (isDigit(cur)) {
        ms = (ms * 10) + (HVal.cc(cur) - HVal.cc('0'));
        consume();
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
    if (cur === 'Z') {
      consume();
      zUtc = true;
    }
    else {
      var neg = (cur === '-');
      if (cur !== '-' && cur !== '+') {
        throw errChar("Expected -/+ for timezone offset");
      }
      consume();
      var tzHours = readTwoDigits("Invalid digit for timezone offset");
      if (cur !== ':') {
        throw errChar("Expected colon for timezone offset");
      }
      consume();
      var tzMins = readTwoDigits("Invalid digit for timezone offset");
      tzOffset = (tzHours * 3600) + (tzMins * 60);
      if (neg) tzOffset = -tzOffset;
    }

    // timezone name
    var tz;
    if (cur !== ' ') {
      if (!zUtc) throw errChar("Expected space between timezone offset and name");
      else tz = HTimeZone.UTC;
    } else if (zUtc && !(HVal.cc('A') <= HVal.cc(peek) && HVal.cc(peek) <= HVal.cc('Z'))) {
      tz = HTimeZone.UTC;
    } else {
      consume();
      var tzBuf = "";
      if (!isTz(cur)) throw errChar("Expected timezone name");
      while (isTz(cur)) {
        tzBuf += cur;
        consume();
      }
      tz = HTimeZone.make(tzBuf);
    }
    return HDateTime.make(date, time, tz, tzOffset);
  }

  // if we have unit, parse that
  var unit = null;
  if (isUnit(cur)) {
    s = "";
    while (isUnit(cur)) {
      s += cur;
      consume();
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
  throw errChar("Invalid hex char");
}

/**
 * @memberof HZincReader
 * @return {int}
 */
function readEscChar() {
  consume();  // back slash

  // check basics
  switch (HVal.cc(cur)) {
    case HVal.cc('b'):
      consume();
      return HVal.cc('\b');
    case HVal.cc('f'):
      consume();
      return HVal.cc('\f');
    case HVal.cc('n'):
      consume();
      return HVal.cc('\n');
    case HVal.cc('r'):
      consume();
      return HVal.cc('\r');
    case HVal.cc('t'):
      consume();
      return HVal.cc('\t');
    case HVal.cc('"'):
      consume();
      return HVal.cc('"');
    case HVal.cc('$'):
      consume();
      return HVal.cc('$');
    case HVal.cc('\\'):
      consume();
      return HVal.cc('\\');
  }

  // check for uxxxx
  if (cur === 'u') {
    consume();
    var n3 = toNibble(cur);
    consume();
    var n2 = toNibble(cur);
    consume();
    var n1 = toNibble(cur);
    consume();
    var n0 = toNibble(cur);
    consume();
    return (n3 << 12) | (n2 << 8) | (n1 << 4) | (n0);
  }

  throw err("Invalid escape sequence: \\" + cur);
}

/**
 * @memberof HZincReader
 * @return {string}
 */
function readStrLiteral() {
  consume(); // opening quote
  var s = "";
  while (cur !== '"') {
    if (done(cur)) throw err("Unexpected end of str literal");
    if (cur === '\n' || cur === '\r') throw err("Unexpected newline in str literal");
    if (cur === '\\') {
      s += String.fromCharCode(readEscChar());
    } else {
      s += cur;
      consume();
    }
  }
  consume(); // closing quote
  return s;
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readRefVal() {
  consume(); // opening @
  var s = "";
  while (HRef.isIdChar(HVal.cc(cur))) {
    if (done(cur)) throw err("Unexpected end of ref literal");
    if (cur === '\n' || cur === '\r') throw err("Unexpected newline in ref literal");
    s += cur;
    consume();
  }
  skipSpace();

  var dis = null;
  if (cur === '"') dis = readStrLiteral();

  return HRef.make(s, dis);
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readStrVal() {
  return HStr.make(readStrLiteral());
}

/**
 * @memberof HZincReader
 * @return {HVal}
 */
function readUriVal() {
  consume(); // opening backtick
  var s = "";

  while (true) {
    if (done(cur)) throw err("Unexpected end of uri literal");
    if (cur === '\n' || cur === '\r') throw err("Unexpected newline in uri literal");
    if (cur === '`') break;
    if (cur === '\\') {
      switch (HVal.cc(peek)) {
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
          s += cur;
          s += peek;
          consume();
          consume();
          break;
        case HVal.cc('`'):
          s += '`';
          consume();
          consume();
          break;
        default:
          if (peek === 'u' || peek === '\\') s += readEscChar();
          else throw err("Invalid URI escape sequence \\" + peek);
          break;
      }
    } else {
      s += cur;
      consume();
    }
  }
  consume(); // closing backtick
  return HUri.make(s);
}

/**
 * Read a single scalar value from the stream.
 * @memberof HZincReader
 * @return {HVal}
 */
function readVal() {
  if (isDigit(cur)) return readNumVal();
  if (isAlpha(cur)) return readWordVal();

  switch (HVal.cc(cur)) {
    case HVal.cc('@'):
      return readRefVal();
    case HVal.cc('"'):
      return readStrVal();
    case HVal.cc('`'):
      return readUriVal();
    case HVal.cc('-'):
      if (HVal.cc(peek) === HVal.cc('I')) return readWordVal();
      return readNumVal();
    default:
      throw errChar("Unexpected char for start of value");
  }
}

/**
 * Read a scalar value.
 * @return {HVal}
 */
HZincReader.prototype.readScalar = function() {
  var val = readVal();
  if (notdone(cur, true)) throw errChar("Expected end of stream");
  return val;
};

/**
 * @memberof HZincReader
 * @return {string}
 */
function readId() {
  if (!isIdStart(cur)) throw errChar("Invalid name start char");
  var s = "";
  while (isId(cur)) {
    s += cur;
    consume();
  }
  return s;
}

function readVer() {
  var id = readId();
  if (id !== "ver") throw err("Expecting zinc header 'ver:2.0', not '" + id + "'");
  if (cur !== ':') throw err("Expecting ':' colon");
  consume();
  var ver = readStrLiteral();
  if (ver === "2.0") version = 2;
  else throw err("Unsupported zinc version: " + ver);
  skipSpace();
}

/**
 * @memberof HZincReader
 * @param {HDictBuilder} b
 */
function readMeta(b) {
  // parse pairs
  while (isIdStart(cur)) {
    // name
    var name = readId();

    // marker or :val
    var val = HMarker.VAL;
    skipSpace();
    if (cur === ':') {
      consume();
      skipSpace();
      val = readVal();
      skipSpace();
    }
    b.add(name, val);
    skipSpace();
  }
}

/** Read grid from the stream.
 * @return {HGrid}
 */
HZincReader.prototype.readGrid = function(callback) {
  try {
    var b = new HGridBuilder();

    // meta line
    readVer();
    readMeta(b.meta());
    consumeNewline();

    // read cols
    var numCols = 0;
    while (true) {
      var name = readId();
      skipSpace();
      numCols++;
      readMeta(b.addCol(name));
      if (cur !== ',') break;
      consume();
      skipSpace();
    }
    consumeNewline();

    // rows
    while (cur !== '\n' && notdone(cur, false)) {
      var cells = [];
      var i;
      for (i = 0; i < numCols; ++i) cells[i] = null;
      for (i = 0; i < numCols; ++i) {
        skipSpace();
        if (cur !== ',' && cur !== '\n') cells[i] = readVal();
        skipSpace();
        if (i + 1 < numCols) {
          if (cur !== ',') throw errChar("Expecting comma in row");
          consume();
        }
      }
      consumeNewline();
      b.addRow(cells);
    }
    if (cur === '\n') consumeNewline();

    callback(null, b.toGrid());
  } catch (err) {
    callback(err);
  }
};

/** Read list of grids from the stream.
 * @return {HGrid[]}
 */
HZincReader.prototype.readGrids = function(callback) {
  _readGrid(this, [], callback);
};
function _readGrid(self, acc, callback) {
  if (notdone(cur, false)) {
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
    readMeta(b);
    if (notdone(cur, true)) throw errChar("Expected end of stream");
    callback(null, b.toDict());
  } catch (err) {
    callback(err);
  }
};

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterAnd() {
  var q = readFilterAtomic();
  skipSpace();
  if (cur !== 'a') return q;
  if (readId() !== "and") throw err("Expecting 'and' keyword");
  skipSpace();
  return q.and(readFilterAnd());
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterOr() {
  var q = readFilterAnd();
  skipSpace();
  if (cur !== 'o') return q;
  if (readId() !== "or") throw err("Expecting 'or' keyword");
  skipSpace();
  return q.or(readFilterOr());
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterParens() {
  consume();
  skipSpace();
  var q = readFilterOr();
  if (cur !== ')') throw err("Expecting ')'");
  consume();
  return q;
}

function consumeCmp() {
  consume();
  if (cur === '=') consume();
  skipSpace();
}

/**
 * @memberof HZincReader
 * @return {string}
 */
function readFilterPath() {
  // read first tag name
  var id = readId();

  // if not pathed, optimize for common case
  if (cur !== '-' || peek !== '>') return id;

  // parse path
  var s = id;
  var acc = [];
  acc[acc.length] = id;
  while (cur === '-' || peek === '>') {
    consume();
    consume();
    id = readId();
    acc[acc.length] = id;
    s += '-' + '>' + id;
  }
  return s;
}

/**
 * @memberof HZincReader
 * @return {HFilter}
 */
function readFilterAtomic() {
  skipSpace();
  if (cur === '(') return readFilterParens();

  var path = readFilterPath();
  skipSpace();

  if (path.toString() === "not") return HFilter.missing(readFilterPath());

  if (cur === '=' && peek === '=') {
    consumeCmp();
    return HFilter.eq(path, readVal());
  }
  if (cur === '!' && peek === '=') {
    consumeCmp();
    return HFilter.ne(path, readVal());
  }
  if (cur === '<' && peek === '=') {
    consumeCmp();
    return HFilter.le(path, readVal());
  }
  if (cur === '>' && peek === '=') {
    consumeCmp();
    return HFilter.ge(path, readVal());
  }
  if (cur === '<') {
    consumeCmp();
    return HFilter.lt(path, readVal());
  }
  if (cur === '>') {
    consumeCmp();
    return HFilter.gt(path, readVal());
  }

  return HFilter.has(path);
}

/** Never use directly.  Use "HFilter.make"
 * @return {HFilter}
 */
HZincReader.prototype.readFilter = function() {
  isFilter = true;
  skipSpace();
  var q = readFilterOr();
  skipSpace();
  if (notdone(cur, true)) throw errChar("Expected end of stream");
  return q;
};
