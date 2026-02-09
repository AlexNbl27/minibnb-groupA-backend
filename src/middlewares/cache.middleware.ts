import { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";
import { env } from "../config/env";
import crypto from "crypto";

export const cacheMiddleware = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // Generate ETag for cached data
        const etag = `W/"${crypto.createHash("md5").update(cachedData).digest("hex")}"`;
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", `private, max-age=${ttl}`);

        // Check if client sent If-None-Match header
        const clientEtag = req.headers["if-none-match"];
        if (clientEtag === etag) {
          // Content hasn't changed, return 304
          return res.status(304).end();
        }

        return res.json(JSON.parse(cachedData));
      }

      // Override res.json pour cacher la réponse ET gérer les ETags
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const dataString = JSON.stringify(body);

        // Generate ETag
        const etag = `W/"${crypto.createHash("md5").update(dataString).digest("hex")}"`;
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", `private, max-age=${ttl}`);

        // Check if client sent If-None-Match header
        const clientEtag = req.headers["if-none-match"];
        if (clientEtag === etag) {
          // Content hasn't changed, return 304
          res.status(304).end();
          return res;
        }

        // Cache the response
        redisClient.setEx(key, ttl, dataString);
        return originalJson(body);
      };

      next();
    } catch (error) {
      if (env.NODE_ENV !== "test") {
        console.error("Cache error:", error);
      }
      next();
    }
  };
};

/**
 * Middleware to set Cache-Control headers for routes without Redis cache
 */
export const cacheControlMiddleware = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set Cache-Control header
    res.setHeader("Cache-Control", `private, max-age=${maxAge}`);
    next();
  };
};
