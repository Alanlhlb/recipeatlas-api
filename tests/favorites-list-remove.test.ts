import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/auth/register').send({
    name: 'Favorite User',
    email,
    password: 'secure-password',
  }).expect(201);

  const login = await request(app).post('/api/auth/login').send({
    email,
    password: 'secure-password',
  }).expect(200);

  return login.body.data.token;
}

describe('user favorite list and removal', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();
  });

  it('lists only the authenticated user favorites', async () => {
    const recipe = createRecipe({ title: 'Favorite Pasta', instructions: 'Cook pasta.' });
    const anotherRecipe = createRecipe({ title: 'Other Soup', instructions: 'Cook soup.' });
    const firstToken = await registerAndLogin('first@example.com');
    const secondToken = await registerAndLogin('second@example.com');

    await request(app).post(`/api/favorites/${recipe.id}`).set('Authorization', `Bearer ${firstToken}`).expect(201);
    await request(app).post(`/api/favorites/${anotherRecipe.id}`).set('Authorization', `Bearer ${secondToken}`).expect(201);

    const response = await request(app).get('/api/favorites').set('Authorization', `Bearer ${firstToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.recipes).toHaveLength(1);
    expect(response.body.data.recipes[0].id).toBe(recipe.id);
  });

  it('removes the authenticated user favorite', async () => {
    const recipe = createRecipe({ title: 'Favorite Pasta', instructions: 'Cook pasta.' });
    const token = await registerAndLogin('favorite@example.com');

    await request(app).post(`/api/favorites/${recipe.id}`).set('Authorization', `Bearer ${token}`).expect(201);
    const response = await request(app).delete(`/api/favorites/${recipe.id}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect((db.prepare('SELECT COUNT(*) AS total FROM favorites').get() as { total: number }).total).toBe(0);
  });

  it('returns 404 when the current user removes a missing favorite', async () => {
    const token = await registerAndLogin('favorite@example.com');
    const response = await request(app).delete('/api/favorites/999').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Favorite was not found');
  });
});
