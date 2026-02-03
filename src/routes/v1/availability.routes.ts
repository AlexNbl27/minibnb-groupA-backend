import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware";
import { cacheMiddleware as cache } from "../../middlewares/cache.middleware";
import { getAvailabilitySchema } from "../../validators/availability.validator";
import * as availabilityService from "../../services/availability.service";
import { SuccessResponse, OkResponse } from "../../utils/success";

const router = Router();

router.get(
    "/:listingId/availability",
    validate(getAvailabilitySchema),
    cache(300), // 5 minutes
    async (req, res, next) => {
        try {
            const { listingId } = req.params;
            const { start_date, end_date } = req.query;

            // Ensure types are handled correctly
            const startDate = typeof start_date === "string" ? start_date : undefined;
            const endDate = typeof end_date === "string" ? end_date : undefined;

            const result = await availabilityService.getAvailability({
                listingId: parseInt(listingId as string, 10),
                startDate,
                endDate,
            });

            new OkResponse(result, undefined, "Availability retrieved successfully").send(res);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
