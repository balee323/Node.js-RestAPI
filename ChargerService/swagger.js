const swaggerJSDoc = require('swagger-jsdoc');

var swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Charger Service',
        version: '1.0.0',
        description: 'Charger Service Swagger documentation and interaction.',
    },
};

var options = {
    swaggerDefinition: swaggerDefinition,
    apis: ['./ routes/*.js'], // Path to the API routes in your Node.js application
};

var swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;