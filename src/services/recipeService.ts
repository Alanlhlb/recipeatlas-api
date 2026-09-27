import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type { Ingredient, Recipe } from '../types/recipe';

/** Raw request body accepted when creating or replacing a recipe. */
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

/** A single ingredient after validation. */
interface ValidatedIngredient {
  name: string;
  quantity: string | null;
}

/** A recipe after validation, ready to be persisted. */
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

/**
 * Query string options accepted by the public catalogue endpoint.
 *
 * Every field is typed as `unknown` because query string values arrive
 * unvalidated from Express and must be narrowed before use.
 */
export interface RecipeListOptions {
  /** Case-insensitive partial match against the recipe title. */
  q?: unknown;
  /** Exact, case-insensitive match against the category. */
  category?: unknown;
  /** One of `easy`, `medium` or `hard`. */
  difficulty?: unknown;
  /** Upper bound, in minutes, for the cooking time. */
  maxTime?: unknown;
  /** Field to order by. */
  sort?: unknown;
  /** Either `asc` or `desc`. */
  order?: unknown;
}

/** Sortable query values mapped to their real column names. */
export const RECIPE_SORT_FIELDS: Record<string, string> = {
  title: 'title',
  category: 'category',
  cookingTime: 'cookingTime',
  servings: 'servings',
  difficulty: 'difficulty',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

/** Difficulty values accepted by the API. */
export const RECIPE_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Narrows an optional text field, treating blank strings as absent.
 *
 * @param value - Raw value taken from a request body.
 * @param fieldName - Field name used to build a helpful error message.
 * @returns The trimmed value, or `null` when the field was omitted or blank.
 * @throws {AppError} 400 when the value is present but not a string.
 */
function optionalText(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be text`, 400);
  }

  return value.trim() || null;
}

/**
 * Narrows an optional positive whole number, treating blank strings as absent.
 *
 * @param value - Raw value taken from a request body.
 * @param fieldName - Field name used to build a helpful error message.
 * @returns The value, or `null` when the field was omitted or blank.
 * @throws {AppError} 400 when the value is not a positive integer.
 */
function optionalPositiveInteger(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new AppError(`${fieldName} must be a positive whole number`, 400);
  }

  return value as number;
}

/**
 * Validates the ingredient array of a recipe payload.
 *
 * @param value - Raw `ingredients` value from the request body.
 * @returns The validated ingredient list; an empty array when omitted.
 * @throws {AppError} 400 when the value is not an array or an entry has no name.
 */
function validateIngredients(value: unknown): ValidatedIngredient[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError('ingredients must be an array', 400);
  }

  return value.map((ingredient: { name?: unknown; quantity?: unknown }, index) => {
    if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
      throw new AppError(`ingredients[${index}].name is required`, 400);
    }

    const quantity = optionalText(ingredient.quantity, `ingredients[${index}].quantity`);

    return { name: ingredient.name.trim(), quantity };
  });
}

/**
 * Validates and normalises a full recipe payload.
 *
 * @param input - Raw request body.
 * @returns A validated recipe ready to be written to the database.
 * @throws {AppError} 400 when a required field is missing or a value is invalid.
 */
function validateRecipe(input: CreateRecipeInput): ValidatedRecipe {
  if (typeof input.title !== 'string' || !input.title.trim()) {
    throw new AppError('title is required', 400);
  }

  if (typeof input.instructions !== 'string' || !input.instructions.trim()) {
    throw new AppError('instructions are required', 400);
  }

  const difficulty = optionalText(input.difficulty, 'difficulty');

  if (difficulty && !RECIPE_DIFFICULTIES.includes(difficulty)) {
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

/**
 * Reads a single recipe together with its ingredients.
 *
 * @param id - Primary key of the recipe.
 * @returns The recipe and its ordered ingredient list.
 * @throws {AppError} 404 when no recipe has that identifier.
 */
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
 *
 * Running both statements inside a transaction means a failure part way through
 * cannot leave a recipe with a partially replaced ingredient list.
 *
 * @param id - Primary key of the recipe to replace.
 * @param input - Raw request body containing the replacement values.
 * @returns The updated recipe.
 * @throws {AppError} 400 when the payload is invalid, 404 when the recipe is missing.
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
 * Deletes a recipe. SQLite cascades the deletion to its ingredients.
 *
 * @param id - Primary key of the recipe to delete.
 * @throws {AppError} 404 when no recipe has that identifier.
 */
export function deleteRecipe(id: number): void {
  const result = db.prepare('DELETE FROM recipes WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new AppError('Recipe was not found', 404);
  }
}

/**
 * Lists recipes for the public catalogue with optional search, filtering and sorting.
 *
 * Filter values are bound as SQL parameters and the sort column is resolved through
 * a whitelist, so no caller-supplied text ever reaches the SQL string itself.
 *
 * @param options - Query string options; all fields are optional.
 * @returns Matching recipes ordered as requested, each with its ingredients.
 * @throws {AppError} 400 when a query value is of the wrong type or outside its allowed set.
 */
export function listRecipes(options: RecipeListOptions = {}): Recipe[] {
  const conditions: string[] = [];
  const parameters: (string | number)[] = [];

  if (options.q !== undefined) {
    if (typeof options.q !== 'string') {
      throw new AppError('q must be text', 400);
    }

    const term = options.q.trim().toLowerCase();

    if (term) {
      conditions.push("LOWER(title) LIKE ? ESCAPE '\\'");
      parameters.push(`%${term.replace(/[\\%_]/g, '\\$&')}%`);
    }
  }

  if (options.category !== undefined) {
    if (typeof options.category !== 'string') {
      throw new AppError('category must be text', 400);
    }

    const category = options.category.trim();

    if (category) {
      conditions.push('LOWER(category) = ?');
      parameters.push(category.toLowerCase());
    }
  }

  if (options.difficulty !== undefined) {
    if (typeof options.difficulty !== 'string') {
      throw new AppError('difficulty must be text', 400);
    }

    const difficulty = options.difficulty.trim().toLowerCase();

    if (difficulty) {
      if (!RECIPE_DIFFICULTIES.includes(difficulty)) {
        throw new AppError('difficulty must be easy, medium or hard', 400);
      }

      conditions.push('difficulty = ?');
      parameters.push(difficulty);
    }
  }

  if (options.maxTime !== undefined) {
    if (typeof options.maxTime !== 'string') {
      throw new AppError('maxTime must be text', 400);
    }

    const maxTime = options.maxTime.trim();

    if (maxTime) {
      if (!/^\d+$/.test(maxTime)) {
        throw new AppError('maxTime must be a positive whole number', 400);
      }

      conditions.push('cookingTime IS NOT NULL AND cookingTime <= ?');
      parameters.push(Number(maxTime));
    }
  }

  let direction = 'DESC';

  if (options.order !== undefined) {
    if (typeof options.order !== 'string') {
      throw new AppError('order must be text', 400);
    }

    const order = options.order.trim().toLowerCase();

    if (order) {
      if (order !== 'asc' && order !== 'desc') {
        throw new AppError('order must be asc or desc', 400);
      }

      direction = order === 'asc' ? 'ASC' : 'DESC';
    }
  }

  let column = 'updatedAt';

  if (options.sort !== undefined) {
    if (typeof options.sort !== 'string') {
      throw new AppError('sort must be text', 400);
    }

    const sort = options.sort.trim();

    if (sort) {
      if (!Object.prototype.hasOwnProperty.call(RECIPE_SORT_FIELDS, sort)) {
        throw new AppError(
          `sort must be one of ${Object.keys(RECIPE_SORT_FIELDS).join(', ')}`,
          400,
        );
      }

      column = RECIPE_SORT_FIELDS[sort];
    }
  }

  let query = `SELECT id, title, instructions, category, imageUrl, cookingTime, servings,
                      difficulty, createdAt, updatedAt
               FROM recipes`;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY ${column} ${direction}, id DESC`;

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
 *
 * @param input - Raw request body containing the new recipe.
 * @returns The newly created recipe, including its generated identifier.
 * @throws {AppError} 400 when the payload is invalid.
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
