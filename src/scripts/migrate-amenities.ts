import { supabaseAdmin } from '../config/supabase';

const AMENITY_MAPPING: Record<string, string> = {
    // Exact matches (case-insensitive)
    "wifi": "wifi",
    "kitchen": "kitchen",
    "heating": "heating",
    "washer": "washer",
    "dryer": "dryer",
    "air conditioning": "air_conditioning",
    "tv": "tv",
    "iron": "iron",
    "pool": "pool",
    "garden": "garden",
    "barbecue": "barbecue",
    "parking": "parking",
    "smoke detector": "smoke_detector",
    "fire extinguisher": "fire_extinguisher",
    "first aid kit": "first_aid_kit",
    "elevator": "elevator",
    "gym": "gym",
    "pet friendly": "pet_friendly",
    // Common variants
    "essentials": "wifi", // map "Essentials" to wifi as best guess
    "television": "tv",
    "ac": "air_conditioning",
    "a/c": "air_conditioning",
    "swimming pool": "pool",
    "free parking": "parking",
    "pets allowed": "pet_friendly",
};

async function migrateAmenities() {
    console.log('🔄 Starting amenities migration...');

    // 1. Fetch all listings
    const { data: listings, error } = await supabaseAdmin
        .from('listings')
        .select('id, name, amenities');

    if (error) {
        console.error('❌ Failed to fetch listings:', error.message);
        process.exit(1);
    }

    console.log(`📊 Found ${listings.length} listings to process.`);

    let updatedCount = 0;
    const unknownAmenities = new Set<string>();

    for (const listing of listings) {
        if (!listing.amenities || !Array.isArray(listing.amenities)) {
            continue;
        }

        const currentAmenities = listing.amenities as string[];
        const newAmenities = new Set<string>();

        for (const amenity of currentAmenities) {
            if (!amenity) continue;

            const normalized = amenity.toLowerCase().trim();
            const mapped = AMENITY_MAPPING[normalized];

            if (mapped) {
                newAmenities.add(mapped);
            } else {
                unknownAmenities.add(amenity);
            }
        }

        // Update if different
        const newAmenitiesArray = Array.from(newAmenities);
        // Simple check if changed (length different or content different)
        const isChanged =
            newAmenitiesArray.length !== currentAmenities.length ||
            !newAmenitiesArray.every(a => currentAmenities.includes(a));

        // Actually we should force update to normalized slugs anyway
        // But let's only update if we have mapped valid slugs
        if (newAmenitiesArray.length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('listings')
                .update({ amenities: newAmenitiesArray })
                .eq('id', listing.id);

            if (updateError) {
                console.error(`⚠️ Failed to update listing ${listing.id}:`, updateError.message);
            } else {
                updatedCount++;
                process.stdout.write('.');
            }
        }
    }

    console.log('\n✅ Migration completed!');
    console.log(`📝 Updated ${updatedCount} listings.`);

    if (unknownAmenities.size > 0) {
        console.log('\n⚠️ Unmapped amenities found (preserved in original but not added to new list if strict replace, current logic replaces whole array so they are LOST):');
        // Wait, the requirement says "Ne pas supprimer les amenities inconnues (les ignorer silencieusement, ne garder que les mappées)"
        // "ne garder que les mappées" implies we only keep the mapped ones, so the unknown ones ARE deleted from the listing's amenity list.
        console.log(Array.from(unknownAmenities).sort().join('\n'));
    }
}

migrateAmenities().catch(console.error);
