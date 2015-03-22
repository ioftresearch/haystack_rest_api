# NodeHaystack

Project haystack light weight node.js compliant client and server implementation.

### [API Documentation](http://lynxspring.bitbucket.org/nodehaystack/)

### Usage

npm install nodehaystack

index.js

    var hs = require('nodehaystack');

    var app = new hs.app('Node Haystack Toolkit', hs.TestDatabase, 3000, '');

    app.start();

