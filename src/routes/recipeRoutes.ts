import { Router } from 'express';
import { getById, list } from '../controllers/recipeController';

const recipeRouter = Router();

recipeRouter.get('/', list);
recipeRouter.get('/:id', getById);

export default recipeRouter;
