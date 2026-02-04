import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { CreatedResponse, OkResponse } from "../../utils/success";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cohosts
 *   description: Co-host management
 */

// POST /api/v1/cohosts (Ajouter un co-hôte)
/**
 * @swagger
 * /cohosts:
 *   post:
 *     summary: Add a co-host to a listing
 *     tags: [Cohosts]
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
 *               - co_host_id
 *             properties:
 *               listing_id:
 *                 type: integer
 *               co_host_id:
 *                 type: string
 *               can_edit_listing:
 *                 type: boolean
 *               can_access_messages:
 *                 type: boolean
 *               can_respond_messages:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Co-host added
 */
router.post("/", authenticate, async (req, res, next) => {
    try {
        const userId = (req as AuthRequest).user!.id;
        const { listing_id, co_host_id } = req.body;

        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listing_id)
            .single();

        if (!listing) {
            throw new NotFoundError("Listing not found");
        }

        if (listing.host_id !== userId) {
            throw new ForbiddenError("Only host can add co-hosts");
        }

        const { data, error } = await supabase
            .from("co_hosts")
            .insert({
                listing_id,
                host_id: userId,
                co_host_id,
                can_edit_listing: req.body.can_edit_listing || false,
                can_access_messages: req.body.can_access_messages || false,
                can_respond_messages: req.body.can_respond_messages || false,
            })
            .select()
            .single();

        if (error) throw error;
        new CreatedResponse(data).send(res);
    } catch (error) {
        next(error);
    }
});

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

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                throw new NotFoundError("Co-host record not found.");
            }
            throw fetchError;
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
