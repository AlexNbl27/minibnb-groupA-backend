import express from "express";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { cacheMiddleware } from "../../middlewares/cache.middleware";
import { ListingService } from "../../services/listing.service";
import { CacheService } from "../../services/cache.service";
import { createListingSchema, updateListingSchema } from "../../validators/listing.validator";
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
 *         name: q
 *         description: Search query (searches in name and description)
 *         schema:
 *           type: string
 *       - in: query
 *         name: host_id
 *         description: Filter listings by host ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: check_in
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: check_out
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: property_type
 *         description: Exact property type (e.g., "Entire home")
 *         schema:
 *           type: string
 *       - in: query
 *         name: property_types
 *         description: Multiple property types, comma-separated
 *         schema:
 *           type: string
 *       - in: query
 *         name: amenities
 *         description: Required amenities, comma-separated (ALL must match)
 *         schema:
 *           type: string
 *       - in: query
 *         name: amenities_any
 *         description: Optional amenities, comma-separated (ANY must match)
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_bedrooms
 *         schema:
 *           type: integer
 *       - in: query
 *         name: min_beds
 *         schema:
 *           type: integer
 *       - in: query
 *         name: min_bathrooms
 *         schema:
 *           type: number
 *       - in: query
 *         name: min_rating
 *         description: Minimum rating (0-5)
 *         schema:
 *           type: number
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       host_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       picture_url:
 *                         type: string
 *                       price:
 *                         type: integer
 *                       address:
 *                         type: string
 *                       city:
 *                         type: string
 *                       postal_code:
 *                         type: string
 *                       neighbourhood_group_cleansed:
 *                         type: string
 *                       bedrooms:
 *                         type: integer
 *                       beds:
 *                         type: integer
 *                       bathrooms:
 *                         type: number
 *                       max_guests:
 *                         type: integer
 *                       property_type:
 *                         type: string
 *                       rules:
 *                         type: string
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       review_scores_value:
 *                         type: number
 *                       is_active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       host_name:
 *                         type: string
 *                         nullable: true
 *                       host_picture_url:
 *                         type: string
 *                         nullable: true
 */
router.get("/", cacheMiddleware(300), async (req, res, next) => {
  try {
    // Parse comma-separated values into arrays
    const parseArray = (value: unknown): string[] | undefined => {
      if (typeof value === "string" && value.trim()) {
        const items = value
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        return items.length > 0 ? items : undefined;
      }
      return undefined;
    };

    const filters = {
      city: req.query.city as string,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      guests: req.query.guests ? Number(req.query.guests) : undefined,
      q: req.query.q as string,
      host_id: req.query.host_id as string,
      check_in: req.query.check_in as string,
      check_out: req.query.check_out as string,
      // Filtres avancés
      property_type: req.query.property_type as string,
      property_types: parseArray(req.query.property_types),
      amenities: parseArray(req.query.amenities),
      amenities_any: parseArray(req.query.amenities_any),
      min_bedrooms: req.query.min_bedrooms ? Number(req.query.min_bedrooms) : undefined,
      min_beds: req.query.min_beds ? Number(req.query.min_beds) : undefined,
      min_bathrooms: req.query.min_bathrooms ? Number(req.query.min_bathrooms) : undefined,
      min_rating: req.query.min_rating ? Number(req.query.min_rating) : undefined,
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
      totalPages: Math.ceil(result.total / pagination.limit),
    }).send(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/listings/me (Host listings)
/**
 * @swagger
 * /listings/me:
 *   get:
 *     summary: Get current user listings (including inactive)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of user listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       host_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       picture_url:
 *                         type: string
 *                       price:
 *                         type: integer
 *                       address:
 *                         type: string
 *                       city:
 *                         type: string
 *                       postal_code:
 *                         type: string
 *                       neighbourhood_group_cleansed:
 *                         type: string
 *                       bedrooms:
 *                         type: integer
 *                       beds:
 *                         type: integer
 *                       bathrooms:
 *                         type: number
 *                       max_guests:
 *                         type: integer
 *                       property_type:
 *                         type: string
 *                       rules:
 *                         type: string
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       review_scores_value:
 *                         type: number
 *                       is_active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await listingService.getByUser((req as AuthRequest).user!.id, pagination);

    new OkResponse(result.data, {
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    }).send(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/listings/:id
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     host_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     picture_url:
 *                       type: string
 *                     price:
 *                       type: integer
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     postal_code:
 *                       type: string
 *                     neighbourhood_group_cleansed:
 *                       type: string
 *                     bedrooms:
 *                       type: integer
 *                     beds:
 *                       type: integer
 *                     bathrooms:
 *                       type: number
 *                     max_guests:
 *                       type: integer
 *                     property_type:
 *                       type: string
 *                     rules:
 *                       type: string
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     review_scores_value:
 *                       type: number
 *                     is_active:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     host_name:
 *                       type: string
 *                       nullable: true
 *                     host_picture_url:
 *                       type: string
 *                       nullable: true
 */
router.get("/:id", async (req, res, next) => {
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               neighbourhood_group_cleansed:
 *                 type: string
 *               picture_url:
 *                  type: string
 *               bedrooms:
 *                 type: integer
 *               beds:
 *                 type: integer
 *               bathrooms:
 *                 type: number
 *               max_guests:
 *                 type: integer
 *               property_type:
 *                 type: string
 *               rules:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Listing created
 */
router.post("/", authenticate, validate(createListingSchema), async (req, res, next) => {
  try {
    const listing = await listingService.create((req as AuthRequest).user!.id, req.body);

    // Invalider cache
    await cacheService.invalidatePattern("cache:/api/v1/listings?*");

    new CreatedResponse(listing).send(res);
  } catch (error) {
    next(error);
  }
});

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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               neighbourhood_group_cleansed:
 *                 type: string
 *               picture_url:
 *                  type: string
 *               bedrooms:
 *                 type: integer
 *               beds:
 *                 type: integer
 *               bathrooms:
 *                 type: number
 *               max_guests:
 *                 type: integer
 *               property_type:
 *                 type: string
 *               rules:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Listing updated
 */
router.patch("/:id", authenticate, validate(updateListingSchema), async (req, res, next) => {
  try {
    const listing = await listingService.update(Number(req.params.id), (req as AuthRequest).user!.id, req.body);

    // Invalider cache
    await cacheService.invalidateListingCache(Number(req.params.id));

    new OkResponse(listing).send(res);
  } catch (error) {
    next(error);
  }
});

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
    await listingService.delete(Number(req.params.id), (req as AuthRequest).user!.id);

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

    const result = await bookingService.getByListing(Number(req.params.id), (req as AuthRequest).user!.id, pagination);

    new OkResponse(result.data, {
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    }).send(res);
  } catch (error) {
    next(error);
  }
});

export default router;
