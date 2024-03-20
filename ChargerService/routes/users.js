'use strict';
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {

    var token = req.header('authorization');

    res.send('respond with a resource');
});



//function getAuthorizationToken(request) {

//    var token = req.header('authorization');

//    return token;

//}


module.exports = router;
