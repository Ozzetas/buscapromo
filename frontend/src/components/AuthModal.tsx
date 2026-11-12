import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
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
      if (axios.isAxiosError<{ detail?: string | Array<{ msg: string }> }>(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg);
        } else {
          setError('No se pudo completar la autenticación. Verifica tu conexión.');
        }
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta en Buscapromo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Selector de pestaña */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50 p-1.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre y Apellido
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Milagros Airalde"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@buscapromo.com"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={64}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Registrarme'}
          </button>

          {/* Accesos rápidos para pruebas de cátedra (seed.py) */}
          {mode === 'login' && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-500 text-center">
                Cuentas de prueba (Seeder):
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillSeedCredentials('admin')}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cargar Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillSeedCredentials('user')}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cargar Consumidor
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}