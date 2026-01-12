import { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";

export const cacheMiddleware = (ttl: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }

            // Override res.json pour cacher la réponse
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                redisClient.setEx(key, ttl, JSON.stringify(body));
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error("Cache error:", error);
            next();
        }
    };
};
