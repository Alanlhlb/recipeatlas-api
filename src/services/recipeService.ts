import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type { Ingredient, Recipe } from '../types/recipe';

interface CreateIngredientInput {
  name?: unknown;
  quantity?: unknown;
}

interface CreateRecipeInput {
  title?: unknown;
  instructions?: unknown;
  category?: unknown;
  imageUrl?: unknown;
  cookingTime?: unknown;
  servings?: unknown;
  difficulty?: unknown;
  ingredients?: unknown;
}

interface ValidatedIngredient {
  name: string;
  quantity: string | null;
}

interface ValidatedRecipe {
  title: string;
  instructions: string;
  category: string | null;
  imageUrl: string | null;
  cookingTime: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: ValidatedIngredient[];
}

function optionalText(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be text`, 400);
  }

  return value.trim() || null;
}

function optionalPositiveInteger(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new AppError(`${fieldName} must be a positive whole number`, 400);
  }

  return value as number;
}

function validateIngredients(value: unknown): ValidatedIngredient[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError('ingredients must be an array', 400);
  }

  return value.map((ingredient: CreateIngredientInput, index) => {
    if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
      throw new AppError(`ingredients[${index}].name is required`, 400);
    }

    const quantity = optionalText(ingredient.quantity, `ingredients[${index}].quantity`);

    return { name: ingredient.name.trim(), quantity };
  });
}

function validateRecipe(input: CreateRecipeInput): ValidatedRecipe {
  if (typeof input.title !== 'string' || !input.title.trim()) {
    throw new AppError('title is required', 400);
  }

  if (typeof input.instructions !== 'string' || !input.instructions.trim()) {
    throw new AppError('instructions are required', 400);
  }

  const difficulty = optionalText(input.difficulty, 'difficulty');

  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new AppError('difficulty must be easy, medium or hard', 400);
  }

  return {
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    category: optionalText(input.category, 'category'),
    imageUrl: optionalText(input.imageUrl, 'imageUrl'),
    cookingTime: optionalPositiveInteger(input.cookingTime, 'cookingTime'),
    servings: optionalPositiveInteger(input.servings, 'servings'),
    difficulty,
    ingredients: validateIngredients(input.ingredients),
  };
}

export function getRecipeById(id: number): Recipe {
  const recipe = db
    .prepare(
      `SELECT id, title, instructions, category, imageUrl, cookingTime, servings,
              difficulty, createdAt, updatedAt
       FROM recipes WHERE id = ?`,
    )
    .get(id) as Omit<Recipe, 'ingredients'> | undefined;

  if (!recipe) {
    throw new AppError('Recipe was not found', 404);
  }

  const ingredients = db
    .prepare('SELECT id, recipeId, name, quantity FROM ingredients WHERE recipeId = ?')
    .all(id) as Ingredient[];

  return { ...recipe, ingredients };
}

/**
 * Replaces a recipe and its ingredients as one database transaction.
 */
export function updateRecipe(id: number, input: CreateRecipeInput): Recipe {
  const recipe = validateRecipe(input);
  const now = new Date().toISOString();

  const update = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE recipes
         SET title = ?, instructions = ?, category = ?, imageUrl = ?, cookingTime = ?,
             servings = ?, difficulty = ?, updatedAt = ?
         WHERE id = ?`,
      )
      .run(
        recipe.title,
        recipe.instructions,
        recipe.category,
        recipe.imageUrl,
        recipe.cookingTime,
        recipe.servings,
        recipe.difficulty,
        now,
        id,
      );

    if (result.changes === 0) {
      throw new AppError('Recipe was not found', 404);
    }

    db.prepare('DELETE FROM ingredients WHERE recipeId = ?').run(id);

    const insertIngredient = db.prepare(
      'INSERT INTO ingredients (recipeId, name, quantity) VALUES (?, ?, ?)',
    );

    for (const ingredient of recipe.ingredients) {
      insertIngredient.run(id, ingredient.name, ingredient.quantity);
    }
  });

  update();
  return getRecipeById(id);
}

/**
 * Lists recipes for the public catalogue.
 */
export function listRecipes(searchQuery?: unknown): Recipe[] {
  let query = `SELECT id, title, instructions, category, imageUrl, cookingTime, servings,
                      difficulty, createdAt, updatedAt
               FROM recipes`;
  let parameters: string[] = [];

  if (searchQuery !== undefined) {
    if (typeof searchQuery !== 'string') {
      throw new AppError('q must be text', 400);
    }

    const term = searchQuery.trim().toLowerCase();

    if (term) {
      const escapedTerm = term.replace(/[\\%_]/g, '\\$&');
      query += ' WHERE LOWER(title) LIKE ? ESCAPE \'\\\'';
      parameters = [`%${escapedTerm}%`];
    }
  }

  query += ' ORDER BY updatedAt DESC, id DESC';

  const recipes = db.prepare(query).all(...parameters) as Omit<Recipe, 'ingredients'>[];

  const ingredientsForRecipe = db.prepare(
    'SELECT id, recipeId, name, quantity FROM ingredients WHERE recipeId = ?',
  );

  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: ingredientsForRecipe.all(recipe.id) as Ingredient[],
  }));
}

/**
 * Creates a recipe and its ingredients as one database transaction.
 */
export function createRecipe(input: CreateRecipeInput): Recipe {
  const recipe = validateRecipe(input);
  const now = new Date().toISOString();

  const create = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO recipes (
          title, instructions, category, imageUrl, cookingTime, servings, difficulty, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        recipe.title,
        recipe.instructions,
        recipe.category,
        recipe.imageUrl,
        recipe.cookingTime,
        recipe.servings,
        recipe.difficulty,
        now,
        now,
      );

    const recipeId = Number(result.lastInsertRowid);
    const insertIngredient = db.prepare(
      'INSERT INTO ingredients (recipeId, name, quantity) VALUES (?, ?, ?)',
    );

    for (const ingredient of recipe.ingredients) {
      insertIngredient.run(recipeId, ingredient.name, ingredient.quantity);
    }

    return recipeId;
  });

  return getRecipeById(create());
}
