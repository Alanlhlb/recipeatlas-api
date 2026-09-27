import type { NextFunction, Request, Response } from 'express';
import { createRecipe, updateRecipe } from '../services/recipeService';
import { AppError } from '../middleware/errorHandler';

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

/**
 * Replaces a recipe for an authenticated administrator.
 */
export function update(req: Request, res: Response, next: NextFunction): void {
  try {
    const idParameter = req.params.id;

    if (Array.isArray(idParameter) || !/^\d+$/.test(idParameter)) {
      throw new AppError('Recipe id must be a positive whole number', 400);
    }

    const recipeId = Number(idParameter);

    if (recipeId < 1) {
      throw new AppError('Recipe id must be a positive whole number', 400);
    }

    const recipe = updateRecipe(recipeId, req.body);

    res.status(200).json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
}
