import type { NextFunction, Request, Response } from 'express';
import { searchTheMealDb } from '../services/theMealDbService';

/**
 * Searches recipe information from TheMealDB without modifying local data.
 */
export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipes = await searchTheMealDb(req.query.q);

    res.status(200).json({
      status: 'success',
      data: { recipes },
    });
  } catch (error) {
    next(error);
  }
}
