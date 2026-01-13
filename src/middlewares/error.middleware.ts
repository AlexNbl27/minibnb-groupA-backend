import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { env } from "../config/env";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
        });
    }

    // Erreur Zod
    if (error instanceof ZodError) {
        const zodErrors = error.issues || [];
        const errorMessage = zodErrors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");

        return res.status(400).json({
            success: false,
            message: errorMessage ? `Validation error: ${errorMessage}` : "Validation error",
            errors: zodErrors,
        });
    }

    if (env.NODE_ENV !== "test") {
        console.error("Unhandled error:", error);
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
