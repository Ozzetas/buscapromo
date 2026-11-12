// ==========================================
// 1. USUARIOS Y AUTENTICACIÓN (schemas/user.py)
// ==========================================

export type UserRole = 'admin' | 'user';

export interface UserBase {
  email: string;
  full_name: string;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse extends UserBase {
  id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// ==========================================
// 2. SUPERMERCADOS (schemas/supermarket.py)
// ==========================================

export interface SupermarketBase {
  name: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
}

export type SupermarketCreate = SupermarketBase;

export interface SupermarketResponse extends SupermarketBase {
  id: string;
  city: string;
  distance_km?: number | null;
}

// ==========================================
// 3. PROMOCIONES (schemas/promotion.py)
// ==========================================

// Días de la semana: 0 (Lunes) a 6 (Domingo)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PromotionBase {
  supermarket_id: string;
  title: string;
  description: string;
  discount_percentage?: number | null;
  applicable_days: DayOfWeek[];
  is_active?: boolean;
}

export type PromotionCreate = PromotionBase;

export interface PromotionResponse extends PromotionBase {
  id: string;
  discount_percentage: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PromotionWithSupermarketResponse extends PromotionResponse {
  supermarket: SupermarketResponse;
}

// ==========================================
// 4. PARÁMETROS DE BÚSQUEDA Y RESPUESTAS API
// ==========================================

export type AllowedRadiusKm = 1 | 1.5 | 3 | 5;

export interface PromotionSearchParams {
  latitude: number;
  longitude: number;
  radius_km?: AllowedRadiusKm;
  day_of_week?: DayOfWeek | null;
}

export interface DeactivatePromotionResponse {
  status: string;
  message: string;
}