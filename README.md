# NodeHaystack

Project haystack light weight node.js compliant client and server implementation.

### [API Documentation](http://lynxspring.bitbucket.org/nodehaystack/)

### Usage

install nodehaystack via console from node application location

    npm install nodehaystack

app.js

    // Module dependencies.
    var hs = require('nodehaystack'),
        express = require('express'),
        bodyParser = require('body-parser'),
        url = require('url');

    // get the database
    var db = new hs.TestDatabase();

    var app = express();

    // all environments
    app.set('port', process.env.PORT || 3000);
    // setup body parser
    app.use(bodyParser.text()); // TODO: modify so body does not need parsed (should be able to read directly from request stream)
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

run from console

    node app.js

### Known Issues

HOp.js - line 152: We should be able to pass in the request object itself and read from it's stream.  This would remove
the requirement for body-parser in the example app.js.

HZincWriter.js - line 86: I am getting a grid from HDictBuilder.toGrid() that has no columns.  This is only happening
when the grid should be HGrid.EMPTY, so there is a catch here to fix the issue.  We should still figure out why
the dict builder is return a grid with no columns though.
