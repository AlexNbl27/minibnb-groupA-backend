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
                url: `https://minibnb-backend.vincentmagnien.com/api`,
                description: 'Production server',
            },
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
    apis: [path.join(process.cwd(), 'dist/app.js'), path.join(process.cwd(), 'dist/routes/**/*.js')], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
