import request from 'supertest';
import app from '../src/app';

describe('CORS configuration', () => {
  it('allows the configured frontend origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not allow an unknown browser origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://untrusted.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
