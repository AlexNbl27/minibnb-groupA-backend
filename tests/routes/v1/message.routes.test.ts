import request from 'supertest';
import { MessageService } from '../../../src/services/message.service';

// Mocks
const mockGetByConversation = jest.fn();
const mockSend = jest.fn();

jest.mock('../../../src/services/message.service', () => {
    return {
        MessageService: jest.fn().mockImplementation(() => ({
            getByConversation: mockGetByConversation,
            send: mockSend,
        })),
    };
});

// Mock Auth Middleware
jest.mock('../../../src/middlewares/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123', email: 'user@test.com' };
        next();
    },
}));

import app from '../../../src/app';

describe('Message Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/messages/:conversationId', () => {
        it('should return messages for a conversation', async () => {
            const mockMessages = [{ id: 1, content: 'Hello' }];
            mockGetByConversation.mockResolvedValue(mockMessages);

            const response = await request(app).get('/api/v1/conversations/10');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockMessages);
            expect(mockGetByConversation).toHaveBeenCalledWith(10, 'user-123');
        });

        it('should handle errors (e.g., forbidden)', async () => {
            mockGetByConversation.mockRejectedValue(new Error('Forbidden'));

            const response = await request(app).get('/api/v1/conversations/10');

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/v1/messages/:conversationId/messages', () => {
        it('should send a message', async () => {
            const messageData = { content: 'Hello there' };
            const mockMessage = { id: 1, ...messageData, conversation_id: 10, sender_id: 'user-123' };
            mockSend.mockResolvedValue(mockMessage);

            const response = await request(app)
                .post('/api/v1/conversations/10/messages')
                .send(messageData);

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(mockMessage);
            expect(mockSend).toHaveBeenCalledWith('user-123', 10, 'Hello there');
        });

        it('should validate input', async () => {
            const response = await request(app)
                .post('/api/v1/conversations/10/messages')
                .send({}); // Missing content

            expect(response.status).toBe(400);
            expect(mockSend).not.toHaveBeenCalled();
        });
    });
});
