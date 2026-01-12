import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { MessageService } from "../../services/message.service";
import { sendMessageSchema } from "../../validators/message.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();
const messageService = new MessageService();

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
