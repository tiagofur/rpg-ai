import { client } from './client';

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
    };
    accessToken: string;
    refreshToken: string;
}

export const authApi = {
    register: async (email: string, username: string, password: string) => {
        return client.post<{ user: any }>('/api/auth/register', { email, username, password });
    },

    login: async (email: string, password: string) => {
        return client.post<AuthResponse>('/api/auth/login', { email, password });
    },
};
