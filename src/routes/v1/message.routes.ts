import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { MessageService } from "../../services/message.service";
import { sendMessageSchema } from "../../validators/message.validator";
import { sendSuccess } from "../../utils/response";

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

        res.json({
            success: true,
            data: result.data,
            meta: {
                total: result.total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(result.total / pagination.limit)
            }
        });
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
            sendSuccess(res, message, 201);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
