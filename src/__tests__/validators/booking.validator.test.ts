import { createBookingSchema } from "../../validators/booking.validator";

describe("BookingValidator", () => {
    describe("createBookingSchema", () => {
        const validData = {
            body: {
                listing_id: 1,
                check_in: "2024-01-01",
                check_out: "2024-01-05",
                guest_count: 2,
            },
        };

        it("should validate correct data", async () => {
            const result = await createBookingSchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should fail if check_out is before check_in", async () => {
            const invalidData = {
                body: {
                    ...validData.body,
                    check_in: "2024-01-05",
                    check_out: "2024-01-01",
                },
            };
            const result = await createBookingSchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid date format", async () => {
            const invalidData = {
                body: {
                    ...validData.body,
                    check_in: "01-01-2024", // Wrong format
                },
            };
            const result = await createBookingSchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with negative guest count", async () => {
            const invalidData = {
                body: {
                    ...validData.body,
                    guest_count: -1,
                },
            };
            const result = await createBookingSchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
