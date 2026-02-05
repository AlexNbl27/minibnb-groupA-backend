import { Router } from 'express';
import { getAmenitiesByCategory, AMENITY_CATEGORIES } from '../../constants/amenities';

const router = Router();

/**
 * @swagger
 * /amenities:
 *   get:
 *     summary: Get all amenities by category
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: List of amenities grouped by category
 */
router.get('/', (req, res) => {
    const amenitiesByCategory = getAmenitiesByCategory();
    const responseData = Object.entries(amenitiesByCategory).reduce((acc, [key, value]) => {
        const categoryKey = key as keyof typeof AMENITY_CATEGORIES;
        acc[categoryKey] = {
            label: AMENITY_CATEGORIES[categoryKey],
            amenities: value.map(a => ({ slug: a.slug, label: a.label }))
        };
        return acc;
    }, {} as any);

    res.json({
        success: true,
        data: responseData
    });
});

export default router;
