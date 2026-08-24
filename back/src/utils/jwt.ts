import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserPayload } from '../types/auth.types';

export const generateToken = (payload: IUserPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): IUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as IUserPayload;
};
