var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();


/// Settings
app.set('json spaces', 40);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var indexRoutes = require('./routes/index');
var jobRoutes = require('./routes/jobs');

app.use('/', indexRoutes);
app.use('/jobs', jobRoutes);


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
