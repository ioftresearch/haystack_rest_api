/**
 * HGridFormat models a format used to encode/decode HGrid.
 *
 * @see {@link http://project-haystack.org/doc/Rest#contentNegotiation|Project Haystack}
 */

/**
 * @constructor
 * @param {string} mime
 * @param {HGridReader} reader
 * @param {HGridWriter} writer
 */
function HGridFormat(mime, reader, writer) {
  if (mime.indexOf(';') >= 0) throw new Error("mime has semicolon " + mime);

  /**
   * Mime type for the format with no paramters, such as "text/zinc".
   * All text formats are assumed to be utf-8.
   */
  this.mime = mime;
  /**
   * Class of HGridReader used to read this format
   * or null if reading is unavailable.
   */
  this.reader = reader;
  /**
   * Class of HGridWriter used to write this format
   * or null if writing is unavailable.
   */
  this.writer = writer;
}
module.exports = HGridFormat;

var HCsvWriter = require('./HCsvWriter'),
    HJsonWriter = require('./HJsonWriter'),
    HZincReader = require('./HZincReader'),
    HZincWriter = require('./HZincWriter');

/**
 * Find the HGridFormat for the given mime type.  The mime type
 * may contain parameters in which case they are automatically stripped
 * for lookup.  Throw a RuntimeException or return null based on
 * checked flag if the mime type is not registered to a format.
 *
 * @static
 * @param {string} mime
 * @param {boolean} checked
 * @return {HGridFormat}
 */
HGridFormat.find = function(mime, checked) {	    // normalize mime type to strip parameters
  var semicolon = mime.indexOf(';');
  if (semicolon > 0) mime = mime.substring(0, semicolon).trim();

  // lookup format
  var format = registry[mime];
  if (typeof(format) !== 'undefined' && format !== null) return format;

  // handle missing
  if (checked) throw new Error("No format for mime type: " + mime);
  return null;
};

/**
 * List all registered formats
 *
 * @static
 * @return {HGridFormat[]}
 */
HGridFormat.list = function() {
  var keys = Object.keys(registry);
  var acc = [];
  for (var i = 0; i < keys.length; i++) acc[i] = registry[keys[i]];

  return acc;
};

/**
 * Register a new HGridFormat
 *
 * @static
 * @param {HGridFormat} format
 */
HGridFormat.register = function(format) {
  registry[format.mime] = format;
};

/**
 * Make instance of "reader"; constructor with InputStream is expected.
 *
 * @param {Stream.Readable} input - if string is passed, it is converted to a {StringStream}
 * @return {HGridReader}
 */
HGridFormat.prototype.makeReader = function(input) {
  if (this.reader === null) throw new Error("Format doesn't support reader: " + this.mime);
  try {
    return new this.reader(input);
  } catch (e) {
    e.message = "Cannot construct: " + this.reader.name + "(InputStream). " + e.message;
    throw e;
  }
};


/**
 * Make instance of "writer"; constructor with OutputStream is expected.
 *
 * @param {Stream.Writable} out
 * @return {HGridWriter}
 */
HGridFormat.prototype.makeWriter = function(out) {
  if (this.writer === null) throw new Error("Format doesn't support writer: " + this.mime);
  try {
    return new this.writer(out);
  } catch (e) {
    e.message = "Cannot construct: " + this.writer.name + "(OutputStream). " + e.message;
    throw e;
  }
};

var registry = {};
try {
  HGridFormat.register(new HGridFormat("text/plain", HZincReader, HZincWriter));
  HGridFormat.register(new HGridFormat("text/zinc", HZincReader, HZincWriter));
  HGridFormat.register(new HGridFormat("text/csv", null, HCsvWriter));
  HGridFormat.register(new HGridFormat("application/json", null, HJsonWriter));
}
catch (e) {
  console.log(e.stack);
}
