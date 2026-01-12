import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";
import { UnauthorizedError } from "../utils/errors";

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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError(
                "Missing or invalid authorization header",
            );
        }

        const token = authHeader.split(" ")[1];

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
