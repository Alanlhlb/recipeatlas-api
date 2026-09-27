import type { NextFunction, Request, Response } from 'express';
import { searchTheMealDb } from '../services/theMealDbService';

/**
 * Searches recipe information from TheMealDB without modifying local data.
 *
 * Mounted at `GET /api/external-recipes`; it is public and unguarded, and simply
 * proxies the external provider's results into the RecipeAtlas response shape.
 *
 * @param req - Express request whose `q` query parameter is the search term.
 * @param res - Express response; sends 200 with the mapped external recipes.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when `q` is missing, 502 when the provider is unavailable.
 */
export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipes = await searchTheMealDb(req.query.q);

    res.status(200).json({
      status: 'success',
      data: { recipes },
    });
  } catch (error) {
    next(error);
  }
}
