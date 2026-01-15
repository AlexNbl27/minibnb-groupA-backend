import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { updateProfileSchema } from "../../validators/user.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: User profile management
 */

/**
 * @swagger
 * /profiles/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details
 */
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

/**
 * @swagger
 * /profiles/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
    "/me",
    authenticate,
    validate(updateProfileSchema),
    async (req, res, next) => {
        try {
            if (req.body.avatar_url === "" || req.body.avatarUrl === "") {
                req.body.avatar_url = null;
                delete req.body.avatarUrl;
            }

            const { data, error } = await supabase
                .from("profiles")
                .upsert({
                    id: (req as AuthRequest).user!.id,
                    email: (req as AuthRequest).user!.email,
                    ...req.body
                })
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
