import express from "express";
import { AuthService } from "../../services/auth.service";
import { validate } from "../../middlewares/validation.middleware";
import { signupSchema, loginSchema } from "../../validators/user.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();
const authService = new AuthService();

router.post("/signup", validate(signupSchema), async (req, res, next) => {
    try {
        const { email, password, first_name, last_name } = req.body;
        const data = await authService.signUp(
            email,
            password,
            first_name,
            last_name,
        );
        sendSuccess(res, { user: data.user, session: data.session }, 201);
    } catch (error) {
        next(error);
    }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.signIn(email, password);
        sendSuccess(res, { user: data.user, session: data.session });
    } catch (error) {
        next(error);
    }
});

router.post("/logout", async (req, res, next) => {
    try {
        await authService.signOut();
        sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;
