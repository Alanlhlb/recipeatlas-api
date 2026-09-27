import type { NextFunction, Request, Response } from 'express';
import { createRecipe, deleteRecipe, updateRecipe } from '../services/recipeService';
import { AppError } from '../middleware/errorHandler';

/**
 * Creates a recipe for an authenticated administrator.
 *
 * Mounted at `POST /api/admin/recipes` behind the `requireAuth` and `requireAdmin`
 * middleware, so it can rely on `req.user` being an administrator.
 *
 * @param req - Express request whose body holds the new recipe.
 * @param res - Express response; sends 201 with the created recipe.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the recipe payload is invalid.
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
 * Validates and converts the recipe id taken from the route parameters.
 *
 * @param req - Express request whose `id` parameter is read.
 * @returns The recipe id as a positive whole number.
 * @throws {AppError} 400 when the parameter is missing or not a positive integer.
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
 *
 * Mounted at `PUT /api/admin/recipes/:id` behind `requireAuth` and `requireAdmin`.
 *
 * @param req - Express request whose body holds the replacement recipe.
 * @param res - Express response; sends 200 with the updated recipe.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the id or payload is invalid, 404 when the recipe is missing.
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
 *
 * Mounted at `DELETE /api/admin/recipes/:id` behind `requireAuth` and `requireAdmin`.
 *
 * @param req - Express request whose `id` parameter identifies the recipe.
 * @param res - Express response; sends a bodyless 204 on success.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the id is invalid, 404 when the recipe is missing.
 */
export function remove(req: Request, res: Response, next: NextFunction): void {
  try {
    deleteRecipe(readRecipeId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
