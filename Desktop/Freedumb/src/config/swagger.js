const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FREEDUMB API',
      version: '1.0.0',
      description: 'AI-Powered Personal Finance Management API',
      contact: {
        name: 'FREEDUMB Support',
        email: 'support@freedumb.ai'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.freedumb.ai/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js', './openapi.yaml']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;