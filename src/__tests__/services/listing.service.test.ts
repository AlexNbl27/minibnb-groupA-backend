import { ListingService } from "../../services/listing.service";
import { supabaseAdmin } from "../../config/supabase";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

jest.mock("../../config/supabase");

const mockSupabaseAdmin = supabaseAdmin as any;

describe("ListingService", () => {
    let listingService: ListingService;

    beforeEach(() => {
        listingService = new ListingService();
        jest.clearAllMocks();
    });

    describe("create", () => {
        it("should create a listing if user is host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { is_host: true }, error: null }); // profile check
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { id: 1, name: "New Listing" }, error: null }); // insert return

            const result = await listingService.create("host-id", { name: "New Listing" } as any);

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith("profiles");
            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith("listings");
            expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(expect.objectContaining({ host_id: "host-id", name: "New Listing" }));
            expect(result).toEqual({ id: 1, name: "New Listing" });
        });

        it("should throw ForbiddenError if user is not host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { is_host: false }, error: null });

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

            mockSupabaseAdmin.range.mockResolvedValueOnce({ data: mockListings, error: null, count: mockCount });

            const result = await listingService.getAll();

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith("listings");
            expect(mockSupabaseAdmin.range).toHaveBeenCalledWith(0, 9);
            expect(result).toEqual({ data: mockListings, total: mockCount });
        });

        it("should filter by city", async () => {
            mockSupabaseAdmin.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ city: "Paris" });

            expect(mockSupabaseAdmin.ilike).toHaveBeenCalledWith("city", "%Paris%");
        });

        it("should filter by price range", async () => {
            mockSupabaseAdmin.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });

            await listingService.getAll({ min_price: 100, max_price: 200 });

            expect(mockSupabaseAdmin.gte).toHaveBeenCalledWith("price", 100);
            expect(mockSupabaseAdmin.lte).toHaveBeenCalledWith("price", 200);
        });
    });

    describe("getById", () => {
        it("should return listing if found", async () => {
            const mockListing = { id: 1, name: "Listing 1" };
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: mockListing, error: null });

            const result = await listingService.getById(1);

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith("listings");
            expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith("id", 1);
            expect(result).toEqual(mockListing);
        });

        it("should throw NotFoundError if not found", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            await expect(listingService.getById(999)).rejects.toThrow(NotFoundError);
        });
    });

    describe("update", () => {
        it("should update if user is host", async () => {
            // checkEditPermission mock: first mock returns true (host check)
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "host-id" }, error: null });
            // Update return
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { id: 1, name: "Updated" }, error: null });

            const result = await listingService.update(1, "host-id", { name: "Updated" });

            expect(mockSupabaseAdmin.update).toHaveBeenCalledWith({ name: "Updated" });
            expect(result).toEqual({ id: 1, name: "Updated" });
        });

        it("should throw ForbiddenError if not allowed", async () => {
            // checkEditPermission: not host, then not co-host
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null }); // not host
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null }); // not co-host

            await expect(listingService.update(1, "user-id", {})).rejects.toThrow(ForbiddenError);
        });
    });

    describe("delete", () => {
        it("should delete if user is host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "host-id" }, error: null });


            await listingService.delete(1, "host-id");

            expect(mockSupabaseAdmin.delete).toHaveBeenCalled();
        });

        it("should throw ForbiddenError if user is not host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null });

            await expect(listingService.delete(1, "user-id")).rejects.toThrow(ForbiddenError);
        });
    });
});
