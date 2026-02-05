import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate } from "../../middlewares/auth.middleware";
import { OkResponse } from "../../utils/success";
import { BadRequestError } from "../../utils/errors";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 */
router.get("/search", authenticate, async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      throw new BadRequestError("Email query parameter is required");
    }

    const { data, error } = await supabase.from("profiles").select("id, email, first_name, last_name, avatar_url").ilike("email", `%${email}%`).limit(5);

    if (error) throw error;

    new OkResponse(data || []).send(res);
  } catch (error) {
    next(error);
  }
});

export default router;
