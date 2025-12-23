import { User } from '../schemas/user.schema';

export interface UserIdResponse {
    _id: string;
}

export interface MessageResponse {
    message: string;
}

export interface PaginatedUsersResponse {
    results: User[];
    totalPages: number;
}
