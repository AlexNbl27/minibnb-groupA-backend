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
