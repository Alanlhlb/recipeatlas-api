import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
  });

  it('returns the authenticated user account', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secure-password',
    }).expect(201);

    const login = await request(app).post('/api/auth/login').send({
      email: 'ada@example.com',
      password: 'secure-password',
    }).expect(200);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'user',
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a request without an access token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Authentication is required',
    });
  });

  it('rejects an invalid access token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Invalid access token',
    });
  });
});
