import { Request } from 'express';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUserPayload {
  userId: number;
  name: string;
  role: Role;
}

export interface ILoginRequest {
  name: string;
  password: string;
}

export interface ILoginResponse {
  message: string;
  token: string;
  expiresIn: string;
  user: {
    id: number;
    name: string;
    role: Role;
  };
}

export interface IAuthRequest extends Request {
  user?: IUserPayload;
}