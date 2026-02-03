import { getAvailability } from "../../services/availability.service";
import { supabaseAdmin } from "../../config/supabase";
import { NotFoundError } from "../../utils/errors";

jest.mock("../../config/supabase");

const mockSupabaseAdmin = supabaseAdmin as any;

describe("AvailabilityService", () => {
    // Helper to setup mocks for successful availability fetch
    const setupSuccessMocks = (
        listingData: { id: number; is_active: boolean },
        bookingsData: { check_in: string; check_out: string }[] | null
    ) => {
        // Mock for listing query: from().select().eq().single()
        mockSupabaseAdmin.single.mockResolvedValueOnce({
            data: listingData,
            error: null,
        });

        // Mock for bookings query: from().select().eq().not().not()
        // First not() returns this for chaining, second not() returns data
        mockSupabaseAdmin.not
            .mockReturnValueOnce(mockSupabaseAdmin)
            .mockResolvedValueOnce({
                data: bookingsData,
                error: null,
            });
    };

    const setupListingNotFoundMock = () => {
        mockSupabaseAdmin.single.mockResolvedValueOnce({
            data: null,
            error: null,
        });
    };

    const setupListingErrorMock = () => {
        mockSupabaseAdmin.single.mockResolvedValueOnce({
            data: null,
            error: { message: "Database error" },
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
        // Reset the mock chain
        mockSupabaseAdmin.from.mockReturnThis();
        mockSupabaseAdmin.select.mockReturnThis();
        mockSupabaseAdmin.eq.mockReturnThis();
        mockSupabaseAdmin.not.mockReturnThis();
    });

    describe("getAvailability", () => {
        describe("default range behavior", () => {
            it("should default start_date to today when not provided", async () => {
                const today = new Date();
                const expectedStartDate = today.toISOString().split("T")[0];

                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({ listingId: 1 });

                expect(result.query_range.start_date).toBe(expectedStartDate);
            });

            it("should default end_date to 3 months from today when not provided", async () => {
                const threeMonthsLater = new Date();
                threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
                const expectedEndDate = threeMonthsLater.toISOString().split("T")[0];

                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({ listingId: 1 });

                expect(result.query_range.end_date).toBe(expectedEndDate);
            });

            it("should use provided start_date when specified", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-06-01",
                });

                expect(result.query_range.start_date).toBe("2024-06-01");
            });

            it("should use provided end_date when specified", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-12-31",
                });

                expect(result.query_range.end_date).toBe("2024-12-31");
            });

            it("should use both provided dates when specified", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-02-15",
                    endDate: "2024-05-20",
                });

                expect(result.query_range.start_date).toBe("2024-02-15");
                expect(result.query_range.end_date).toBe("2024-05-20");
            });
        });

        describe("listing validation", () => {
            it("should throw NotFoundError if listing does not exist", async () => {
                setupListingNotFoundMock();

                await expect(getAvailability({ listingId: 999 })).rejects.toThrow(NotFoundError);
            });

            it("should throw NotFoundError if there is a database error", async () => {
                setupListingErrorMock();

                await expect(getAvailability({ listingId: 1 })).rejects.toThrow(NotFoundError);
            });

            it("should return is_active status from listing", async () => {
                setupSuccessMocks({ id: 1, is_active: false }, []);

                const result = await getAvailability({ listingId: 1 });

                expect(result.is_active).toBe(false);
            });
        });

        describe("overlap filtering results", () => {
            it("should return empty booked_periods when no bookings exist", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, []);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-03-31",
                });

                expect(result.booked_periods).toEqual([]);
            });

            it("should return booked_periods that overlap with query range", async () => {
                const overlappingBookings = [
                    { check_in: "2024-01-15", check_out: "2024-01-20" },
                    { check_in: "2024-02-01", check_out: "2024-02-10" },
                ];

                setupSuccessMocks({ id: 1, is_active: true }, overlappingBookings);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-03-31",
                });

                expect(result.booked_periods).toHaveLength(2);
                expect(result.booked_periods).toEqual(overlappingBookings);
            });

            it("should correctly format booked periods", async () => {
                const bookings = [{ check_in: "2024-01-10", check_out: "2024-01-15" }];

                setupSuccessMocks({ id: 1, is_active: true }, bookings);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-01-31",
                });

                expect(result.booked_periods[0]).toHaveProperty("check_in", "2024-01-10");
                expect(result.booked_periods[0]).toHaveProperty("check_out", "2024-01-15");
            });

            it("should handle null bookings response gracefully", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, null);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-03-31",
                });

                expect(result.booked_periods).toEqual([]);
            });

            // Note: Error handling for bookings fetch is tested via integration tests
            // The supabase mock chaining makes it difficult to test this error path in unit tests
        });

        describe("response structure", () => {
            it("should return correct response structure", async () => {
                setupSuccessMocks({ id: 1, is_active: true }, [
                    { check_in: "2024-01-10", check_out: "2024-01-15" },
                ]);

                const result = await getAvailability({
                    listingId: 1,
                    startDate: "2024-01-01",
                    endDate: "2024-03-31",
                });

                expect(result).toHaveProperty("listing_id", 1);
                expect(result).toHaveProperty("is_active", true);
                expect(result).toHaveProperty("booked_periods");
                expect(result).toHaveProperty("query_range");
                expect(result.query_range).toHaveProperty("start_date", "2024-01-01");
                expect(result.query_range).toHaveProperty("end_date", "2024-03-31");
            });
        });
    });
});
