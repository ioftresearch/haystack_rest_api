//
// Copyright (c) 2015, Shawn Jacobson
// Licensed under the Academic Free License version 3.0
//
// Ported from @see {@link https://bitbucket.org/brianfrank/haystack-java|Haystack Java Toolkit}
//
// History:
//   21 Mar 2015  Shawn Jacobson  Creation
//

var http = require('http'),
  https = require('https'),
  crypto = require('crypto'),
  HDictBuilder = require('../HDictBuilder'),
  HGrid = require('../HGrid'),
  HGridBuilder = require('../HGridBuilder'),
  HNum = require('../HNum'),
  HStr = require('../HStr'),
  HProj = require('../HProj'),
  HWatch = require('../HWatch'),
  HVal = require('../HVal'),
  HJsonReader = require('../io/HJsonReader'),
  HJsonWriter = require('../io/HJsonWriter'),
  HZincReader = require('../io/HZincReader'),
  HZincWriter = require('../io/HZincWriter'),
  Base64 = require('../util/Base64'),
  CryptoUtil = require('../util/CryptoUtil');

var postTimeout = 3000;
var rejectUnauth = true;
HClient.setRejectUnauthorized = function(boolval){
  if(boolval === true || boolval === false)
    rejectUnauth = boolval;
};

HClient.getRejectUnauthorized = function(boolval){
  return rejectUnauth;
};

//module.exports.setRejectUnauthorized = setRejectUnauthorized;
//module.exports.rejectUnauth = rejectUnauth;

/**
 * HClient manages a logical connection to a HTTP REST haystack server.
 * @see {@link http://project-haystack.org/doc/Rest|Project Haystack}
 *
 * Constructor with URI to server's API and authentication credentials.
 * @constructor
 * @extends HProj
 * @param {string} uri
 * @param {string} user
 * @param {string} pass
 * @param {string} format - ZINC or JSON (defaults to ZINC)
 */
function HClient(uri, user, pass, format, connectTimeout, readTimeout) {
  // check uri
  if (!HVal.startsWith(uri, "http://") && !HVal.startsWith(uri, "https://"))
    throw new Error("Invalid uri format: " + uri);
  if (!HVal.endsWith(uri, "/")) uri = uri + "/";

  // sanity check arguments
  if (user.length === 0) throw new Error("user cannot be empty string");

  this.user = user;
  this.pass = pass;
  this.authProperty = null;
  this.cookieProperty = null;
  this.uwatches = {};
  this.format = format;
  if (typeof(format)==='undefined')
    this.format = "ZINC";

  /** Base URI for connection such as "http://host/api/demo/".
   This string always ends with slash. */
  this.uri = uri;
  /** Timeout in milliseconds for opening the HTTP socket */
  if (connectTimeout) this.connectTimeout = connectTimeout;
  /** Timeout in milliseconds for reading from the HTTP socket */
  if (readTimeout) this.readTimeout = readTimeout;
}
HClient.prototype = Object.create(HProj.prototype);
module.exports = HClient;

/**
 * @constructor
 * @extends HWatch
 * @static
 * @memberof HClient
 * @param {HClient} c
 * @param {string} d
 * @param {HNum} l
 */
function HClientWatch(c, d, l) {
  this.client = c;
  this.udis = d;
  this.desiredLease = l;
  this.uid = null;
  this.ulease = null;
  this.closed = false;
}
HClientWatch.prototype = Object.create(HWatch.prototype);

/**
 * @return {string}
 */
HClientWatch.prototype.id = function() {
  return this.uid;
};
/**
 * @return {HNum}
 */
HClientWatch.prototype.lease = function() {
  return this.ulease;
};
/**
 * @return {string}
 */
HClientWatch.prototype.dis = function() {
  return this.udis;
};
/**
 * @param {HRef[]} ids
 * @param {boolean} checked - optional, defaults to true
 * @param {function} callback
 * @return {HGrid}
 */
HClientWatch.prototype.sub = function(ids, checked, callback) {
  if (typeof(checked)==='function') {
    callback = checked;
    checked = true;
  }

  this.client.watchSub(this, ids, checked, callback);
};
/**
 * @param {HRef[]} ids
 * @param {function} callback
 */
HClientWatch.prototype.unsub = function(ids, callback) {
  this.client.watchUnsub(this, ids, callback);
};
/**
 * @param {function} callback
 * @return {HGrid}
 */
