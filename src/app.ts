import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { cacheControlMiddleware } from "./middlewares/cache.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

// Middlewares globaux
// Configure Helmet with exceptions for Swagger UI
app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === "development"
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
            },
          },
  }),
);

// CORS configuration - Allow frontend and same-origin (for Swagger UI)
const allowedOrigins = [env.FRONTEND_URL, ...(env.BACKEND_URL ? [env.BACKEND_URL] : []), `http://localhost:${env.PORT}`, ...(env.NODE_ENV === "development" ? ["http://localhost:3000"] : [])].filter(
  Boolean,
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Swagger documentation
const swaggerMiddleware = [swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any];
app.use("/docs", ...swaggerMiddleware);
app.use("/v1/docs", ...swaggerMiddleware);
app.use("/api/v1/docs", ...swaggerMiddleware);

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
    docs: ["/docs", "/v1/docs", "/api/v1/docs"],
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
