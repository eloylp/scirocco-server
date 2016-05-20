var mongoose = require('mongoose');
var dbName;
switch (process.env.APP_ENV) {

    case 'production':
        dbName = 'dds';
        break;
    case 'development':
        dbName = 'ddsdev';
        break;
    case 'testing':
        dbName = 'ddstesting';
        break;
    default:
        dbName = 'ddsdev';
        break;
}
var dbURI = process.env.MONGO_URL + '/' + dbName;


mongoose.connect(dbURI);

mongoose.set('debug', (process.env.APP_ENV == 'development' || process.env.APP_ENV == 'testing'));

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});


exports.message = require('./message');





