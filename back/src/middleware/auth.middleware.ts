import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { IAuthRequest } from '../types/auth.types';
import { UserModel } from '../models/user.model';

export const authMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Token de autenticacion no proporcionado',
        errorCode: 'NO_TOKEN',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        message: 'Token de autenticacion no valido',
        errorCode: 'INVALID_TOKEN',
      });
      return;
    }

    const decoded = verifyToken(token);

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        message: 'Usuario no encontrado',
        errorCode: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({
        message: 'Cuenta desactivada',
        errorCode: 'ACCOUNT_DISABLED',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      res.status(401).json({
        message: 'Sesion expirada',
        errorCode: 'TOKEN_EXPIRED',
      });
      return;
    }

    if ((error as Error).name === 'JsonWebTokenError') {
      res.status(401).json({
        message: 'Token invalido',
        errorCode: 'INVALID_TOKEN',
      });
      return;
    }

    console.error('Error en authMiddleware:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};
