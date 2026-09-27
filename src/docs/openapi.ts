const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'RecipeAtlas API',
    version: '1.0.0',
    description: 'REST API for public recipe discovery and administrator recipe management.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
  tags: [
    { name: 'System', description: 'API health and operational endpoints' },
    { name: 'Authentication', description: 'Account registration, login and current user access' },
    { name: 'Recipes', description: 'Public recipe browsing and searching' },
    { name: 'Administration', description: 'Administrator-only recipe management' },
    { name: 'External recipes', description: 'TheMealDB recipe search' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API health',
        responses: {
          '200': {
            description: 'The API is available',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT returned by POST /api/auth/login.',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ok'], example: 'ok' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
          status: { type: 'string', enum: ['error'] },
          message: { type: 'string' },
        },
      },
    },
  },
} as const;

export default openApiDocument;
