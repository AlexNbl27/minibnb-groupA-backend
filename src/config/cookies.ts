import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
};

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
};

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const COOKIE_NAMES = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
} as const;
