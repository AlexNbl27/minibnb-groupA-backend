import express from "express";
import { AuthService } from "../../services/auth.service";
import { validate } from "../../middlewares/validation.middleware";
import {
    signupSchema,
    loginSchema,
    refreshTokenSchema,
} from "../../validators/user.validator";
import { sendSuccess } from "../../utils/response";

const router = express.Router();
const authService = new AuthService();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.signIn(email, password);
        sendSuccess(res, { user: data.user, session: data.session });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", async (req, res, next) => {
    try {
        await authService.signOut();
        sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh user session
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session refreshed successfully
 */
router.post("/refresh", validate(refreshTokenSchema), async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        const data = await authService.refreshToken(refresh_token);
        sendSuccess(res, { user: data.user, session: data.session });
    } catch (error) {
        next(error);
    }
});

export default router;
