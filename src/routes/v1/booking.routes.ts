import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { BookingService } from "../../services/booking.service";
import { CacheService } from "../../services/cache.service";
import { createBookingSchema } from "../../validators/booking.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();
const bookingService = new BookingService();
const cacheService = new CacheService();

// GET /api/v1/bookings/me
router.get("/me", authenticate, async (req, res, next) => {
    try {
        const bookings = await bookingService.getByUser(
            (req as AuthRequest).user!.id,
        );
        sendSuccess(res, bookings);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/bookings
router.post(
    "/",
    authenticate,
    validate(createBookingSchema),
    async (req, res, next) => {
        try {
            const booking = await bookingService.create(
                (req as AuthRequest).user!.id,
                req.body,
            );

            // Invalider cache
            await cacheService.invalidateBookingCache(req.body.listing_id);

            sendSuccess(res, booking, 201);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
