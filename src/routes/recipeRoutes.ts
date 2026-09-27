import { Router } from 'express';
import { list } from '../controllers/recipeController';

const recipeRouter = Router();

recipeRouter.get('/', list);

export default recipeRouter;
