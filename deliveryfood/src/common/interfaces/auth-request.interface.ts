import { Request } from 'express';
import { IUser } from '@/auth/interfaces/auth.interface';

/**
 * Authenticated request interface
 * Used for endpoints protected by JwtAuthGuard
 */
export interface AuthenticatedRequest extends Request {
    user: IUser & {
        restaurantId?: string;
        shipperId?: string;
    };
}
