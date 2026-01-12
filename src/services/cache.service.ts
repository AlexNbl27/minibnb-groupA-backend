import redisClient from "../config/redis";

export class CacheService {
    async get<T>(key: string): Promise<T | null> {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl: number): Promise<void> {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
    }

    async del(key: string): Promise<void> {
        await redisClient.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }

    // Invalidations spécifiques
    async invalidateListingCache(listingId: number): Promise<void> {
        await this.invalidatePattern(`cache:/api/v1/listings/${listingId}*`);
        await this.invalidatePattern("cache:/api/v1/listings?*");
    }

    async invalidateBookingCache(listingId: number): Promise<void> {
        await this.invalidatePattern(`cache:listing:${listingId}:availability`);
    }
}
