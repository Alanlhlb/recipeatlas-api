import { Router } from 'express';
import { create, remove, update } from '../controllers/adminRecipeController';
import { requireAdmin, requireAuth } from '../middleware/auth';

/**
 * Administrator recipe-management routes.
 *
 * Every endpoint is guarded by `requireAuth` followed by `requireAdmin`, so only an
 * authenticated administrator can create, replace or delete a recipe.
 */
const adminRecipeRouter = Router();

/** POST /api/admin/recipes — create a recipe; guarded by requireAuth and requireAdmin. */
adminRecipeRouter.post('/recipes', requireAuth, requireAdmin, create);
/** PUT /api/admin/recipes/:id — replace a recipe; guarded by requireAuth and requireAdmin. */
adminRecipeRouter.put('/recipes/:id', requireAuth, requireAdmin, update);
/** DELETE /api/admin/recipes/:id — delete a recipe; guarded by requireAuth and requireAdmin. */
adminRecipeRouter.delete('/recipes/:id', requireAuth, requireAdmin, remove);

export default adminRecipeRouter;
