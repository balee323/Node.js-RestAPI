'use strict';
var express = require('express');
var router = express.Router();
var logger = require('.././logger');
var dataLayer = require('.././DataLayer');

const authToken = "166c2589-3036-4683-be32-e7b2f6aeb324";

//update
router.put('/', async (req, res) => {


    try {
        if (!isValidAuthToken(req)) {
            res.send("Invalid authorization token.");
            return;
        }

        logger.info("request made to users/get/.");


        var name = req.body.name;

        //need class to validate request

        var isSuccessful = await dataLayer.updateCharger(req);

        //for insert verb.  Move this to other endpoint
        //var isSuccessful = await dataLayer.insertCharger(req);

        if (!isSuccessful) {
            res.status(500).send({ error: 'Internal server error. Please contact support.' })
            return
        }
 
        res.send(`New charger resource ID: ${name} has been added.`);
    }
    catch (exception) {
        logger.error(exception);

        var errorMessage = exception.toString();

        if (errorMessage.includes("BAD REQUEST:")) {
         
            res.status(400).send(`errror: ${errorMessage}`);
        }
        else {
            res.status(500).send({ error: 'Internal server error. Please contact support.' })
        }      
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
