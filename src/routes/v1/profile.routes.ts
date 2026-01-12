import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { updateProfileSchema } from "../../validators/user.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();

router.get("/me", authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", (req as AuthRequest).user!.id)
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        next(error);
    }
});

router.patch(
    "/me",
    authenticate,
    validate(updateProfileSchema),
    async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .update(req.body)
                .eq("id", (req as AuthRequest).user!.id)
                .select()
                .single();

            if (error) throw error;
            sendSuccess(res, data);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
