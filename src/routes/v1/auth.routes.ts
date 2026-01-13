import express from "express";
import { AuthService } from "../../services/auth.service";
import { ConflictError } from "../../utils/errors";
import { validate } from "../../middlewares/validation.middleware";
import { signupSchema, loginSchema } from "../../validators/user.validator";
import { sendSuccess } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";
import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  COOKIE_NAMES,
} from "../../config/cookies";

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
 *                 format: email
 *                 example: john.doe@example.com
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MySecurePassword123
 *                 description: Password with minimum 8 characters
 *               first_name:
 *                 type: string
 *                 minLength: 2
 *                 example: John
 *                 description: First name with minimum 2 characters
 *               last_name:
 *                 type: string
 *                 minLength: 2
 *                 example: Doe
 *                 description: Last name with minimum 2 characters
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
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

    if (data.session?.access_token) {
      res.cookie(
        COOKIE_NAMES.ACCESS_TOKEN,
        data.session.access_token,
        ACCESS_TOKEN_COOKIE_OPTIONS
      );
    }

    if (data.session?.refresh_token) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        data.session.refresh_token,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
    }

    sendSuccess(res, { user: data.user }, 201);
  } catch (error: any) {
    if (
      error.message === "User already registered" ||
      error.code === "user_already_exists"
    ) {
      next(new ConflictError("User already exists"));
      return;
    }
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
 *                 format: email
 *                 example: john.doe@example.com
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 example: MySecurePassword123
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.signIn(email, password);

    if (data.session?.access_token) {
      res.cookie(
        COOKIE_NAMES.ACCESS_TOKEN,
        data.session.access_token,
        ACCESS_TOKEN_COOKIE_OPTIONS
      );
    }

    if (data.session?.refresh_token) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        data.session.refresh_token,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
    }

    sendSuccess(res, { user: data.user });
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

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_TOKEN_COOKIE_OPTIONS);

    sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token found");
    }

    const data = await authService.refreshSession(refreshToken);

    if (data.session?.access_token) {
      res.cookie(
        COOKIE_NAMES.ACCESS_TOKEN,
        data.session.access_token,
        ACCESS_TOKEN_COOKIE_OPTIONS
      );
    }

    if (data.session?.refresh_token) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        data.session.refresh_token,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
    }

    sendSuccess(res, { user: data.user });
  } catch (error) {
    next(error);
  }
});

export default router;
