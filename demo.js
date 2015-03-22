var App = require('./app'),
    TestDatabase = require('./test/TestDatabase');

//var server = new App("Node Haystack app", TestDatabase, (process.env.PORT || 3000), '');

var name, port, prefix;

for (var i=0; i<process.argv.length; i++) {
  if (process.argv[i]==='-name') name = process.argv[++i];
  if (process.argv[i]==='-port') port = process.argv[++i];
  if (process.argv[i]==='-prefix') prefix = process.argv[++i];
}
// parse args and see if we have defined anything,
var server = new App(name, TestDatabase, port, prefix);
server.start();