import { supabase } from "../config/supabase";
import { Booking } from "../types/booking.types";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "../utils/errors";

export class BookingService {
    // Créer une réservation (avec validation chevauchement)
    async create(
        userId: string,
        data: {
            listing_id: number;
            check_in: string;
            check_out: string;
            guest_count: number;
        },
    ): Promise<Booking> {
        // Vérifier que le listing existe et est actif
        const { data: listing } = await supabase
            .from("listings")
            .select("id, price, max_guests, is_active")
            .eq("id", data.listing_id)
            .single();

        if (!listing || !listing.is_active) {
            throw new NotFoundError("Listing not found or inactive");
        }

        if (data.guest_count > listing.max_guests) {
            throw new BadRequestError(
                `Maximum ${listing.max_guests} guests allowed`,
            );
        }

        // Vérifier disponibilité (pas de chevauchement)
        const { data: conflictingBookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("listing_id", data.listing_id)
            .or(
                `and(check_in.lte.${data.check_out},check_out.gte.${data.check_in})`,
            );

        if (conflictingBookings && conflictingBookings.length > 0) {
            throw new BadRequestError(
                "Listing is not available for these dates",
            );
        }

        // Calculer le prix total
        const days = Math.ceil(
            (new Date(data.check_out).getTime() -
                new Date(data.check_in).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const total_price = days * listing.price;

        const { data: booking, error } = await supabase
            .from("bookings")
            .insert({
                ...data,
                guest_id: userId,
                total_price,
            })
            .select()
            .single();

        if (error) throw error;
        return booking;
    }

    // Récupérer les réservations d'un utilisateur
    async getByUser(
        userId: string,
        pagination: { page: number; limit: number } = { page: 1, limit: 10 },
    ): Promise<{ data: Booking[]; total: number }> {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;

        const { data, error, count } = await supabase
            .from("bookings")
            .select("*, listing:listings(*)", { count: "exact" })
            .eq("guest_id", userId)
            .order("check_in", { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    }

    // Récupérer les réservations d'un listing (hôte/co-hôte)
    async getByListing(
        listingId: number,
        userId: string,
        pagination: { page: number; limit: number } = { page: 1, limit: 10 },
    ): Promise<{ data: Booking[]; total: number }> {
        // Vérifier permission (hôte ou co-hôte)
        const canView = await this.checkViewPermission(listingId, userId);
        if (!canView) {
            throw new ForbiddenError(
                "You do not have permission to view bookings",
            );
        }

        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;

        const { data, error, count } = await supabase
            .from("bookings")
            .select("*, guest:profiles(first_name, last_name, avatar_url)", { count: "exact" })
            .eq("listing_id", listingId)
            .order("check_in", { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    }

    private async checkViewPermission(
        listingId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listingId)
            .single();

        if (listing?.host_id === userId) return true;

        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("id")
            .eq("listing_id", listingId)
            .eq("co_host_id", userId)
            .single();

        return !!coHost;
    }
}
