/**
 * HGridReader is base class for reading grids from an input stream.
 *
 * @see {@link http://project-haystack.org/doc/Rest#contentNegotiation|Project Haystack}
 */

/**
 * @constructor
 */
function HGridReader() {}
module.exports = HGridReader;

/**
 * Read a grid
 * @abstract
 * @return {HGrid}
 */
HGridReader.prototype.readGrid = function() {
  throw new Error('must be implemented by subclass!');
};
