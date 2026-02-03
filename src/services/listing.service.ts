import { supabase } from "../config/supabase";
import { Listing } from "../types/listing.types";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class ListingService {
    // Créer une annonce (hôte uniquement)
    async create(userId: string, data: Partial<Listing>): Promise<Listing> {
        // Vérifier que l'utilisateur est hôte
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_host")
            .eq("id", userId)
            .single();

        if (!profile?.is_host) {
            throw new ForbiddenError("Only hosts can create listings");
        }

        const { data: listing, error } = await supabase
            .from("listings")
            .insert({ ...data, host_id: userId })
            .select()
            .single();

        if (error) throw error;
        return listing;
    }

    // Récupérer toutes les annonces (avec cache)
    async getAll(
        filters?: {
            city?: string;
            min_price?: number;
            max_price?: number;
            guests?: number;
            q?: string;
            host_id?: string;
            check_in?: string;
            check_out?: string;
            property_type?: string;
            property_types?: string[];
            amenities?: string[];
            amenities_any?: string[];
            min_bedrooms?: number;
            min_beds?: number;
            min_bathrooms?: number;
            min_rating?: number;
        },
        pagination: { page: number; limit: number } = { page: 1, limit: 10 },
    ): Promise<{ data: Listing[]; total: number }> {
        let query = supabase
            .from("listings")
            .select("*", { count: "exact" })
            .eq("is_active", true);

        if (filters?.city) {
            query = query.ilike("city", `%${filters.city}%`);
        }
        if (filters?.min_price) {
            query = query.gte("price", filters.min_price);
        }
        if (filters?.max_price) {
            query = query.lte("price", filters.max_price);
        }
        if (filters?.guests) {
            query = query.gte("max_guests", filters.guests);
        }
        if (filters?.host_id) {
            query = query.eq("host_id", filters.host_id);
        }
        if (filters?.q) {
            query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
        }

        // Filtres avancés
        if (filters?.property_type) {
            query = query.eq("property_type", filters.property_type);
        }
        if (filters?.property_types && filters.property_types.length > 0) {
            query = query.in("property_type", filters.property_types);
        }
        if (filters?.amenities && filters.amenities.length > 0) {
            query = query.contains("amenities", filters.amenities);
        }
        if (filters?.amenities_any && filters.amenities_any.length > 0) {
            query = query.overlaps("amenities", filters.amenities_any);
        }
        if (filters?.min_bedrooms) {
            query = query.gte("bedrooms", filters.min_bedrooms);
        }
        if (filters?.min_beds) {
            query = query.gte("beds", filters.min_beds);
        }
        if (filters?.min_bathrooms) {
            query = query.gte("bathrooms", filters.min_bathrooms);
        }
        if (filters?.min_rating) {
            query = query.gte("review_scores_value", filters.min_rating);
        }

        // Filtrage par dates (disponibilité)
        if (filters?.check_in && filters?.check_out) {
            const checkIn = filters.check_in;
            const checkOut = filters.check_out;

            // Trouver les listings occupés
            const { data: busyListings } = await supabase
                .from("bookings")
                .select("listing_id")
                .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`);

            if (busyListings && busyListings.length > 0) {
                const busyIds = busyListings.map((b) => b.listing_id);
                query = query.not("id", "in", `(${busyIds.join(",")})`);
            }
        }

        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;

        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    }

    // Récupérer une annonce par ID
    async getById(id: number): Promise<Listing> {
        const { data, error } = await supabase
            .from("listings")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            throw new NotFoundError("Listing not found");
        }
        return data;
    }

    // Mettre à jour une annonce
    async update(
        id: number,
        userId: string,
        data: Partial<Listing>,
    ): Promise<Listing> {
        // Vérifier permissions (hôte ou co-hôte avec can_edit_listing)
        const canEdit = await this.checkEditPermission(id, userId);
        if (!canEdit) {
            throw new ForbiddenError(
                "You do not have permission to edit this listing",
            );
        }

        const { data: listing, error } = await supabase
            .from("listings")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return listing;
    }

    // Supprimer une annonce (hôte uniquement)
    async delete(id: number, userId: string): Promise<void> {
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", id)
            .single();

        if (listing?.host_id !== userId) {
            throw new ForbiddenError("Only the host can delete the listing");
        }

        const { error } = await supabase.from("listings").delete().eq("id", id);

        if (error) throw error;
    }

    // Vérifier permission d'édition
    private async checkEditPermission(
        listingId: number,
        userId: string,
    ): Promise<boolean> {
        // Vérifier si hôte principal
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listingId)
            .single();

        if (listing?.host_id === userId) return true;

        // Vérifier si co-hôte avec permission
        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_edit_listing")
            .eq("listing_id", listingId)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_edit_listing || false;
    }
}
