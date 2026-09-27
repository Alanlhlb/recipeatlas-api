import type { NextFunction, Request, Response } from 'express';
import { getRecipeById, listRecipes } from '../services/recipeService';
import { AppError } from '../middleware/errorHandler';
import { sendConditionalJson } from '../utils/conditional';
import { recipeCollectionLinks, recipeLinks } from '../utils/hypermedia';

/**
 * Returns the public recipe catalogue.
 *
 * Supports `q` (title search), `category`, `difficulty` and `maxTime` filters plus
 * `sort` and `order` for sorting. The response is sent conditionally, so a client
 * that already holds the current representation receives `304 Not Modified`, and
 * every recipe carries HATEOAS links describing the actions available to the caller.
 *
 * @param req - The incoming Express request, including query string and optional caller.
 * @param res - The Express response to write to.
 * @param next - Express continuation callback used to forward errors.
 */
export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const recipes = listRecipes({
      q: req.query.q,
      category: req.query.category,
      difficulty: req.query.difficulty,
      maxTime: req.query.maxTime,
      sort: req.query.sort,
      order: req.query.order,
    });

    const role = req.user?.role;

    const body = {
      status: 'success',
      data: {
        count: recipes.length,
        recipes: recipes.map((recipe) => ({
          ...recipe,
          _links: recipeLinks(recipe.id, role),
        })),
        _links: recipeCollectionLinks(req.originalUrl, role),
      },
    };

    sendConditionalJson(req, res, 200, body);
  } catch (error) {
    next(error);
  }
}

/**
 * Returns one public recipe with its ingredients and HATEOAS links.
 *
 * The response participates in conditional requests, so repeat reads of an
 * unchanged recipe answer with `304 Not Modified`.
 *
 * @param req - The incoming Express request, including the recipe id parameter.
 * @param res - The Express response to write to.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when the id is not a positive whole number, 404 when absent.
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

    const body = {
      status: 'success',
      data: {
        recipe: {
          ...recipe,
          _links: recipeLinks(recipe.id, req.user?.role),
        },
      },
    };

    sendConditionalJson(req, res, 200, body);
  } catch (error) {
    next(error);
  }
}
