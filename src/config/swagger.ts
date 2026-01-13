import swaggerJsdoc from 'swagger-jsdoc';
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
    apis: ['./src/app.ts', './src/routes/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