HClientWatch.prototype.pollChanges = function(callback) {
  this.client.watchPoll(this, false, callback);
};
/**
 * @param {function} callback
 * @return {HGrid}
 */
HClientWatch.prototype.pollRefresh = function(callback) {
  this.client.watchPoll(this, true, callback);
};
/**
 * @param {function} callback
 */
HClientWatch.prototype.close = function(callback) {
  this.client.watchClose(this, true, callback);
};
/**
 * @return {boolean}
 */
HClientWatch.prototype.isOpen = function() {
  return !this.closed;
};

////////////////////////////////////////////////////////////////
//Property
////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @memberof HClient
 * @param {string} key
 * @param {string} value
 */
function Property(key, value) {
  this.key = key;
  this.value = value;
}
/**
 * @return {string}
 */
Property.prototype.toString = function() {
  return "[Property " +
    "key:" + this.key + ", " +
    "value:" + this.value + "]";
};

//////////////////////////////////////////////////////////////////////////
//Authentication
//////////////////////////////////////////////////////////////////////////

/**
 * Authenticate using Basic HTTP
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {Response} resp
 * @param {function} callback
 */
HClient.prototype.authenticateBasic = function(t, resp, callback) {
  // According to http://en.wikipedia.org/wiki/Basic_access_authentication,
  // we are supposed to get a "WWW-Authenticate" header, that has the 'realm' in it.
  // We don't get it, but it doesn't matter.  Just set up a Property
  // to send back Basic Authorization on subsequent requests.

  t.authProperty = new Property(
    "Authorization",
    "Basic " + Base64.STANDARD.encode(t.user + ":" + t.pass));

  callback(null, t);
}

/**
 * @private
 * @memberof HClient
 * @param {HClient} t (this)
 * @params {Response} resp
 * @return {JSObject} (i.e. '{}')
 */
HClient.prototype.parseResProps = function(body) {
  // parse response as name:value pairs
  var props = {};
  var lines = body.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var colon = lines[i].indexOf(':');
    var name = lines[i].substring(0, colon).trim();
    var val = lines[i].substring(colon + 1).trim();
    props[name] = val;
  }

  return props;
};

/**
 * parse URL into host, path and port and return as array
 * @memberof HClient
 */
HClient.prototype.parseUrl = function(url) {
  // parse url information to host, port and path
  var host = "";
  var path = "";
  var port = 80;
  var proto = url.indexOf("//") + 2;
  if (proto > 0) {
    host = url.substring(proto, url.indexOf("/", proto));
    path = url.substring(url.indexOf("/", proto));
    var colon = host.indexOf(":");
    if (colon > 0) {
      port = host.substring(colon + 1);
      host = host.substring(0, colon);
    }
  }

  return [host, path, port];
};
/**
 * Authenticate with SkySpark nonce based HMAC SHA-1 mechanism.
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {Response} resp
 * @param {function} callback
 */
