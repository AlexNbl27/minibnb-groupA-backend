import { supabaseAdmin } from "../config/supabase";
import { NotFoundError } from "../utils/errors";

interface AvailabilityQuery {
    listingId: number;
    startDate?: string;
    endDate?: string;
}

interface BookedPeriod {
    check_in: string;
    check_out: string;
}

export const getAvailability = async ({
    listingId,
    startDate,
    endDate,
}: AvailabilityQuery) => {
    // 1. Default dates if not provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    if (!startDate) {
        // If not provided, start is today (already set)
    }

    if (!endDate) {
        // Default +3 months
        end.setMonth(end.getMonth() + 3);
    }

    // Format YYYY-MM-DD for consistency
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // 2. Check listing exists & is_active
    const { data: listing, error: listingError } = await supabaseAdmin
        .from("listings")
        .select("id, is_active")
        .eq("id", listingId)
        .single();

    if (listingError || !listing) {
        throw new NotFoundError("Listing not found");
    }

    // 3. fetch bookings in range
    // Overlap logic: (booking_start <= query_end) AND (booking_end >= query_start)
    // supabase query
    const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from("bookings")
        .select("check_in, check_out")
        .eq("listing_id", listingId)
        .not("check_in", "gt", endStr) // check_in <= endStr
        .not("check_out", "lt", startStr); // check_out >= startStr

    // Note: Supabase/Postgrest overlap filtering can be tricky.
    // .not('check_in', 'gt', endStr) is equivalent to check_in <= endStr
    // .not('check_out', 'lt', startStr) is equivalent to check_out >= startStr

    if (bookingsError) {
        throw new Error("Failed to fetch bookings");
    }

    const bookedPeriods: BookedPeriod[] = (bookings || []).map((b) => ({
        check_in: b.check_in as string, // supabase types might need assertion or generic
        check_out: b.check_out as string,
    }));

    return {
        listing_id: listingId,
        is_active: listing.is_active,
        booked_periods: bookedPeriods,
        query_range: {
            start_date: startStr,
            end_date: endStr,
        },
    };
};
