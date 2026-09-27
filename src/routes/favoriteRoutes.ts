import { Router } from 'express';
import { create, list, remove } from '../controllers/favoriteController';
import { requireAuth } from '../middleware/auth';

const favoriteRouter = Router();

favoriteRouter.get('/', requireAuth, list);
favoriteRouter.post('/:recipeId', requireAuth, create);
favoriteRouter.delete('/:recipeId', requireAuth, remove);

export default favoriteRouter;
