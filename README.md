# RecipeAtlas API

RecipeAtlas is a TypeScript REST API for recipe discovery and personal recipe collections. It provides public recipe browsing and title search, authenticated user accounts, personal favourites, recipe-related contact messages, and protected administrator recipe management.

This repository is the **backend API** for the 6003CEM Web API Development coursework. The React TypeScript single-page application will be maintained in a separate GitHub repository.

## Features

- Public recipe catalogue, title search, and recipe detail endpoints
- Server-side filtering by category and difficulty, plus maximum cooking time
- Server-side sorting with a whitelisted column set and ascending or descending order
- Secure user registration and login
- Password hashing with bcrypt
- JWT Bearer authentication and role-based access control
- Optional authentication so public endpoints still return role-aware hypermedia
- HTTP conditional requests with weak `ETag` and `304 Not Modified` responses
- HATEOAS hypermedia links that adapt to the caller's role
- Secure administrator provisioning through local environment variables
- Administrator recipe create, update, and delete operations
- Personal favourite recipe collection for registered users
- User messages to administrators about specific recipes
- TheMealDB external recipe search integration
- OpenAPI 3.0.3 specification and interactive Swagger UI
- SQLite production database and separate test database
- Automated endpoint tests using Jest and Supertest
- JSDoc documentation on exported functions, services, and shared types

## Technology

- Node.js and TypeScript
- Express 5
- SQLite via better-sqlite3
- bcrypt and JSON Web Tokens
- Jest and Supertest
- Swagger UI / OpenAPI 3.0.3

## Project structure

```text
src/
  config/        Environment configuration
  controllers/   HTTP request and response handling
  db/            SQLite schema and database connection
  docs/          OpenAPI specification
  middleware/    Authentication, authorisation, and error handling
  routes/        Express route definitions
  scripts/       Local administrator provisioning script
  services/      Business and persistence logic
  types/         Shared TypeScript data types
  utils/         Conditional request and hypermedia helpers
tests/           Automated API endpoint and schema tests
```

The codebase separates routes, controllers, services, and database setup so HTTP handling, business rules, and persistence logic remain independently maintainable.

## Setup

### Prerequisites

- Node.js 22 or newer
- npm

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to a new local `.env` file.

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Set secure local values in `.env`:

```env
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_NAME=RecipeAtlas Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-this-with-a-strong-password
```

Do not commit `.env`. It contains secrets and local administrator credentials.

### Start the API in development mode

```bash
npm run dev
```

The API starts at:

```text
http://localhost:3000
```

Health check:

```text
GET http://localhost:3000/health
```

### Production build

```bash
npm run build
npm start
```

## Administrator setup

Public registration always creates a normal `user` account. It cannot create administrators.

To create the initial administrator from the values in `.env`, run:

```bash
npm run seed:admin
```

The script hashes the administrator password before storing it and rejects a duplicate email address.

## Authentication and authorisation

1. Register with `POST /api/auth/register`.
2. Log in with `POST /api/auth/login`.
3. Send the returned JWT with protected requests:

```http
Authorization: Bearer <token>
```

Roles:

- **Public visitor**: can browse, search, and view local recipes.
- **Registered user**: can access their own account, manage their favourites, and send recipe-related messages.
- **Administrator**: can create, update, and delete recipes, and view user contact messages.

Protected endpoints return `401 Unauthorized` for missing or invalid authentication. Administrator-only endpoints return `403 Forbidden` to normal users.

## API documentation

Interactive Swagger UI:

```text
http://localhost:3000/api/docs/
```

Machine-readable OpenAPI document:

```text
http://localhost:3000/api/openapi.json
```

The Swagger UI includes endpoint request bodies, JWT Bearer authorisation, expected responses, and error status codes.

## Main endpoints

### Public endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Confirm that the API is running |
| GET | `/api/recipes` | Browse local recipes, with filtering and sorting |
| GET | `/api/recipes?q=pasta` | Search local recipe titles |
| GET | `/api/recipes?category=Dinner&sort=title&order=asc` | Filter by category and sort by title |
| GET | `/api/recipes/:id` | Read one local recipe |
| GET | `/api/external-recipes?q=pasta` | Search TheMealDB without saving data locally |
| POST | `/api/auth/register` | Register a standard user account |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Authenticated user endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Get the current user account |
| GET | `/api/favorites` | List the current user's favourite recipes |
| POST | `/api/favorites/:recipeId` | Save a local recipe as a favourite |
| DELETE | `/api/favorites/:recipeId` | Remove a favourite |
| POST | `/api/messages` | Send a message about a local recipe to administrators |

