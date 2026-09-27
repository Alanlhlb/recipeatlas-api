import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

interface CatalogueItem {
  title: string;
  cookingTime: number | null;
}

/**
 * These tests exercise the catalogue query string against hostile and unusual
 * input. They exist to prove that filtering and sorting cannot be abused to
 * change the shape of the SQL statement, and that LIKE wildcards supplied by a
 * client are treated as literal characters.
 */
describe('GET /api/recipes query string safety', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();

    createRecipe({
      title: '100% Wholegrain Bread',
      instructions: 'Knead, prove, then bake.',
      category: 'Breakfast',
      difficulty: 'medium',
      cookingTime: 120,
      servings: 8,
    });
    createRecipe({
      title: 'Quick Tomato Soup',
      instructions: 'Simmer tomatoes and blend.',
      category: 'Lunch',
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
    });
    createRecipe({
      title: 'Roast Chicken',
      instructions: 'Season and roast until golden.',
      category: 'Dinner',
      difficulty: 'hard',
      cookingTime: null,
      servings: 4,
    });
  });

  const titles = (body: { data: { recipes: CatalogueItem[] } }) =>
    body.data.recipes.map((recipe) => recipe.title);

  it('rejects a sort value that tries to append extra SQL', async () => {
    const response = await request(app)
      .get('/api/recipes')
      .query({ sort: 'title; DROP TABLE recipes' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('sort must be one of');
  });

  it('rejects a sort value that tries to change the sort direction inline', async () => {
    const response = await request(app).get('/api/recipes').query({ sort: 'title DESC' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('sort must be one of');
  });

  it('keeps the recipes table intact after a rejected injection attempt', async () => {
    await request(app).get('/api/recipes').query({ sort: 'title; DROP TABLE recipes' });

    const response = await request(app).get('/api/recipes');

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(3);
  });

  it('treats a percent sign in the search term as a literal character', async () => {
    const response = await request(app).get('/api/recipes').query({ q: '%' });

    expect(response.status).toBe(200);
    expect(titles(response.body)).toEqual(['100% Wholegrain Bread']);
  });

  it('does not let a wildcard search term return the whole catalogue', async () => {
    const wildcard = await request(app).get('/api/recipes').query({ q: '%' });
    const everything = await request(app).get('/api/recipes');

    expect(wildcard.body.data.count).toBeLessThan(everything.body.data.count);
  });

  it('treats an underscore in the search term as a literal character', async () => {
    const response = await request(app).get('/api/recipes').query({ q: '_' });

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(0);
  });

  it('accepts an upper case order value', async () => {
    const response = await request(app).get('/api/recipes').query({ sort: 'title', order: 'DESC' });

    expect(response.status).toBe(200);
    expect(titles(response.body)).toEqual(['Roast Chicken', 'Quick Tomato Soup', '100% Wholegrain Bread']);
  });

  it('excludes recipes without a cooking time from a maximum time filter', async () => {
    const response = await request(app).get('/api/recipes').query({ maxTime: '0' });

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(0);
  });

  it('ignores empty query values and returns the full catalogue', async () => {
    const response = await request(app)
      .get('/api/recipes')
      .query({ q: '', category: '', difficulty: '', sort: '', order: '' });

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(3);
  });
});
