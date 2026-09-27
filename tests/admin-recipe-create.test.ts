import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { provisionAdministrator } from '../src/services/adminProvisioningService';

const recipe = {
  title: 'Vegetable Pasta',
  instructions: 'Boil pasta and mix with vegetables.',
  category: 'Dinner',
  cookingTime: 25,
  servings: 2,
  difficulty: 'easy',
  ingredients: [
    { name: 'Pasta', quantity: '200 g' },
    { name: 'Tomato', quantity: '2' },
  ],
};

describe('POST /api/admin/recipes', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();
  });

  it('rejects a request without a token', async () => {
    const response = await request(app).post('/api/admin/recipes').send(recipe);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication is required');
  });

  it('rejects an authenticated standard user', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Standard User',
      email: 'user@example.com',
      password: 'secure-password',
    }).expect(201);

    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'secure-password',
    }).expect(200);

    const response = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send(recipe);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Administrator access is required');
  });

  it('allows an administrator to create a recipe with ingredients', async () => {
    await provisionAdministrator({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'strong-admin-password',
    }).expect(200);

    const response = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send(recipe);

    expect(response.status).toBe(201);
    expect(response.body.data.recipe).toMatchObject({
      title: 'Vegetable Pasta',
      difficulty: 'easy',
      ingredients: recipe.ingredients,
    });
  });

  it('rejects an invalid recipe without writing partial data', async () => {
    await provisionAdministrator({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'strong-admin-password',
    }).expect(200);

    const response = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send({ ...recipe, ingredients: [{ quantity: '200 g' }] });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('ingredients[0].name is required');

    const count = db.prepare('SELECT COUNT(*) AS total FROM recipes').get() as { total: number };
    expect(count.total).toBe(0);
  });
});
