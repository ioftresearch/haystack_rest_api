// Module dependencies.
var express = require('express'),
    url = require('url'),
    TestDatabase = require('./test/TestDatabase');

// get the database
var db = new TestDatabase();

var app = express();
var bodyParser = require('body-parser');

// all environments
app.set('port', process.env.PORT || 3000);
// setup body parser
app.use(bodyParser.text());
app.all('*', function(req, res) {
  // if root, then redirect to {haystack}/about
  var path = url.parse(req.url).pathname;
  if (typeof(path) === 'undefined' || path === null || path.length === 0 || path === "/") {
    res.redirect("/about");
    return;
  }

  // parse URI path into "/{opName}/...."
  var slash = path.indexOf('/', 1);
  if (slash < 0) slash = path.length;
  var opName = path.substring(1, slash);

  // resolve the op
  db.op(opName, false, function(err, op) {
    if (typeof(op) === 'undefined' || op === null) {
      res.status(404);
      res.send("404 - Not Found");
      return;
    }

    // route to the op
    op.onServiceOp(db, req, res, function(err) {
      if (err) {
        console.log(e.stack);
        throw e;
      }
    });
  });
});

var server = app.listen(app.get('port'), function() {

  var host = server.address().address;
  var port = server.address().port;

  if (host.length === 0 || host === "::") host = "localhost";

  console.log('Node Haystack app listening at http://%s:%s', host, port);

});
