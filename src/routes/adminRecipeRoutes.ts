import { Router } from 'express';
import { create, remove, update } from '../controllers/adminRecipeController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const adminRecipeRouter = Router();

adminRecipeRouter.post('/recipes', requireAuth, requireAdmin, create);
adminRecipeRouter.put('/recipes/:id', requireAuth, requireAdmin, update);
adminRecipeRouter.delete('/recipes/:id', requireAuth, requireAdmin, remove);

export default adminRecipeRouter;
