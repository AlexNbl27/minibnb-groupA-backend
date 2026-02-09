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
      headers: {},
    };
    res = {
      json: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return cached response if key exists", async () => {
    const cachedData = { data: "cached" };
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(cachedData));

    await cacheMiddleware(60)(req as Request, res as Response, next);

    expect(mockRedisClient.get).toHaveBeenCalledWith("cache:/test");
    expect(res.setHeader).toHaveBeenCalledWith("ETag", expect.stringContaining("W/"));
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, max-age=60");
    expect(res.json).toHaveBeenCalledWith(cachedData);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 304 if ETag matches", async () => {
    const cachedData = { data: "cached" };
    const cachedString = JSON.stringify(cachedData);
    mockRedisClient.get.mockResolvedValueOnce(cachedString);

    // Calculate the expected ETag
    const crypto = require("crypto");
    const expectedEtag = `W/"${crypto.createHash("md5").update(cachedString).digest("hex")}"`;

    req.headers = { "if-none-match": expectedEtag };

    await cacheMiddleware(60)(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
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
    (res.json as any)(responseData);

    expect(mockRedisClient.setEx).toHaveBeenCalledWith("cache:/test", 60, JSON.stringify(responseData));
    expect(res.setHeader).toHaveBeenCalledWith("ETag", expect.stringContaining("W/"));
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, max-age=60");
  });

  it("should return 304 when ETag matches on new response", async () => {
    mockRedisClient.get.mockResolvedValueOnce(null);

    const responseData = { data: "new" };
    const dataString = JSON.stringify(responseData);
    const crypto = require("crypto");
    const expectedEtag = `W/"${crypto.createHash("md5").update(dataString).digest("hex")}"`;

    req.headers = { "if-none-match": expectedEtag };

    await cacheMiddleware(60)(req as Request, res as Response, next);

    // Trigger the overridden json method
    (res.json as any)(responseData);

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
  });

  it("should ignore redis errors and call next", async () => {
    mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"));

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await cacheMiddleware(60)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
