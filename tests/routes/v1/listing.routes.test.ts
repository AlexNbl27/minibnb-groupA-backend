import request from 'supertest';
import { ListingService } from '../../../src/services/listing.service';
import { CacheService } from '../../../src/services/cache.service';

// Mocks
const mockGetAll = jest.fn();
const mockGetById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockInvalidatePattern = jest.fn();
const mockInvalidateListingCache = jest.fn();

jest.mock('../../../src/services/listing.service', () => {
    return {
        ListingService: jest.fn().mockImplementation(() => ({
            getAll: mockGetAll,
            getById: mockGetById,
            create: mockCreate,
            update: mockUpdate,
            delete: mockDelete,
        })),
    };
});

jest.mock('../../../src/services/cache.service', () => {
    return {
        CacheService: jest.fn().mockImplementation(() => ({
            invalidatePattern: mockInvalidatePattern,
            invalidateListingCache: mockInvalidateListingCache,
        })),
    };
});

jest.mock('../../../src/config/redis');

// Mock Auth Middleware
jest.mock('../../../src/middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'host@test.com' };
        next();
    },
}));

import app from '../../../src/app';

describe('Listing Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/listings', () => {
        it('should return all listings', async () => {
            const mockListings = [{ id: 1, name: 'Villa' }];
            mockGetAll.mockResolvedValue({ data: mockListings, total: 1 });

            const response = await request(app).get('/api/v1/listings');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockListings);
            expect(mockGetAll).toHaveBeenCalled();
        });

        it('should pass filters', async () => {
            mockGetAll.mockResolvedValue({ data: [], total: 0 });

            await request(app).get('/api/v1/listings?city=Paris&min_price=100');

            expect(mockGetAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    city: 'Paris',
                    min_price: 100
                }),
                { page: 1, limit: 10 }
            );
        });
    });

    describe('POST /api/v1/listings', () => {
        const newListing = {
            name: 'New Villa with Pool',
            description: 'Beautiful villa',
            picture_url: 'https://example.com/image.jpg',
            price: 200,
            address: '123 Ocean Drive',
            city: 'Nice',
            postal_code: '06000',
            max_guests: 4
        };

        it('should create a listing', async () => {
            const createdListing = { id: 1, ...newListing, host_id: 'user-123' };
            mockCreate.mockResolvedValue(createdListing);

            const response = await request(app)
                .post('/api/v1/listings')
                .send(newListing);

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(createdListing);
            expect(mockCreate).toHaveBeenCalledWith('user-123', expect.objectContaining(newListing));
            expect(mockInvalidatePattern).toHaveBeenCalled();
        });
    });

    describe('PATCH /api/v1/listings/:id', () => {
        it('should update listing', async () => {
            const updateData = { price: 250 };
            const updatedListing = { id: 1, ...updateData };
            mockUpdate.mockResolvedValue(updatedListing);

            const response = await request(app)
                .patch('/api/v1/listings/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(updatedListing);
            expect(mockUpdate).toHaveBeenCalledWith(1, 'user-123', expect.objectContaining(updateData));
            expect(mockInvalidateListingCache).toHaveBeenCalledWith(1);
        });
    });

    describe('DELETE /api/v1/listings/:id', () => {
        it('should delete listing', async () => {
            mockDelete.mockResolvedValue(undefined);

            const response = await request(app).delete('/api/v1/listings/1');

            expect(response.status).toBe(200);
            expect(mockDelete).toHaveBeenCalledWith(1, 'user-123');
            expect(mockInvalidateListingCache).toHaveBeenCalledWith(1);
        });
    });
});
