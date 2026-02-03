import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { MessageService } from "../../services/message.service";
import { sendMessageSchema } from "../../validators/message.validator";
import { CreatedResponse, OkResponse } from "../../utils/success";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging system
 */
const messageService = new MessageService();

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get("/", authenticate, async (req, res, next) => {
    try {
        const conversations = await messageService.getUserConversations(
            (req as AuthRequest).user!.id
        );
        new OkResponse(conversations).send(res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Create or get a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listing_id
 *             properties:
 *               listing_id:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation created or retrieved
 */
router.post("/", authenticate, async (req, res, next) => {
    try {
        const conversation = await messageService.createConversation(
            (req as AuthRequest).user!.id,
            req.body.listing_id,
            req.body.message
        );
        new CreatedResponse(conversation).send(res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /conversations/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get("/:conversationId", authenticate, async (req, res, next) => {
    try {
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        };

        const result = await messageService.getByConversation(
            Number(req.params.conversationId),
            (req as AuthRequest).user!.id,
            pagination
        );

        new OkResponse(result.data, {
            total: result.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(result.total / pagination.limit)
        }).send(res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
    "/:conversationId/messages",
    authenticate,
    validate(sendMessageSchema),
    async (req, res, next) => {
        try {
            const message = await messageService.send(
                (req as AuthRequest).user!.id,
                Number(req.params.conversationId),
                req.body.content,
            );
            new CreatedResponse(message).send(res);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
