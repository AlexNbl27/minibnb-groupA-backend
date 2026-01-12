export interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    is_host: boolean;
    created_at: string;
    updated_at: string;
}

export interface CoHost {
    id: number;
    listing_id: number;
    host_id: string;
    co_host_id: string;
    can_edit_listing: boolean;
    can_access_messages: boolean;
    can_respond_messages: boolean;
    created_at: string;
}
