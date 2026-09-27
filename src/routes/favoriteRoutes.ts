import { Router } from 'express';
import { create, list, remove } from '../controllers/favoriteController';
import { requireAuth } from '../middleware/auth';

/**
 * Favourite routes.
 *
 * Every endpoint is guarded by `requireAuth`, because a favourite always belongs to
 * the authenticated user.
 */
const favoriteRouter = Router();

/** GET /api/favorites — list the current user's favourites; guarded by requireAuth. */
favoriteRouter.get('/', requireAuth, list);
/** POST /api/favorites/:recipeId — save a recipe; guarded by requireAuth. */
favoriteRouter.post('/:recipeId', requireAuth, create);
/** DELETE /api/favorites/:recipeId — remove a saved recipe; guarded by requireAuth. */
favoriteRouter.delete('/:recipeId', requireAuth, remove);

export default favoriteRouter;
