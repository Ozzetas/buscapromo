import { Calendar, ExternalLink, Flame, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { DAYS_OF_WEEK, getCurrentBackendDay } from '../utils/constants';
import {
  extractPaymentBadges,
  getSupermarketBrand,
  SupermarketLogo,
} from '../utils/supermarketBranding';
import type { PromotionWithSupermarketResponse } from '../types';

interface PromotionCardProps {
  promotion: PromotionWithSupermarketResponse;
  isAdmin?: boolean;
  onDeactivate?: (promotionId: string) => Promise<void>;
  isDeactivating?: boolean;
}

export function PromotionCard({
  promotion,
  isAdmin = false,
  onDeactivate,
  isDeactivating = false,
}: PromotionCardProps) {
  const { supermarket } = promotion;
  const brand = getSupermarketBrand(supermarket.name);
  const paymentBadges = extractPaymentBadges(promotion.title, promotion.description);

  // Verifico en tiempo real si la promoción aplica en el día de hoy
  const todayDay = getCurrentBackendDay();
  const isAvailableToday = promotion.applicable_days.includes(todayDay);

  // Clasifico el impacto visual del descuento según umbrales publicitarios
  const discount = promotion.discount_percentage ?? 0;
  const isHotDeal = discount >= 30;
  const isHighDeal = discount >= 25 && discount < 30;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${supermarket.latitude},${supermarket.longitude}`;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isAvailableToday
          ? 'border-blue-200/90 shadow-md shadow-blue-950/5'
          : 'border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Barra superior con el color corporativo de la cadena de supermercados */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${brand.headerGradient}`} />

      <div className="p-5 sm:p-6">
        {/* Cabecera Publicitaria: Badge de Descuento + Distancia Geoespacial */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {promotion.discount_percentage !== null &&
            promotion.discount_percentage !== undefined ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-extrabold tracking-tight text-white shadow-sm ${
                  isHotDeal
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/20'
                    : isHighDeal
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/20'
                      : 'bg-slate-900'
                }`}
              >
                {isHotDeal ? (
                  <Flame className="h-3.5 w-3.5 fill-amber-200 text-amber-100" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                )}
                {promotion.discount_percentage}% OFF
              </span>
            ) : (
              <span className="inline-flex items-center rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                Beneficio Activo
              </span>
            )}

            {isAvailableToday && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Hoy
              </span>
            )}
          </div>

          {supermarket.distance_km !== null && supermarket.distance_km !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />a{' '}
              {supermarket.distance_km.toFixed(2)} km
            </span>
          )}
        </div>

        {/* Bloque de Identidad del Supermercado con Logotipo */}
        <div className="mb-4 flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <SupermarketLogo name={supermarket.name} sizeClass="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <span
              className={`block text-[10px] font-extrabold uppercase tracking-wider ${brand.accentText}`}
            >
              {brand.chainLabel}
            </span>
            <h3 className="truncate text-sm font-extrabold text-slate-900">
              {supermarket.name}
            </h3>
            <p className="truncate text-xs text-slate-500">{supermarket.address}</p>
          </div>
        </div>

        {/* Título y Condiciones de la Promoción */}
        <h4 className="mb-2 text-base font-extrabold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
          {promotion.title}
        </h4>
        <p className="mb-4 text-sm text-slate-600 leading-relaxed">
          {promotion.description}
        </p>

        {/* Chips de Medios de Pago Detectados */}
        {paymentBadges.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {paymentBadges.map((badge) => (
              <span
                key={badge.label}
                className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Días de Vigencia y Acciones */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Calendar className="h-3 w-3" />
            Días de vigencia
          </span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            <span>Cómo llegar</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.map((day) => {
            const isApplicable = promotion.applicable_days.includes(day.value);
            const isTodayPill = day.value === todayDay;

            return (
              <span
                key={day.value}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                  isApplicable && isTodayPill
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200'
                    : isApplicable
                      ? 'bg-blue-100/90 text-blue-900 border border-blue-200'
                      : 'bg-white text-slate-300 border border-slate-100'
                }`}
              >
                {day.short}
              </span>
            );
          })}
        </div>

        {isAdmin && onDeactivate && (
          <div className="mt-3.5 border-t border-slate-200/70 pt-3 flex justify-end">
            <button
              type="button"
              disabled={isDeactivating}
              onClick={() => void onDeactivate(promotion.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeactivating ? 'Desactivando...' : 'Dar de baja lógica'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}