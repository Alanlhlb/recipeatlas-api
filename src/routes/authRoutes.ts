import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, getCurrentUser);

export default authRouter;
