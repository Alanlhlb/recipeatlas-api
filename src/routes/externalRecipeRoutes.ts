import { Router } from 'express';
import { search } from '../controllers/externalRecipeController';

const externalRecipeRouter = Router();

externalRecipeRouter.get('/', search);

export default externalRecipeRouter;
