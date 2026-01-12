import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { cacheMiddleware } from "../../middlewares/cache.middleware";
import { ListingService } from "../../services/listing.service";
import { CacheService } from "../../services/cache.service";
import {
    createListingSchema,
    updateListingSchema,
} from "../../validators/listing.validator";

const router = express.Router();
const listingService = new ListingService();
const cacheService = new CacheService();

// GET /api/v1/listings (avec cache 5 min)
router.get("/", cacheMiddleware(300), async (req, res, next) => {
    try {
        const filters = {
            city: req.query.city as string,
            min_price: req.query.min_price
                ? Number(req.query.min_price)
                : undefined,
            max_price: req.query.max_price
                ? Number(req.query.max_price)
                : undefined,
            guests: req.query.guests ? Number(req.query.guests) : undefined,
        };

        const listings = await listingService.getAll(filters);

        res.json({ success: true, data: listings });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/listings/:id (avec cache 1h)
router.get("/:id", cacheMiddleware(3600), async (req, res, next) => {
    try {
        const listing = await listingService.getById(Number(req.params.id));
        res.json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/listings (protégé)
router.post(
    "/",
    authenticate,
    validate(createListingSchema),
    async (req, res, next) => {
        try {
            const listing = await listingService.create(
                (req as AuthRequest).user!.id,
                req.body,
            );

            // Invalider cache
            await cacheService.invalidatePattern("cache:/api/v1/listings?*");

            res.status(201).json({ success: true, data: listing });
        } catch (error) {
            next(error);
        }
    },
);

// PATCH /api/v1/listings/:id (protégé)
router.patch(
    "/:id",
    authenticate,
    validate(updateListingSchema),
    async (req, res, next) => {
        try {
            const listing = await listingService.update(
                Number(req.params.id),
                (req as AuthRequest).user!.id,
                req.body,
            );

            // Invalider cache
            await cacheService.invalidateListingCache(Number(req.params.id));

            res.json({ success: true, data: listing });
        } catch (error) {
            next(error);
        }
    },
);

// DELETE /api/v1/listings/:id (protégé)
router.delete("/:id", authenticate, async (req, res, next) => {
    try {
        await listingService.delete(
            Number(req.params.id),
            (req as AuthRequest).user!.id,
        );

        // Invalider cache
        await cacheService.invalidateListingCache(Number(req.params.id));

        res.json({ success: true, message: "Listing deleted" });
    } catch (error) {
        next(error);
    }
});

export default router;
