import { Router } from 'express';
import { getById, list } from '../controllers/recipeController';
import { optionalAuth } from '../middleware/auth';

/**
 * Public recipe routes.
 *
 * These endpoints stay open to anonymous visitors. `optionalAuth` simply enriches
 * the request with the caller's identity when a valid Bearer token is supplied, so
 * the hypermedia links in the response can reflect what that caller may do.
 */
const recipeRouter = Router();

recipeRouter.get('/', optionalAuth, list);
recipeRouter.get('/:id', optionalAuth, getById);

export default recipeRouter;
