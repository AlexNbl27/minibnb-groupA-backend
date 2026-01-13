import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any); // as any pour éviter les erreurs de type

// Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the server
 *     responses:
 *       200:
 *         description: Server is up and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to MiniBnB API",
        docs: "/api-docs",
        health: "/health",
    });
});

// Gestion d'erreurs
app.use(errorHandler);

// Démarrage
export const start = async () => {
    try {
        await connectRedis();
        app.listen(env.PORT, () => {
            console.log(`🚀 Server running on http://localhost:${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}

export default app;
