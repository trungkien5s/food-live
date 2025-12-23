import { User } from '@/modules/users/schemas/user.schema';

export interface IUser {
    _id: string;
    username?: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
}

export interface LoginResponse {
    user: {
        _id: string;
        email: string;
        name: string;
        role: string;
    };
    access_token: string;
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
}

export interface LogoutResponse {
    message: string;
    statusCode: number;
    data: {
        userId: string;
        email: string;
        logoutTime: string;
    };
}

export interface RegisterResponse {
    message: string;
}

export interface ActivationResponse {
    message: string;
}

export interface JwtPayload {
    username: string;
    sub: string;
    role: string;
}

export type UserFromDB = User & { _id: string };
