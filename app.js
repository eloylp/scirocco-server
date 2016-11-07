/// Load environment.

var env = require('node-env-file');
try {
    env(__dirname + '/.env');
} catch (err) {
    console.error("Error reading .env file. You can copy an example from .env.dist .");
    process.exit(1);
}

/// Dependencies

var config = require('./config.js');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var authMiddleware = require('./middlewares/auth');
var requestTreatmentMiddleWare = require('./middlewares/requestTreatment');
var errorHandlersMiddleWare = require('./middlewares/errorHandlers');
var app = express();

/// Settings

app.set('port', process.env.SCIROCCO_PORT || 8000);
app.set('env', process.env.SCIROCCO_ENV || 'development');
app.set('x-powered-by', false);
app.set('json spaces', 40);
app.set('config', config);


/// Middlewares add


app.use(logger('dev'));
app.use(bodyParser.json({limit: config.sizeLimits.json}));
app.use(bodyParser.raw({limit: config.sizeLimits.raw}));
app.use(bodyParser.text({limit: config.sizeLimits.text}));
app.use(authMiddleware.check());
app.use(requestTreatmentMiddleWare.checkContentType());

/// Routing

var indexRoutes = require('./routes/index');
var messageRoutes = require('./routes/messages');
var messageQueueRoutes = require('./routes/messageQueue');


app.use('/', indexRoutes);
app.use('/messages', messageRoutes);
app.use('/messageQueue', messageQueueRoutes);


app.use(errorHandlersMiddleWare.notFoundRedir());
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(errorHandlersMiddleWare.develop());

} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(errorHandlersMiddleWare.production());
}


module.exports = app;
