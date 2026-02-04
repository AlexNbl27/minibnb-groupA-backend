import { cacheMiddleware } from "../../middlewares/cache.middleware";
import redisClient from "../../config/redis";
import { Request, Response, NextFunction } from "express";

jest.mock("../../config/redis");

const mockRedisClient = redisClient as any;

describe("CacheMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            originalUrl: "/test",
        };
        res = {
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return cached response if key exists", async () => {
        const cachedData = { data: "cached" };
        mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(cachedData));

        await cacheMiddleware(60)(req as Request, res as Response, next);

        expect(mockRedisClient.get).toHaveBeenCalledWith("cache:/test");
        expect(res.json).toHaveBeenCalledWith(cachedData);
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next if cache miss", async () => {
        mockRedisClient.get.mockResolvedValueOnce(null);
        const originalJson = res.json;

        await cacheMiddleware(60)(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(originalJson).not.toHaveBeenCalled(); // Original request didn't finish yet
    });

    it("should cache response on next call", async () => {
        mockRedisClient.get.mockResolvedValueOnce(null);
        const originalJson = res.json;

        await cacheMiddleware(60)(req as Request, res as Response, next);

        // Trigger the overridden json method
        const responseData = { data: "new" };
        res.json!(responseData); // Use the overridden method

        expect(mockRedisClient.setEx).toHaveBeenCalledWith("cache:/test", 60, JSON.stringify(responseData));
        expect(originalJson).toHaveBeenCalledWith(responseData);
    });

    it("should ignore redis errors and call next", async () => {
        mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"));

        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        await cacheMiddleware(60)(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
