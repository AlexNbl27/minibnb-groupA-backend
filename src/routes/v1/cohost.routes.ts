import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { OkResponse } from "../../utils/success";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cohosts
 *   description: Co-host management
 */

// DELETE /api/v1/cohosts/:id (Retirer co-hôte)
/**
 * @swagger
 * /cohosts/{id}:
 *   delete:
 *     summary: Remove a co-host
 *     tags: [Cohosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Co-host removed
 */
router.delete("/:id", authenticate, async (req, res, next) => {
    try {
        const coHostId = Number(req.params.id);
        const userId = (req as AuthRequest).user!.id;

        const { data: coHost, error: fetchError } = await supabase
            .from("co_hosts")
            .select("listing_id, co_host_id")
            .eq("id", coHostId)
            .single();

        if (fetchError) throw fetchError;
        if (!coHost) {
            throw new NotFoundError("Co-host record not found.");
        }

        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", coHost.listing_id)
            .single();

        if (listing?.host_id !== userId && coHost.co_host_id !== userId) {
            throw new ForbiddenError(
                "You do not have permission to remove this co-host.",
            );
        }

        const { error } = await supabase
            .from("co_hosts")
            .delete()
            .eq("id", coHostId);
        if (error) throw error;

        new OkResponse({ message: "Co-host removed" }).send(res);
    } catch (error) {
        next(error);
    }
});

export default router;
