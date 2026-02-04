import { z } from "zod";

// Helper to check if a date string represents a valid calendar date (UTC-based)
const isValidDateString = (value: string): boolean => {
    const parts = value.split("-");
    if (parts.length !== 3) {
        return false;
    }
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return false;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
    .refine(isValidDateString, { message: "Invalid calendar date" });

export const getAvailabilitySchema = z.object({
    params: z.object({
        listingId: z.string().regex(/^\d+$/, "Listing ID must be a number"),
    }),
    query: z
        .object({
            start_date: dateSchema.optional(),
            end_date: dateSchema.optional(),
        })
        .refine(
            (data) => {
                if (data.start_date && data.end_date) {
                    return new Date(data.end_date) >= new Date(data.start_date);
                }
                return true;
            },
            { message: "end_date must be >= start_date", path: ["end_date"] }
        ),
});
