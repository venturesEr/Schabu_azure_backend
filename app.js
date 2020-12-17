var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testAPIRouter = require("./routes/testAPI");
var expireCode = require("./routes/expire")
var database = require("./routes/wav_file_conversion");
var postRec = require("./routes/handleRec")
var getJob = require("./routes/getJobs")
var voiceSense = require("./routes/voiceSense");
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// fetch json object
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/", indexRouter)
app.use('/getQuestion', database);
app.use('/users', usersRouter);
app.use("/testAPI", testAPIRouter);
app.use('/expire', expireCode);
app.use('/postRec', postRec)
app.use('/getJobs', getJob)
app.use("/voicesense", voiceSense);
//app.use("/expireCode", expireCodecheck)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
