import type { NextFunction, Request, Response } from 'express';
import { createRecipe } from '../services/recipeService';

/**
 * Creates a recipe for an authenticated administrator.
 */
export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    const recipe = createRecipe(req.body);

    res.status(201).json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
}
