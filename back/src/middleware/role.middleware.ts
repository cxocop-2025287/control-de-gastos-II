import { Response, NextFunction } from 'express';
import { IAuthRequest, Role } from '../types/auth.types';

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        message: 'Autenticacion requerida',
        errorCode: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: 'No tienes permiso para acceder a este recurso',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};
