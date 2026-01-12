import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gestion d'erreurs
app.use(errorHandler);

// Démarrage
const start = async () => {
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

start();
