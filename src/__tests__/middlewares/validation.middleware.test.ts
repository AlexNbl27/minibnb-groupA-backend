import { validate } from "../../middlewares/validation.middleware";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

describe("ValidationMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const schema = z.object({
        body: z.object({
            name: z.string(),
        }),
    });

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {},
        };
        res = {};
        next = jest.fn();
    });

    it("should call next if validation passes", async () => {
        req.body = { name: "test" };

        await validate(schema)(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith();
    });

    it("should call next with error if validation fails", async () => {
        req.body = { name: 123 }; // Invalid type

        await validate(schema)(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
});
