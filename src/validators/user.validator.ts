import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        first_name: z.string().min(2),
        last_name: z.string().min(2),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        old_password: z.string(),
        new_password: z.string().min(8),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        first_name: z.string().min(2).optional(),
        last_name: z.string().min(2).optional(),
        phone: z.string().optional(),
        avatar_url: z.union([z.string().url(), z.literal("")]).optional(),
        bio: z.string().max(500).optional(),
    }),
});
