export interface Message {
    id: number;
    conversation_id: number;
    sender_id: string;
    content: string;
    created_at: string;
}

export interface Conversation {
    id: number;
    listing_id: number;
    booking_id: number | null;
    guest_id: string;
    host_id: string;
    co_host_id: number | null;
    created_at: string;
    updated_at: string;
}
