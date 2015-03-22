// Module dependencies.
var bodyParser = require('body-parser'),
    express = require('express'),
    url = require('url');

function App(db, port, prefix) {
  this.app = express();
  this.app.set('port', port);
  this.db = db;
  this.prefix = prefix.length>0 ? '/' + prefix : prefix;
}
module.exports = App;

App.prototype.start = function() {
  var self = this;
  // setup body parser
  self.app.use(bodyParser.text());
  self.app.all(self.prefix + '*', function(req, res) {
    // if root, then redirect to {haystack}/about
    var path = url.parse(req.url).pathname
    if (self.prefix.length>0) path = path.substring(self.prefix.length);
    if (typeof(path) === 'undefined' || path === null || path.length === 0 || path === "/") {
      res.redirect(self.prefix + "/about");
      return;
    }

    // parse URI path into "/{opName}/...."
    var slash = path.indexOf('/', 1);
    if (slash < 0) slash = path.length;
    var opName = path.substring(1, slash);

    // resolve the op
    self.db.op(opName, false, function(err, op) {
      if (typeof(op) === 'undefined' || op === null) {
        res.status(404);
        res.send("404 - Not Found");
        return;
      }

      // route to the op
      op.onServiceOp(self.db, req, res, function(err) {
        if (err) {
          console.log(e.stack);
          throw e;
        }
      });
    });
  });

  var server = self.app.listen(self.app.get('port'), function() {

    var host = server.address().address;
    var port = server.address().port;

    if (host.length === 0 || host === "::") host = "localhost";

    console.log('Node Haystack app listening at http://%s:%s', host, port);

  });
}
