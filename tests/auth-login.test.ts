import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';

describe('POST /api/auth/login', () => {
  const user = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'secure-password',
  };

  beforeEach(async () => {
    db.prepare('DELETE FROM users').run();
    await request(app).post('/api/auth/register').send(user).expect(201);
  });

  it('returns a valid JWT for correct credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.user).toMatchObject({
      name: user.name,
      email: user.email,
      role: 'user',
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const payload = jwt.verify(
      response.body.data.token,
      process.env.JWT_SECRET as string,
    ) as jwt.JwtPayload;

    expect(payload.sub).toBeDefined();
    expect(payload.role).toBe('user');
  });

  it('rejects an incorrect password without revealing which credential failed', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Invalid email or password',
    });
  });

  it('rejects an unknown email with the same safe response', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: user.password,
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Invalid email or password',
    });
  });
});
