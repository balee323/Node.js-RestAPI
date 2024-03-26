
var pino = require('pino');

var date = new Date();
var year = date.getFullYear();
var month = String(date.getMonth() + 1).padStart(2, '0');
var day = String(date.getDate()).padStart(2, '0');

module.exports = pino(
    {
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    //use special backtick `
    pino.destination(`${__dirname}/logs/ChargerService_${year}_${month}_${day}.log`) 
);