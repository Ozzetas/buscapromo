import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, type ActiveView } from './components/Navbar';
import { PromotionExplorer } from './components/PromotionExplorer';
import { AdminBackoffice } from './components/AdminBackoffice';
import { AuthModal } from './components/AuthModal';

function AppContent() {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('explorer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const currentView: ActiveView =
    activeView === 'backoffice' && isAdmin ? 'backoffice' : 'explorer';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeView={currentView}
        onSelectView={setActiveView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'explorer' ? <PromotionExplorer /> : <AdminBackoffice />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-semibold text-slate-700">
            Buscapromo • Plataforma Geolocalizada de Ofertas en Córdoba Capital
          </p>
          <p className="mt-1">
            Trabajo Final Integrador — Tecnicatura Universitaria en Programación (UTN)
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}