import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { MessageService } from "../../services/message.service";
import { sendMessageSchema, assignCoHostSchema } from "../../validators/message.validator";
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       listing_id:
 *                         type: integer
 *                       guest_id:
 *                         type: string
 *                         format: uuid
 *                       host_id:
 *                         type: string
 *                         format: uuid
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       listing:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           picture_url:
 *                             type: string
 *                       guest:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 *                       host:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 *                       last_message:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                           sender_id:
 *                             type: string
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const conversations = await messageService.getUserConversations((req as AuthRequest).user!.id);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     listing_id:
 *                       type: integer
 *                     guest_id:
 *                       type: string
 *                     host_id:
 *                       type: string
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const conversation = await messageService.createConversation((req as AuthRequest).user!.id, req.body.listing_id, req.body.message);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       conversation_id:
 *                         type: integer
 *                       sender_id:
 *                         type: string
 *                         format: uuid
 *                       content:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       sender:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 */
router.get("/:conversationId", authenticate, async (req, res, next) => {
  try {
    const pagination =
      req.query.page && req.query.limit
        ? {
            page: Number(req.query.page),
            limit: Number(req.query.limit),
          }
        : undefined;

    const result = await messageService.getByConversation(Number(req.params.conversationId), (req as AuthRequest).user!.id, pagination);

    new OkResponse(result.data, {
      total: result.total,
      page: pagination?.page || 1,
      limit: pagination?.limit || result.total,
      totalPages: pagination ? Math.ceil(result.total / pagination.limit) : 1,
      conversation: result.conversation,
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     conversation_id:
 *                       type: integer
 *                     sender_id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     created_at:
 *                       type: string
 */
router.post("/:conversationId/messages", authenticate, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const message = await messageService.send((req as AuthRequest).user!.id, Number(req.params.conversationId), req.body.content);
    new CreatedResponse(message).send(res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /conversations/{conversationId}:
 *   patch:
 *     summary: Assign a co-host to a conversation
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
 *               - co_host_id
 *             properties:
 *               co_host_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Co-host assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.patch("/:conversationId", authenticate, validate(assignCoHostSchema), async (req, res, next) => {
  try {
    await messageService.assignCoHost(Number(req.params.conversationId), req.body.co_host_id, (req as AuthRequest).user!.id);
    new OkResponse({ message: "Co-host assigned" }).send(res);
  } catch (error) {
    next(error);
  }
});

export default router;
