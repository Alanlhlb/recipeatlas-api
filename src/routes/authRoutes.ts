import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

/**
 * Authentication routes.
 *
 * Registration and login are public because they establish the caller's identity;
 * reading the current account is guarded by `requireAuth`.
 */
const authRouter = Router();

/** POST /api/auth/register — create a standard user account; unguarded. */
authRouter.post('/register', register);
/** POST /api/auth/login — exchange credentials for a JWT; unguarded. */
authRouter.post('/login', login);
/** GET /api/auth/me — return the current account; guarded by requireAuth. */
authRouter.get('/me', requireAuth, getCurrentUser);

export default authRouter;
