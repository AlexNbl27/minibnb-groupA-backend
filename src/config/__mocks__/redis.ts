export const redisClient = {
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    isReady: true,
};

export const connectRedis = jest.fn();

export default redisClient;
