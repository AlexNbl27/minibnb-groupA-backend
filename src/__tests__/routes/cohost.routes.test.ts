import request from "supertest";
import express from "express";
import cohostRoutes from "../../routes/v1/cohost.routes";
import { errorHandler } from "../../middlewares/error.middleware";
import { supabase } from "../../config/supabase";
import cookieParser from "cookie-parser";

jest.mock("../../config/supabase");
const mockSupabase = supabase as any;

// Mock auth middleware
jest.mock("../../middlewares/auth.middleware", () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: "user-id" };
        next();
    },
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/cohosts", cohostRoutes);
app.use(errorHandler);

describe("CohostRoutes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /cohosts", () => {
        it("should add co-host successfully", async () => {
            mockSupabase.from.mockReturnThis();
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockReturnThis();
            // Listing check
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "user-id" }, error: null });
            // Insert co-host
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 1 }, error: null });

            const response = await request(app)
                .post("/cohosts")
                .send({ listing_id: 1, co_host_id: "cohost-id" });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it("should reject if user is not the host", async () => {
            mockSupabase.from.mockReturnThis();
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockReturnThis();
            // Listing check
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null });

            const response = await request(app)
                .post("/cohosts")
                .send({ listing_id: 1, co_host_id: "cohost-id" });

            expect(response.status).toBe(403);
        });
    });

    describe("DELETE /cohosts/:id", () => {
        it("should remove co-host as host", async () => {
            mockSupabase.from.mockReturnThis();
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockReturnThis();

            // fetch cohost
            mockSupabase.single.mockResolvedValueOnce({ data: { listing_id: 1, co_host_id: "cohost-id" }, error: null });
            // fetch listing 
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "user-id" }, error: null });
            // delete - returning a builder that has eq
            mockSupabase.delete.mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            const response = await request(app).delete("/cohosts/1");

            expect(response.status).toBe(200);
        });

        it("should allow co-host to remove themselves", async () => {
            mockSupabase.from.mockReturnThis();
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockReturnThis();

            // fetch cohost
            mockSupabase.single.mockResolvedValueOnce({ data: { listing_id: 1, co_host_id: "user-id" }, error: null });
            // fetch listing
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "other-id" }, error: null });
            // delete
            mockSupabase.delete.mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            const response = await request(app).delete("/cohosts/1");

            expect(response.status).toBe(200);
        });

        it("should reject if not host or the co-host", async () => {
            mockSupabase.from.mockReturnThis();
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockReturnThis();

            // fetch cohost
            mockSupabase.single.mockResolvedValueOnce({ data: { listing_id: 1, co_host_id: "other-id" }, error: null });
            // fetch listing
            mockSupabase.single.mockResolvedValueOnce({ data: { host_id: "another-id" }, error: null });

            const response = await request(app).delete("/cohosts/1");

            expect(response.status).toBe(403);
        });
    });
});
