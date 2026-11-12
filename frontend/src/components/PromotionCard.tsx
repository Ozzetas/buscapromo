import { DAYS_OF_WEEK } from '../utils/constants';
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

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div>
        {/* Cabecera: Descuento y Distancia */}
        <div className="mb-3 flex items-center justify-between gap-2">
          {promotion.discount_percentage !== null && promotion.discount_percentage !== undefined ? (
            <span className="inline-flex items-center rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white">
              {promotion.discount_percentage}% OFF
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
              Promoción Vigente
            </span>
          )}

          {supermarket.distance_km !== null && supermarket.distance_km !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              📍 a {supermarket.distance_km.toFixed(2)} km
            </span>
          )}
        </div>

        {/* Sucursal */}
        <div className="mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {supermarket.name}
          </h3>
          <p className="text-xs text-slate-500">
            {supermarket.address} • {supermarket.city}
          </p>
        </div>

        {/* Título y Descripción de la Oferta */}
        <h4 className="mb-1.5 text-base font-bold text-slate-900 leading-snug">
          {promotion.title}
        </h4>
        <p className="mb-4 text-sm text-slate-600 leading-relaxed">
          {promotion.description}
        </p>
      </div>

      {/* Pie de tarjeta: Días aplicables y Acción Admin */}
      <div className="border-t border-slate-100 pt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Días de vigencia
        </p>
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.map((day) => {
            const isApplicable = promotion.applicable_days.includes(day.value);
            return (
              <span
                key={day.value}
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isApplicable
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-50 text-slate-300'
                }`}
              >
                {day.short}
              </span>
            );
          })}
        </div>

        {isAdmin && onDeactivate && (
          <div className="mt-3 border-t border-slate-100 pt-2.5 flex justify-end">
            <button
              type="button"
              disabled={isDeactivating}
              onClick={() => void onDeactivate(promotion.id)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isDeactivating ? 'Desactivando...' : 'Dar de baja lógica'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}