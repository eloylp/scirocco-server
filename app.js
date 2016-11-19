/// Load environment.
if (!process.env.SCIROCCO_NO_ENV_FILE) {

    var env = require('node-env-file');
    try {
        env(__dirname + '/.env');
    } catch (err) {
        console.error("Error reading .env file. You can copy an example from .env.dist .");
        process.exit(1);
    }
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

app.set('port', config.port);
app.set('env', config.environment);
app.set('x-powered-by', config.xPoweredBy);
app.set('json spaces', config.jsonSpaces);
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
var globalDataSpace = require('./routes/globalDataSpace');


app.use('/', indexRoutes);
app.use('/messages', messageRoutes);
app.use('/messageQueue', messageQueueRoutes);
app.use('/globalDataSpace', globalDataSpace);


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
