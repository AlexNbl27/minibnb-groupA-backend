import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
);

// Client avec service role pour bypass RLS (admin operations)
export const supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
);

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone: string | null;
                    avatar_url: string | null;
                    bio: string | null;
                    is_host: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone?: string;
                    avatar_url?: string;
                    bio?: string;
                    is_host?: boolean;
                };
                Update: {
                    first_name?: string;
                    last_name?: string;
                    phone?: string;
                    avatar_url?: string;
                    bio?: string;
                    is_host?: boolean;
                };
            };
            // ... autres tables seront ajoutées au fur et à mesure
        };
    };
};
