import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";
import { UnauthorizedError } from "../utils/errors";
import { COOKIE_NAMES } from "../config/cookies";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        let token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            throw new UnauthorizedError(
                "Missing authentication token",
            );
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            throw new UnauthorizedError("Invalid or expired token");
        }

        req.user = {
            id: data.user.id,
            email: data.user.email!,
        };

        next();
    } catch (error) {
        next(error);
    }
};
