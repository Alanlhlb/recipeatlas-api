import type { NextFunction, Request, Response } from 'express';
import { listRecipes } from '../services/recipeService';

/**
 * Returns the public recipe catalogue.
 */
export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const recipes = listRecipes(req.query.q);

    res.status(200).json({
      status: 'success',
      data: { recipes },
    });
  } catch (error) {
    next(error);
  }
}
