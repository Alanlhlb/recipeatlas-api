import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

describe('GET /api/recipes/:id', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();
  });

  it('allows visitors to read a recipe and its ingredients', async () => {
    const recipe = createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      ingredients: [{ name: 'Pasta', quantity: '200 g' }],
    });

    const response = await request(app).get(`/api/recipes/${recipe.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        recipe: expect.objectContaining({
          id: recipe.id,
          title: 'Vegetable Pasta',
          ingredients: [
            expect.objectContaining({ name: 'Pasta', quantity: '200 g' }),
          ],
        }),
      },
    });
  });

  it('returns 404 when the recipe does not exist', async () => {
    const response = await request(app).get('/api/recipes/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Recipe was not found',
    });
  });

  it('rejects an invalid recipe id', async () => {
    const response = await request(app).get('/api/recipes/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Recipe id must be a positive whole number',
    });
  });
});
