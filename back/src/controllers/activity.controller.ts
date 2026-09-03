import { Response } from 'express';
import { IAuthRequest } from '../types/auth.types';
import { getActivityTimeout, registerActivity } from '../middleware/activity.middleware';

export class ActivityController {
  static async heartbeat(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      // Cuando el frontend envía heartbeat es porque hubo actividad del usuario.
      // Registramos la actividad en el backend para refrescar el tiempo de inactividad.
      registerActivity(userId);
      const timeoutSeconds = getActivityTimeout();
      
      res.status(200).json({
        remainingTime: timeoutSeconds,
        isActive: true,
        timeoutSeconds,
      });
    } catch (error) {
      console.error('Error en heartbeat:', error);
      res.status(500).json({
        message: 'Error al verificar actividad',
        errorCode: 'INTERNAL_ERROR',
      });
    }
  }
}