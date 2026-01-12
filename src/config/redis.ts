import { createClient } from "redis";
import { env } from "./env";

const redisClient = createClient({
    socket: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT),
    },
    password: env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected");
});

export const connectRedis = async () => {
    await redisClient.connect();
};

export default redisClient;
