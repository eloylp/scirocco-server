var config = require('./config');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var auth = require('./middlewares/auth');
var app = express();


/// Settings
app.set('json spaces', 40);
app.set('config', config);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(auth.check);

var indexRoutes = require('./routes/index');
var messageRoutes = require('./routes/messages');
var batchRoutes = require('./routes/batches');


app.use('/', indexRoutes);
app.use('/messages', messageRoutes);
app.use('/batches', batchRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {

    if(err.name == 'ValidationError'){
      res.status(400);
    }else if(err.status){
      res.status(err.status);
    }else{
      res.status(500);
    }
    res.json({
      message: err.message,
      errors: err.errors
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  if(err.name == 'ValidationError'){
    res.status(400);
  }else if(err.status){
    res.status(err.status);
  }else{
    res.status(500);
  }
  res.json({
    message: err.message,
    errors: err.errors
  });
});

module.exports = app;
