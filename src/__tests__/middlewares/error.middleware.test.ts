import { errorHandler } from "../../middlewares/error.middleware";
import { AppError } from "../../utils/errors";
import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

describe("ErrorMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should handle AppError", () => {
        const error = new AppError(400, "Test error");

        errorHandler(error, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: "fail",
            message: "Test error",
        }));
    });

    it("should handle ZodError", () => {
        const error = new ZodError([{ code: "custom", path: ["field"], message: "Invalid" }]);

        errorHandler(error, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: "fail",
            message: "Validation error",
        }));
    });

    it("should handle Supabase/Postgres errors", () => {
        const error = { code: "23505", details: "Key already exists", hint: "Check key" };

        errorHandler(error, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: "fail",
            message: "Duplicate value",
        }));
    });

    it("should handle unknown errors", () => {
        const error = new Error("Unknown");
        // Suppress console.error
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        errorHandler(error, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: "error",
            message: "Internal server error",
        }));

        consoleSpy.mockRestore();
    });
});
