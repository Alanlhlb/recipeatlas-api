import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

describe('GET /api/recipes', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();
  });

  it('allows visitors to browse recipes without authentication', async () => {
    createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      category: 'Dinner',
      ingredients: [{ name: 'Pasta', quantity: '200 g' }],
    });

    const response = await request(app).get('/api/recipes');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.count).toBe(1);
    expect(response.body.data.recipes).toEqual([
      expect.objectContaining({
        title: 'Vegetable Pasta',
        category: 'Dinner',
        ingredients: [
          expect.objectContaining({ name: 'Pasta', quantity: '200 g' }),
        ],
      }),
    ]);
  });

  it('returns an empty array when the catalogue has no recipes', async () => {
    const response = await request(app).get('/api/recipes');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.count).toBe(0);
    expect(response.body.data.recipes).toEqual([]);
  });
});