HClient.prototype.authenticateFolio = function(t, resp, callback) {
  var authUri = resp.headers["folio-auth-api-uri"];
  if (typeof(authUri) === 'undefined' || authUri === null) {
    callback(new Error("Missing 'Folio-Auth-Api-Uri' header"));
    return;
  }

  // make request to auth URI to get salt, nonce
  var baseUri = t.uri.substring(0, t.uri.indexOf('/', 9));
  var url = baseUri + authUri + "?" + t.user;

  // parse url information to host, port and path
  var info = t.parseUrl(url);
  // post back nonce/digest to auth URI
  var opts = {
    host: info[0],
    path: info[1],
    port: info[2],
    method: 'GET'
  };

  var httptype = http;
  if(url.indexOf('https') === 0)
  {
    httptype = https;
    opts.rejectUnauthorized = rejectUnauth;
  }
  httptype.get(opts, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      // parse response as name:value pairs
      var props = t.parseResProps(body);

      // get salt and nonce values
      var salt = props.userSalt;
      if (typeof(salt) === 'undefined') throw new Error("auth missing 'userSalt'");
      var nonce = props.nonce;
      if (typeof(nonce) === 'undefined') throw new Error("auth missing 'nonce'");

      // compute hmac
      var hmacBytes = CryptoUtil.hmac("sha1", (t.user + ":" + salt), t.pass);
      var hmac = Base64.STANDARD.encodeBytes(hmacBytes);

      // compute digest with nonce
      var md = crypto.createHash("sha1");
      md.update((hmac + ":" + nonce));
      var digest = md.digest('base64');

      // parse url information to host, port and path
      var info = t.parseUrl(url);
      // post back nonce/digest to auth URI
      var opts = {
        host: info[0],
        path: info[1],
        port: info[2],
        method: 'POST',
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      };

      var httptype = http;
      if(url.indexOf('https') === 0)
      {
        httptype = https;
        opts.rejectUnauthorized = rejectUnauth;
      }

      var req = httptype.request(opts, function(res) {
        var body = '';
        res.on('data', function(d) {
          body += d;
        });
        res.on('end', function() {
          if (res.statusCode !== 200) {
            callback(new Error("Invalid username/password [" + res.statusCode + "]"));
            return;
          }

          // parse successful authentication to get cookie value
          props = t.parseResProps(body);
          var cookie = props.cookie;
          if (typeof(cookie) === 'undefined') {
            callback(new Error("auth missing 'cookie'"));
            return;
          }

          t.authProperty = new Property("Cookie", cookie);

          callback(null, t);
        });
      });
      if (this.connectTimeout){
        var cTimeout = this.connectTimeout
        req.setTimeout(cTimeout);
        req.on('timeout', function() {
          req.abort();
          req.end();
          callback(new Error('Connection timeout of ' + cTimeout + 'ms reached'))
        })
      }
      if (this.readTimeout) {
        var rTimeout = this.readTimeout
        req.on('socket', function(sock) {
          sock.on('connect', function() {
            setTimeout(function() {
              req.abort();
              req.end();
              callback(new Error('Read timeout of ' + rTimeout + 'ms reached'))
            }, rTimeout)
          })
        })
      }
      req.on('error', function(e) {
        callback(e);
      });
      // write the data
      req.write("nonce:" + nonce + "\ndigest:" + digest + "\n");
      req.end();
    });
  }).on('error', function(e) {
    callback(e);
  });

}

/**
 * Authenticate with the server.  Currently we just support
 * SkySpark nonce based HMAC SHA-1 mechanism.
 * @private
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {function} callback
 */
HClient.prototype.authenticate = function(callback) {
  var self = this;

  // make request to about to get headers
  var url = self.uri + "about";

  // parse url information to host, port and path
  var info = self.parseUrl(url);
  // post back nonce/digest to auth URI
  var opts = {
    host: info[0],
    path: info[1],
    port: info[2],
    method: 'POST',
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  };

  var httptype = http;
  if(url.indexOf('https') === 0)
  {
    httptype = https;
    opts.rejectUnauthorized = rejectUnauth;
  }

  httptype.get(opts, function(res) {
    var folioAuthUri = res.headers["folio-auth-api-uri"];
    if (typeof(folioAuthUri) !== 'undefined' && folioAuthUri !== null) {
      self.authenticateFolio(self, res, callback);
      return;
    }

    var respCode = res.statusCode;
    switch (respCode) {
      case 200:
        callback(null, self);
        return;
      case 302:
      case 401:
        self.authenticateBasic(self, res, callback);
        return;
      default:
        callback(new Error("Unexpected Response Code: " + respCode));
        return;
    }
  }).on('error', function(e) {
    callback(e);
  });
};

//////////////////////////////////////////////////////////////////////////
// Operations
//////////////////////////////////////////////////////////////////////////

/**
 * Convenience for construction and call to open().
 * @static
 * @param {string} uri
 * @param {string} user
 * @param {string} pass
 * @param {function} callback
 * @return {HClient}
 */
HClient.open = function(uri, user, pass, format, callback, connectTimeout, readTimeout) {
  var _format = format;
  var _callback = callback;
  if (typeof(_format)==='function') {
    _callback = _format;
    _format = undefined;
  }
  new HClient(uri, user, pass, _format, connectTimeout, readTimeout).open(_callback);
};

/**
 * Authenticate the client and return this.
 * @param {function} callback
 * @return {HClient}
 */
HClient.prototype.open = function(callback) {
  this.authenticate(callback);
};

/**
 * Call "about" to query summary info.
 * @param {function} callback
 * @return {HDict}
 */
HClient.prototype.about = function(callback) {
  this.call("about", HGrid.EMPTY, function(err, grid) {
    callback(null, grid.row(0));
  });
};

