import { useState, type ReactNode } from 'react';

export interface BrandTheme {
  id: 'carrefour' | 'cordiez' | 'disco' | 'supermami' | 'default';
  chainLabel: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  headerGradient: string;
  localLogoPath?: string;
  renderVectorLogo: () => ReactNode;
}

export interface PaymentBadge {
  label: string;
  className: string;
}

/**
 * Aplico el Patrón Factory para resolver la identidad visual y el logotipo
 * de cada cadena de supermercados a partir de su nombre de sucursal.
 */
export function getSupermarketBrand(supermarketName: string): BrandTheme {
  const normalized = supermarketName.toLowerCase();

  if (normalized.includes('carrefour')) {
    return {
      id: 'carrefour',
      chainLabel: 'Grupo Carrefour',
      accentText: 'text-blue-700',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      headerGradient: 'from-blue-600 via-blue-700 to-red-600',
      localLogoPath: '/logos/carrefour.png',
      renderVectorLogo: () => (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Logo Carrefour">
          <rect width="64" height="64" rx="14" fill="#ffffff" />
          {/* Rombo tricolor corporativo de Carrefour */}
          <path d="M32 10 L12 32 L32 54 L26 32 Z" fill="#E30613" />
          <path d="M32 10 L52 32 L32 54 L38 32 Z" fill="#004E9E" />
          <circle cx="32" cy="32" r="9.5" fill="#ffffff" />
          <path
            d="M35.5 27.5 C33.5 25.5 28.5 26.5 28.5 32 C28.5 37.5 33.5 38.5 35.5 36.5"
            stroke="#004E9E"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ),
    };
  }

  if (normalized.includes('cordiez')) {
    return {
      id: 'cordiez',
      chainLabel: 'Supermercados Cordiez',
      accentText: 'text-orange-700',
      accentBg: 'bg-orange-50',
      accentBorder: 'border-orange-200',
      headerGradient: 'from-orange-500 via-red-500 to-amber-500',
      localLogoPath: '/logos/cordiez.png',
      renderVectorLogo: () => (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Logo Cordiez">
          <rect width="64" height="64" rx="14" fill="#EA580C" />
          <circle cx="32" cy="32" r="21" fill="#ffffff" fillOpacity="0.16" />
          <text
            x="32"
            y="29"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            COR
          </text>
          <text
            x="32"
            y="45"
            textAnchor="middle"
            fill="#FEF08A"
            fontSize="16"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            10
          </text>
        </svg>
      ),
    };
  }

  if (normalized.includes('disco')) {
    return {
      id: 'disco',
      chainLabel: 'Cencosud • Disco',
      accentText: 'text-red-700',
      accentBg: 'bg-red-50',
      accentBorder: 'border-red-200',
      headerGradient: 'from-red-600 via-rose-600 to-red-700',
      localLogoPath: '/logos/disco.png',
      renderVectorLogo: () => (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Logo Disco">
          <rect width="64" height="64" rx="14" fill="#DC2626" />
          <circle cx="32" cy="32" r="22" stroke="#ffffff" strokeWidth="3.5" fill="none" />
          <text
            x="32"
            y="37"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13.5"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="-0.5"
          >
            DISCO
          </text>
        </svg>
      ),
    };
  }

  if (normalized.includes('mami') || normalized.includes('dino')) {
    return {
      id: 'supermami',
      chainLabel: 'Grupo Dinosaurio',
      accentText: 'text-purple-700',
      accentBg: 'bg-purple-50',
      accentBorder: 'border-purple-200',
      headerGradient: 'from-purple-700 via-fuchsia-600 to-amber-500',
      localLogoPath: '/logos/supermami.png',
      renderVectorLogo: () => (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Logo Super Mami Dino">
          <rect width="64" height="64" rx="14" fill="#6B21A8" />
          <rect x="8" y="14" width="48" height="36" rx="8" fill="#FACC15" />
          <text
            x="32"
            y="30"
            textAnchor="middle"
            fill="#6B21A8"
            fontSize="10.5"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            SUPER
          </text>
          <text
            x="32"
            y="43"
            textAnchor="middle"
            fill="#B91C1C"
            fontSize="12.5"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            MAMI
          </text>
        </svg>
      ),
    };
  }

  return {
    id: 'default',
    chainLabel: 'Retail Córdoba',
    accentText: 'text-slate-700',
    accentBg: 'bg-slate-100',
    accentBorder: 'border-slate-200',
    headerGradient: 'from-slate-700 to-slate-900',
    renderVectorLogo: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-label="Supermercado">
        <rect width="64" height="64" rx="14" fill="#1E293B" />
        <text
          x="32"
          y="39"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="22"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          {supermarketName.charAt(0).toUpperCase()}
        </text>
      </svg>
    ),
  };
}

interface SupermarketLogoProps {
  name: string;
  sizeClass?: string;
}

/**
 * Componente resiliente de logotipo: intenta cargar el asset local si el equipo lo deposita
 * en public/logos/, y ante cualquier error de carga renderiza instantáneamente el vector SVG oficial.
 */
export function SupermarketLogo({ name, sizeClass = 'h-12 w-12' }: SupermarketLogoProps) {
  const brand = getSupermarketBrand(name);
  const [useFallbackSvg, setUseFallbackSvg] = useState<boolean>(true);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm ${sizeClass}`}
      title={brand.chainLabel}
    >
      {!useFallbackSvg && brand.localLogoPath ? (
        <img
          src={brand.localLogoPath}
          alt={`Logo de ${name}`}
          className="h-full w-full object-contain"
          onError={() => setUseFallbackSvg(true)}
        />
      ) : (
        brand.renderVectorLogo()
      )}
    </div>
  );
}

/**
 * Analizo el título y la descripción de la promoción para extraer chips publicitarios
 * de bancos, tarjetas y billeteras virtuales frecuentes en Córdoba.
 */
export function extractPaymentBadges(title: string, description: string): PaymentBadge[] {
  const fullText = `${title} ${description}`.toLowerCase();
  const badges: PaymentBadge[] = [];

  if (fullText.includes('modo')) {
    badges.push({
      label: 'MODO',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    });
  }
  if (fullText.includes('cordobesa') || fullText.includes('bancor')) {
    badges.push({
      label: 'Bancor • Cordobesa',
      className: 'bg-sky-100 text-sky-800 border-sky-300',
    });
  }
  if (fullText.includes('macro')) {
    badges.push({
      label: 'Banco Macro',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    });
  }
  if (fullText.includes('santander')) {
    badges.push({
      label: 'Santander',
      className: 'bg-red-100 text-red-800 border-red-300',
    });
  }
  if (fullText.includes('cencosud')) {
    badges.push({
      label: 'Tarjeta Cencosud',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    });
  }
  if (fullText.includes('cuenta dni') || fullText.includes('bna')) {
    badges.push({
      label: 'BNA+ / Cuenta DNI',
      className: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    });
  }
  if (fullText.includes('mi carrefour')) {
    badges.push({
      label: 'Mi Carrefour',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    });
  }
  if (fullText.includes('efectivo')) {
    badges.push({
      label: 'Efectivo',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
    });
  }

  return badges;
}