import { Compass, LogIn, LogOut, MapPin, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveView = 'explorer' | 'backoffice';

interface NavbarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenAuthModal: () => void;
}

export function Navbar({ activeView, onSelectView, onOpenAuthModal }: NavbarProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Marca e Identidad Visual */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectView('explorer')}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-extrabold text-white shadow-md shadow-blue-600/20 transition-transform group-hover:scale-105">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Busca<span className="text-blue-600">promo</span>
                </span>
                <span className="hidden rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 md:inline-block">
                  CBA
                </span>
              </div>
              <span className="hidden items-center gap-1 text-xs font-medium text-slate-500 sm:flex">
                <MapPin className="h-3 w-3 text-blue-600" />
                Córdoba Capital
              </span>
            </div>
          </button>

          {/* Navegación Principal */}
          <nav className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectView('explorer')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                activeView === 'explorer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Explorar Ofertas</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onSelectView('backoffice')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeView === 'backoffice'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Panel Backoffice</span>
              </button>
            )}
          </nav>
        </div>

        {/* Estado de Autenticación */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  {user.full_name}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {user.role === 'admin' ? 'Administrador' : 'Consumidor'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (activeView === 'backoffice') {
                    onSelectView('explorer');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}