/**
 * Call "ops" to query which operations are supported by server.
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.ops = function(callback) {
  this.call("ops", HGrid.EMPTY, callback);
};

/**
 * Call "formats" to query which MIME formats are available.
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.formats = function(callback) {
  this.call("formats", HGrid.EMPTY, callback);
};

//////////////////////////////////////////////////////////////////////////
// Reads
//////////////////////////////////////////////////////////////////////////

/**
 * @protected
 * @param {HRef} id
 * @param {function} callback
 * @return {HDict}
 */
HClient.prototype.onReadById = function(id, callback) {
  this.readByIds([id], false, function(err, grid) {
    if (grid.isEmpty()) {
      callback(null, null);
      return;
    }
    var rec = grid.row(0);
    if (rec.missing("id")) {
      callback(null, null);
      return;
    }
    callback(null, rec);
  });
};

/**
 * @protected
 * @param {HRef[]} ids
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.onReadByIds = function(ids, callback) {
  var b = new HGridBuilder();
  b.addCol("id");
  for (var i = 0; i < ids.length; ++i) b.addRow([ids[i]]);
  this.call("read", b.toGrid(), callback);
};

/**
 * @protected
 * @param {string} filter
 * @param {int} limit
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.onReadAll = function(filter, limit, callback) {
  var b = new HGridBuilder();
  b.addCol("filter");
  b.addCol("limit");
  b.addRow([HStr.make(filter), HNum.make(limit)]);
  this.call("read", b.toGrid(), callback);
};

//////////////////////////////////////////////////////////////////////////
//Call
//////////////////////////////////////////////////////////////////////////

/**
 * @private
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {Response} resp
 */
HClient.prototype.checkSetCookie = function(resp) {
  // if auth is already cookie based, we don't want to overwrite it
  if (this.authProperty !== null && this.authProperty.key === "Cookie") return;

  // check for Set-Cookie
  var header = resp.headers["set-cookie"];
  if (typeof(header) === 'undefined' || header === null) return;

  // parse cookie name=value pair
  header = header.toString();
  var semi = header.indexOf(";");
  if (semi > 0) header = header.substring(0, semi);

  // save cookie for future requests
  this.cookieProperty = new Property("Cookie", header);
}

/**
 * @private
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {string} op
 * @param {string} data
 * @param {function} callback
 * @returns {string}
 */
function postString(t, op, data, callback) {
  var connectTimeoutError = false;
  var readTimeoutError = false;
  // setup the POST request
  var url = t.uri + op;
  var headers = {};
  headers.Connection = "Close";
  if (t.format==='JSON') {
    headers["Content-Type"] = "application/json; charset=utf-8";
    headers["Accept"] = "application/json";
  } else {
    headers["Content-Type"] = "text/plain; charset=utf-8";
  }
  headers["Content-Length"] = Buffer.byteLength(data);
  if (t.authProperty !== null && typeof(t.authProperty)!=='undefined') headers[t.authProperty.key] = t.authProperty.value;
  if (t.cookieProperty !== null && typeof(t.cookieProperty)!=='undefined') headers[t.cookieProperty.key] = t.cookieProperty.value;

  // parse url information to host, port and path
  var info = t.parseUrl(url);
  // post back nonce/digest to auth URI
  var opts = {
    host: info[0],
    path: info[1],
    port: info[2],
    method: 'POST',
    headers: headers
  };

  var httptype = http;
  if(url.indexOf('https') === 0)
  {
    httptype = https;
    opts.rejectUnauthorized = rejectUnauth;
  }

  var req = httptype.request(opts, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      // check for successful request
      if (res.statusCode !== 200) {
        callback(new Error("Call Http Error: " + res.statusCode));
        return;
      }
      if (readTimeoutError) {
        callback(new Error("Read timeout of " + HClient.readTimeout + " ms was hit!"))
      }
      if (connectTimeoutError) {
        callback(new Error("Read timeout of " + HClient.connectTimeout + " ms was hit!"))
      }

      // check for response cookie
      t.checkSetCookie(res);

      callback(null, body);
    });
  });
  req.on('error', function(e) {
    callback(new Error("Call Network Error: " + e.message));
  })
  // create timeouts, if they exist
  if (this.connectTimeout){
    var cTimeout = this.connectTimeout
    req.setTimeout(cTimeout);
    req.on('timeout', function() {
      req.abort();
      req.end();
      callback(new Error('Connection timeout of ' + cTimeout + 'ms reached'))
    })
  }
  if (this.readTimeout) {
    var rTimeout = this.readTimeout
    req.on('socket', function(sock) {
      sock.on('connect', function() {
        setTimeout(function() {
          req.abort();
          req.end();
          callback(new Error('Read timeout of ' + rTimeout + 'ms reached'))
        }, rTimeout)
      })
    })
  }
  // write the data
  req.write(data);
  req.end();
}

