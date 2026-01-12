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
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get("/:conversationId", authenticate, async (req, res, next) => {
    try {
        const messages = await messageService.getByConversation(
            Number(req.params.conversationId),
            (req as AuthRequest).user!.id,
        );
        sendSuccess(res, messages);
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
