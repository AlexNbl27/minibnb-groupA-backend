import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase';

const SQL_FILE_PATH = path.join(process.cwd(), 'airbnb.sql');

async function seed() {
    console.log('🌱 Starting seed process...');

    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error(`❌ SQL file not found at ${SQL_FILE_PATH}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');
    const lines = sqlContent.split('\n');
    const insertLines = lines.filter(line => line.startsWith('INSERT INTO `listings`'));

    console.log(`Found ${insertLines.length} listings to insert.`);

    for (const line of insertLines) {
        try {
            await processLine(line);
        } catch (error) {
            console.error(`Error processing line: ${line.substring(0, 50)}...`, error);
        }
    }

    console.log('✅ Seeding completed!');
}

async function processLine(line: string) {
    // Extract content inside VALUES (...)
    const valuesMatch = line.match(/VALUES \((.*)\);/);
    if (!valuesMatch) return;

    const valuesStr = valuesMatch[1];
    const values = parseSqlValues(valuesStr);

    // Schema from SQL:
    // id, name, picture_url, host_name, host_thumbnail_url, price, neighbourhood_group_cleansed, review_scores_value
    const [
        id,
        name,
        pictureUrl,
        hostName,
        hostThumbnailUrl,
        price,
        neighbourhood,
        reviewScore
    ] = values;

    // 1. Handle Host
    const hostId = await ensureHost(hostName, hostThumbnailUrl);

    // 2. Parse Metadata from Name
    const metadata = parseListingName(name);

    // 3. Prepare Listing Data
    const listingData = {
        // We might want to let Supabase handle IDs if they are serial, but let's try to preserve if possible.
        // However, MiniBnB schema ID is number, Airbnb is int.
        // If we have conflicts, we might need to ignore ID or use upsert.
        host_id: hostId,
        name: name,
        description: `Beautiful ${metadata.property_type.toLowerCase()} in ${neighbourhood}.`,
        picture_url: pictureUrl,
        price: parseInt(price),
        address: `${neighbourhood}, France`,
        city: neighbourhood,
        // postal_code: null, 
        neighbourhood_group_cleansed: neighbourhood,
        bedrooms: metadata.bedrooms,
        beds: metadata.beds,
        bathrooms: metadata.bathrooms,
        max_guests: metadata.beds * 2, // Heuristic
        property_type: metadata.property_type,
        amenities: ["Wifi", "Kitchen", "Heating", "Washer", "Essentials"],
        review_scores_value: parseFloat(reviewScore) || null,
        is_active: true
    };

    // 4. Insert Listing
    const { error } = await supabaseAdmin
        .from('listings')
        .insert(listingData);

    if (error) {
        console.error(`Failed to insert listing ${name}:`, error.message);
    } else {
        // console.log(`Inserted listing: ${name}`);
        process.stdout.write('.');
    }
}

// Helper to reliably parse SQL value list respecting quotes
function parseSqlValues(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === "'" && str[i - 1] !== '\\') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cleanValue(current));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(cleanValue(current));
    return result;
}

function cleanValue(val: string): string {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
        // Unescape SQL escapes if needed (basic handling)
        val = val.replace(/\\'/g, "'");
    }
    return val;
}

async function ensureHost(name: string, avatarUrl: string): Promise<string> {
    // Generate a deterministic email for the host so we don't create duplicates
    const email = `host.${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@minibnb.demo`;

    // Try to find existing profile first via direct DB query (bypassing auth check which requires ID)
    // But profiles are linked to auth.users.
    // Ideally we use admin auth client to list users.

    // Strategy: Create user using Admin API. If exists, it deals with it?
    // User creation via Admin API:
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            first_name: name,
            last_name: '(Host)',
            is_host: true,
            avatar_url: avatarUrl
        }
    });

    if (user) return user.id;

    // If error is "User already registered", fetch the user ID
    if (createError?.message?.includes('registered')) {
        // We can't easily "get by email" with admin client without listing all users (expensive) or using a direct query if we had access to auth schema (we don't usually).
        // However, since profiles likely exist for these users, maybe we can query the 'profiles' table by email?
        // Wait, 'profiles' table has 'email' column according to config/supabase.ts schema!
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profile) return profile.id;
    }

    // Fallback: If we can't find or create, return a placeholder ID if foreign keys allow it (unlikely)
    // Or fail
    throw new Error(`Could not ensure host for ${name}: ${createError?.message}`);
}

function parseListingName(name: string) {
    // Example: "Rental unit in Bordeaux · ★4.78 · 2 bedrooms · 3 beds · 1 bath"
    const parts = name.split(' · ');

    let property_type = 'Apartment';
    if (parts[0]) {
        const typeMatch = parts[0].match(/^(.*?) in /);
        if (typeMatch) property_type = typeMatch[1];
    }

    let bedrooms = 1;
    let beds = 1;
    let bathrooms = 1;

    for (const part of parts) {
        if (part.includes('bedroom')) {
            const match = part.match(/(\d+)/);
            if (match) bedrooms = parseInt(match[1]);
            // Studio handling
            if (part.toLowerCase().includes('studio')) bedrooms = 0;
        }
        if (part.includes('bed') && !part.includes('bedroom')) { // exclude 'bedroom' matches
            const match = part.match(/(\d+)/);
            if (match) beds = parseInt(match[1]);
        }
        if (part.includes('bath')) {
            const match = part.match(/(\d+(\.\d+)?)/);
            if (match) bathrooms = parseFloat(match[1]);
        }
    }

    return { property_type, bedrooms, beds, bathrooms };
}

seed().catch(console.error);
