import { Response } from "express";

export const sendSuccess = (
    res: Response,
    data: any,
    statusCode: number = 200,
) => {
    res.status(statusCode).json({
        success: true,
        data,
    });
};

export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    errors: any[] = [],
) => {
    res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined,
    });
};
