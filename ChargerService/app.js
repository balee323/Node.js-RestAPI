'use strict';
var debug = require('debug')('my express app');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dataLayer = require('./DataLayer');
var routes = require('./routes/index');
var users = require('./routes/users');
var charger = require('./routes/charger');
require('dotenv').config(); //I need to research what this actually does (I think it reads local env file?)

// Add Swagger modules
var swaggerUI = require('swagger-ui-express');
var swaggerSpec = require('./swagger');
var logger = require('./logger');
var pinoHTTP = require('pino-http');


var app = express();

app.use(
    pinoHTTP({
        logger
    })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Serve Swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

//initialize Database
var promise = dataLayer.initializeDatabase();

promise.then(function (isSuccess) {
    if (!isSuccess) {
        logger.error("Error initializing DB.")
    }
    if (isSuccess) {
        logger.info("successful initializing DB.")
    }

});

// Routes
app.use('/', routes);
app.use('/users', users);
app.use('/charger', charger);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



var server = app.listen(process.env.SERVICE_PORT, function () {
    console.log('Express server listening on port ' + server.address().port);
});
