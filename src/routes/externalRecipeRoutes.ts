import { Router } from 'express';
import { search } from '../controllers/externalRecipeController';

/**
 * External recipe routes.
 *
 * Proxies the TheMealDB search API; the endpoint is public and unguarded.
 */
const externalRecipeRouter = Router();

/** GET /api/external-recipes — search TheMealDB; unguarded. */
externalRecipeRouter.get('/', search);

export default externalRecipeRouter;
