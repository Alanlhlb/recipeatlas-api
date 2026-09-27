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
import openApiDocument from './docs/openapi';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRecipeRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/external-recipes', externalRecipeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
