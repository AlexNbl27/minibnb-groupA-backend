import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { NotFoundError } from "../../utils/errors";
import { cacheMiddleware } from "../../middlewares/cache.middleware";
import { ListingService } from "../../services/listing.service";
import { CacheService } from "../../services/cache.service";
import {
    createListingSchema,
    updateListingSchema,
} from "../../validators/listing.validator";
import { CreatedResponse, OkResponse } from "../../utils/success";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: Property listings management
 */
const listingService = new ListingService();
const cacheService = new CacheService();

// GET /api/v1/listings (avec cache 5 min)
/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of listings
 */
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

        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        };

        const result = await listingService.getAll(filters, pagination);

        new OkResponse(result.data, {
            total: result.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(result.total / pagination.limit)
        }).send(res);
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/listings/:id (avec cache 1h)
/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing details
 */
router.get("/:id", cacheMiddleware(3600), async (req, res, next) => {
    try {
        const listing = await listingService.getById(Number(req.params.id));
        new OkResponse(listing).send(res);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/listings (protégé)
/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price_per_night
 *               - city
 *               - country
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price_per_night:
 *                 type: number
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Listing created
 */
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

            new CreatedResponse(listing).send(res);
        } catch (error) {
            next(error);
        }
    },
);

// PATCH /api/v1/listings/:id (protégé)
/**
 * @swagger
 * /listings/{id}:
 *   patch:
 *     summary: Update a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               price_per_night:
 *                 type: number
 *     responses:
 *       200:
 *         description: Listing updated
 */
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

            new OkResponse(listing).send(res);
        } catch (error) {
            next(error);
        }
    },
);

// DELETE /api/v1/listings/:id (protégé)
/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
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
 *         description: Listing deleted
 */
router.delete("/:id", authenticate, async (req, res, next) => {
    try {
        await listingService.delete(
            Number(req.params.id),
            (req as AuthRequest).user!.id,
        );

        // Invalider cache
        await cacheService.invalidateListingCache(Number(req.params.id));

        new OkResponse({ message: "Listing deleted" }).send(res);
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/listings/:id/bookings (Host only)
import { BookingService } from "../../services/booking.service";
const bookingService = new BookingService();

/**
 * @swagger
 * /listings/{id}/bookings:
 *   get:
 *     summary: Get bookings for a listing (Host only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get("/:id/bookings", authenticate, async (req, res, next) => {
    try {
        const pagination = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        };

        const result = await bookingService.getByListing(
            Number(req.params.id),
            (req as AuthRequest).user!.id,
            pagination
        );

        new OkResponse(result.data, {
            total: result.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(result.total / pagination.limit)
        }).send(res);
    } catch (error) {
        next(error);
    }
});

import { supabase } from "../../config/supabase";
import { ForbiddenError } from "../../utils/errors";

/**
 * @swagger
 * /listings/{id}/cohosts:
 *   post:
 *     summary: Add a co-host to a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - co_host_id
 *             properties:
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
router.post("/:id/cohosts", authenticate, async (req, res, next) => {
    try {
        const listingId = Number(req.params.id);
        const userId = (req as AuthRequest).user!.id;
        const { co_host_id } = req.body;

        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listingId)
            .single();
        if (listing?.host_id !== userId) {
            throw new ForbiddenError("Only host can add co-hosts");
        }

        const { data, error } = await supabase
            .from("co_hosts")
            .insert({
                listing_id: listingId,
                host_id: userId,
                co_host_id: co_host_id,
                can_edit_listing: req.body.can_edit_listing || false,
                can_access_messages: req.body.can_access_messages || false,
                can_respond_messages: req.body.can_respond_messages || false,
            })
            .select()
            .single();

        if (error) throw error;
        new CreatedResponse(data).send(res);
    } catch (error: any) {
        if (error.code === 'PGRST116') {
            next(new NotFoundError("Listing not found"));
            return;
        }
        next(error);
    }
});

export default router;
