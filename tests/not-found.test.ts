import request from 'supertest';
import app from '../src/app';

describe('unknown routes', () => {
  it('returns a consistent 404 error response', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Route GET /api/does-not-exist not found',
    });
  });
});
