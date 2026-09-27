import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

interface CatalogueItem {
  title: string;
  cookingTime: number | null;
}

describe('GET /api/recipes filtering and sorting', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();

    createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      category: 'Dinner',
      difficulty: 'easy',
      cookingTime: 25,
      servings: 2,
    });
    createRecipe({
      title: 'Mango Smoothie',
      instructions: 'Blend mango with milk.',
      category: 'Breakfast',
      difficulty: 'easy',
      cookingTime: 10,
      servings: 1,
    });
    createRecipe({
      title: 'Spiced Chicken Curry',
      instructions: 'Simmer chicken in spiced tomato sauce.',
      category: 'Dinner',
      difficulty: 'medium',
      cookingTime: 45,
      servings: 4,
    });
  });

  const titles = (body: { data: { recipes: CatalogueItem[] } }) =>
    body.data.recipes.map((recipe) => recipe.title).sort();

  it('filters by category, ignoring case', async () => {
    const response = await request(app).get('/api/recipes?category=dinner');

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(2);
    expect(titles(response.body)).toEqual(['Spiced Chicken Curry', 'Vegetable Pasta']);
  });

  it('filters by difficulty', async () => {
    const response = await request(app).get('/api/recipes?difficulty=medium');

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(1);
    expect(response.body.data.recipes[0].title).toBe('Spiced Chicken Curry');
  });

  it('filters by maximum cooking time', async () => {
    const response = await request(app).get('/api/recipes?maxTime=25');

    expect(response.status).toBe(200);
    expect(titles(response.body)).toEqual(['Mango Smoothie', 'Vegetable Pasta']);
  });

  it('combines several filters in one request', async () => {
    const response = await request(app).get('/api/recipes?category=Dinner&maxTime=30');

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(1);
    expect(response.body.data.recipes[0].title).toBe('Vegetable Pasta');
  });

  it('sorts by title ascending', async () => {
    const response = await request(app).get('/api/recipes?sort=title&order=asc');

    expect(response.status).toBe(200);
    expect(response.body.data.recipes.map((recipe: CatalogueItem) => recipe.title)).toEqual([
      'Mango Smoothie',
      'Spiced Chicken Curry',
      'Vegetable Pasta',
    ]);
  });

  it('sorts by cooking time descending', async () => {
    const response = await request(app).get('/api/recipes?sort=cookingTime&order=desc');

    expect(response.status).toBe(200);
    expect(response.body.data.recipes.map((recipe: CatalogueItem) => recipe.cookingTime)).toEqual([
      45, 25, 10,
    ]);
  });

  it('rejects a sort field that is not on the whitelist', async () => {
    const response = await request(app).get('/api/recipes?sort=passwordHash');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('sort must be one of');
  });

  it('rejects an order value other than asc or desc', async () => {
    const response = await request(app).get('/api/recipes?order=sideways');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('order must be asc or desc');
  });

  it('rejects an unknown difficulty filter', async () => {
    const response = await request(app).get('/api/recipes?difficulty=impossible');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('difficulty must be easy, medium or hard');
  });

  it('rejects a non-numeric maximum cooking time', async () => {
    const response = await request(app).get('/api/recipes?maxTime=soon');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('maxTime must be a positive whole number');
  });
});
