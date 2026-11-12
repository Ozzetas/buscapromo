import { useCallback, useEffect, useState } from 'react';
import { promotionService } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ALLOWED_RADII_KM,
  CORDOBA_DEFAULT_COORDS,
  CORDOBA_LOCATION_PRESETS,
  DAYS_OF_WEEK,
  getCurrentBackendDay,
} from '../utils/constants';
import { PromotionCard } from './PromotionCard';
import type {
  AllowedRadiusKm,
  DayOfWeek,
  PromotionWithSupermarketResponse,
} from '../types';

export function PromotionExplorer() {
  const { isAdmin } = useAuth();

  const [latitude, setLatitude] = useState<number>(CORDOBA_DEFAULT_COORDS.latitude);
  const [longitude, setLongitude] = useState<number>(CORDOBA_DEFAULT_COORDS.longitude);
  const [locationLabel, setLocationLabel] = useState<string>('Centro (Plaza San Martín)');
  const [radiusKm, setRadiusKm] = useState<AllowedRadiusKm>(1.5);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);

  const [promotions, setPromotions] = useState<PromotionWithSupermarketResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await promotionService.searchNearby({
        latitude,
        longitude,
        radius_km: radiusKm,
        day_of_week: selectedDay,
      });
      setPromotions(results);
    } catch {
      setError('No se pudieron cargar las promociones. Verifica que el backend esté activo en el puerto 8000.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radiusKm, selectedDay]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const handleUseBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(4)));
        setLongitude(Number(position.coords.longitude.toFixed(4)));
        setLocationLabel('Mi ubicación GPS actual');
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError('Permiso de ubicación denegado. Se mantiene la ubicación de referencia en Córdoba.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectPreset = (preset: (typeof CORDOBA_LOCATION_PRESETS)[number]) => {
    setLatitude(preset.latitude);
    setLongitude(preset.longitude);
    setLocationLabel(preset.name);
  };

  const handleDeactivatePromotion = async (promotionId: string) => {
    setDeactivatingId(promotionId);
    try {
      await promotionService.deactivate(promotionId);
      setPromotions((prev) => prev.filter((item) => item.id !== promotionId));
    } catch {
      setError('Error al intentar desactivar la promoción.');
    } finally {
      setDeactivatingId(null);
    }
  };

  const todayBackendDay = getCurrentBackendDay();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado y Panel de Filtros Geoespaciales */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Promociones de Supermercados Cercanos
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ubicación activa:{' '}
              <span className="font-semibold text-slate-800">{locationLabel}</span>{' '}
              <span className="text-xs text-slate-400">
                ({latitude}, {longitude})
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUseBrowserGeolocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <span>📍</span>
              {isLocating ? 'Obteniendo GPS...' : 'Usar mi GPS'}
            </button>

            <select
              aria-label="Cambiar zona de referencia en Córdoba"
              value={`${latitude},${longitude}`}
              onChange={(e) => {
                const preset = CORDOBA_LOCATION_PRESETS.find(
                  (p) => `${p.latitude},${p.longitude}` === e.target.value
                );
                if (preset) handleSelectPreset(preset);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value={`${latitude},${longitude}`} disabled>
                Simular zona en Córdoba...
              </option>
              {CORDOBA_LOCATION_PRESETS.map((preset) => (
                <option
                  key={preset.name}
                  value={`${preset.latitude},${preset.longitude}`}
                >
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controles: Radio en KM y Día de la Semana */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Selector de Radio (Haversine) */}
          <div className="lg:col-span-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Radio de búsqueda
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ALLOWED_RADII_KM.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    radiusKm === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Día (0=Lunes a 6=Domingo) */}
          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filtrar por día de la semana
              </label>
              <button
                type="button"
                onClick={() => setSelectedDay(todayBackendDay)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Seleccionar Hoy ({DAYS_OF_WEEK[todayBackendDay].label})
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  selectedDay === null
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos
              </button>

              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    selectedDay === day.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resultados */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 h-6 w-24 rounded bg-slate-200" />
              <div className="mb-2 h-4 w-40 rounded bg-slate-200" />
              <div className="mb-4 h-5 w-full rounded bg-slate-200" />
              <div className="h-16 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-800">
            No se encontraron promociones en un radio de {radiusKm} km
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Prueba ampliando el radio a 3 km o 5 km, o selecciona &ldquo;Todos&rdquo; los días.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              Mostrando <span className="font-bold text-slate-900">{promotions.length}</span>{' '}
              {promotions.length === 1 ? 'promoción activa' : 'promociones activas'} ordenadas por cercanía y descuento
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                isAdmin={isAdmin}
                onDeactivate={handleDeactivatePromotion}
                isDeactivating={deactivatingId === promo.id}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}