import { Router } from 'express';
import { create, list } from '../controllers/messageController';
import { requireAdmin, requireAuth } from '../middleware/auth';

/**
 * Message routes.
 *
 * Sending is available to any authenticated user, while reading every message is
 * restricted to administrators.
 */
const messageRouter = Router();

/** POST /api/messages — send a message about a recipe; guarded by requireAuth. */
messageRouter.post('/', requireAuth, create);
/** GET /api/messages — list all messages; guarded by requireAuth and requireAdmin. */
messageRouter.get('/', requireAuth, requireAdmin, list);

export default messageRouter;
