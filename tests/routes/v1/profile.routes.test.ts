import request from 'supertest';

// 1. Mock supabase
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../../src/config/supabase', () => ({
    supabase: {
        from: mockFrom,
    },
}));

jest.mock('../../../src/config/redis');

// 2. Mock Auth Middleware
jest.mock('../../../src/middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'test@example.com' }; // Mock authenticated user
        next();
    },
}));

// 3. Import app
import app from '../../../src/app';

describe('Profile Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup chainable mock
        mockFrom.mockReturnValue({
            update: mockUpdate,
            upsert: mockUpdate, // Add upsert mock
            select: mockSelect,
            eq: mockEq,
        });
        mockUpdate.mockReturnValue({ // Upsert chaining
            select: mockSelect
        });
        mockEq.mockReturnValue({
            select: mockSelect,
            single: mockSingle,
        });
        mockSelect.mockReturnValue({
            eq: mockEq,
            single: mockSingle
        });
    });

    describe('PATCH /api/v1/profiles/me', () => {
        it('should set avatar_url to null if empty string is provided', async () => {
            const mockUpdatedProfile = { id: 'user-123', avatar_url: null };
            mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null });

            const response = await request(app)
                .patch('/api/v1/profiles/me')
                .send({ avatar_url: "" });

            expect(response.status).toBe(200);

            // Verify supabase was called with null
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                id: 'user-123',
                email: 'test@example.com',
                avatar_url: null
            }));
        });

        it('should accept valid avatar url', async () => {
            const mockUpdatedProfile = { id: 'user-123', avatar_url: "https://example.com/pic.jpg" };
            mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null });

            const response = await request(app)
                .patch('/api/v1/profiles/me')
                .send({ avatar_url: "https://example.com/pic.jpg" });

            expect(response.status).toBe(200);
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com',
                avatar_url: "https://example.com/pic.jpg"
            }));
        });

        it('should set avatar_url to null if camelCase avatarUrl is empty string', async () => {
            const mockUpdatedProfile = { id: 'user-123', avatar_url: null };
            mockSingle.mockResolvedValue({ data: mockUpdatedProfile, error: null });

            const response = await request(app)
                .patch('/api/v1/profiles/me')
                .send({ avatarUrl: "" });

            expect(response.status).toBe(200);

            // Verify payload transformation
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com',
                avatar_url: null
            }));
            // Ensure avatarUrl was removed (not strictly checking 'not.objectContaining' but conceptually)
            // The mockUpdate argument should ONLY have avatar_url: null (and potentially other fields if sent), 
            // but definitely not avatarUrl.
        });
    });
});
