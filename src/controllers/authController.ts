import type { Request, Response, NextFunction } from 'express';
import { registerUser } from '../services/authService';

/**
 * Handles public account registration requests.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
