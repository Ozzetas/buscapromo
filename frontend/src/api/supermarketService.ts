import { apiClient } from './client';
import type { AllowedRadiusKm, SupermarketCreate, SupermarketResponse } from '../types';

export const supermarketService = {
  async getAll(): Promise<SupermarketResponse[]> {
    const { data } = await apiClient.get<SupermarketResponse[]>('/supermarkets/');
    return data;
  },

  async getById(supermarketId: string): Promise<SupermarketResponse> {
    const { data } = await apiClient.get<SupermarketResponse>(`/supermarkets/${supermarketId}`);
    return data;
  },

  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: AllowedRadiusKm = 1.5
  ): Promise<SupermarketResponse[]> {
    const { data } = await apiClient.get<SupermarketResponse[]>('/supermarkets/nearby', {
      params: {
        latitude,
        longitude,
        radius_km: radiusKm,
      },
    });
    return data;
  },

  async create(supermarketData: SupermarketCreate): Promise<SupermarketResponse> {
    const { data } = await apiClient.post<SupermarketResponse>('/supermarkets/', supermarketData);
    return data;
  },
};