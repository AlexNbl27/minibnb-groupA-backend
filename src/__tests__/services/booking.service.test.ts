import { BookingService } from "../../services/booking.service";
import { supabaseAdmin } from "../../config/supabase";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors";

jest.mock("../../config/supabase");

const mockSupabaseAdmin = supabaseAdmin as any;

describe("BookingService", () => {
    let bookingService: BookingService;

    beforeEach(() => {
        bookingService = new BookingService();
        jest.clearAllMocks();
    });

    describe("create", () => {
        const validBookingData = {
            listing_id: 1,
            check_in: "2024-01-01",
            check_out: "2024-01-05",
            guest_count: 2,
        };

        it("should create booking successfully", async () => {
            // Listing check
            mockSupabaseAdmin.single.mockResolvedValueOnce({
                data: { id: 1, price: 100, max_guests: 4, is_active: true },
                error: null,
            });
            // Conflict check
            mockSupabaseAdmin.or.mockResolvedValueOnce({ data: [], error: null });
            // Insert
            mockSupabaseAdmin.single.mockResolvedValueOnce({
                data: { ...validBookingData, id: 1, total_price: 400 },
                error: null,
            });

            const result = await bookingService.create("user-id", validBookingData);

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith("bookings");
            expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    total_price: 400,
                    guest_id: "user-id",
                }),
            );
            expect(result).toEqual(expect.objectContaining({ total_price: 400 }));
        });

        it("should throw NotFoundError if listing not found", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null });

            await expect(bookingService.create("user-id", validBookingData)).rejects.toThrow(NotFoundError);
        });

        it("should throw BadRequestError if guest count exceeds max", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({
                data: { id: 1, price: 100, max_guests: 1, is_active: true },
                error: null,
            });

            await expect(bookingService.create("user-id", validBookingData)).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if dates conflict", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({
                data: { id: 1, price: 100, max_guests: 4, is_active: true },
                error: null,
            });
            mockSupabaseAdmin.or.mockResolvedValueOnce({ data: [{ id: 99 }], error: null }); // Conflict found

            await expect(bookingService.create("user-id", validBookingData)).rejects.toThrow(BadRequestError);
        });
    });

    describe("getByUser", () => {
        it("should return bookings for user", async () => {
            mockSupabaseAdmin.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

            await bookingService.getByUser("user-id");

            expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith("guest_id", "user-id");
        });
    });

    describe("getByListing", () => {
        it("should return bookings if user is host", async () => {
            // checkViewPermission: host check
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "user-id" }, error: null });

            mockSupabaseAdmin.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

            await bookingService.getByListing(1, "user-id");

            expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith("listing_id", 1);
        });

        it("should throw ForbiddenError if user is not host or co-host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null }); // not host
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null }); // not co-host

            await expect(bookingService.getByListing(1, "user-id")).rejects.toThrow(ForbiddenError);
        });
    });

    describe("delete (cancel/reject)", () => {
        it("should allowed if user is guest", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { listing_id: 1, guest_id: "user-id" }, error: null });
            // mockSupabaseAdmin.delete.mockReturnThis();
            // mockSupabaseAdmin.eq.mockResolvedValueOnce({ error: null });

            await bookingService.delete(1, "user-id");

            expect(mockSupabaseAdmin.delete).toHaveBeenCalled();
        });

        it("should allowed if user is host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { listing_id: 1, guest_id: "other-id" }, error: null });
            // check host
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "user-id" }, error: null });

            // mockSupabaseAdmin.delete.mockReturnThis();
            // mockSupabaseAdmin.eq.mockResolvedValueOnce({ error: null });

            await bookingService.delete(1, "user-id");

            expect(mockSupabaseAdmin.delete).toHaveBeenCalled();
        });

        it("should throw ForbiddenError if user is neither guest nor host", async () => {
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { listing_id: 1, guest_id: "other-id" }, error: null });
            mockSupabaseAdmin.single.mockResolvedValueOnce({ data: { host_id: "another-id" }, error: null });

            console.log("Mock 1 set: guest=other-id");
            console.log("Mock 2 set: host=another-id");

            await expect(bookingService.delete(1, "user-id")).rejects.toThrow(ForbiddenError);
        });
    });
});
