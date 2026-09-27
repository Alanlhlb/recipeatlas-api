import { Router } from 'express';
import { create } from '../controllers/adminRecipeController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const adminRecipeRouter = Router();

adminRecipeRouter.post('/recipes', requireAuth, requireAdmin, create);

export default adminRecipeRouter;
