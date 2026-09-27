import type { NextFunction, Request, Response } from 'express';
import { createRecipe, deleteRecipe, updateRecipe } from '../services/recipeService';
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
 * Validates and converts the route recipe id.
 */
function readRecipeId(req: Request): number {
  const idParameter = req.params.id;

  if (Array.isArray(idParameter) || !/^\d+$/.test(idParameter)) {
    throw new AppError('Recipe id must be a positive whole number', 400);
  }

  const recipeId = Number(idParameter);

  if (recipeId < 1) {
    throw new AppError('Recipe id must be a positive whole number', 400);
  }

  return recipeId;
}

/**
 * Replaces a recipe for an authenticated administrator.
 */
export function update(req: Request, res: Response, next: NextFunction): void {
  try {
    const recipe = updateRecipe(readRecipeId(req), req.body);

    res.status(200).json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a recipe for an authenticated administrator.
 */
export function remove(req: Request, res: Response, next: NextFunction): void {
  try {
    deleteRecipe(readRecipeId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
