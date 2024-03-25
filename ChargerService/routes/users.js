'use strict';
var express = require('express');
var router = express.Router();

var logger = require('.././logger');



//const logger = winston.createLogger({
//    level: 'info',
//    format: winston.format.json(),
//    transports: [new winston.transports.Console()],
//});

/* GET users listing. */
router.get('/', function (req, res) {

    var token = req.header('authorization');

    logger.info("request made to users/get/.");

    res.send('respond with a resource');
});



//function getAuthorizationToken(request) {

//    var token = req.header('authorization');

//    return token;

//}


module.exports = router;
