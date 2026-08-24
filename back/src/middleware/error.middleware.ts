import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error no manejado:', err);

  res.status(500).json({
    message: 'Error interno del servidor',
    errorCode: 'INTERNAL_ERROR',
  });
};
