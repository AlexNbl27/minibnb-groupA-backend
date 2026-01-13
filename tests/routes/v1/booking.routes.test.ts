import request from 'supertest';
import { BookingService } from '../../../src/services/booking.service';
import { CacheService } from '../../../src/services/cache.service';

// Mocks
const mockGetByUser = jest.fn();
const mockCreate = jest.fn();
const mockInvalidateCache = jest.fn();

jest.mock('../../../src/services/booking.service', () => {
    return {
        BookingService: jest.fn().mockImplementation(() => ({
            getByUser: mockGetByUser,
            create: mockCreate,
        })),
    };
});

jest.mock('../../../src/services/cache.service', () => {
    return {
        CacheService: jest.fn().mockImplementation(() => ({
            invalidateBookingCache: mockInvalidateCache,
        })),
    };
});

// Mock Auth Middleware
jest.mock('../../../src/middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'test@test.com' };
        next();
    },
}));

import app from '../../../src/app';

describe('Booking Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/bookings/me', () => {
        it('should return user bookings', async () => {
            const mockBookings = [{ id: '1', listing_id: 1 }];
            mockGetByUser.mockResolvedValue(mockBookings);

            const response = await request(app).get('/api/v1/bookings/me');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockBookings);
            expect(mockGetByUser).toHaveBeenCalledWith('user-123');
        });

        it('should handle errors', async () => {
            mockGetByUser.mockRejectedValue(new Error('Fetch failed'));

            const response = await request(app).get('/api/v1/bookings/me');

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/v1/bookings', () => {
        const bookingData = {
            listing_id: 1,
            check_in: '2023-01-01',
            check_out: '2023-01-05',
            total_price: 100,
            guest_count: 2
        };

        it('should create a booking', async () => {
            const mockBooking = { id: 'b1', ...bookingData };
            mockCreate.mockResolvedValue(mockBooking);
            mockInvalidateCache.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/v1/bookings')
                .send(bookingData);

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(mockBooking);
            expect(mockCreate).toHaveBeenCalledWith('user-123', expect.objectContaining(bookingData));
            expect(mockInvalidateCache).toHaveBeenCalledWith(1);
        });

        it('should validate params', async () => {
            const response = await request(app)
                .post('/api/v1/bookings')
                .send({}); // Empty body

            expect(response.status).toBe(400);
            expect(mockCreate).not.toHaveBeenCalled();
        });
    });
});
