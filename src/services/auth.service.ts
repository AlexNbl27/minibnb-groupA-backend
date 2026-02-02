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

        if (error) throw error;
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
        // 1. Verify old password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPassword,
        });

        if (signInError) throw signInError;

        // 2. Update password with admin client
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) throw error;
        return data;
    }
}
