import { supabase, supabaseAdmin } from "../config/supabase";

export class AuthService {
    async signUp(
        email: string,
        password: string,
        first_name: string,
        last_name: string,
    ) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name, last_name },
            },
        });

        if (error) throw error;
        return data;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Check if user exists to distinguish error
            // Using supabaseAdmin to bypass RLS if needed, or public profiles if readable
            // Assuming we can check profiles or try to sign up with a dummy password to see if email is taken (hacky)
            // Better: use admin API to get user by email
            const { data: userData, error: userError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("email", email)
                .single();

            if (!userData || userError) {
                throw new Error("User not found");
            }

            throw new Error("Invalid password");
        }
        return data;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async refreshSession(refreshToken: string) {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) throw error;
        return data;
    }

    async updatePassword(userId: string, email: string, oldPassword: string, newPassword: string) {
        // Verify old password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPassword,
        });

        if (signInError) {
            throw new Error("Invalid login credentials");
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
    }
}
