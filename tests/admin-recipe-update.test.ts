import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { provisionAdministrator } from '../src/services/adminProvisioningService';
import { createRecipe } from '../src/services/recipeService';

const updatedRecipe = {
  title: 'Updated Vegetable Pasta',
  instructions: 'Cook pasta, then mix with vegetables and sauce.',
  category: 'Dinner',
  cookingTime: 30,
  servings: 4,
  difficulty: 'medium',
  ingredients: [{ name: 'Pasta', quantity: '400 g' }],
};

describe('PUT /api/admin/recipes/:id', () => {
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

  it('replaces a recipe and its ingredients for an administrator', async () => {
    const originalRecipe = createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      ingredients: [
        { name: 'Pasta', quantity: '200 g' },
        { name: 'Tomato', quantity: '2' },
      ],
    });

    const response = await request(app)
      .put(`/api/admin/recipes/${originalRecipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedRecipe);

    expect(response.status).toBe(200);
    expect(response.body.data.recipe).toMatchObject({
      id: originalRecipe.id,
      title: 'Updated Vegetable Pasta',
      difficulty: 'medium',
      ingredients: [expect.objectContaining({ name: 'Pasta', quantity: '400 g' })],
    });
    expect(response.body.data.recipe.ingredients).toHaveLength(1);
  });

  it('returns 404 when an administrator updates a missing recipe', async () => {
    const response = await request(app)
      .put('/api/admin/recipes/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedRecipe);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Recipe was not found');
  });

  it('rejects invalid replacement data without changing the recipe', async () => {
    const originalRecipe = createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
    });

    const response = await request(app)
      .put(`/api/admin/recipes/${originalRecipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...updatedRecipe, difficulty: 'advanced' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('difficulty must be easy, medium or hard');

    const unchangedRecipe = await request(app).get(`/api/recipes/${originalRecipe.id}`);
    expect(unchangedRecipe.body.data.recipe.title).toBe('Vegetable Pasta');
  });
});
