import { apiClient } from './client';
import type {
  DayOfWeek,
  DeactivatePromotionResponse,
  PromotionCreate,
  PromotionResponse,
  PromotionSearchParams,
  PromotionWithSupermarketResponse,
} from '../types';

export const promotionService = {
  async searchNearby(params: PromotionSearchParams): Promise<PromotionWithSupermarketResponse[]> {
    const queryParams: Record<string, number> = {
      latitude: params.latitude,
      longitude: params.longitude,
      radius_km: params.radius_km ?? 1.5,
    };

    if (params.day_of_week !== undefined && params.day_of_week !== null) {
      queryParams.day_of_week = params.day_of_week;
    }

    const { data } = await apiClient.get<PromotionWithSupermarketResponse[]>('/promotions/search', {
      params: queryParams,
    });
    return data;
  },

  async getBySupermarket(supermarketId: string): Promise<PromotionResponse[]> {
    const { data } = await apiClient.get<PromotionResponse[]>(
      `/promotions/supermarket/${supermarketId}`
    );
    return data;
  },

  async getByDay(dayOfWeek: DayOfWeek): Promise<PromotionResponse[]> {
    const { data } = await apiClient.get<PromotionResponse[]>(`/promotions/day/${dayOfWeek}`);
    return data;
  },

  async create(promotionData: PromotionCreate): Promise<PromotionResponse> {
    const { data } = await apiClient.post<PromotionResponse>('/promotions/', promotionData);
    return data;
  },

  async deactivate(promotionId: string): Promise<DeactivatePromotionResponse> {
    const { data } = await apiClient.patch<DeactivatePromotionResponse>(
      `/promotions/${promotionId}/deactivate`
    );
    return data;
  },
};