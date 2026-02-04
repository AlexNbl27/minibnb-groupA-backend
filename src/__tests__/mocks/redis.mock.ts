export const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    isReady: true,
};


