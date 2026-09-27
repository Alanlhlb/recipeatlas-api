import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

describe('POST /api/favorites/:recipeId', () => {
  let token: string;
  let recipeId: number;

  beforeEach(async () => {
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();

    const recipe = createRecipe({
      title: 'Favorite Pasta',
      instructions: 'Cook pasta.',
    });
    recipeId = recipe.id;

    await request(app).post('/api/auth/register').send({
      name: 'Favorite User',
      email: 'favorite@example.com',
      password: 'secure-password',
    }).expect(201);

    const login = await request(app).post('/api/auth/login').send({
      email: 'favorite@example.com',
      password: 'secure-password',
    }).expect(200);

    token = login.body.data.token;
  });

  it('adds a local recipe to the authenticated user favorites', async () => {
    const response = await request(app)
      .post(`/api/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ status: 'success' });

    const count = db.prepare('SELECT COUNT(*) AS total FROM favorites').get() as { total: number };
    expect(count.total).toBe(1);
  });

  it('rejects a duplicate favorite', async () => {
    await request(app)
      .post(`/api/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const response = await request(app)
      .post(`/api/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Recipe is already in your favorites');
  });

  it('rejects a missing recipe', async () => {
    const response = await request(app)
      .post('/api/favorites/999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Recipe was not found');
  });

  it('requires authentication', async () => {
    const response = await request(app).post(`/api/favorites/${recipeId}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication is required');
  });
});
