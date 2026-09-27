import request from 'supertest';
import app from '../src/app';
import db from '../src/db/database';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
  });

  it('creates a standard user and never returns a password hash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'Ada@example.com',
      password: 'secure-password',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      status: 'success',
      data: {
        user: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'user',
        },
      },
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const storedUser = db
      .prepare('SELECT passwordHash, role FROM users WHERE email = ?')
      .get('ada@example.com') as { passwordHash: string; role: string };

    expect(storedUser.passwordHash).not.toBe('secure-password');
    expect(storedUser.role).toBe('user');
  });

  it('rejects invalid registration data', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Name must contain at least 2 characters',
    });
  });

  it('rejects an email address that is already registered', async () => {
    const user = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'secure-password',
    };

    await request(app).post('/api/auth/register').send(user).expect(201);
    const response = await request(app).post('/api/auth/register').send(user);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 'error',
      message: 'An account with this email already exists',
    });
  });
});
