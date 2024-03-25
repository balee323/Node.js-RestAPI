'use strict';
var express = require('express');
var router = express.Router();
var logger = require('.././logger');
var secretsManager = require('.././AwsSecretsManager');

const authToken = "166c2589-3036-4683-be32-e7b2f6aeb324";



router.put('/', async (req, res) => {


    try {
        if (!isValidAuthToken(req)) {
            res.send("Invalid authorization token.");
            return;
        }

        logger.info("request made to users/get/.");

        var password = await secretsManager.getSecret("password");



        //validate request
        //database add new charger resource


        res.send('New charger resource ID: ${req.Id} has been added.');
    }
    catch (exception) {
        logger.error(exception);
        res.status(500).send({ error: 'Internal server error. Please contact support.' })
    }
  
});



function isValidAuthToken(req) {

    var token = req.header('authorization');

    if (token === authToken) {
        return true;
    };

    return false;

}


module.exports = router;