### Administrator endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/recipes` | Create a recipe |
| PUT | `/api/admin/recipes/:id` | Replace a recipe and its ingredients |
| DELETE | `/api/admin/recipes/:id` | Delete a recipe and its ingredients |
| GET | `/api/messages` | View contact messages |

## Filtering and sorting

`GET /api/recipes` accepts the following optional query parameters:

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Case-insensitive partial match on the recipe title |
| `category` | string | Case-insensitive exact match on the category |
| `difficulty` | string | One of `Easy`, `Medium`, `Hard` |
| `maxTime` | integer | Only recipes whose cooking time is at most this many minutes |
| `sort` | string | One of `title`, `category`, `cookingTime`, `servings`, `difficulty`, `createdAt`, `updatedAt` |
| `order` | string | `asc` or `desc` (default `asc`) |

All parameters are optional and can be combined. The response body contains a `count` field with the number of matching recipes and a `data` array.

```http
GET /api/recipes?category=Dinner&maxTime=45&sort=cookingTime&order=desc
```

Query values are always sent to SQLite as bound parameters, and the `sort` column is resolved through a whitelist, so user input is never interpolated directly into SQL. Invalid values for `difficulty`, `sort`, or `order` return `400 Bad Request`.

## Conditional requests

`GET /api/recipes` and `GET /api/recipes/:id` return a weak `ETag` header derived from the response body:

```http
ETag: W/"nH1xfhcIBXGxpnxrOYy075aWNHI"
Cache-Control: no-cache
Vary: Authorization
```

Send the value back in `If-None-Match` to avoid re-downloading unchanged data. When the representation has not changed the API replies with `304 Not Modified` and an empty body:

```http
If-None-Match: W/"nH1xfhcIBXGxpnxrOYy075aWNHI"
```

`Vary: Authorization` tells caches that the representation depends on the caller's role, because hypermedia links differ between anonymous visitors, users, and administrators.

## Hypermedia links

Every recipe resource and recipe collection includes a `_links` object so clients can discover available actions without hard-coding URLs. Each link contains `href`, `method`, and a human-readable `title`.

```json
{
  "id": 1,
  "title": "Creamy Garlic Pasta",
  "_links": {
    "self": { "href": "/api/recipes/1", "method": "GET", "title": "Read this recipe" },
    "collection": { "href": "/api/recipes", "method": "GET", "title": "Browse all recipes" }
  }
}
```

The link set adapts to the caller's role:

- **Anonymous**: `self`, `collection`.
- **Authenticated user**: adds `add-favourite`, `remove-favourite`, and `contact-administrator`; the collection adds `favourites`.
- **Administrator**: adds `update` and `delete`; the collection adds `create` and `messages`.

These endpoints use optional authentication, so a valid `Authorization: Bearer <token>` enriches the response but is never required. A missing or malformed token is treated as an anonymous request rather than an error.

## Testing

Run all automated tests with:

```bash
npm test
```

The test suite uses `recipeatlas.test.db`, while normal development uses `recipeatlas.db`. This keeps test data separate from development data.

Tests cover successful and invalid API requests, authentication, administrator access restrictions, CRUD behaviour, favourites, messages, database constraints, OpenAPI documentation, CORS, external API failures, catalogue filtering and sorting, hostile query string input, HTTP conditional requests, and hypermedia links.

Jest runs with `--runInBand` so the suites execute sequentially. All suites share a single SQLite test file, and running them in parallel causes lock contention and intermittent timeouts.

## Code documentation

Exported services, controllers, middleware, utilities, and shared types are documented with JSDoc blocks, including `@param`, `@returns`, and `@throws` tags. Editors such as Visual Studio Code show these comments on hover and in autocomplete.

## Security and data handling

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- JWT tokens expire after one hour.
- Administrator accounts can only be created locally through the environment-controlled seed command.
- CORS only allows the configured `FRONTEND_ORIGIN`.
- Request data is validated before database writes.
- SQLite foreign keys and transactions prevent incomplete or orphaned related data.
- API errors use consistent JSON responses and do not expose unexpected internal error details.
- TheMealDB requests use a five-second timeout and return a safe `502` error if the provider is unavailable.

## External integration

The API integrates with [TheMealDB](https://www.themealdb.com/) through:

```text
GET /api/external-recipes?q=<recipe name>
```

The API normalises TheMealDB response fields into the RecipeAtlas recipe shape. Results are read-only and are not inserted into the local database automatically.

## Coursework repository requirement

The coursework requires two separate GitHub repositories:

1. This backend TypeScript REST API repository: <https://github.com/Alanlhlb/recipeatlas-api>
2. A separate React TypeScript SPA frontend repository: <https://github.com/Alanlhlb/recipeatlas-client>

The frontend repository consumes this API using the `FRONTEND_ORIGIN` configured above.
