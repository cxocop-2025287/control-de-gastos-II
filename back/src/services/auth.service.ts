import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { ILoginRequest, ILoginResponse } from '../types/auth.types';
import { env } from '../config/env';
import { registerActivity } from '../middleware/activity.middleware';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = 'AppError';
  }
}

export class AuthService {
  static async login(data: ILoginRequest): Promise<ILoginResponse> {
    const user: IUser | null = await UserModel.findByName(data.name);

    if (!user) {
      throw new AppError('Credenciales incorrectas', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Cuenta desactivada', 403, 'ACCOUNT_DISABLED');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Credenciales incorrectas', 401, 'INVALID_CREDENTIALS');
    }

    const tokenPayload = {
      userId: user.id,
      name: user.name,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    registerActivity(user.id);

    return {
      message: 'Inicio de sesion exitoso',
      token,
      expiresIn: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }
}