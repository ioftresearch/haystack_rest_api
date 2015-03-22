var App = require('./app'),
    TestDatabase = require('./test/TestDatabase');

var server = new App(new TestDatabase(), (process.env.PORT || 3000), '');
server.start();