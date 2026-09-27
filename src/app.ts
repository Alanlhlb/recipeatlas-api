/**
 * RecipeAtlas Express application.
 *
 * Assembles the middleware stack (CORS and JSON body parsing), the OpenAPI
 * documentation endpoints, the feature routers, and the shared not-found and
 * error-handling middleware. The configured instance is exported as the default
 * export so both the HTTP server entry point and the test suite can mount it.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import './db/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRouter from './routes/authRoutes';
import adminRecipeRouter from './routes/adminRecipeRoutes';
import recipeRouter from './routes/recipeRoutes';
import externalRecipeRouter from './routes/externalRecipeRoutes';
import favoriteRouter from './routes/favoriteRoutes';
import messageRouter from './routes/messageRoutes';
import openApiDocument from './docs/openapi';
import config from './config/env';

/** The configured Express application, ready to be mounted or listened on. */
const app = express();

app.use(
  cors({
    /**
     * Allows requests with no `Origin` header and any request whose origin
     * matches the configured frontend origin; all other origins are rejected.
     *
     * @param origin - The request's `Origin` header, or `undefined` when absent.
     * @param callback - CORS callback invoked with the allow/deny decision.
     */
    origin(origin, callback) {
      const allowed = !origin || origin === config.frontendOrigin;
      callback(null, allowed);
    },
  }),
);
app.use(express.json());

/** Serves the raw OpenAPI document as JSON for tooling and client generation. */
app.get('/api/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});
/** Serves the interactive Swagger UI generated from the OpenAPI document. */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRecipeRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/external-recipes', externalRecipeRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/messages', messageRouter);

/** Liveness probe used by deployments and tests to confirm the API is running. */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
