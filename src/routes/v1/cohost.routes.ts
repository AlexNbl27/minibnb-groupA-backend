import express from "express";
import { supabase } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { sendSuccess } from "../../utils/response";
import { ForbiddenError } from "../../utils/errors";

const router = express.Router();

// DELETE /api/v1/cohosts/:id (Retirer co-hôte)
router.delete("/:id", authenticate, async (req, res, next) => {
    try {
        const coHostId = Number(req.params.id);
        const userId = (req as AuthRequest).user!.id;

        const { data: coHost, error: fetchError } = await supabase
            .from("co_hosts")
            .select("listing_id, co_host_id")
            .eq("id", coHostId)
            .single();

        if (fetchError || !coHost) {
            throw new ForbiddenError("Co-host record not found.");
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

        sendSuccess(res, { message: "Co-host removed" });
    } catch (error) {
        next(error);
    }
});

export default router;
