import { ListingService } from "../../services/listing.service";
import { supabase } from "../../config/supabase";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

jest.mock("../../config/supabase");

const mockSupabase = supabase as any;

describe("ListingService", () => {
    let listingService: ListingService;

    beforeEach(() => {
        listingService = new ListingService();
        jest.clearAllMocks();

        // Setup chainable mock methods for supabase (used by ListingService)
        mockSupabase.from = jest.fn().mockReturnThis();
        mockSupabase.select = jest.fn().mockReturnThis();
        mockSupabase.insert = jest.fn().mockReturnThis();
        mockSupabase.update = jest.fn().mockReturnThis();
        mockSupabase.delete = jest.fn().mockReturnThis();
        mockSupabase.eq = jest.fn().mockReturnThis();
        mockSupabase.single = jest.fn();
        mockSupabase.or = jest.fn().mockReturnThis();
        mockSupabase.range = jest.fn();
        mockSupabase.order = jest.fn().mockReturnThis();
        mockSupabase.gte = jest.fn().mockReturnThis();
        mockSupabase.lte = jest.fn().mockReturnThis();
        mockSupabase.ilike = jest.fn().mockReturnThis();
        mockSupabase.contains = jest.fn().mockReturnThis();
        mockSupabase.overlaps = jest.fn().mockReturnThis();
        mockSupabase.in = jest.fn().mockReturnThis();
        mockSupabase.not = jest.fn().mockReturnThis();
    });

    describe("create", () => {
        it("should create a listing if user is host", async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { is_host: true }, error: null }); // profile check
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 1, name: "New Listing" }, error: null }); // insert return

            const result = await listingService.create("host-id", { name: "New Listing" } as any);

            expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
            expect(mockSupabase.from).toHaveBeenCalledWith("listings");
            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({ host_id: "host-id", name: "New Listing" }));
            expect(result).toEqual({ id: 1, name: "New Listing" });
        });

        it("should throw ForbiddenError if user is not host", async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { is_host: false }, error: null });

            await expect(listingService.create("user-id", {} as any)).rejects.toThrow(ForbiddenError);
        });
    });

    describe("getAll", () => {
        it("should return listings with default pagination", async () => {
            const mockListings = [{ id: 1, name: "Listing 1" }];
            const mockCount = 1;

            // Mock chain for getting listings
            // Note: In getAll, it calls: from('listings').select(...).eq('is_active', true).range(from, to)
            // We need to ensure the mock chain returns a promise that resolves to data/count

            // Because of how the service is written: const { data, error, count } = await query;
            // The last called method in the chain needs to return the promise.
            // In the default case: range is the last call.

            mockSupabase.range.mockResolvedValueOnce({ data: mockListings, error: null, count: mockCount });

            const result = await listingService.getAll();

            expect(mockSupabase.from).toHaveBeenCalledWith("listings");
            expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
            expect(result).toEqual({ data: mockListings, total: mockCount });
        });

        it("should filter by city", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ city: "Paris" });

            expect(mockSupabase.ilike).toHaveBeenCalledWith("city", "%Paris%");
        });

        it("should filter by price range", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_price: 100, max_price: 200 });

            expect(mockSupabase.gte).toHaveBeenCalledWith("price", 100);
            expect(mockSupabase.lte).toHaveBeenCalledWith("price", 200);
        });

        it("should filter by single property_type", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ property_type: "apartment" });

            expect(mockSupabase.eq).toHaveBeenCalledWith("property_type", "apartment");
        });

        it("should filter by multiple property_types using in", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ property_types: ["apartment", "house", "villa"] });

            expect(mockSupabase.in).toHaveBeenCalledWith("property_type", ["apartment", "house", "villa"]);
        });

        it("should not apply property_types filter for empty array", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ property_types: [] });

            expect(mockSupabase.in).not.toHaveBeenCalledWith("property_type", expect.anything());
        });

        it("should filter by amenities (all must match) using contains", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ amenities: ["wifi", "pool", "parking"] });

            expect(mockSupabase.contains).toHaveBeenCalledWith("amenities", ["wifi", "pool", "parking"]);
        });

        it("should filter by amenities_any (any match) using overlaps", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ amenities_any: ["wifi", "pool"] });

            expect(mockSupabase.overlaps).toHaveBeenCalledWith("amenities", ["wifi", "pool"]);
        });

        it("should not apply amenities filter for empty array", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ amenities: [] });

            expect(mockSupabase.contains).not.toHaveBeenCalledWith("amenities", expect.anything());
        });

        it("should filter by min_bedrooms", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_bedrooms: 2 });

            expect(mockSupabase.gte).toHaveBeenCalledWith("bedrooms", 2);
        });

        it("should filter by min_beds", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_beds: 3 });

            expect(mockSupabase.gte).toHaveBeenCalledWith("beds", 3);
        });

        it("should filter by min_bathrooms", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_bathrooms: 2 });

            expect(mockSupabase.gte).toHaveBeenCalledWith("bathrooms", 2);
        });

        it("should filter by min_rating", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_rating: 4.5 });

            expect(mockSupabase.gte).toHaveBeenCalledWith("review_scores_value", 4.5);
        });

        it("should apply multiple advanced filters together", async () => {
            mockSupabase.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({
                city: "Paris",
                min_price: 50,
                max_price: 200,
                property_types: ["apartment", "studio"],
                amenities: ["wifi"],
                min_bedrooms: 1,
                min_rating: 4.0
            });

            expect(mockSupabase.ilike).toHaveBeenCalledWith("city", "%Paris%");
            expect(mockSupabase.gte).toHaveBeenCalledWith("price", 50);
            expect(mockSupabase.lte).toHaveBeenCalledWith("price", 200);
            expect(mockSupabase.in).toHaveBeenCalledWith("property_type", ["apartment", "studio"]);
            expect(mockSupabase.contains).toHaveBeenCalledWith("amenities", ["wifi"]);
            expect(mockSupabase.gte).toHaveBeenCalledWith("bedrooms", 1);
            expect(mockSupabase.gte).toHaveBeenCalledWith("review_scores_value", 4.0);
        });
    });

    describe("getById", () => {
        it("should return listing if found", async () => {
            const mockListing = { id: 1, name: "Listing 1" };
            mockSupabase.single.mockResolvedValueOnce({ data: mockListing, error: null });

            const result = await listingService.getById(1);

            expect(mockSupabase.from).toHaveBeenCalledWith("listings");
            expect(mockSupabase.eq).toHaveBeenCalledWith("id", 1);
            expect(result).toEqual(mockListing);
        });

        it("should throw NotFoundError if not found", async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            await expect(listingService.getById(999)).rejects.toThrow(NotFoundError);
        });
    });

    describe("update", () => {
        it("should update if user is host", async () => {
            // checkEditPermission mock: first mock returns true (host check)
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "host-id" }, error: null });
            // Update return
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 1, name: "Updated" }, error: null });

            const result = await listingService.update(1, "host-id", { name: "Updated" });

            expect(mockSupabase.update).toHaveBeenCalledWith({ name: "Updated" });
            expect(result).toEqual({ id: 1, name: "Updated" });
        });

        it("should throw ForbiddenError if not allowed", async () => {
            // checkEditPermission: not host, then not co-host
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null }); // not host
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); // not co-host

            await expect(listingService.update(1, "user-id", {})).rejects.toThrow(ForbiddenError);
        });
    });

    describe("delete", () => {
        it("should delete if user is host", async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "host-id" }, error: null });


            await listingService.delete(1, "host-id");

            expect(mockSupabase.delete).toHaveBeenCalled();
        });

        it("should throw ForbiddenError if user is not host", async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null });

            await expect(listingService.delete(1, "user-id")).rejects.toThrow(ForbiddenError);
        });
    });
});
