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
 * HTimeZone handles the mapping between Haystack timezone
 * names and Javascript (moment) timezones.
 * @see {@link http://project-haystack.org/doc/TimeZones|Project Haystack}
 *
 * @constructor
 * @param {string} name
 * @param {Moment.Zone} js
 */
function HTimeZone(name, js) {
  /** Haystack timezone name */
  this.name = name;
  /** Javascript (moment) representation of this timezone. */
  this.js = js;
}
module.exports = HTimeZone;

var moment = require('moment-timezone');

var cache = {};
var toJS = {};
var fromJS = {};

/**
 * Return Haystack timezone name
 * @return {string}
 */
HTimeZone.prototype.toString = function() {
  return this.name;
};

/**
 * Equals is based on name
 * @param {HTimezone}
 * @return {boolean}
 */
HTimeZone.prototype.equals = function(that) {
  return that instanceof HTimeZone && this.name === that.name;
};

function fixGMT(jsId) {
  // Javscript (moment) IDs can be in the form "GMT[+,-]h" as well as
  // "GMT", and "GMT0".  In that case, convert the ID to "Etc/GMT[+,-]h".
  // V8 uses the format "GMT[+,-]hh00 (used for default timezone), this also
  // needs converted to the POSIX standard (that moment uses) which means
  // that -0500 needs to be modified to +5

  // must be "GMT" or "GMT0" which are fine
  if (jsId.indexOf("+") < 0 && jsId.indexOf("-") < 0) return "Etc/" + jsId;

  // get the numeric value and inverse it
  var num = -parseInt(jsId.substring(3, 6));
  // ensure we have a valid value
  if ((jsId.substring(3, 4) === "-" && num < 13) || (jsId.substring(3, 4) === "+" && num < 15))
    return "Etc/GMT" + (num > 0 ? "+" : "") + num;

  // nothing we could do, return what was passed
  return jsId;
}

/**
 *
 * @param {sting|Moment.Zone} arg1
 * @param {boolean} checked
 * @returns {HTimeZone}
 */
HTimeZone.make = function(arg1, checked) {
  if (typeof(checked) === 'undefined') checked = true;

  var jsId;
  if (HVal.typeis(arg1, 'string', String)) {
    /**
     * Construct with Haystack timezone name, raise exception or
     * return null on error based on check flag.
     */
    // lookup in cache
    var tz = cache[arg1];
    if (typeof(tz) !== 'undefined') return tz;

    // map haystack id to Javascript full id
    jsId = toJS[arg1];
    if (typeof(jsId) === 'undefined') {
      if (checked) throw new Error("Unknown tz: " + arg1);
      return undefined;
    }

    // resolve full id to HTimeZone and cache
    var js = moment.tz.zone(jsId);
    tz = new HTimeZone(arg1, js);
    cache[arg1] = tz;
    return tz;
  } else {
    /**
     * Construct from Javascript timezone.  Throw exception or return
     * null based on checked flag.
     */

    jsId = arg1.name;
    if (HVal.startsWith(jsId, "GMT")) fixGMT(jsId);

    var name = fromJS[jsId];
    if (typeof(name) !== 'undefined' && name !== null)
      return HTimeZone.make(name);
    if (checked) throw new Error("Invalid Java timezone: " + arg1.name);
    return;
  }
};

{
  try {
    // only time zones which start with these
    // regions are considered valid timezones
    var regions = {};
    regions.Africa = "ok";
    regions.America = "ok";
    regions.Antarctica = "ok";
    regions.Asia = "ok";
    regions.Atlantic = "ok";
    regions.Australia = "ok";
    regions.Etc = "ok";
    regions.Europe = "ok";
    regions.Indian = "ok";
    regions.Pacific = "ok";

    // iterate Javascript timezone IDs available
    var ids = moment.tz.names();

    for (var i = 0; i < ids.length; ++i) {
      var js = ids[i];

      // skip ids not formatted as Region/City
      var slash = js.indexOf('/');
      if (slash < 0) continue;
      var region = js.substring(0, slash);
      if (typeof(regions[region]) === 'undefined' || regions[region] === null) continue;

      // get city name as haystack id
      slash = js.lastIndexOf('/');
      var haystack = js.substring(slash + 1);

      // store mapping b/w Javascript <-> Haystack

      toJS[haystack] = js;
      fromJS[js] = haystack;
    }
  } catch (err) {
    console.log(err.stack);
  }

  var utc;
  try {
    utc = HTimeZone.make(moment.tz.zone("Etc/UTC"));
  } catch (err) {
    console.log(err.stack);
  }

  var def;
  try {
    // check if configured with system property
    var defName = process.env["haystack.tz"];
    if (typeof(defName) !== 'undefined' && defName !== null) {
      def = HTimeZone.make(defName, false);
      if (typeof(def) === 'undefined' || def === null)
        console.log("WARN: invalid haystack.tz system property: " + defName);
    }

    // if we still don't have a default, try to use Javascript's
    if (typeof(def) === 'undefined' || def === null) {
      var date = new Date().toString();
      var gmtStart = date.indexOf("GMT");
      var gmtEnd = date.indexOf(" ", gmtStart);
      def = HTimeZone.make(fromJS[fixGMT(date.substring(gmtStart, gmtEnd))]);
    }
  } catch (err) {
    console.log(err.stack);
    def = utc;
  }

  /** UTC timezone */
  HTimeZone.UTC = utc;

  /** Default timezone for VM */
  HTimeZone.DEFAULT = def;
}
