/**
 * HGridWriter is base class for writing grids to an output stream.
 *
 * @see {@link http://project-haystack.org/doc/Rest#contentNegotiation|Project Haystack}
 */

/**
 * @constructor
 */
function HGridWriter() {}
module.exports = HGridWriter;

/**
 * Write a grid
 * @abstract
 * @param {HGrid}
 */
HGridWriter.prototype.writeGrid = function(grid) {
  throw new Error('must be implemented by subclass!');
};
