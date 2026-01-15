import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { env } from "../config/env";
import { ErrorResponse } from "../utils/errors";


export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    let statusCode: number = 500;
    let message = "Internal server error";
    let status = "error";
    let errors: any[] | undefined;

    // Handle AppError (Trusted errors)
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        status = error.status;
        errors = error.errors;
    }
    // Handle Zod Validation Errors
    else if (error instanceof ZodError) {
        statusCode = 400;
        message = "Validation error";
        status = "fail";
        errors = error.issues;
    }
    // Handle Supabase Errors (PostgrestError)
    else if (error?.code && error?.details && error?.hint) {
        // This is a naive check for Supabase/Postgres errors
        // You might want to refine this based on specific error codes
        if (error.code === '23505') { // Unique violation
            statusCode = 409;
            message = "Duplicate value";
            status = "fail";
        } else {
            console.error("Supabase Error:", error);
        }
    }

    // Log unexpected errors
    if (statusCode === 500) {
        if (env.NODE_ENV !== "test") {
            console.error("Unhandled error:", error);
        }
    }
    new ErrorResponse(statusCode, message, status, errors).send(res);
};
