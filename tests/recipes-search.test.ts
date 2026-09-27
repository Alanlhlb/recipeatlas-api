import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

describe('GET /api/recipes?q=', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();

    createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
    });
    createRecipe({
      title: 'Mango Smoothie',
      instructions: 'Blend mango with milk.',
    });
  });

  it('searches recipe titles without requiring authentication', async () => {
    const response = await request(app).get('/api/recipes?q=PASTA');

    expect(response.status).toBe(200);
    expect(response.body.data.recipes).toHaveLength(1);
    expect(response.body.data.recipes[0].title).toBe('Vegetable Pasta');
  });

  it('returns an empty list when no title matches', async () => {
    const response = await request(app).get('/api/recipes?q=burger');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.count).toBe(0);
    expect(response.body.data.recipes).toEqual([]);
  });

  it('treats wildcard characters as normal search text', async () => {
    const response = await request(app).get('/api/recipes?q=%25');

    expect(response.status).toBe(200);
    expect(response.body.data.recipes).toEqual([]);
  });
});
