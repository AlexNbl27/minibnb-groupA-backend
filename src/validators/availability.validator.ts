import { z } from "zod";

export const getAvailabilitySchema = z.object({
    params: z.object({
        listingId: z.string().regex(/^\d+$/, "Listing ID must be a number"),
    }),
    query: z.object({
        start_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
            .optional(),
        end_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
            .optional(),
    }),
});
