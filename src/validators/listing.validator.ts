import { z } from "zod";

export const createListingSchema = z.object({
    body: z.object({
        name: z.string().min(10).max(255),
        description: z.string().optional(),
        picture_url: z.string().url(),
        price: z.number().int().positive(),
        address: z.string().min(5),
        city: z.string().min(2),
        postal_code: z.string().optional(),
        neighbourhood_group_cleansed: z.string().optional(),
        bedrooms: z.number().int().positive().default(1),
        beds: z.number().int().positive().default(1),
        bathrooms: z.number().positive().default(1.0),
        max_guests: z.number().int().positive().default(2),
        property_type: z.string().default("Rental unit"),
        rules: z.string().optional(),
        amenities: z.array(z.string()).default([]),
    }),
});

export const updateListingSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(10).max(255).optional(),
        description: z.string().optional(),
        picture_url: z.string().url().optional(),
        price: z.number().int().positive().optional(),
        address: z.string().min(5).optional(),
        city: z.string().min(2).optional(),
        is_active: z.boolean().optional(),
    }),
});