/**
 * @private
 * @memberof HClient
 * @param {HClient} t (this)
 * @param {string} op
 * @param {HGrid} req
 * @param {function} callback
 * @returns {HGrid}
 */
function postGrid(t, op, req, callback) {
  getWriter(t).gridToString(req, function(err, reqStr) {
    if (err) {
      callback(err);
      return;
    }

    postString(t, op, reqStr, function(err, str) {
      if (err) {
        callback(err);
      } else {
        new getReader(t, str).readGrid(callback);
      }
    });
  });
}

function getReader(t, str) {
  if (t.format==='JSON') return new HJsonReader(str);

  return new HZincReader(str);
}
function getWriter(t) {
  if (t.format==='JSON') return HJsonWriter;

  return HZincWriter;
}

/**
 * Make a call to the given operation.  The request grid is posted
 * to the URI "this.uri+op" and the response is parsed as a grid.
 * Raise CallNetworkException if there is a communication I/O error.
 * Raise CallErrException if there is a server side error and an error
 * grid is returned.
 * @param {string} op
 * @param {HGrid} req
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.call = function(op, req, callback) {
  postGrid(this, op, req, function(err, grid) {
    if (err || grid.isErr()) {
      callback(err ? err : new Error(grid.dict.map.errTrace + "\n"));
      return
    }
    callback(null, grid);
  });
};

//////////////////////////////////////////////////////////////////////////
// Evals
//////////////////////////////////////////////////////////////////////////

/**
 * Call "evaluate" operation to evaluate a vendor specific
 * expression on the server:
 *   - SkySpark: any Axon expression
 * @param {string} expr
 * @param {function} callback
 * @return {HGrid}
 * @throws Raise CallErrException if the server raises an exception.
 */
HClient.prototype.evaluate = function(expr, callback) {
  var b = new HGridBuilder();
  b.addCol("expr");
  b.addRow([HStr.make(expr)]);
  this.call("eval", b.toGrid(), callback);
};

/**
 * Call "evalAll" operation to evaluate a batch of vendor specific
 * expressions on the server. See "eval" method for list of vendor
 * expression formats.  The request grid must specify an "expr" column.
 * A separate grid is returned for each row in the request.  If checked
 * is false, then this call does *not* automatically check for error
 * grids.  Client code must individual check each grid for partial
 * failures using "Grid.isErr".  If checked is true and one of the
 * requests failed, then raise CallErrException for first failure.
 * @param {string[]} req
 * @param {boolean} checked - optional, defaults to true
 * @param {function} callback
 * @return {HGrid[]}
 */
HClient.prototype.evalAll = function(req, checked, callback) {
  var _checked = checked;
  var _callback = callback;
  if (typeof(_checked)==='function') {
    callback = _checked;
    _checked = true;
  }

  var self = this;
  var i;
  if (!(req instanceof HGrid)) {
    var b = new HGridBuilder();
    b.addCol("expr");
    for (i = 0; i < req.length; ++i) b.addRow([HStr.make(req[i])]);
    req = b.toGrid();
  }

  getWriter(self).gridToString(req, function(err, reqStr) {
    if (err) {
      _callback(err);
    } else {

      postString(self, "evalAll", reqStr, function(err, str) {
        new getReader(self, str).readGrids(function (err, res) {
          if (_checked) {
            for (i = 0; i < res.length; ++i) {
              if (res[i].isErr()) {
                _callback(new Error(res[i]));
                return;
              }
            }
          }
          _callback(null, res);
        });
      });
    }
  });
};

//////////////////////////////////////////////////////////////////////////
// Watches
//////////////////////////////////////////////////////////////////////////

/**
 * Create a new watch with an empty subscriber list.  The dis
 * string is a debug string to keep track of who created the watch.
 * @param {string} dis
 * @param {HNum} lease
 * @return {HClientWatch}
 */
