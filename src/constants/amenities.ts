export interface AmenityDefinition {
    slug: string;
    label: string;
    category: AmenityCategory;
}

export type AmenityCategory = "essentials" | "comfort" | "outdoor" | "safety" | "services";

export const AMENITY_CATEGORIES: Record<AmenityCategory, string> = {
    essentials: "Essentials",
    comfort: "Comfort",
    outdoor: "Outdoor",
    safety: "Safety",
    services: "Services",
};

export const AMENITIES: AmenityDefinition[] = [
    // Essentials
    { slug: "wifi", label: "Wifi", category: "essentials" },
    { slug: "kitchen", label: "Kitchen", category: "essentials" },
    { slug: "heating", label: "Heating", category: "essentials" },
    { slug: "washer", label: "Washer", category: "essentials" },
    { slug: "dryer", label: "Dryer", category: "essentials" },
    // Comfort
    { slug: "air_conditioning", label: "Air conditioning", category: "comfort" },
    { slug: "tv", label: "TV", category: "comfort" },
    { slug: "iron", label: "Iron", category: "comfort" },
    // Outdoor
    { slug: "pool", label: "Pool", category: "outdoor" },
    { slug: "garden", label: "Garden", category: "outdoor" },
    { slug: "barbecue", label: "Barbecue", category: "outdoor" },
    { slug: "parking", label: "Parking", category: "outdoor" },
    // Safety
    { slug: "smoke_detector", label: "Smoke detector", category: "safety" },
    { slug: "fire_extinguisher", label: "Fire extinguisher", category: "safety" },
    { slug: "first_aid_kit", label: "First aid kit", category: "safety" },
    // Services
    { slug: "elevator", label: "Elevator", category: "services" },
    { slug: "gym", label: "Gym", category: "services" },
    { slug: "pet_friendly", label: "Pet friendly", category: "services" },
];

export const VALID_AMENITY_SLUGS = AMENITIES.map((a) => a.slug);

export function getAmenitiesByCategory(): Record<AmenityCategory, AmenityDefinition[]> {
    return AMENITIES.reduce((acc, amenity) => {
        if (!acc[amenity.category]) acc[amenity.category] = [];
        acc[amenity.category].push(amenity);
        return acc;
    }, {} as Record<AmenityCategory, AmenityDefinition[]>);
}
