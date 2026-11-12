import { apiClient, TOKEN_STORAGE_KEY } from './client';
import type { TokenResponse, UserCreate, UserLogin, UserResponse } from '../types';

export const authService = {
  async register(userData: UserCreate): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/register', userData);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    return data;
  },

  async login(credentials: UserLogin): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    return data;
  },

  async getMe(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>('/auth/me');
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};