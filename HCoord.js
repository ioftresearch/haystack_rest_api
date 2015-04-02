//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var HVal = require('./HVal');

/**
 * HCoord models a geographic coordinate as latitude and longitude
 * @see {@link http://project-haystack.org/doc/TagModel#tagKinds|Project Haystack}
 *
 * @constructor
 * @extends {HVal}
 * @param {float} ulat
 * @param {float} ulng
 */
function HCoord(ulat, ulng) {
  if (ulat < -90000000 || ulat > 90000000) throw new Error("Invalid lat > +/- 90");
  if (ulng < -180000000 || ulng > 180000000) throw new Error("Invalid lng > +/- 180");
  /** Latitude in micro-degrees */
  this.ulat = ulat;
  /** Longitude in micro-degrees */
  this.ulng = ulng;
}
HCoord.prototype = Object.create(HVal.prototype);
module.exports = HCoord;

/**
 * Latitude in decimal degrees
 * @return {float}
 */
HCoord.prototype.lat = function() {
  return this.ulat / 1000000.0;
};

/**
 * Longitude in decimal degrees
 * @return {float}
 */
HCoord.prototype.lng = function() {
  return this.ulng / 1000000.0;
};

function uToStr(ud) {
  var s = "";
  if (ud < 0) {
    s += "-";
    ud = -ud;
  }
  if (ud < 1000000.0) {
    s += (ud / 1000000.0).toFixed(6).toString();
    // strip extra zeros
    while (s.charAt(s.length - 2) !== '.' && s.charAt(s.length - 1) === '0')
      s = s.substring(0, s.length - 1);

    return s;
  }
  var x = ud.toString();
  var dot = x.length - 6;
  var end = x.length;
  var i;
  while (end > dot + 1 && x.charAt(end - 1) === '0')
    --end;
  for (i = 0; i < dot; ++i)
    s += x.charAt(i);
  s += ".";
  for (i = dot; i < end; ++i)
    s += x.charAt(i);

  return s;
}

/**
 * Represented as "C(lat,lng)"
 * @return {string}
 */
HCoord.prototype.toZinc = function() {
  var s = "C(";
  s += getLatLng(this);
  s += ")";
  return s;
};

/**
 * Encode as "c:lat,lng"
 * @returns string
 */
HCoord.prototype.toJSON = function() {
  return "c:" + getLatLng(this);
};

function getLatLng(self) {
  s = uToStr(self.ulat);
  s += ",";
  s += uToStr(self.ulng);
  return s;
}

/**
 * Equals is based on lat, lng
 * @param {HCoord} that - object to be compared to
 * @return {boolean}
 */
HCoord.prototype.equals = function(that) {
  return that instanceof HCoord && this.ulat === that.ulat && this.ulng === that.ulng;
};

/**
 * Parse from lat and long or string format "C(lat,lng)" or raise Error
 * @static
 * @param {string|float} lat - {string} Parse from string format "C(lat,lng)"<br/>
 *   {float} Construct from basic fields
 * @param {float} lng
 * @return {HCoord}
 */
HCoord.make = function(lat, lng) {
  if (HVal.typeis(lat, 'string', String)) {
    if (!HVal.startsWith(lat, "C(")) throw new Error("Parse Exception: Invalid start");
    if (!HVal.endsWith(lat, ")")) throw new Error("Parse Exception: Invalid end");
    var comma = lat.indexOf(',');
    if (comma < 3) throw new Error("Parse Exception: Invalid format");
    var plat = lat.substring(2, comma);
    var plng = lat.substring(comma + 1, lat.length - 1);
    if (isNaN(parseFloat(plat)) || isNaN(parseFloat(plng))) throw new Error("Parse Exception: NaN");

    return HCoord.make(parseFloat(plat), parseFloat(plng));
  } else {
    return new HCoord(parseInt(lat * 1000000.0), parseInt(lng * 1000000.0));
  }
};

/**
 * Return if given latitude is legal value between -90.0 and +90.0
 * @static
 * @param {float} lat
 * @return {boolean}
 */
HCoord.isLat = function(lat) {
  return -90.0 <= lat && lat <= 90.0;
};

/**
 * Return if given is longitude is legal value between -180.0 and +180.0
 * @static
 * @param {float} lng
 * @return {boolean}
 */
HCoord.isLng = function(lng) {
  return -180.0 <= lng && lng <= 180.0;
};
