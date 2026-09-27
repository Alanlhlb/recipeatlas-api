import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { createRecipe } from '../src/services/recipeService';
import { provisionAdministrator } from '../src/services/adminProvisioningService';

describe('HATEOAS navigation links', () => {
  let recipeId: number;

  beforeEach(() => {
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();

    const recipe = createRecipe({
      title: 'Vegetable Pasta',
      instructions: 'Boil pasta and mix with vegetables.',
      category: 'Dinner',
    });

    recipeId = recipe.id;
  });

  async function tokenForStandardUser(): Promise<string> {
    await request(app).post('/api/auth/register').send({
      name: 'Standard User',
      email: 'user@example.com',
      password: 'secure-password',
    }).expect(201);

    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'secure-password',
    }).expect(200);

    return login.body.data.token as string;
  }

  async function tokenForAdministrator(): Promise<string> {
    await provisionAdministrator({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'strong-admin-password',
    }).expect(200);

    return login.body.data.token as string;
  }

  it('advertises self and collection links to anonymous callers', async () => {
    const response = await request(app).get(`/api/recipes/${recipeId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.recipe._links.self).toEqual({
      href: `/api/recipes/${recipeId}`,
      method: 'GET',
      title: 'This recipe',
    });
    expect(response.body.data.recipe._links.collection.href).toBe('/api/recipes');
    expect(response.body.data.recipe._links['add-favourite']).toBeUndefined();
    expect(response.body.data.recipe._links.update).toBeUndefined();
  });

  it('advertises favourite and messaging links to an authenticated user', async () => {
    const token = await tokenForStandardUser();

    const response = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.recipe._links['add-favourite'].href).toBe(`/api/favorites/${recipeId}`);
    expect(response.body.data.recipe._links['add-favourite'].method).toBe('POST');
    expect(response.body.data.recipe._links['remove-favourite'].method).toBe('DELETE');
    expect(response.body.data.recipe._links['contact-administrator'].href).toBe('/api/messages');
    expect(response.body.data.recipe._links.update).toBeUndefined();
  });

  it('advertises administrator operations to an administrator', async () => {
    const token = await tokenForAdministrator();

    const response = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.recipe._links.update).toEqual({
      href: `/api/admin/recipes/${recipeId}`,
      method: 'PUT',
      title: 'Replace this recipe',
    });
    expect(response.body.data.recipe._links.delete.method).toBe('DELETE');
  });

  it('treats an invalid token as anonymous instead of rejecting the request', async () => {
    const response = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(200);
    expect(response.body.data.recipe._links.update).toBeUndefined();
  });

  it('preserves the query string in the collection self link', async () => {
    const response = await request(app).get('/api/recipes?sort=title&order=asc');

    expect(response.status).toBe(200);
    expect(response.body.data._links.self.href).toBe('/api/recipes?sort=title&order=asc');
    expect(response.body.data._links['external-recipes'].href).toBe('/api/external-recipes?q={title}');
    expect(response.body.data._links.create).toBeUndefined();
  });

  it('adds administrator-only collection links for an administrator', async () => {
    const token = await tokenForAdministrator();

    const response = await request(app)
      .get('/api/recipes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data._links.create).toEqual({
      href: '/api/admin/recipes',
      method: 'POST',
      title: 'Add a new recipe',
    });
    expect(response.body.data._links.messages.href).toBe('/api/messages');
  });
});
