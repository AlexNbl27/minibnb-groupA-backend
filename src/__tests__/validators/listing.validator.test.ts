import { createListingSchema, updateListingSchema } from "../../validators/listing.validator";

describe("ListingValidator", () => {
    describe("createListingSchema", () => {
        const validData = {
            body: {
                name: "Beautiful Apartment",
                picture_url: "https://example.com/pic.jpg",
                price: 100,
                address: "123 Main St",
                city: "Paris",
                description: "A lovely place to stay",
                bedrooms: 2,
                beds: 2,
                bathrooms: 1,
                max_guests: 4,
            },
        };

        it("should validate correct data", async () => {
            const result = await createListingSchema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should fail with invalid price", async () => {
            const invalidData = {
                body: {
                    ...validData.body,
                    price: -10,
                },
            };
            const result = await createListingSchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });

        it("should fail if missing required fields", async () => {
            const invalidData = {
                body: {
                    name: "Incomplete",
                },
            };
            const result = await createListingSchema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe("updateListingSchema", () => {
        it("should validate correct update data", async () => {
            const data = {
                params: { id: "1" },
                body: { name: "Updated Name" },
            };
            const result = await updateListingSchema.safeParseAsync(data);
            expect(result.success).toBe(true);
        });

        it("should fail with invalid id", async () => {
            const data = {
                params: { id: "abc" },
                body: { name: "Updated Name" },
            };
            const result = await updateListingSchema.safeParseAsync(data);
            expect(result.success).toBe(false);
        });
    });
});
