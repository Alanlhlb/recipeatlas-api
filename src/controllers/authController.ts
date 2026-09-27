import type { Request, Response, NextFunction } from 'express';
import { getPublicUserById, loginUser, registerUser } from '../services/authService';

/**
 * Handles public account registration requests.
 *
 * Mounted at `POST /api/auth/register`; it is deliberately unguarded so anyone can
 * create a standard user account.
 *
 * @param req - Express request whose body holds name, email and password.
 * @param res - Express response; sends 201 with the created public user.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when a field is invalid, 409 when the email is already registered.
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
 *
 * Mounted at `POST /api/auth/login`; it is unguarded because the credentials in the
 * body are the authentication.
 *
 * @param req - Express request whose body holds email and password.
 * @param res - Express response; sends 200 with the signed token and public user.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 400 when a field is invalid, 401 when the credentials do not match.
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

/**
 * Returns the account represented by the validated access token.
 *
 * Mounted at `GET /api/auth/me` behind `requireAuth`, so `req.user` is always set.
 *
 * @param req - Express request carrying the authenticated user from `requireAuth`.
 * @param res - Express response; sends 200 with the current public user.
 * @param next - Express continuation callback used to forward errors.
 * @throws {AppError} 401 when the account behind the token no longer exists.
 */
export function getCurrentUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getPublicUserById(req.user!.id);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
