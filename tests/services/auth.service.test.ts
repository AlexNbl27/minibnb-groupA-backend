import { AuthService } from '../../src/services/auth.service';
import { supabase } from '../../src/config/supabase';

// Mock supabase module
jest.mock('../../src/config/supabase', () => ({
    supabase: {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    },
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                })),
            })),
        })),
    },
}));

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    describe('signUp', () => {
        it('should sign up a user successfully', async () => {
            const mockData = { user: { id: '123', email: 'test@example.com' } };
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            const result = await authService.signUp(
                'test@example.com',
                'password123',
                'John',
                'Doe'
            );

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                options: {
                    data: { first_name: 'John', last_name: 'Doe' },
                },
            });
            expect(result).toEqual(mockData);
        });

        it('should throw an error if signUp fails', async () => {
            const mockError = { message: 'Signup failed' };
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError,
            });

            await expect(
                authService.signUp('test@example.com', 'pwd', 'J', 'D')
            ).rejects.toEqual(mockError);
        });
    });

    describe('signIn', () => {
        it('should sign in a user successfully', async () => {
            const mockData = { session: { access_token: 'token' } };
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            const result = await authService.signIn('test@example.com', 'password123');

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result).toEqual(mockData);
        });

        it('should throw an error with "Invalid password" if user exists but login fails', async () => {
            const mockError = { message: 'Invalid credentials' };
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError,
            });

            // Mock user existing
            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
                }),
            });
            const { supabaseAdmin } = require('../../src/config/supabase');
            (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: mockSelect });

            await expect(
                authService.signIn('test@example.com', 'badpassword')
            ).rejects.toThrow('Invalid password');
        });

        it('should throw an error with "User not found" if login fails and user does not exist', async () => {
            const mockError = { message: 'Invalid credentials' };
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError,
            });

            // Mock user NOT existing
            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
                }),
            });
            const { supabaseAdmin } = require('../../src/config/supabase');
            (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: mockSelect });

            await expect(
                authService.signIn('nonexistent@example.com', 'pwd')
            ).rejects.toThrow('User not found');
        });
    });

    describe('signOut', () => {
        it('should sign out successfully', async () => {
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

            await authService.signOut();

            expect(supabase.auth.signOut).toHaveBeenCalled();
        });

        it('should throw an error if signOut fails', async () => {
            const mockError = { message: 'Signout failed' };
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: mockError });

            await expect(authService.signOut()).rejects.toEqual(mockError);
        });
    });
});
