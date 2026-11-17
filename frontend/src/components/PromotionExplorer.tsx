import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CalendarCheck,
  Compass,
  MapPin,
  Navigation,
  Percent,
  Radar,
  Store,
} from 'lucide-react';
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

/**
 * Clasifico explícitamente las excepciones de red y API para evitar bloques catch genéricos
 * y registrar telemetría estructurada en la consola del cliente.
 */
function resolveApiErrorMessage(err: unknown, contextAction: string): string {
  if (axios.isAxiosError<{ detail?: string }>(err)) {
    const status = err.response?.status;
    const serverDetail = err.response?.data?.detail;

    console.error(`[Buscapromo API Error] Acción: ${contextAction}`, {
      status,
      code: err.code,
      detail: serverDetail,
    });

    if (err.code === 'ECONNABORTED') {
      return 'La consulta superó el tiempo límite de espera (Timeout 10s). Verifica tu conexión.';
    }
    if (!err.response) {
      return 'No se pudo conectar con el servidor Backend (puerto 8000). Verifica que Uvicorn esté activo.';
    }
    if (typeof serverDetail === 'string') {
      return serverDetail;
    }
    return `El servidor rechazó la solicitud con código HTTP ${status}.`;
  }

  console.error(`[Buscapromo Unexpected Error] Acción: ${contextAction}`, err);
  return 'Ocurrió un error inesperado al procesar los datos en el navegador.';
}

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
    } catch (err: unknown) {
      setError(resolveApiErrorMessage(err, 'searchNearby'));
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radiusKm, selectedDay]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const handleUseBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador web no soporta la API de Geolocalización HTML5.');
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
      (geoError: GeolocationPositionError) => {
        console.warn('[Buscapromo Geolocation Warning]', {
          code: geoError.code,
          message: geoError.message,
        });
        setIsLocating(false);
        setError(
          'Permiso de GPS denegado o tiempo agotado. Se mantiene la ubicación de referencia en Córdoba.'
        );
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
    } catch (err: unknown) {
      setError(resolveApiErrorMessage(err, `deactivate(${promotionId})`));
    } finally {
      setDeactivatingId(null);
    }
  };

  const todayBackendDay = getCurrentBackendDay();

  // Calculo métricas dinámicas (KPIs) sobre los resultados filtrados para enriquecer la toma de decisiones
  const summaryStats = useMemo(() => {
    if (promotions.length === 0) {
      return { maxDiscount: 0, nearestKm: null as number | null, uniqueBranches: 0 };
    }

    const maxDiscount = promotions.reduce(
      (max, p) => Math.max(max, p.discount_percentage ?? 0),
      0
    );

    const distances = promotions
      .map((p) => p.supermarket.distance_km)
      .filter((d): d is number => d !== null && d !== undefined);

    const nearestKm = distances.length > 0 ? Math.min(...distances) : null;
    const uniqueBranches = new Set(promotions.map((p) => p.supermarket_id)).size;

    return { maxDiscount, nearestKm, uniqueBranches };
  }, [promotions]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner y Panel de Control Geoespacial (Estética Bento 2026) */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Cabecera Oscura con Gradiente Publicitario */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-bold text-blue-200">
                <Radar className="h-3.5 w-3.5 text-blue-300 animate-spin" />
                <span>Motor Geoespacial Haversine Activo</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Promociones de Supermercados Cercanos
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span>Punto de referencia:</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-0.5 font-bold text-white">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  {locationLabel}
                </span>
                <span
                  className="text-xs text-slate-400"
                  title="Coordenadas geodésicas utilizadas en la consulta"
                >
                  ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                </span>
              </p>
            </div>

            {/* Controles de Ubicación */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleUseBrowserGeolocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition-all"
              >
                <Navigation className="h-4 w-4" />
                {isLocating ? 'Localizando GPS...' : 'Usar mi GPS'}
              </button>

              <div className="relative">
                <select
                  aria-label="Cambiar zona de referencia en Córdoba"
                  value={`${latitude},${longitude}`}
                  onChange={(e) => {
                    const preset = CORDOBA_LOCATION_PRESETS.find(
                      (p) => `${p.latitude},${p.longitude}` === e.target.value
                    );
                    if (preset) handleSelectPreset(preset);
                  }}
                  className="rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-xs focus:border-blue-400 focus:outline-none"
                >
                  <option value={`${latitude},${longitude}`} disabled className="text-slate-900">
                    Simular barrio en Córdoba...
                  </option>
                  {CORDOBA_LOCATION_PRESETS.map((preset) => (
                    <option
                      key={preset.name}
                      value={`${preset.latitude},${preset.longitude}`}
                      className="text-slate-900"
                    >
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros Táctiles: Radio en KM y Día de la Semana */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:px-8 lg:grid-cols-12">
          {/* Selector de Radio */}
          <div className="lg:col-span-4">
            <label className="mb-2.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              Radio de búsqueda
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ALLOWED_RADII_KM.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                    radiusKm === r
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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
            <div className="mb-2.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
                Filtrar por día de la semana
              </label>
              <button
                type="button"
                onClick={() => setSelectedDay(todayBackendDay)}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Seleccionar Hoy ({DAYS_OF_WEEK[todayBackendDay].label})
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all ${
                  selectedDay === null
                    ? 'bg-slate-900 text-white shadow-sm'
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
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    selectedDay === day.value
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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

      {/* Alerta de Error Estructurada */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Grilla de Resultados y Barra de KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="mb-4 h-6 w-24 rounded-lg bg-slate-200" />
              <div className="mb-4 h-14 w-full rounded-2xl bg-slate-100" />
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-16 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-extrabold text-slate-800">
            No se encontraron promociones en un radio de {radiusKm} km
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Prueba ampliando el radio de búsqueda a 3 km o 5 km, o selecciona &ldquo;Todos&rdquo;
            los días.
          </p>
        </div>
      ) : (
        <>
          {/* Barra de Métricas Rápidas (KPIs de Ahorro y Cercanía) */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ofertas Encontradas
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {promotions.length} en {summaryStats.uniqueBranches}{' '}
                  {summaryStats.uniqueBranches === 1 ? 'sucursal' : 'sucursales'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ahorro Máximo en Zona
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  Hasta {summaryStats.maxDiscount}% OFF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sucursal Más Cercana
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {summaryStats.nearestKm !== null
                    ? `A solo ${summaryStats.nearestKm.toFixed(2)} km`
                    : 'En tu zona'}
                </p>
              </div>
            </div>
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