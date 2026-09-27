import type { NextFunction, Request, Response } from 'express';
import { getRecipeById, listRecipes } from '../services/recipeService';
import { AppError } from '../middleware/errorHandler';

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

/**
 * Returns one public recipe with its ingredients.
 */
export function getById(req: Request, res: Response, next: NextFunction): void {
  try {
    const idParameter = req.params.id;

    if (Array.isArray(idParameter) || !/^\d+$/.test(idParameter)) {
      throw new AppError('Recipe id must be a positive whole number', 400);
    }

    const recipeId = Number(idParameter);

    if (recipeId < 1) {
      throw new AppError('Recipe id must be a positive whole number', 400);
    }

    const recipe = getRecipeById(recipeId);

    res.status(200).json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
}
