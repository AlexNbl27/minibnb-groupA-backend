export interface Booking {
    id: number;
    listing_id: number;
    guest_id: string;
    check_in: string; // ISO date
    check_out: string;
    total_price: number;
    guest_count: number;
    created_at: string;
    updated_at: string;
}
