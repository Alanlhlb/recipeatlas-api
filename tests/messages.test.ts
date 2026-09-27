import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';
import { provisionAdministrator } from '../src/services/adminProvisioningService';
import { createRecipe } from '../src/services/recipeService';

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/auth/register').send({
    name: 'Message User',
    email,
    password: 'secure-password',
  }).expect(201);

  const login = await request(app).post('/api/auth/login').send({
    email,
    password: 'secure-password',
  }).expect(200);

  return login.body.data.token;
}

describe('recipe contact messages', () => {
  let recipeId: number;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();

    recipeId = createRecipe({
      title: 'Contact Pasta',
      instructions: 'Cook pasta.',
    }).id;
    userToken = await registerAndLogin('message@example.com');

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

  it('allows an authenticated user to contact administrators about a recipe', async () => {
    const response = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipeId,
        subject: 'Ingredient question',
        body: 'Can I replace the pasta with a gluten-free option?',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.message).toMatchObject({
      recipeId,
      subject: 'Ingredient question',
    });
  });

  it('rejects a message with invalid content', async () => {
    const response = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ recipeId, subject: 'Hi', body: 'Too short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('subject must contain at least 3 characters');
  });

  it('allows only administrators to view contact messages', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipeId,
        subject: 'Ingredient question',
        body: 'Can I replace the pasta with a gluten-free option?',
      })
      .expect(201);

    const userResponse = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userResponse.status).toBe(403);

    const adminResponse = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data.messages).toEqual([
      expect.objectContaining({
        subject: 'Ingredient question',
        userEmail: 'message@example.com',
        recipeTitle: 'Contact Pasta',
      }),
    ]);
  });
});
