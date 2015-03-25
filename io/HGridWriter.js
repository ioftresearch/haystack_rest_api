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
 * HGridWriter is base class for writing grids to an output stream.
 * @see {@link http://project-haystack.org/doc/Rest#contentNegotiation|Project Haystack}

 * @constructor
 */
function HGridWriter() {}
module.exports = HGridWriter;

/**
 * Write a grid
 * @abstract
 * @param {HGrid}
 */
HGridWriter.prototype.writeGrid = function(grid, callback) {
  throw new Error('must be implemented by subclass!');
};
