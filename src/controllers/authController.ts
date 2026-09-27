import type { Request, Response, NextFunction } from 'express';
import { loginUser, registerUser } from '../services/authService';

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

/**
 * Handles login requests and returns a short-lived access token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
