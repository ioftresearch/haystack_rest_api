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
 * HGridReader is base class for reading grids from an input stream.
 * @see {@link http://project-haystack.org/doc/Rest#contentNegotiation|Project Haystack}
 *
 * @constructor
 */
function HGridReader() {}
module.exports = HGridReader;

/**
 * Read a grid
 * @abstract
 * @return {HGrid}
 */
HGridReader.prototype.readGrid = function(callback) {
  throw new Error('must be implemented by subclass!');
};
