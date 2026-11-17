import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../utils/errorHandler';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setShowPassword(false);
    setError(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  const fillSeedCredentials = (role: 'admin' | 'user') => {
    setMode('login');
    setError(null);
    if (role === 'admin') {
      setEmail('admin@buscapromo.com');
      setPassword('AdminPassword2026!');
    } else {
      setEmail('cliente@buscapromo.com');
      setPassword('ClientePassword2026!');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({
          email,
          full_name: fullName.trim(),
          password,
        });
      }
      resetForm();
      onClose();
    } catch (err: unknown) {
      // Utilizo el manejador centralizado para registrar el fallo y mostrar un mensaje claro al usuario
      setError(
        extractApiError(
          err,
          mode === 'login' ? 'AuthModal.login' : 'AuthModal.register',
          'No se pudo completar la autenticación.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl">
        {/* Cabecera Oscura con Gradiente Corporativo */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Seguridad JWT • Bcrypt</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta en Buscapromo'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                {mode === 'login'
                  ? 'Accede a tu perfil o al panel de administración RBAC'
                  : 'Regístrate gratis para personalizar tu experiencia en Córdoba'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selector de Pestaña (Segmented Control) */}
        <div className="mx-6 mt-5 grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`rounded-xl py-2 text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`rounded-xl py-2 text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Nombre y Apellido
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Milagros Airalde"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@buscapromo.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={64}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-10 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
          >
            <KeyRound className="h-4 w-4" />
            <span>
              {isSubmitting
                ? 'Verificando credenciales...'
                : mode === 'login'
                  ? 'Iniciar Sesión'
                  : 'Registrarme Ahora'}
            </span>
          </button>

          {/* Accesos rápidos para pruebas de cátedra (seed.py) */}
          {mode === 'login' && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Credenciales Rápidas de Prueba (Seeder)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fillSeedCredentials('admin')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-extrabold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  <span>Cargar Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillSeedCredentials('user')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-100 transition-colors"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Cargar Consumidor</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}