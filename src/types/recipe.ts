import type { HypermediaLinks } from '../utils/hypermedia';

/**
 * A single measured item belonging to a recipe.
 */
export interface Ingredient {
  /** Surrogate key of the ingredient row. */
  id: number;
  /** Identifier of the recipe this ingredient belongs to. */
  recipeId: number;
  /** Display name of the ingredient. */
  name: string;
  /** Free-text amount, for example `200 g`. `null` when the author omitted it. */
  quantity: string | null;
}

/**
 * A stored recipe together with its ingredient collection.
 */
export interface Recipe {
  /** Surrogate key of the recipe. */
  id: number;
  /** Recipe name, unique enough for title search. */
  title: string;
  /** Step-by-step preparation method. */
  instructions: string;
  /** Course or meal type, for example `Dinner`. */
  category: string | null;
  /** Absolute URL of a representative photograph. */
  imageUrl: string | null;
  /** Total preparation time in minutes. */
  cookingTime: number | null;
  /** Number of portions the recipe yields. */
  servings: number | null;
  /** One of `easy`, `medium` or `hard`. */
  difficulty: string | null;
  /** ISO-8601 timestamp of creation. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
  /** Ordered ingredient collection. */
  ingredients: Ingredient[];
}

/**
 * A recipe as returned to API clients, with HATEOAS navigation links attached.
 */
export interface RecipeResource extends Recipe {
  /** Discoverable actions for the authenticated caller. */
  _links: HypermediaLinks;
}