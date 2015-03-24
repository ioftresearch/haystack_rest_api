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
 * HOp is the base class for server side operations exposed by the REST API.
 * All methods on HOp must be thread safe.
 * @see {@link http://project-haystack.org/doc/Ops|Project Haystack}

 * @constructor
 */
function HOp() {}
module.exports = HOp;

var url = require('url'),
    HDictBuilder = require('../HDictBuilder'),
    HGrid = require('../HGrid'),
    HGridBuilder = require('../HGridBuilder'),
    HRef = require('../HRef'),
    HStr = require('../HStr'),
    HUri = require('../HUri'),
    HVal = require('../HVal'),
    HGridFormat = require('../io/HGridFormat'),
    HZincReader = require('../io/HZincReader');

/**
 * Programmatic name of the operation.
 * @abstract
 * @return {string}
 */
HOp.prototype.name = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Short one line summary of what the operation does.
 * @abstract
 * @return {string}
 */
HOp.prototype.summary = function() {
  throw new Error('must be implemented by subclass!');
};

/**
 * Service the request and return response.
 * This method routes to "onService(HServer,HGrid)".
 *
 * @param db
 * @param req
 * @param res
 * @param callback
 */
HOp.prototype.onServiceOp = function(db, req, res, callback) {
  if (req instanceof HGrid) {
    callback(new Error("Unsupported Operation: " + this.contructor.name + ".onService(HServer,HGrid)"));
  } else {
    // parse GET query parameters or POST body into grid
    var reqGrid = HGrid.EMPTY;
    var method = req.method;
    if (method === "GET") reqGrid = getToGrid(req);
    if (method === "POST") reqGrid = postToGrid(req, res);
    if (typeof(reqGrid) === 'undefined' && reqGrid === null) return;

    // route to onService(HServer, HGrid)
    var self = this;
    this.onService(db, reqGrid, function(err, resGrid) {
      if (err) resGrid = HGridBuilder.errToGrid(err);
      // figure out best format to use for response
      var format = toFormat(req);

      // send response
      res.statusCode = 200;
      if (HVal.startsWith(format.mime, "text/"))
        res.setHeader("Content-Type", format.mime + "; charset=utf-8");
      else
        res.setHeader("Content-Type", format.mime);

      var out = format.makeWriter(res);
      out.writeGrid(resGrid);
      res.end();
    });
  }
};
/**
 * Service the request and return response.
 * @param {HServer} db
 * @param {HGrid} grid
 * @return {HGrid}
 */
HOp.prototype.onService = function(db, grid) {
  throw new Error('Unsupported Operation: ' + this.name() + '.onService(HServer,HGrid');
};

/**
 * Map the GET query parameters to grid with one row
 * @memberof HOp
 * @param {Express.Request} req
 * @return {HGrid}
 */
function getToGrid(req) {
  var query = url.parse(req.url, true);

  var keys = Object.keys(query);
  if (keys.legth === 0) return HGrid.EMPTY;

  var b = new HDictBuilder();
  for (var i = 0; i < keys.length; i++) {
    var valStr = query[keys[i]];

    var val;
    try {
      val = new HZincReader(valStr).readScalar();
    } catch (e) {
      val = HStr.make(valStr);
    }
    b.add(keys[i], val);
  }
  return HGridBuilder.dictToGrid(b.toDict());
};

/**
 * Map the POST body to grid
 * @memberof HOp
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @return {HGrid}
 */
function postToGrid(req, res) {
  // get content type
  var mime = req.headers["content-type"];
  if (typeof(mime) === 'undefined' || mime === null) {
    res.statusCode = 400;
    res.statusMessage = "Missing 'Content-Type' header";
    return null;
  }

  // check if we have a format that supports reading the content type
  var format = HGridFormat.find(mime, false);
  if (typeof(format) === 'undefined' || format === null || typeof(format.reader) === 'undefined' || format.reader === null) {
    res.statusCode = 415;
    res.statusMessage = "No format reader available for MIME type: " + mime;
    return null;
  }

  // read the grid
  // TODO: Fix so that only the request and not the parsed body are sent
  return format.makeReader(req.body).readGrid();
};

/**
 * Find the best format to use for encoding response using
 * HTTP content negotiation.
 * @memberof HOp
 * @param {Express.Request} req
 * @return {HGridFormat}
 */
function toFormat(req) {
  var format = null;
  var accept = req.header.accept;
  if (typeof(accept) !== 'undefined' && accept !== null) {
    var mimes = HStr.split(accept, ',', true);
    for (var i = 0; i < mimes.length; ++i) {
      format = HGridFormat.find(mimes[i], false);
      if (format !== null && format.writer !== null) break;
    }
  }
  if (format === null) format = HGridFormat.find("text/plain", true);
  return format;
};

/**
 * @param {HServer} db
 * @param {HGrid} grid
 * @param {function} callback
 */
HOp.prototype.gridToIds = function(db, grid, callback) {
  _addGridId(this, [], db, grid, callback);
};
function _addGridId(self, ids, db, grid, callback) {
  if (ids.length>=grid.numRows()) {
    callback(null, ids);
  } else {
    self.valToId(db, grid.row(ids.length).get("id"), function(err, id) {
      ids[ids.length] = id;
      _addGridId(self, ids, db, grid, callback);
    });
  }
}

/**
 * @param {HServer} db
 * @param {HVal} val
 * @param {function} callback
 */
HOp.prototype.valToId = function(db, val, callback) {
  if (val instanceof HUri) {
    var rec = db.navReadByUri(val, false, function(err, rec) {
      callback(null, rec === null ? HRef.nullRef : rec.id());
    });
  } else {
    callback(null, val);
  }
};
