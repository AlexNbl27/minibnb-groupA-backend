export interface Listing {
  id: number;
  host_id: string;
  host_name?: string;
  name: string;
  description?: string;
  picture_url: string;
  price: number;
  address: string;
  city: string;
  postal_code?: string;
  neighbourhood_group_cleansed?: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  property_type: string;
  rules?: string;
  amenities: string[];
  review_scores_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingExtend extends Listing {
  host_picture_url?: string;
  co_hosts?: {
    id: number;
    listing_id: number;
    host_id: string;
    co_host_id: string;
    can_edit_listing: boolean;
    can_access_messages: boolean;
    can_respond_messages: boolean;
    user: {
      first_name: string;
      last_name: string;
      avatar_url: string;
      email: string;
    };
  }[];
}
