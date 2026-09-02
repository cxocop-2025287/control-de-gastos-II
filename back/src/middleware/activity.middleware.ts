import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types/auth.types';
import { env } from '../config/env';

const userActivity = new Map<number, number>();
const ACTIVITY_TIMEOUT = (env.SESSION_INACTIVITY_TIMEOUT || 60) * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastActivity] of userActivity) {
    if ((now - lastActivity) > ACTIVITY_TIMEOUT * 2) {
      userActivity.delete(userId);
    }
  }
}, 5 * 60 * 1000);

export const activityMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }

  const userId = req.user.userId;
  const now = Date.now();
  const lastActivity = userActivity.get(userId) || 0;

  if (lastActivity > 0 && (now - lastActivity) > ACTIVITY_TIMEOUT) {
    userActivity.delete(userId);
    res.status(401).json({
      message: 'Sesión expirada por inactividad',
      errorCode: 'SESSION_EXPIRED',
    });
    return;
  }

  userActivity.set(userId, now);
  next();
};

export const getRemainingTime = (userId: number): number => {
  const lastActivity = userActivity.get(userId);
  if (!lastActivity) return 0;
  const elapsed = Date.now() - lastActivity;
  return Math.max(0, Math.floor((ACTIVITY_TIMEOUT - elapsed) / 1000));
};

export const isUserActive = (userId: number): boolean => {
  const lastActivity = userActivity.get(userId);
  if (!lastActivity) return false;
  return (Date.now() - lastActivity) <= ACTIVITY_TIMEOUT;
};

export const getActivityTimeout = (): number => {
  return Math.floor(ACTIVITY_TIMEOUT / 1000);
};

/**
 * Registra actividad para un usuario sin pasar por el middleware.
 * Usado por el endpoint de heartbeat cuando el frontend reporta actividad real.
 */
export const registerActivity = (userId: number): void => {
  userActivity.set(userId, Date.now());
};