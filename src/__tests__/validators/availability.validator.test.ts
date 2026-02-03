import { getAvailabilitySchema } from "../../validators/availability.validator";

describe("AvailabilityValidator", () => {
    describe("getAvailabilitySchema", () => {
        it("should validate correct data with listingId only", async () => {
            const validData = {
                params: { listingId: "123" },
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should validate correct data with all params", async () => {
            const validData = {
                params: { listingId: "1" },
                query: {
                    start_date: "2024-01-01",
                    end_date: "2024-03-31"
                }
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should validate with only start_date", async () => {
            const validData = {
                params: { listingId: "1" },
                query: { start_date: "2024-01-01" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should validate with only end_date", async () => {
            const validData = {
                params: { listingId: "1" },
                query: { end_date: "2024-03-31" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should fail if listingId is not a number", async () => {
            const invalidData = {
                params: { listingId: "abc" },
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail if listingId is negative", async () => {
            const invalidData = {
                params: { listingId: "-1" },
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail if listingId contains decimal", async () => {
            const invalidData = {
                params: { listingId: "1.5" },
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail if listingId is empty", async () => {
            const invalidData = {
                params: { listingId: "" },
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid start_date format (MM-DD-YYYY)", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "01-15-2024" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid start_date format (YYYY/MM/DD)", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "2024/01/15" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid end_date format", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { end_date: "invalid-date" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with incomplete date format", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "2024-1-1" } // Should be 2024-01-01
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail if listingId is missing", async () => {
            const invalidData = {
                params: {},
                query: {}
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid calendar date (Feb 30)", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "2024-02-30" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid calendar date (Apr 31)", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { end_date: "2024-04-31" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail with invalid calendar date (month 13)", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "2024-13-01" }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail when end_date is before start_date", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: {
                    start_date: "2024-03-15",
                    end_date: "2024-03-01"
                }
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should pass when end_date equals start_date", async () => {
            const validData = {
                params: { listingId: "1" },
                query: {
                    start_date: "2024-03-15",
                    end_date: "2024-03-15"
                }
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should validate Feb 29 on leap year", async () => {
            const validData = {
                params: { listingId: "1" },
                query: { start_date: "2024-02-29" } // 2024 is a leap year
            };
            const result = await getAvailabilitySchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should fail Feb 29 on non-leap year", async () => {
            const invalidData = {
                params: { listingId: "1" },
                query: { start_date: "2023-02-29" } // 2023 is not a leap year
            };
            const result = await getAvailabilitySchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
