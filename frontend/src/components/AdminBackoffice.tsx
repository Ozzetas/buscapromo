import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Flame,
  Layers,
  MapPin,
  Percent,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { promotionService, supermarketService } from '../api';
import { useAuth } from '../context/AuthContext';
import { CORDOBA_LOCATION_PRESETS, DAYS_OF_WEEK } from '../utils/constants';
import { extractApiError } from '../utils/errorHandler';
import {
  extractPaymentBadges,
  getSupermarketBrand,
  SupermarketLogo,
} from '../utils/supermarketBranding';
import type { DayOfWeek, PromotionResponse, SupermarketResponse } from '../types';

export function AdminBackoffice() {
  const { isAdmin } = useAuth();

  // Catálogo de sucursales
  const [supermarkets, setSupermarkets] = useState<SupermarketResponse[]>([]);
  const [isLoadingSupermarkets, setIsLoadingSupermarkets] = useState<boolean>(true);

  // Estado formulario 1: Alta de Supermercado
  const [superName, setSuperName] = useState<string>('');
  const [superAddress, setSuperAddress] = useState<string>('');
  const [superCity, setSuperCity] = useState<string>('Córdoba');
  const [superLat, setSuperLat] = useState<string>('-31.4167');
  const [superLon, setSuperLon] = useState<string>('-64.1833');
  const [isCreatingSuper, setIsCreatingSuper] = useState<boolean>(false);

  // Estado formulario 2: Alta de Promoción
  const [promoSupermarketId, setPromoSupermarketId] = useState<string>('');
  const [promoTitle, setPromoTitle] = useState<string>('');
  const [promoDescription, setPromoDescription] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<string>('20');
  const [promoDays, setPromoDays] = useState<DayOfWeek[]>([0]);
  const [isCreatingPromo, setIsCreatingPromo] = useState<boolean>(false);

  // Estado sección 3: Listado y baja lógica por sucursal
  const [filterSupermarketId, setFilterSupermarketId] = useState<string>('');
  const [branchPromotions, setBranchPromotions] = useState<PromotionResponse[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState<boolean>(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // Mensajes de feedback estructurados
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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
        text: extractApiError(
          err,
          'AdminBackoffice.loadSupermarkets',
          'No se pudo cargar el catálogo de supermercados.'
        ),
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
    } catch (err: unknown) {
      // Reemplazo el bloque catch vacío por manejo explícito con logging estructurado
      setBranchPromotions([]);
      setFeedback({
        type: 'error',
        text: extractApiError(
          err,
          `AdminBackoffice.loadBranchPromotions(${supermarketId})`,
          'No se pudieron recuperar las promociones de la sucursal seleccionada.'
        ),
      });
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

  // Obtengo la sucursal actualmente seleccionada en el administrador inferior para mostrar su identidad visual
  const selectedFilterSupermarket = useMemo(
    () => supermarkets.find((s) => s.id === filterSupermarketId) ?? null,
    [supermarkets, filterSupermarketId]
  );

  // Detecto en vivo los chips bancarios mientras el administrador redacta una nueva promoción
  const livePreviewBadges = useMemo(
    () => extractPaymentBadges(promoTitle, promoDescription),
    [promoTitle, promoDescription]
  );

  const livePreviewBrand = useMemo(
    () => getSupermarketBrand(superName || 'Carrefour'),
    [superName]
  );

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-red-900">
            Acceso Restringido (403 Forbidden)
          </h2>
          <p className="mt-2 text-sm text-red-700">
            Esta sección requiere privilegios de Administrador para gestionar sucursales y
            promociones.
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

  const handleApplyCoordinatePreset = (preset: (typeof CORDOBA_LOCATION_PRESETS)[number]) => {
    setSuperLat(String(preset.latitude));
    setSuperLon(String(preset.longitude));
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
        text: `Sucursal "${created.name}" registrada exitosamente en MongoDB Atlas.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractApiError(
          err,
          'AdminBackoffice.handleCreateSupermarket',
          'Error al registrar el supermercado.'
        ),
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
        text: `Promoción "${created.title}" publicada exitosamente.`,
      });

      if (filterSupermarketId === promoSupermarketId) {
        void loadBranchPromotions(filterSupermarketId);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: extractApiError(
          err,
          'AdminBackoffice.handleCreatePromotion',
          'Error al registrar la promoción.'
        ),
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
        text: extractApiError(
          err,
          `AdminBackoffice.handleDeactivatePromotion(${promotionId})`,
          'No se pudo dar de baja la promoción.'
        ),
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabecera Hero del Backoffice (Estética Bento 2026) */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>RBAC • Modo Administrador Verificado</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Panel Backoffice de Gestión (ABMC)
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Alta de sucursales geolocalizadas, publicación de ofertas bancarias y bajas
                lógicas en MongoDB Atlas.
              </p>
            </div>

            {/* Tarjetas de Métricas Administrativas */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Store className="h-3.5 w-3.5" />
                  <span>Sucursales</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-white">{supermarkets.length}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Ofertas en Sucursal</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-white">
                  {branchPromotions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Feedback Estructurado */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm font-bold shadow-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grilla de Formularios de Alta (Sucursales y Promociones) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. Formulario Alta de Supermercado */}
        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700" />
          <div className="p-6 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                  Módulo Geoespacial • Paso 1
                </span>
                <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">
                  1. Registrar Nueva Sucursal
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Endpoint:{' '}
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">
                    POST /api/v1/supermarkets/
                  </code>
                </p>
              </div>

              {/* Previsualización en vivo del emblema corporativo */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2">
                <SupermarketLogo name={superName || 'Carrefour'} sizeClass="h-10 w-10" />
                <div className="hidden sm:block">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Identidad
                  </span>
                  <span className={`text-xs font-extrabold ${livePreviewBrand.accentText}`}>
                    {livePreviewBrand.chainLabel}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateSupermarket} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  Nombre de la Cadena / Sucursal
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={superName}
                  onChange={(e) => setSuperName(e.target.value)}
                  placeholder="Ej. Carrefour Express Nueva Córdoba / Disco..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={200}
                    value={superAddress}
                    onChange={(e) => setSuperAddress(e.target.value)}
                    placeholder="Ej. Av. Hipólito Yrigoyen 320"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={superCity}
                    onChange={(e) => setSuperCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              {/* Asistente rápido de coordenadas de barrios de Córdoba */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    <Compass className="h-3.5 w-3.5 text-blue-600" />
                    Coordenadas Geodésicas
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Plantillas rápidas:
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {CORDOBA_LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyCoordinatePreset(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {preset.name.split(' (')[0]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
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
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm font-mono font-semibold focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
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
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm font-mono font-semibold focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingSuper}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-extrabold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreatingSuper ? 'Guardando sucursal...' : 'Crear Sucursal'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* 2. Formulario Alta de Promoción */}
        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />
          <div className="p-6 sm:p-7">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                Motor Comercial • Paso 2
              </span>
              <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">
                2. Publicar Nueva Promoción
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Endpoint:{' '}
                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">
                  POST /api/v1/promotions/
                </code>
              </p>
            </div>

            <form onSubmit={handleCreatePromotion} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    <Store className="h-3.5 w-3.5 text-blue-600" />
                    Sucursal Asociada
                  </label>
                  <select
                    required
                    disabled={isLoadingSupermarkets || supermarkets.length === 0}
                    value={promoSupermarketId}
                    onChange={(e) => setPromoSupermarketId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    {supermarkets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    <Percent className="h-3.5 w-3.5 text-blue-600" />
                    Descuento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step="any"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    placeholder="Ej. 25"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  <Tag className="h-3.5 w-3.5 text-blue-600" />
                  Título de la Oferta
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={150}
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="Ej. 25% de ahorro con Tarjeta Cordobesa (Bancor)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                />
                {livePreviewBadges.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">
                      Etiquetas detectadas:
                    </span>
                    {livePreviewBadges.map((badge) => (
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

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
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
                        className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreatingPromo ? 'Publicando promoción...' : 'Publicar Promoción'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Listado y Baja Lógica por Sucursal */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                Auditoría de Catálogo • Paso 3
              </span>
              <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">
                3. Administrar Promociones Vigentes por Sucursal
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Baja lógica mediante{' '}
                <code className="rounded-md bg-slate-200/70 px-1.5 py-0.5 font-mono font-semibold text-slate-700">
                  PATCH /api/v1/promotions/&#123;id&#125;/deactivate
                </code>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {selectedFilterSupermarket && (
                <SupermarketLogo
                  name={selectedFilterSupermarket.name}
                  sizeClass="h-11 w-11"
                />
              )}
              <select
                aria-label="Seleccionar sucursal para ver sus promociones"
                value={filterSupermarketId}
                onChange={(e) => setFilterSupermarketId(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none"
              >
                {supermarkets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 sm:px-8">
          {isLoadingPromos ? (
            <div className="space-y-3 py-4">
              {[1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : branchPromotions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <p className="text-sm font-extrabold text-slate-700">
                Esta sucursal no tiene promociones activas registradas en este momento.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Utiliza el formulario &ldquo;2. Publicar Nueva Promoción&rdquo; para cargar
                beneficios en esta sucursal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {branchPromotions.map((promo) => {
                const discount = promo.discount_percentage ?? 0;
                const isHot = discount >= 30;
                const badges = extractPaymentBadges(promo.title, promo.description);

                return (
                  <div
                    key={promo.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {promo.discount_percentage !== null &&
                        promo.discount_percentage !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold text-white ${
                              isHot
                                ? 'bg-gradient-to-r from-orange-500 to-red-600'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                          >
                            {isHot ? (
                              <Flame className="h-3.5 w-3.5 fill-amber-200 text-amber-100" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                            )}
                            {promo.discount_percentage}% OFF
                          </span>
                        ) : (
                          <span className="rounded-xl bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                            Beneficio Activo
                          </span>
                        )}

                        <h3 className="text-base font-extrabold text-slate-900">
                          {promo.title}
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600">{promo.description}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {DAYS_OF_WEEK.map((day) => {
                          const active = promo.applicable_days.includes(day.value);
                          return (
                            <span
                              key={day.value}
                              className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                                active
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-slate-50 text-slate-300 border border-slate-100'
                              }`}
                            >
                              {day.short}
                            </span>
                          );
                        })}

                        {badges.map((badge) => (
                          <span
                            key={badge.label}
                            className={`ml-1 inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deactivatingId === promo.id}
                      onClick={() => void handleDeactivatePromotion(promo.id)}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {deactivatingId === promo.id ? 'Procesando...' : 'Dar de Baja Lógica'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}