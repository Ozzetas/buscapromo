import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { promotionService, supermarketService } from '../api';
import { useAuth } from '../context/AuthContext';
import { DAYS_OF_WEEK } from '../utils/constants';
import type { DayOfWeek, PromotionResponse, SupermarketResponse } from '../types';

export function AdminBackoffice() {
  const { isAdmin } = useAuth();

  // Catálogo de sucursales
  const [supermarkets, setSupermarkets] = useState<SupermarketResponse[]>([]);
  const [isLoadingSupermarkets, setIsLoadingSupermarkets] = useState<boolean>(true);

  // Estado formulario Alta de Supermercado
  const [superName, setSuperName] = useState('');
  const [superAddress, setSuperAddress] = useState('');
  const [superCity, setSuperCity] = useState('Córdoba');
  const [superLat, setSuperLat] = useState('-31.4167');
  const [superLon, setSuperLon] = useState('-64.1833');
  const [isCreatingSuper, setIsCreatingSuper] = useState(false);

  // Estado formulario Alta de Promoción
  const [promoSupermarketId, setPromoSupermarketId] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('20');
  const [promoDays, setPromoDays] = useState<DayOfWeek[]>([0]);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  // Estado listado y baja lógica por sucursal
  const [filterSupermarketId, setFilterSupermarketId] = useState('');
  const [branchPromotions, setBranchPromotions] = useState<PromotionResponse[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // Mensajes de feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError<{ detail?: string | Array<{ msg: string }> }>(err)) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length > 0) return detail[0].msg;
    }
    return fallback;
  };

  const loadSupermarkets = useCallback(async () => {
    setIsLoadingSupermarkets(true);
    try {
      const data = await supermarketService.getAll();
      setSupermarkets(data);
      if (data.length > 0) {
        setPromoSupermarketId((prev) => prev || data[0].id);
        setFilterSupermarketId((prev) => prev || data[0].id);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractErrorMessage(err, 'No se pudo cargar el catálogo de supermercados.'),
      });
    } finally {
      setIsLoadingSupermarkets(false);
    }
  }, []);

  const loadBranchPromotions = useCallback(async (supermarketId: string) => {
    if (!supermarketId) return;
    setIsLoadingPromos(true);
    try {
      const data = await promotionService.getBySupermarket(supermarketId);
      setBranchPromotions(data);
    } catch {
      setBranchPromotions([]);
    } finally {
      setIsLoadingPromos(false);
    }
  }, []);

  useEffect(() => {
    void loadSupermarkets();
  }, [loadSupermarkets]);

  useEffect(() => {
    if (filterSupermarketId) {
      void loadBranchPromotions(filterSupermarketId);
    }
  }, [filterSupermarketId, loadBranchPromotions]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-xl font-bold text-red-800">Acceso Restringido (403 Forbidden)</h2>
          <p className="mt-2 text-sm text-red-700">
            Esta sección requiere privilegios de Administrador para gestionar sucursales y promociones.
          </p>
        </div>
      </div>
    );
  }

  const handleToggleDay = (day: DayOfWeek) => {
    setPromoDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleCreateSupermarket = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setIsCreatingSuper(true);

    try {
      const created = await supermarketService.create({
        name: superName.trim(),
        address: superAddress.trim(),
        city: superCity.trim() || 'Córdoba',
        latitude: parseFloat(superLat),
        longitude: parseFloat(superLon),
      });

      setSupermarkets((prev) => [...prev, created]);
      setPromoSupermarketId(created.id);
      setFilterSupermarketId(created.id);
      setSuperName('');
      setSuperAddress('');
      setFeedback({
        type: 'success',
        text: `Sucursal "${created.name}" registrada correctamente (ID: ${created.id}).`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractErrorMessage(err, 'Error al registrar el supermercado.'),
      });
    } finally {
      setIsCreatingSuper(false);
    }
  };

  const handleCreatePromotion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (promoDays.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Debes seleccionar al menos un día de vigencia para la promoción.',
      });
      return;
    }

    setIsCreatingPromo(true);
    try {
      const discountValue = promoDiscount.trim() !== '' ? parseFloat(promoDiscount) : null;

      const created = await promotionService.create({
        supermarket_id: promoSupermarketId,
        title: promoTitle.trim(),
        description: promoDescription.trim(),
        discount_percentage: discountValue,
        applicable_days: promoDays,
        is_active: true,
      });

      setPromoTitle('');
      setPromoDescription('');
      setFeedback({
        type: 'success',
        text: `Promoción "${created.title}" creada exitosamente.`,
      });

      if (filterSupermarketId === promoSupermarketId) {
        void loadBranchPromotions(filterSupermarketId);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractErrorMessage(err, 'Error al registrar la promoción.'),
      });
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const handleDeactivatePromotion = async (promotionId: string) => {
    setFeedback(null);
    setDeactivatingId(promotionId);
    try {
      const response = await promotionService.deactivate(promotionId);
      setBranchPromotions((prev) => prev.filter((p) => p.id !== promotionId));
      setFeedback({
        type: 'success',
        text: response.message,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractErrorMessage(err, 'No se pudo dar de baja la promoción.'),
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabecera Backoffice */}
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="inline-block rounded-md bg-amber-200/80 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-900">
              RBAC • Modo Administrador
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Panel Backoffice de Gestión (ABMC)
            </h1>
            <p className="text-sm text-slate-600">
              Alta de sucursales geolocalizadas, publicación de ofertas y bajas lógicas en MongoDB Atlas.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Sucursales activas:{' '}
            <span className="font-bold text-slate-900">{supermarkets.length}</span>
          </div>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-4 text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grilla de Formularios de Alta */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. Formulario Alta de Supermercado */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            1. Registrar Nueva Sucursal
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            Endpoint: <code className="rounded bg-slate-100 px-1.5 py-0.5">POST /api/v1/supermarkets/</code>
          </p>

          <form onSubmit={handleCreateSupermarket} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Nombre de la Cadena / Sucursal
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={superName}
                onChange={(e) => setSuperName(e.target.value)}
                placeholder="Ej. Hipermercado Libertad Poeta Lugones"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  Dirección Física
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={200}
                  value={superAddress}
                  onChange={(e) => setSuperAddress(e.target.value)}
                  placeholder="Ej. Fray Luis Beltrán y Manuel Cardeñosa"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  Ciudad
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={superCity}
                  onChange={(e) => setSuperCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  Latitud (-90 a 90)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min={-90}
                  max={90}
                  value={superLat}
                  onChange={(e) => setSuperLat(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  Longitud (-180 a 180)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min={-180}
                  max={180}
                  value={superLon}
                  onChange={(e) => setSuperLon(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingSuper}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isCreatingSuper ? 'Guardando sucursal...' : 'Crear Sucursal'}
            </button>
          </form>
        </div>

        {/* 2. Formulario Alta de Promoción */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            2. Publicar Nueva Promoción
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            Endpoint: <code className="rounded bg-slate-100 px-1.5 py-0.5">POST /api/v1/promotions/</code>
          </p>

          <form onSubmit={handleCreatePromotion} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  Sucursal Asociada
                </label>
                <select
                  required
                  disabled={isLoadingSupermarkets || supermarkets.length === 0}
                  value={promoSupermarketId}
                  onChange={(e) => setPromoSupermarketId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  {supermarkets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  % Descuento
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step="any"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  placeholder="Ej. 25"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Título de la Oferta
              </label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={150}
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                placeholder="Ej. 25% de ahorro con Tarjeta Cordobesa"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Descripción y Condiciones (Tope de reintegro)
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={2}
                value={promoDescription}
                onChange={(e) => setPromoDescription(e.target.value)}
                placeholder="Ej. Abonando con QR MODO. Tope de reintegro $10.000 por cuenta."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-600">
                Días de Vigencia (0=Lunes a 6=Domingo)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = promoDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleToggleDay(day.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingPromo || supermarkets.length === 0}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreatingPromo ? 'Publicando promoción...' : 'Publicar Promoción'}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Listado y Baja Lógica por Sucursal */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              3. Administrar Promociones Vigentes por Sucursal
            </h2>
            <p className="text-xs text-slate-500">
              Baja lógica mediante{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                PATCH /api/v1/promotions/&#123;id&#125;/deactivate
              </code>
            </p>
          </div>

          <select
            aria-label="Seleccionar sucursal para ver sus promociones"
            value={filterSupermarketId}
            onChange={(e) => setFilterSupermarketId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            {supermarkets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {isLoadingPromos ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Consultando promociones de la sucursal...
          </p>
        ) : branchPromotions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Esta sucursal no tiene promociones activas registradas en este momento.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {branchPromotions.map((promo) => (
              <div
                key={promo.id}
                className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {promo.discount_percentage && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                        {promo.discount_percentage}% OFF
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900">{promo.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{promo.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {promo.applicable_days.map((d) => (
                      <span
                        key={d}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {DAYS_OF_WEEK[d]?.short ?? d}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={deactivatingId === promo.id}
                  onClick={() => void handleDeactivatePromotion(promo.id)}
                  className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {deactivatingId === promo.id ? 'Procesando...' : 'Dar de Baja Lógica'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}