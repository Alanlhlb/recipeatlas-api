import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './db/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRouter from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
