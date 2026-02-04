import { signupSchema, loginSchema } from "../../validators/user.validator";

describe("UserValidator", () => {
    describe("signupSchema", () => {
        it("should validate correct signup data", async () => {
            const data = {
                body: {
                    email: "test@example.com",
                    password: "password123",
                    first_name: "John",
                    last_name: "Doe",
                },
            };
            const result = await signupSchema.safeParseAsync(data);
            expect(result.success).toBe(true);
        });

        it("should fail with invalid email", async () => {
            const data = {
                body: {
                    email: "invalid-email",
                    password: "password123",
                    first_name: "John",
                    last_name: "Doe",
                },
            };
            const result = await signupSchema.safeParseAsync(data);
            expect(result.success).toBe(false);
        });

        it("should fail with short password", async () => {
            const data = {
                body: {
                    email: "test@example.com",
                    password: "short",
                    first_name: "John",
                    last_name: "Doe",
                },
            };
            const result = await signupSchema.safeParseAsync(data);
            expect(result.success).toBe(false);
        });
    });

    describe("loginSchema", () => {
        it("should validate correct login data", async () => {
            const data = {
                body: {
                    email: "test@example.com",
                    password: "password123",
                },
            };
            const result = await loginSchema.safeParseAsync(data);
            expect(result.success).toBe(true);
        });

        it("should fail if missing fields", async () => {
            const data = {
                body: {
                    email: "test@example.com",
                },
            };
            const result = await loginSchema.safeParseAsync(data);
            expect(result.success).toBe(false);
        });
    });
});
