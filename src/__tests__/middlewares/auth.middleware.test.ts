import { authenticate } from "../../middlewares/auth.middleware";
import { supabase } from "../../config/supabase";
import { UnauthorizedError } from "../../utils/errors";
import { Request, Response, NextFunction } from "express";

jest.mock("../../config/supabase");

const mockSupabase = supabase as any;

describe("AuthMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            cookies: {},
            headers: {},
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should call next if token valid (from cookie)", async () => {
        req.cookies = { access_token: "valid-token" };
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: { id: "user-id", email: "test@example.com" } },
            error: null
        });

        await authenticate(req as Request, res as Response, next);

        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("valid-token");
        // Check that user is attached
        expect((req as any).user).toEqual({ id: "user-id", email: "test@example.com" });
        expect(next).toHaveBeenCalledWith();
    });

    it("should call next if token valid (from header)", async () => {
        req.headers = { authorization: "Bearer valid-token" };
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: { id: "user-id", email: "test@example.com" } },
            error: null
        });

        await authenticate(req as Request, res as Response, next);

        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("valid-token");
        expect(next).toHaveBeenCalledWith();
    });

    it("should throw UnauthorizedError if token missing", async () => {
        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should throw UnauthorizedError if token invalid/expired", async () => {
        req.cookies = { access_token: "invalid-token" };
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: "Invalid token" }
        });

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
