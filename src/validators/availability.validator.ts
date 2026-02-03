import { z } from "zod";

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

export const getAvailabilitySchema = z.object({
    params: z.object({
        listingId: z.string().regex(/^\d+$/, "Listing ID must be a number"),
    }),
    query: z
        .object({
            start_date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
                .refine(isValidDateString, { message: "Invalid calendar date" })
                .optional(),
            end_date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
                .refine(isValidDateString, { message: "Invalid calendar date" })
                .optional(),
        })
        .refine(
            (data) => {
                if (!data.start_date || !data.end_date) {
                    return true;
                }
                const [startYear, startMonth, startDay] = data.start_date.split("-").map(Number);
                const [endYear, endMonth, endDay] = data.end_date.split("-").map(Number);
                const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
                const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
                return end.getTime() >= start.getTime();
            },
            {
                message: "end_date must be on or after start_date",
                path: ["end_date"],
            }
        ),
});
