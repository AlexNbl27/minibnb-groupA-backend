import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../src/middlewares/error.middleware";
import { AppError, NotFoundError, BadRequestError, ErrorResponse } from "../../src/utils/errors";
import { ZodError, z } from "zod";

describe("Error Handling", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        mockReq = {};
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;
        mockNext = jest.fn();
    });
    describe("ErrorResponse", () => {
        it("should send error status and structure", () => {
            const errors = ["Field required"];
            new ErrorResponse(400, "Bad Request", "fail", errors).send(mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                status: "fail",
                message: "Bad Request",
                code: 400,
                errors: errors,
            });
        });
    });

    describe("AppError Classes", () => {
        it("should create AppError with correct properties", () => {
            const error = new AppError(400, "Test error");
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe("Test error");
            expect(error.status).toBe("fail");
            expect(error.isOperational).toBe(true);
        });

        it("should create NotFoundError with correct default message", () => {
            const error = new NotFoundError();
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe("Resource not found");
        });
    });

    describe("Error Middleware", () => {
        const app = express();

        // Test route throwing AppError
        app.get("/app-error", (req, res, next) => {
            next(new BadRequestError("Bad Request"));
        });

        // Test route throwing ZodError (real)
        app.get("/zod-error", (req, res, next) => {
            try {
                const schema = z.string();
                schema.parse(123);
            } catch (error) {
                next(error);
            }
        });

        // Test route throwing generic Error
        app.get("/generic-error", (req, res, next) => {
            next(new Error("Something went wrong"));
        });

        // Test route with Supabase-like error
        app.get("/supabase-error", (req, res, next) => {
            const error: any = new Error("Supabase error");
            error.code = '23505';
            error.details = 'Key exists';
            error.hint = 'Try another one';
            next(error);
        });

        app.use(errorHandler);

        it("should handle AppError correctly", async () => {
            const res = await request(app).get("/app-error");
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                success: false,
                status: "fail",
                message: "Bad Request",
                code: 400
            });
        });

        it("should handle ZodError correctly", async () => {
            const res = await request(app).get("/zod-error");
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Validation error");
            expect(res.body.errors).toHaveLength(1);
        });

        it("should handle Supabase duplicate error correctly", async () => {
            const res = await request(app).get("/supabase-error");
            expect(res.status).toBe(409);
            expect(res.body.message).toBe("Duplicate value");
        });

        it("should handle generic Error as 500", async () => {
            // Suppress console.error for this test
            const originalConsoleError = console.error;
            console.error = jest.fn();

            const res = await request(app).get("/generic-error");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                success: false,
                status: "error",
                message: "Internal server error",
                code: 500
            });

            console.error = originalConsoleError;
        });
    });
});
