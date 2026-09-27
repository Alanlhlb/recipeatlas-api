import { Router } from 'express';
import { create, update } from '../controllers/adminRecipeController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const adminRecipeRouter = Router();

adminRecipeRouter.post('/recipes', requireAuth, requireAdmin, create);
adminRecipeRouter.put('/recipes/:id', requireAuth, requireAdmin, update);

export default adminRecipeRouter;
