import type { AllowedRadiusKm, DayOfWeek } from '../types';

export const DAYS_OF_WEEK: ReadonlyArray<{ value: DayOfWeek; label: string; short: string }> = [
  { value: 0, label: 'Lunes', short: 'Lun' },
  { value: 1, label: 'Martes', short: 'Mar' },
  { value: 2, label: 'Miércoles', short: 'Mié' },
  { value: 3, label: 'Jueves', short: 'Jue' },
  { value: 4, label: 'Viernes', short: 'Vie' },
  { value: 5, label: 'Sábado', short: 'Sáb' },
  { value: 6, label: 'Domingo', short: 'Dom' },
];

export const ALLOWED_RADII_KM: ReadonlyArray<AllowedRadiusKm> = [1, 1.5, 3, 5];

// Coordenadas por defecto: Plaza San Martín (Centro de Córdoba Capital)
export const CORDOBA_DEFAULT_COORDS = {
  latitude: -31.4167,
  longitude: -64.1833,
};

// Puntos estratégicos de Córdoba para simular geolocalización en defensa académica
export const CORDOBA_LOCATION_PRESETS = [
  {
    name: 'Centro (Plaza San Martín)',
    latitude: -31.4167,
    longitude: -64.1833,
  },
  {
    name: 'Nueva Córdoba (Buen Pastor)',
    latitude: -31.4242,
    longitude: -64.1868,
  },
  {
    name: 'Barrio General Paz',
    latitude: -31.4142,
    longitude: -64.1678,
  },
  {
    name: 'Alto Verde (Zona Norte)',
    latitude: -31.3694,
    longitude: -64.2185,
  },
] as const;

/**
 * Convierte el día nativo de JS (0=Domingo..6=Sábado)
 * al estándar del backend en Python (0=Lunes..6=Domingo).
 */
export function getCurrentBackendDay(): DayOfWeek {
  const jsDay = new Date().getDay();
  return ((jsDay + 6) % 7) as DayOfWeek;
}