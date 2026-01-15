import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { env } from './env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MiniBnB API',
            version: '1.0.0',
            description: 'API documentation for MiniBnB application',
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api/v1`,
                description: 'Local server',
            },
            {
                url: `https://minibnb-backend.vincentmagnien.com/api/v1`,
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                        },
                    },
                },
            },
        },
    },
    apis: [
        path.join(__dirname, '../app.{js,ts}'),
        path.join(__dirname, '../routes/**/*.{js,ts}'),
    ], // Path to the API docs - Using __dirname for reliable path resolution
};

export const swaggerSpec = swaggerJsdoc(options);
