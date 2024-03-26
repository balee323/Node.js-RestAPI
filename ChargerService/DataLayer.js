var mysql = require('mysql');
var secretsManager = require('./AwsSecretsManager');
var logger = require('./logger');


class DataLayer {

    static async initializeDatabase() {

        var password = await secretsManager.getSecret("password");

        var connection = mysql.createConnection({
            host: 'chargerdb.cvymeemaolhs.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: password,
            port: '3306',
            database: 'chargerdb',
            timeout: 60000
        });

        var isSuccessful = true;

        // verify can connect to Database (via promise for async)
        var connectionPromise = new Promise((resolve, onError) => {
            connection.connect(function (err) {
                if (err) {
                    logger.error(err);
                    isSuccessful = false;
                }
                else
                {
                    logger.info('Connected to database.');
                    isSuccessful = true;
                }

                resolve(isSuccessful);
            })           
        });

        await connectionPromise;

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

        const createTodosTable = `create table if not exists Chargers(
                          ID int primary key auto_increment,
                          Name varchar(255) not null,
                          Description varchar(255) not null,
                          Status varchar(255) not null,
                          Location varchar(255) not null,
                          Network_Protocol varchar(255) not null,
                          Public_Visibility bool not null default false
                      )`;


        var createTablePromise = new Promise((resolve, onError) => {

            connection.query(createTodosTable, (err, results, fields) => {
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
  

}
module.exports = DataLayer;

