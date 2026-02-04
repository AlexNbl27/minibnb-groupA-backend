import { CacheService } from "../../services/cache.service";
import redisClient from "../../config/redis";

jest.mock("../../config/redis");

const mockRedisClient = redisClient as any;

describe("CacheService", () => {
    let cacheService: CacheService;

    beforeEach(() => {
        cacheService = new CacheService();
        jest.clearAllMocks();
    });

    describe("get", () => {
        it("should return parsed data if key exists", async () => {
            const mockData = { test: true };
            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockData));

            const result = await cacheService.get("test-key");

            expect(mockRedisClient.get).toHaveBeenCalledWith("test-key");
            expect(result).toEqual(mockData);
        });

        it("should return null if key does not exist", async () => {
            mockRedisClient.get.mockResolvedValueOnce(null);

            const result = await cacheService.get("test-key");

            expect(result).toBeNull();
        });
    });

    describe("set", () => {
        it("should set key with ttl and stringified value", async () => {
            const mockData = { test: true };

            await cacheService.set("test-key", mockData, 3600);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith("test-key", 3600, JSON.stringify(mockData));
        });
    });

    describe("del", () => {
        it("should delete key", async () => {
            await cacheService.del("test-key");

            expect(mockRedisClient.del).toHaveBeenCalledWith("test-key");
        });
    });

    describe("invalidatePattern", () => {
        it("should delete all keys matching pattern", async () => {
            mockRedisClient.keys.mockResolvedValueOnce(["key1", "key2"]);

            await cacheService.invalidatePattern("pattern*");

            expect(mockRedisClient.keys).toHaveBeenCalledWith("pattern*");
            expect(mockRedisClient.del).toHaveBeenCalledWith(["key1", "key2"]);
        });

        it("should do nothing if no keys match", async () => {
            mockRedisClient.keys.mockResolvedValueOnce([]);

            await cacheService.invalidatePattern("pattern*");

            expect(mockRedisClient.del).not.toHaveBeenCalled();
        });
    });
});
