import request from 'supertest';
import app from '../src/app';

describe('OpenAPI documentation', () => {
  it('serves a machine-readable OpenAPI document', async () => {
    const response = await request(app).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      openapi: '3.0.3',
      info: {
        title: 'RecipeAtlas API',
        version: '1.0.0',
      },
      paths: {
        '/health': expect.any(Object),
        '/api/auth/register': expect.any(Object),
        '/api/recipes': expect.any(Object),
        '/api/favorites': expect.any(Object),
        '/api/messages': expect.any(Object),
        '/api/admin/recipes': expect.any(Object),
      },
      components: {
        securitySchemes: {
          bearerAuth: expect.objectContaining({
            type: 'http',
            scheme: 'bearer',
          }),
        },
      },
    });
  });

  it('serves the interactive Swagger UI page', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('Swagger UI');
  });
});
