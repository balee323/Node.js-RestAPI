var mysql = require('mysql');
var secretsManager = require('./AwsSecretsManager');
var logger = require('./logger');


class DataLayer {

    static async getDatabaseConnection() {

        var password = await secretsManager.getSecret("password");

        var connection = mysql.createConnection({
            host: 'chargerdb.cvymeemaolhs.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: password,
            port: '3306',
            database: 'chargerdb',
            timeout: 60000
        });

        return connection;
    }

    static async openConnection(connection) {

        var isSuccessful = true;

        // verify can connect to Database (via promise for async)
        var connectionPromise = new Promise((resolve, onError) => {
            connection.connect(function (err) {
                if (err) {
                    logger.error(err);
                    isSuccessful = false;
                }
                else {
                    logger.info('Connected to database.');
                    isSuccessful = true;
                }

                resolve(isSuccessful);
            })
        });

        await connectionPromise;

        return isSuccessful;
    }

    static async insertCharger(request) {

        var requestId = request.body.id;

        if (request !== undefined) {
            throw new error("Detected Device Id.  DeviceIds are auto-incremented and are not included create requests.")
        }

        var isSuccessful = true;

        var connection = await this.getDatabaseConnection();

        isSuccessful = await this.openConnection(connection);

        if (!isSuccessful) {
            return false;
        }

        //insert
        const insertQuery = `insert into chargerdb.Chargers
            (Name, Description, Status, Location, Network_Protocol, Public_Visibility)
            Values 
            (
                ${request.name},
                ${request.description},
                ${request.status},
                ${request.location},
                ${request.networkProtocol},
                ${request.publicVisibility}

            )`;

        var insertPromise = new Promise((resolve, onError) => {

            connection.query(insertQuery, (err, results, fields) => {
                if (err) {
                    logger.error(err);
                    isSuccessful = false
                }
                else {
                    logger.info("table created");
                    isSuccessful = true
                }
                resolve([isSuccessful, results]);

            });
        });

        var results = await insertPromise;

        if (!isSuccessful) {
            return false;
        }

        connection.end((err) => {
            if (err) {
                return logger.error(err);
            }
            logger.info("Database connection closed.")
        });

        return true;
    }

    static async updateCharger(request) {

        var chargerId = request.body.id;

        if (!chargerId) {
            throw new Error("BAD REQUEST: No Detected Device Id.  DeviceIds are required for update requests.")
        }

        var isSuccessful = true;

        var connection = await this.getDatabaseConnection();

        isSuccessful = await this.openConnection(connection);

        if (!isSuccessful) {
            return false;
        }

        // const selectQuery = `SELECT * FROM chargerdb.Chargers WHERE ID = ${request.id} LIMIT 1`;

        const ifExistsCountQuery = `SELECT Count(ID) FROM chargerdb.Chargers WHERE ID = ${chargerId}`;

        var createifExistsPromise = new Promise((resolve, onError) => {

            connection.query(ifExistsCountQuery, (err, results, fields) => {
                if (err) {
                    logger.error(err);
                    isSuccessful = false
                }
                else {
                    logger.info("table created");
                    isSuccessful = true
                }
                resolve([isSuccessful, results]);

            });
        });

        var results = await createifExistsPromise;

        isSuccessful = results[0];

        if (!isSuccessful) {
            return false;
        }

        var returnArray = results[1];
        var count = returnArray[0]["Count(ID)"];


        //update
        if (count == 1) {

            var updateQuery = this.buildUpdateQueryString(request.body);

            console.log(updateQuery);

            var updatePromise = new Promise((resolve, onError) => {
                
                connection.query(updateQuery, (err, results, fields) => {
                    if (err) {
                        logger.error(err);
                        isSuccessful = false
                    }
                    else {
                        logger.info("table created");
                        isSuccessful = true
                    }
                    resolve([isSuccessful, results]);

                });
            });

            var results = await updatePromise;

            if (!isSuccessful) {
                return false;
            }

        }
        else {
            throw new Error("BAD REQUEST: Device ID does not exist.")
        }

        connection.end((err) => {
            if (err) {
                return logger.error(err);
            }
            logger.info("Database connection closed.")
        });

        return true;
    }

    static async initializeDatabase() {


        var isSuccessful = true;

        var connection = await this.getDatabaseConnection();

        isSuccessful = await this.openConnection(connection);

        if (!isSuccessful) {
            return false;
        }
       
        var createDBPromise = new Promise((resolve, onError) => {
            connection.query("CREATE DATABASE if not exists chargerdb", function (err, result) {
                if (err) {
                    logger.error(err);
                    isSuccessful = false
                }
                else {
                    logger.info("Database created");
                    isSuccessful = true
                }
                resolve(isSuccessful);

            });
        });

        await createDBPromise;

        if (!isSuccessful) {
            return false;
        }

        const createChargersTable = `create table if not exists Chargers(
                          ID int primary key not null AUTO_INCREMENT,
                          Name varchar(255) not null,
                          Description varchar(255) not null,
                          Status varchar(255) not null,
                          Location varchar(255) not null,
                          Network_Protocol varchar(255) not null,
                          Public_Visibility bool not null default false
                      )`;


        var createTablePromise = new Promise((resolve, onError) => {

            connection.query(createChargersTable, (err, results, fields) => {
                if (err) {
                    logger.error(err);
                    isSuccessful = false
                }
                else {
                    logger.info("table created");
                    isSuccessful = true
                }
                resolve(isSuccessful);

            });
        });

        await createTablePromise;

        if (!isSuccessful) {
            return false;
        }

        connection.end((err) => {
            if (err) {
                return logger.error(err);
            }
            logger.info("Database connection closed.")
        });

        return true;
    }

    //This function could use some unit tests (or find a better way to do this. In code SQL strings are generally bad)
    //MySQL supports stored procedures, and that would be the ideal way to insert/update records, esepcially lists or JSON.
    static buildUpdateQueryString(requestBody) {

        var locationJsonString = null;
        if (requestBody.location) {
            locationJsonString = JSON.stringify(requestBody.location)
        }

        var updateQuery = 'UPDATE chargerdb.Chargers SET ';

        requestBody.name !== undefined && requestBody.name !== null ? updateQuery
            += ` Name = '${requestBody.name}', ` : updateQuery;

        requestBody.description !== undefined && requestBody.description !== null ? updateQuery
            += ` Description = '${requestBody.description}', ` : updateQuery;

        requestBody.status !== undefined && requestBody.status !== null ? updateQuery
            += ` Status = '${requestBody.status}', ` : updateQuery;

        requestBody.location !== undefined && requestBody.location !== null ? updateQuery
            += ` Location = '${locationJsonString}', ` : updateQuery;

        requestBody.networkProtocol !== undefined && requestBody.networkProtocol !== null ? updateQuery
            += ` Network_Protocol ='${requestBody.networkProtocol}', ` : updateQuery;

        requestBody.publicVisibility !== undefined && requestBody.publicVisibility !== null ? updateQuery
            += ` Public_Visibility = ${requestBody.publicVisibility} ` : updateQuery;

        //remove any trailing commas
        updateQuery.replace(/,(\s+)?$/, '');

        updateQuery += ` WHERE ID = ${requestBody.id}`;

        return updateQuery;
    }

}
module.exports = DataLayer;

