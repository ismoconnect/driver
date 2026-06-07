import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

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
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-[#b58455] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Protected Route wrapper ─────────────────────────────────────────────────
function ProtectedRoute({ user, authChecked, children }) {
  if (!authChecked) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Auth page component ─────────────────────────────────────────────────────
function AuthPage({ user, authChecked }) {
  const navigate = useNavigate();

  if (!authChecked) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Login onLogin={() => navigate('/dashboard')} />;
}

// ─── Dashboard page component ────────────────────────────────────────────────
function DashboardPage({ user, authChecked }) {
  const navigate = useNavigate();
  const { tab } = useParams();

  return (
    <ProtectedRoute user={user} authChecked={authChecked}>
      <Dashboard
        initialTab={tab}
        onLogout={() => navigate('/login')}
      />
    </ProtectedRoute>
  );
}

// ─── App routing layout ──────────────────────────────────────────────────────
function AppRoutes() {
  const { user, authChecked } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<AuthPage user={user} authChecked={authChecked} />} />
      <Route path="/dashboard" element={<DashboardPage user={user} authChecked={authChecked} />} />
      <Route path="/dashboard/:tab" element={<DashboardPage user={user} authChecked={authChecked} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#b58455] selection:text-white">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
