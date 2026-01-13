import { z } from "zod";

export const createBookingSchema = z.object({
    body: z.object({
        listing_id: z.number().int().positive(),
        check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        guest_count: z.number().int().positive().default(1),
    }).refine((data) => new Date(data.check_out) > new Date(data.check_in), {
        message: "check_out must be after check_in",
        path: ["check_out"],
    }),
});
