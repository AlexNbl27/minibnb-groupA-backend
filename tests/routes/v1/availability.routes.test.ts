import request from 'supertest';
import * as availabilityService from '../../../src/services/availability.service';

// Mock availability service
jest.mock('../../../src/services/availability.service');

jest.mock('../../../src/config/redis');

import app from '../../../src/app';

const mockGetAvailability = availabilityService.getAvailability as jest.MockedFunction<typeof availabilityService.getAvailability>;

describe('Availability Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/listings/:listingId/availability', () => {
        const mockAvailabilityResponse = {
            listing_id: 1,
            is_active: true,
            booked_periods: [
                { check_in: '2024-01-10', check_out: '2024-01-15' }
            ],
            query_range: {
                start_date: '2024-01-01',
                end_date: '2024-03-31'
            }
        };

        it('should return 200 with availability data for valid listingId', async () => {
            mockGetAvailability.mockResolvedValue(mockAvailabilityResponse);

            const response = await request(app).get('/api/v1/listings/1/availability');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockAvailabilityResponse);
            expect(mockGetAvailability).toHaveBeenCalledWith({
                listingId: 1,
                startDate: undefined,
                endDate: undefined
            });
        });

        it('should return 200 with date range when query params provided', async () => {
            mockGetAvailability.mockResolvedValue(mockAvailabilityResponse);

            const response = await request(app)
                .get('/api/v1/listings/1/availability')
                .query({ start_date: '2024-01-01', end_date: '2024-03-31' });

            expect(response.status).toBe(200);
            expect(mockGetAvailability).toHaveBeenCalledWith({
                listingId: 1,
                startDate: '2024-01-01',
                endDate: '2024-03-31'
            });
        });

        it('should return 400 for invalid listingId (non-numeric)', async () => {
            const response = await request(app).get('/api/v1/listings/abc/availability');

            expect(response.status).toBe(400);
            expect(mockGetAvailability).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid listingId (negative number)', async () => {
            const response = await request(app).get('/api/v1/listings/-1/availability');

            expect(response.status).toBe(400);
            expect(mockGetAvailability).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid start_date format', async () => {
            const response = await request(app)
                .get('/api/v1/listings/1/availability')
                .query({ start_date: '01-01-2024' }); // Wrong format

            expect(response.status).toBe(400);
            expect(mockGetAvailability).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid end_date format', async () => {
            const response = await request(app)
                .get('/api/v1/listings/1/availability')
                .query({ end_date: 'invalid-date' });

            expect(response.status).toBe(400);
            expect(mockGetAvailability).not.toHaveBeenCalled();
        });

        it('should return 400 for both invalid date formats', async () => {
            const response = await request(app)
                .get('/api/v1/listings/1/availability')
                .query({ start_date: '2024/01/01', end_date: '2024/03/31' });

            expect(response.status).toBe(400);
            expect(mockGetAvailability).not.toHaveBeenCalled();
        });

        it('should handle service errors gracefully', async () => {
            mockGetAvailability.mockRejectedValue(new Error('Service error'));

            const response = await request(app).get('/api/v1/listings/1/availability');

            expect(response.status).toBe(500);
        });
    });
});
