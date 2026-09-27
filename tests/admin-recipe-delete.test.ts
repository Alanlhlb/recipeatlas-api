import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { provisionAdministrator } from '../src/services/adminProvisioningService';
import { createRecipe } from '../src/services/recipeService';

describe('DELETE /api/admin/recipes/:id', () => {
  let adminToken: string;

  beforeEach(async () => {
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();

    await provisionAdministrator({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'strong-admin-password',
    }).expect(200);

    adminToken = login.body.data.token;
  });

  it('deletes a recipe and its ingredients for an administrator', async () => {
    const recipe = createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      ingredients: [{ name: 'Pasta', quantity: '200 g' }],
    });

    const response = await request(app)
      .delete(`/api/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');

    const recipeCount = db.prepare('SELECT COUNT(*) AS total FROM recipes').get() as { total: number };
    const ingredientCount = db.prepare('SELECT COUNT(*) AS total FROM ingredients').get() as { total: number };

    expect(recipeCount.total).toBe(0);
    expect(ingredientCount.total).toBe(0);
  });

  it('returns 404 when an administrator deletes a missing recipe', async () => {
    const response = await request(app)
      .delete('/api/admin/recipes/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Recipe was not found',
    });
  });

  it('rejects a delete request without authentication', async () => {
    const response = await request(app).delete('/api/admin/recipes/1');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication is required');
  });
});
