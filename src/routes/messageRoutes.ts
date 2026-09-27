import { Router } from 'express';
import { create, list } from '../controllers/messageController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const messageRouter = Router();

messageRouter.post('/', requireAuth, create);
messageRouter.get('/', requireAuth, requireAdmin, list);

export default messageRouter;
