import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

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
    if (error.name === "ZodError") {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: (error as any).errors,
        });
    }

    console.error("Unhandled error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
