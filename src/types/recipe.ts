export interface Ingredient {
  id: number;
  recipeId: number;
  name: string;
  quantity: string | null;
}

export interface Recipe {
  id: number;
  title: string;
  instructions: string;
  category: string | null;
  imageUrl: string | null;
  cookingTime: number | null;
  servings: number | null;
  difficulty: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: Ingredient[];
}