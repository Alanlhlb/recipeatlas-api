import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../src/middleware/errorHandler';

describe('errorHandler', () => {
  it('hides unexpected error details behind a 500 response', () => {
    const response = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(
      new Error('Database connection password was rejected'),
      {} as Request,
      response,
      jest.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });

    consoleError.mockRestore();
  });
});
