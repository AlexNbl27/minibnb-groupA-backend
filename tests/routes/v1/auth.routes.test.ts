import request from 'supertest';
import { AuthService } from '../../../src/services/auth.service';

// Define mocks before import
const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockRefreshSession = jest.fn();
const mockUpdatePassword = jest.fn();

// Mock Auth Middleware
jest.mock('../../../src/middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'test@example.com' };
        next();
    },
}));

jest.mock('../../../src/services/auth.service', () => {
    return {
        AuthService: jest.fn().mockImplementation(() => {
            return {
                signUp: mockSignUp,
                signIn: mockSignIn,
                signOut: mockSignOut,
                refreshSession: mockRefreshSession,
                updatePassword: mockUpdatePassword,
            };
        }),
    };
});

// Import app AFTER mocking
import app from '../../../src/app';

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/signup', () => {
        it('should signup successfully', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            const mockSession = { access_token: 'token' };

            mockSignUp.mockResolvedValue({
                user: mockUser,
                session: mockSession,
            });

            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    first_name: 'John',
                    last_name: 'Doe',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                user: mockUser,
                access_token: 'token'
            });
            expect(response.headers['set-cookie']).toBeDefined();
            expect(mockSignUp).toHaveBeenCalledWith(
                'test@example.com',
                'password123',
                'John',
                'Doe'
            );
        });

        it('should validate input', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send({
                    email: 'invalid-email',
                });

            expect(response.status).toBe(400);
            expect(mockSignUp).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            const mockSession = { access_token: 'token' };

            mockSignIn.mockResolvedValue({
                user: mockUser,
                session: mockSession,
            });

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                user: mockUser,
                access_token: 'token'
            });
            expect(response.headers['set-cookie']).toBeDefined();
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        it('should handle login error', async () => {
            mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully', async () => {
            mockSignOut.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/v1/auth/logout');

            expect(response.status).toBe(200);
            expect(mockSignOut).toHaveBeenCalled();
        });
    });

    describe('POST /api/v1/auth/change-password', () => {
        it('should change password successfully', async () => {
            mockUpdatePassword.mockResolvedValue({ user: { id: 'user-123' } });

            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .send({
                    old_password: 'oldPassword123',
                    new_password: 'newPassword123'
                });

            expect(response.status).toBe(200);
            expect(mockUpdatePassword).toHaveBeenCalledWith(
                'user-123',
                'test@example.com',
                'oldPassword123',
                'newPassword123'
            );
        });

        it('should fail with invalid old password', async () => {
            const error = new Error('Invalid login credentials');
            mockUpdatePassword.mockRejectedValue(error);

            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .send({
                    old_password: 'wrongPassword',
                    new_password: 'newPassword123'
                });

            expect(response.status).toBe(401);
        });
    });
});
