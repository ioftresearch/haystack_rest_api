const mongoose = require('mongoose');
const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/Haystack');
connection.on('connected', function () {
    console.log('database is connected successfully');
})

module.exports = connection