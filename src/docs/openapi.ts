/**
 * OpenAPI 3.0 description of the RecipeAtlas API.
 *
 * This module is the single source of truth for the interactive Swagger UI served
 * at `/api/docs` and the raw document served at `/api/openapi.json`. The document
 * is a plain `as const` literal so `swagger-ui-express` can consume it directly.
 */

/**
 * Wraps a schema in the standard `application/json` content object.
 *
 * @param schema - JSON Schema describing a request or response body.
 * @returns An OpenAPI content map for that schema.
 */
const jsonContent = (schema: object) => ({
  'application/json': { schema },
});

/** Reusable error responses keyed by HTTP status code. */
const errorResponses = {
  '400': { description: 'Invalid request', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
  '401': { description: 'Authentication required or token invalid', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
  '403': { description: 'Administrator access required', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
  '404': { description: 'Requested resource was not found', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
  '409': { description: 'Conflicting resource state', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
  '502': { description: 'External recipe provider unavailable', content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }) },
};

/** Path parameter describing the `id` used by the recipe endpoints. */
const recipeIdParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

/** Path parameter describing the `recipeId` used by the favourite endpoints. */
const favoriteRecipeIdParameter = {
  name: 'recipeId',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

/** Query parameters accepted by the recipe catalogue endpoint. */
const recipeListParameters = [
  { name: 'q', in: 'query', required: false, schema: { type: 'string' }, description: 'Case-insensitive partial match against the recipe title' },
  { name: 'category', in: 'query', required: false, schema: { type: 'string' }, description: 'Exact, case-insensitive category match' },
  { name: 'difficulty', in: 'query', required: false, schema: { type: 'string', enum: ['easy', 'medium', 'hard'] }, description: 'Return only recipes with this difficulty' },
  { name: 'maxTime', in: 'query', required: false, schema: { type: 'integer', minimum: 1 }, description: 'Return only recipes whose cooking time is at most this many minutes' },
  { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['title', 'category', 'cookingTime', 'servings', 'difficulty', 'createdAt', 'updatedAt'] }, description: 'Field to order the collection by. Any other value is rejected with 400.' },
  { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction, applied together with sort' },
];

/** Optional header enabling conditional requests against a cached representation. */
const ifNoneMatchHeader = {
  name: 'If-None-Match',
  in: 'header',
  required: false,
  schema: { type: 'string' },
  description: 'Entity tag previously returned by this endpoint. When it still matches the current representation the API answers 304 Not Modified with no body.',
};

/** Response headers sent with every recipe representation. */
const representationHeaders = {
  ETag: { schema: { type: 'string' }, description: 'Weak entity tag identifying this representation, for example W/"3f9c1a..."' },
  'Cache-Control': { schema: { type: 'string' }, description: 'Always no-cache, so clients revalidate rather than serve a stale copy' },
  Vary: { schema: { type: 'string' }, description: 'Always Authorization, because the hypermedia links depend on the caller role' },
};

/** Shared `304 Not Modified` response used by the conditional recipe endpoints. */
const notModifiedResponse = {
  description: 'Not modified — the caller already holds the current representation',
  headers: { ETag: { schema: { type: 'string' }, description: 'The unchanged entity tag' } },
};

/** Anonymous access, or authenticated access when a Bearer token is supplied. */
const optionalSecurity = [{}, { bearerAuth: [] }];

/** The complete OpenAPI document exported for Swagger UI and the JSON endpoint. */
const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'RecipeAtlas API',
    version: '1.0.0',
    description: 'REST API for public recipe discovery, personal collections, and administrator recipe management.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
  tags: [
    { name: 'System', description: 'API health and operational endpoints' },
    { name: 'Authentication', description: 'Account registration, login and current user access' },
    { name: 'Recipes', description: 'Public recipe browsing and searching' },
    { name: 'Favorites', description: 'Authenticated user personal recipe collection' },
    { name: 'Messages', description: 'User contact messages about recipes' },
    { name: 'Administration', description: 'Administrator-only recipe management' },
    { name: 'External recipes', description: 'TheMealDB recipe search' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API health',
        responses: {
          '200': { description: 'The API is available', content: jsonContent({ $ref: '#/components/schemas/HealthResponse' }) },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a standard user account',
        requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/RegisterRequest' }) },
        responses: {
          '201': { description: 'Account created', content: jsonContent({ $ref: '#/components/schemas/UserResponse' }) },
          '400': errorResponses['400'],
          '409': errorResponses['409'],
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate and receive a JWT access token',
        requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/LoginRequest' }) },
        responses: {
          '200': { description: 'Login successful', content: jsonContent({ $ref: '#/components/schemas/LoginResponse' }) },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user', content: jsonContent({ $ref: '#/components/schemas/UserResponse' }) },
          '401': errorResponses['401'],
        },
      },
    },
    '/api/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'Browse, search, filter and sort local recipes',
        description:
          'Publicly readable, with no token required. A valid Bearer token is optional and only changes which HATEOAS links are advertised. Supports conditional requests: send If-None-Match with an ETag previously returned by this endpoint to receive 304 Not Modified when the catalogue has not changed.',
        security: optionalSecurity,
        parameters: [...recipeListParameters, ifNoneMatchHeader],
        responses: {
          '200': { description: 'Recipe catalogue', headers: representationHeaders, content: jsonContent({ $ref: '#/components/schemas/RecipeListResponse' }) },
          '304': notModifiedResponse,
          '400': errorResponses['400'],
        },
      },
    },
    '/api/recipes/{id}': {
      get: {
        tags: ['Recipes'],
        summary: 'Get one local recipe',
        description:
          'Publicly readable, with no token required. A valid Bearer token is optional and only changes which HATEOAS links are advertised. Supports conditional requests through If-None-Match.',
        security: optionalSecurity,
        parameters: [recipeIdParameter, ifNoneMatchHeader],
        responses: {
          '200': { description: 'Recipe detail', headers: representationHeaders, content: jsonContent({ $ref: '#/components/schemas/RecipeResponse' }) },
          '304': notModifiedResponse,
          '400': errorResponses['400'],
          '404': errorResponses['404'],
        },
      },
    },
    '/api/external-recipes': {
      get: {
        tags: ['External recipes'],
        summary: 'Search TheMealDB without writing local data',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 } }],
        responses: {
          '200': { description: 'External recipe results', content: jsonContent({ $ref: '#/components/schemas/ExternalRecipeListResponse' }) },
          '400': errorResponses['400'],
          '502': errorResponses['502'],
        },
      },
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'List the current user saved recipes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Saved recipes', content: jsonContent({ $ref: '#/components/schemas/RecipeListResponse' }) },
          '401': errorResponses['401'],
        },
      },
    },
    '/api/favorites/{recipeId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Save a local recipe to the current user collection',
        security: [{ bearerAuth: [] }],
        parameters: [favoriteRecipeIdParameter],
        responses: {
          '201': { description: 'Recipe saved', content: jsonContent({ $ref: '#/components/schemas/SuccessResponse' }) },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '404': errorResponses['404'],
          '409': errorResponses['409'],
        },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remove a local recipe from the current user collection',
        security: [{ bearerAuth: [] }],
        parameters: [favoriteRecipeIdParameter],
        responses: {
          '204': { description: 'Favorite removed' },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '404': errorResponses['404'],
        },
      },
    },
    '/api/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Send a message to administrators about a recipe',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/CreateMessageRequest' }) },
        responses: {
          '201': { description: 'Message created', content: jsonContent({ $ref: '#/components/schemas/MessageResponse' }) },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '404': errorResponses['404'],
        },
      },
      get: {
        tags: ['Messages'],
        summary: 'List all messages for administrators',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Contact messages', content: jsonContent({ $ref: '#/components/schemas/MessageListResponse' }) },
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/api/admin/recipes': {
      post: {
        tags: ['Administration'],
        summary: 'Create a local recipe',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/RecipeInput' }) },
        responses: {
          '201': { description: 'Recipe created', content: jsonContent({ $ref: '#/components/schemas/RecipeResponse' }) },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
        },
      },
    },
    '/api/admin/recipes/{id}': {
      put: {
        tags: ['Administration'],
        summary: 'Replace a local recipe and its ingredients',
        security: [{ bearerAuth: [] }],
        parameters: [recipeIdParameter],
        requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/RecipeInput' }) },
        responses: {
          '200': { description: 'Recipe updated', content: jsonContent({ $ref: '#/components/schemas/RecipeResponse' }) },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
        },
      },
      delete: {
        tags: ['Administration'],
        summary: 'Delete a local recipe and its ingredients',
        security: [{ bearerAuth: [] }],
        parameters: [recipeIdParameter],
        responses: {
          '204': { description: 'Recipe deleted' },
          '400': errorResponses['400'],
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '404': errorResponses['404'],
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
      HealthResponse: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok'], example: 'ok' } } },
      SuccessResponse: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['success'] } } },
      ErrorResponse: { type: 'object', required: ['status', 'message'], properties: { status: { type: 'string', enum: ['error'] }, message: { type: 'string', example: 'Authentication is required' } } },
      Ingredient: { type: 'object', required: ['name'], properties: { id: { type: 'integer', readOnly: true }, recipeId: { type: 'integer', readOnly: true }, name: { type: 'string', example: 'Pasta' }, quantity: { type: 'string', nullable: true, example: '200 g' } } },
      RecipeInput: {
        type: 'object', required: ['title', 'instructions'], properties: {
          title: { type: 'string', example: 'Vegetable Pasta' }, instructions: { type: 'string', example: 'Boil pasta and mix with vegetables.' }, category: { type: 'string', nullable: true, example: 'Dinner' }, imageUrl: { type: 'string', nullable: true, format: 'uri' }, cookingTime: { type: 'integer', nullable: true, minimum: 1, example: 25 }, servings: { type: 'integer', nullable: true, minimum: 1, example: 2 }, difficulty: { type: 'string', nullable: true, enum: ['easy', 'medium', 'hard'] }, ingredients: { type: 'array', items: { $ref: '#/components/schemas/Ingredient' } },
        },
      },
      Recipe: {
        allOf: [{ $ref: '#/components/schemas/RecipeInput' }, { type: 'object', required: ['id', 'createdAt', 'updatedAt', '_links'], properties: { id: { type: 'integer', readOnly: true }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true }, _links: { $ref: '#/components/schemas/RecipeLinks' } } }],
      },
      Link: {
        type: 'object',
        required: ['href', 'method', 'title'],
        description: 'A single hypermedia control. The client can follow it without hard-coding knowledge of the API surface.',
        properties: {
          href: { type: 'string', example: '/api/recipes/1' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          title: { type: 'string', example: 'This recipe' },
        },
      },
      RecipeLinks: {
        type: 'object',
        description: 'Navigation links for a recipe. Links that require authentication are only advertised to authenticated callers, and administrator operations only to administrators.',
        properties: {
          self: { $ref: '#/components/schemas/Link' },
          collection: { $ref: '#/components/schemas/Link' },
          'add-favourite': { $ref: '#/components/schemas/Link' },
          'remove-favourite': { $ref: '#/components/schemas/Link' },
          'contact-administrator': { $ref: '#/components/schemas/Link' },
          update: { $ref: '#/components/schemas/Link' },
          delete: { $ref: '#/components/schemas/Link' },
        },
      },
      CollectionLinks: {
        type: 'object',
        description: 'Navigation links for the recipe collection itself.',
        properties: {
          self: { $ref: '#/components/schemas/Link' },
          'external-recipes': { $ref: '#/components/schemas/Link' },
          favourites: { $ref: '#/components/schemas/Link' },
          create: { $ref: '#/components/schemas/Link' },
          messages: { $ref: '#/components/schemas/Link' },
        },
      },
      RecipeResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { recipe: { $ref: '#/components/schemas/Recipe' } } } } },
      RecipeListResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', required: ['count', 'recipes'], properties: { count: { type: 'integer', example: 3, description: 'Number of recipes returned by this query' }, recipes: { type: 'array', items: { $ref: '#/components/schemas/Recipe' } }, _links: { $ref: '#/components/schemas/CollectionLinks' } } } } },
      RegisterRequest: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, format: 'password' } } },
      LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
      User: { type: 'object', required: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'], properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['user', 'admin'] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      UserResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
      LoginResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
      CreateMessageRequest: { type: 'object', required: ['recipeId', 'subject', 'body'], properties: { recipeId: { type: 'integer', minimum: 1 }, subject: { type: 'string', minLength: 3 }, body: { type: 'string', minLength: 10 } } },
      Message: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, recipeId: { type: 'integer' }, subject: { type: 'string' }, body: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, userName: { type: 'string' }, userEmail: { type: 'string', format: 'email' }, recipeTitle: { type: 'string' } } },
      MessageResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { message: { $ref: '#/components/schemas/Message' } } } } },
      MessageListResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } } } } } },
      ExternalRecipe: { type: 'object', properties: { source: { type: 'string', enum: ['TheMealDB'] }, sourceId: { type: 'string' }, title: { type: 'string' }, category: { type: 'string', nullable: true }, imageUrl: { type: 'string', nullable: true, format: 'uri' }, instructions: { type: 'string' }, ingredients: { type: 'array', items: { $ref: '#/components/schemas/Ingredient' } } } },
      ExternalRecipeListResponse: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, data: { type: 'object', properties: { recipes: { type: 'array', items: { $ref: '#/components/schemas/ExternalRecipe' } } } } } },
    },
  },
} as const;

export default openApiDocument;