HClient.prototype.watchOpen = function(dis, lease) {
  return new HClientWatch(this, dis, lease);
};

/**
 * List the open watches associated with this HClient.
 * This list does *not* contain a watch until it has been successfully
 * subscribed and assigned an identifier by the server.
 * @return {HWatch[]}
 */
HClient.prototype.watches = function() {
  var keys = Object.keys(this.uwatches);
  var vals = [];
  for (var i = 0; i < keys.length; i++)
    vals[i] = this.uwatches[keys[i]];
  return vals;
};

/**
 * Lookup a watch by its unique identifier associated with this HClient.
 * If not found return null or raise UnknownWatchException based on
 * checked flag.
 * @param {string} id
 * @param {boolean} checked - optional, defaults to true
 * @return {HWatch}
 */
HClient.prototype.watch = function(id, checked) {
  var _checked = checked;
  if (typeof(_checked) === 'undefined') _checked = true;

  var w = this.uwatches[id];
  if (typeof(w) !== 'undefined' && w !== null) return w;
  if (_checked) throw new Error("Unknown Watch: " + id);
  return null;
};

/**
 * @protected
 * @param {HClientWatch} w
 * @param {HRef[]} ids
 * @param {boolean} checked
 * @param {function} callback
 * @return {HGrid[]}
 */
HClient.prototype.watchSub = function(w, ids, checked, callback) {
  if (ids.length === 0) {
    callback(new Error("ids are empty"));
    return;
  }
  if (w.closed) {
    callback(new Error("watch is closed"));
    return;
  }
  var i;

  // grid meta
  var b = new HGridBuilder();
  if (w.uid !== null) b.meta().add("watchId", w.uid);
  if (w.desiredLease !== null) b.meta().add("lease", w.desiredLease);
  b.meta().add("watchDis", w.udis);

  // grid rows
  b.addCol("id");
  for (i = 0; i < ids.length; ++i) b.addRow([ids[i]]);

  // make request
  this.call("watchSub", b.toGrid(), function(err, grid) {
    if (err) {
      // any server side error is considered close
      this.watchClose(w, false);
      callback(err);
      return;
    }

    // make sure watch is stored with its watch id
    if (w.uid === null) {
      w.uid = grid.meta().getStr("watchId");
      w.ulease = grid.meta().get("lease");
      w.client.uwatches[w.uid] = w;
    }

    // if checked, then check it
    if (checked) {
      if (grid.numRows() !== ids.length && ids.length > 0) {
        callback(new Error("Unknown Rec: " + ids[0]));
        return;
      }
      for (i = 0; i < grid.numRows(); ++i) {
        if (grid.row(i).missing("id")) {
          callback(new Error("Unknown Rec: " + ids[i]));
          return;
        }
      }
    }

    callback(null, grid);
  });
};

/**
 * @protected
 * @param {HClientWatch} w
 * @param {HRef[]} ids
 * @param {function} callback
 */
HClient.prototype.watchUnsub = function(w, ids, callback) {
  if (ids.length === 0) {
    callback(new Error("ids are empty"));
    return;
  }
  if (w.uid === null) {
    callback(new Error("nothing subscribed yet"));
    return;
  }
  if (w.closed) {
    callback(new Error("watch is closed"));
    return;
  }

  // grid meta
  var b = new HGridBuilder();
  b.meta().add("watchId", w.uid);

  // grid rows
  b.addCol("id");
  for (var i = 0; i < ids.length; ++i) b.addRow([ids[i]]);

  // make request
  this.call("watchUnsub", b.toGrid(), callback);
};

/**
 * @protected
 * @param {HClientWatch} w
 * @param {boolean} refresh
 * @param {function} callback
 * @returns {HGrid}
 */
HClient.prototype.watchPoll = function(w, refresh, callback) {
  if (w.uid === null) {
    callback(new Error("nothing subscribed yet"));
    return;
  }
  if (w.closed) {
    callback(new Error("watch is closed"));
    return;
  }

  // grid meta
  var b = new HGridBuilder();
  b.meta().add("watchId", w.uid);
  if (refresh) b.meta().add("refresh");
  b.addCol("empty");

  // make request
  this.call("watchPoll", b.toGrid(), function(err, grid) {
    if (err) {
      // any server side error is considered close
      this.watchClose(w, false);
      callback(err);
      return;
    }
    callback(null, grid);
  })
};

