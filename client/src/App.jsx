import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import ClientDashboard from './components/ClientDashboard';
import LegalMentions from './components/LegalMentions';
import Confidentialite from './components/Confidentialite';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Global auth state hook ───────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  return { user, authChecked };
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/50 text-sm font-medium">Chargement...</p>
    </div>
  );
}

// ─── Protected Route wrapper ─────────────────────────────────────────────────
// Redirects to /connexion if user is not authenticated
function ProtectedRoute({ user, authChecked, children }) {
  if (!authChecked) return <LoadingScreen />;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

// ─── Landing page ─────────────────────────────────────────────────────────────
function LandingPage({ user, authChecked }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (location.pathname === '/accueil') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  if (!authChecked) return <LoadingScreen />;

  const handleOpenDashboard = (mode = 'login') => {
    if (user) {
      navigate('/mon-espace');
    } else {
      navigate(mode === 'signup' ? '/inscription' : '/connexion');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-light text-brand-dark font-sans selection:bg-brand-orange selection:text-white transition-colors duration-500">
      <Navbar user={user} onOpenDashboard={handleOpenDashboard} />
      <Hero user={user} onOpenDashboard={handleOpenDashboard} />
      <Services onOpenDashboard={handleOpenDashboard} />
      <Testimonials />
      <Footer user={user} onOpenDashboard={handleOpenDashboard} />
    </div>
  );
}

// ─── Auth page (connexion / inscription) ─────────────────────────────────────
function AuthPage({ mode, user, authChecked }) {
  const navigate = useNavigate();

  if (!authChecked) return <LoadingScreen />;

  // If already logged in, redirect straight to dashboard
  if (user) return <Navigate to="/mon-espace" replace />;

  return (
    <ClientDashboard
      key={mode}  // Force remount when switching between /connexion and /inscription
      initialMode={mode}
      onBack={() => navigate('/accueil')}
      onAuthSuccess={() => navigate('/mon-espace')}
      onSwitchMode={(newMode) => navigate(newMode === 'signup' ? '/inscription' : '/connexion')}
    />
  );
}

// ─── Dashboard page (protected) ───────────────────────────────────────────────
function DashboardPage({ user, authChecked }) {
  const navigate = useNavigate();

  return (
    <ProtectedRoute user={user} authChecked={authChecked}>
      <ClientDashboard
        initialMode="login"
        onBack={() => navigate('/accueil')}
        onAuthSuccess={() => navigate('/mon-espace')}
      />
    </ProtectedRoute>
  );
}

// ─── Root App with Router ─────────────────────────────────────────────────────
function AppRoutes() {
  const { user, authChecked } = useAuth();

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Navigate to="/accueil" replace />} />
      <Route path="/accueil" element={<LandingPage user={user} authChecked={authChecked} />} />
      <Route path="/mentions-legales" element={<LegalMentions />} />
      <Route path="/confidentialite" element={<Confidentialite />} />

      {/* Auth routes */}
      <Route path="/connexion" element={<AuthPage mode="login" user={user} authChecked={authChecked} />} />
      <Route path="/inscription" element={<AuthPage mode="signup" user={user} authChecked={authChecked} />} />

      {/* Protected dashboard route */}
      <Route path="/mon-espace" element={<DashboardPage user={user} authChecked={authChecked} />} />
      <Route path="/mon-espace/:tab" element={<DashboardPage user={user} authChecked={authChecked} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
