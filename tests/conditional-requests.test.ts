import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

describe('conditional HTTP requests', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();

    createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      category: 'Dinner',
    });
  });

  it('sends an ETag and a no-cache directive with the catalogue', async () => {
    const response = await request(app).get('/api/recipes');

    expect(response.status).toBe(200);
    expect(response.headers.etag).toMatch(/^W\/".+"$/);
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers.vary).toContain('Authorization');
  });

  it('answers 304 without a body when If-None-Match still matches', async () => {
    const first = await request(app).get('/api/recipes');
    const second = await request(app)
      .get('/api/recipes')
      .set('If-None-Match', first.headers.etag as string);

    expect(second.status).toBe(304);
    expect(second.text).toBeFalsy();
    expect(second.headers.etag).toBe(first.headers.etag);
  });

  it('answers 200 with a new ETag once the representation changes', async () => {
    const first = await request(app).get('/api/recipes');

    createRecipe({ title: 'Mango Smoothie', instructions: 'Blend mango with milk.' });

    const second = await request(app)
      .get('/api/recipes')
      .set('If-None-Match', first.headers.etag as string);

    expect(second.status).toBe(200);
    expect(second.headers.etag).not.toBe(first.headers.etag);
  });

  it('treats the wildcard If-None-Match as a match', async () => {
    const response = await request(app).get('/api/recipes').set('If-None-Match', '*');

    expect(response.status).toBe(304);
  });

  it('ignores an unrelated entity tag', async () => {
    const response = await request(app).get('/api/recipes').set('If-None-Match', 'W/"something-else"');

    expect(response.status).toBe(200);
  });

  it('supports conditional requests on a single recipe', async () => {
    const recipe = createRecipe({ title: 'Mango Smoothie', instructions: 'Blend mango with milk.' });

    const first = await request(app).get(`/api/recipes/${recipe.id}`);
    const second = await request(app)
      .get(`/api/recipes/${recipe.id}`)
      .set('If-None-Match', first.headers.etag as string);

    expect(first.status).toBe(200);
    expect(second.status).toBe(304);
  });

  it('never converts an error response into a 304', async () => {
    const response = await request(app)
      .get('/api/recipes/999')
      .set('If-None-Match', 'W/"anything"');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Recipe was not found',
    });
  });
});
