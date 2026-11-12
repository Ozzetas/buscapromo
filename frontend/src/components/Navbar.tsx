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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Marca e Identidad */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectView('explorer')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white shadow-sm">
              B
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Busca<span className="text-blue-600">promo</span>
              </span>
              <span className="hidden text-xs text-slate-500 sm:block">
                Córdoba Capital
              </span>
            </div>
          </button>

          {/* Navegación principal */}
          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectView('explorer')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === 'explorer'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Explorar Ofertas
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onSelectView('backoffice')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeView === 'backoffice'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Panel Backoffice
              </button>
            )}
          </nav>
        </div>

        {/* Estado de Autenticación */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">
                  {user.full_name}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}