/**
 * @protected
 * @param {HClientWatch} w
 * @param {boolean} send
 * @param {function} callback
 */
HClient.prototype.watchClose = function(w, send, callback) {
  // mark flag on watch itself, short circuit if already closed
  if (w.closed) return;
  w.closed = true;

  // remove it from my lookup table
  if (w.uid !== null) delete this.uwatches[w.uid];

  // optionally send close message to server
  if (send) {
    var b = new HGridBuilder();
    b.meta().add("watchId", w.uid).add("close");
    b.addCol("id");
    this.call("watchUnsub", b.toGrid(), callback);
    return;
  }

  if (callback) callback(null, null);
};

//////////////////////////////////////////////////////////////////////////
// PointWrite
//////////////////////////////////////////////////////////////////////////

/**
 * Write to a given level of a writable point, and return the current status
 * of a writable point's priority array (see pointWriteArray()).
 *
 * @param {HRef} id Ref identifier of writable point
 * @param {int} level Number from 1-17 for level to write
 * @param {string} who optional username performing the write, otherwise user dis is used
 * @param {HVal} val value to write or null to auto the level
 * @param {HNum} dur Number with duration unit if setting level 8
 * @param {function} callback
 * @returns {HGrid}
 */
HClient.prototype.pointWrite = function(id, level, who, val, dur, callback) {
  var b = new HGridBuilder();
  b.addCol("id");
  b.addCol("level");
  b.addCol("who");
  b.addCol("val");
  b.addCol("duration");

  b.addRow([id, HNum.make(level), HStr.make(who), val, dur]);

  this.call("pointWrite", b.toGrid(), callback);
};

/**
 * Return the current status
 * of a point's priority array.
 * The result is returned grid with following columns:
 * <ul>
 *   <li>level: number from 1 - 17 (17 is default)
 *   <li>levelDis: human description of level
 *   <li>val: current value at level or null
 *   <li>who: who last controlled the value at this level
 * </ul>
 * @param {HRef} id
 * @param {function} callback
 * @returns {HGrid}
 */
HClient.prototype.pointWriteArray = function(id, callback) {
  var b = new HGridBuilder();
  b.addCol("id");
  b.addRow([id]);

  this.call("pointWrite", b.toGrid(), callback);
};

//////////////////////////////////////////////////////////////////////////
// History
//////////////////////////////////////////////////////////////////////////

/**
 * Read history time-series data for given record and time range. The
 * items returned are exclusive of start time and inclusive of end time.
 * Raise exception if id does not map to a record with the required tags
 * "his" or "tz".  The range may be either a String or a HDateTimeRange.
 * If HTimeDateRange is passed then must match the timezone configured on
 * the history record.  Otherwise if a String is passed, it is resolved
 * relative to the history record's timezone.
 * @param {HRef} id
 * @param {object} range
 * @param {function} callback
 * @return {HGrid}
 */
HClient.prototype.hisRead = function(id, range, callback) {
  var b = new HGridBuilder();
  b.addCol("id");
  b.addCol("range");
  b.addRow([id, HStr.make(range.toString())]);
  this.call("hisRead", b.toGrid(), callback);
};

/**
 * Write a set of history time-series data to the given point record.
 * The record must already be defined and must be properly tagged as
 * a historized point.  The timestamp timezone must exactly match the
 * point's configured "tz" tag.  If duplicate or out-of-order items are
 * inserted then they must be gracefully merged.
 * @param {HRef} id
 * @param {HHisItem[]} items
 * @param {function} callback
 */
HClient.prototype.hisWrite = function(id, items, callback) {
  var meta = new HDictBuilder().add("id", id).toDict();
  var req = HGridBuilder.hisItemsToGrid(meta, items);
  this.call("hisWrite", req, callback);
};

//////////////////////////////////////////////////////////////////////////
// Actions
//////////////////////////////////////////////////////////////////////////

/**
 * Invoke a remote action using the "invokeAction" REST operation.
 * @param {HRef} id
 * @param {string} action
 * @param {HDict} args
 * @param {function} callbacj
 * @return {HGrid}
 */
HClient.prototype.invokeAction = function(id, action, args, callback) {
  var meta = new HDictBuilder().add("id", id).add("action", action).toDict();
  var req = HGridBuilder.dictsToGrid(meta, [args]);
  this.call("invokeAction", req, callback);
};