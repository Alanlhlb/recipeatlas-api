import { AppError } from '../middleware/errorHandler';

const THE_MEAL_DB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const REQUEST_TIMEOUT_MS = 5000;

export interface ExternalRecipe {
  source: 'TheMealDB';
  sourceId: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  instructions: string;
  ingredients: Array<{ name: string; quantity: string | null }>;
}

interface MealDbMeal {
  idMeal?: unknown;
  strMeal?: unknown;
  strCategory?: unknown;
  strMealThumb?: unknown;
  strInstructions?: unknown;
  [key: string]: unknown;
}

interface MealDbResponse {
  meals?: MealDbMeal[] | null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toExternalRecipe(meal: MealDbMeal): ExternalRecipe | null {
  const sourceId = optionalString(meal.idMeal);
  const title = optionalString(meal.strMeal);
  const instructions = optionalString(meal.strInstructions);

  if (!sourceId || !title || !instructions) {
    return null;
  }

  const ingredients = Array.from({ length: 20 }, (_, index) => index + 1)
    .map((index) => ({
      name: optionalString(meal[`strIngredient${index}`]),
      quantity: optionalString(meal[`strMeasure${index}`]),
    }))
    .filter((ingredient): ingredient is { name: string; quantity: string | null } => Boolean(ingredient.name));

  return {
    source: 'TheMealDB',
    sourceId,
    title,
    category: optionalString(meal.strCategory),
    imageUrl: optionalString(meal.strMealThumb),
    instructions,
    ingredients,
  };
}

/**
 * Searches TheMealDB and converts its response into the RecipeAtlas format.
 */
export async function searchTheMealDb(query: unknown): Promise<ExternalRecipe[]> {
  if (typeof query !== 'string' || !query.trim()) {
    throw new AppError('q is required for external recipe search', 400);
  }

  const url = `${THE_MEAL_DB_BASE_URL}/search.php?s=${encodeURIComponent(query.trim())}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (!response.ok) {
      throw new AppError('Recipe provider is unavailable', 502);
    }

    const body = (await response.json()) as MealDbResponse;

    if (!body.meals) {
      return [];
    }

    return body.meals
      .map(toExternalRecipe)
      .filter((recipe): recipe is ExternalRecipe => recipe !== null);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Recipe provider is unavailable', 502);
  }
}
