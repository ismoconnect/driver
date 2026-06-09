import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import ClientDashboard from './components/ClientDashboard';
import LegalMentions from './components/LegalMentions';
import Confidentialite from './components/Confidentialite';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// ─── Facebook Pixel Route Tracker ──────────────────────────────────────────────
function FacebookPixelTracker({ marketing }) {
  const location = useLocation();

  useEffect(() => {
    if (!marketing) return;
    const { metaPixelId, metaPixelEnabled } = marketing;

    if (metaPixelEnabled && metaPixelId) {
      if (!window.fbq) {
        /* eslint-disable */
        !(function (f, b, e, v, n, t, s) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = "2.0";
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        /* eslint-enable */
      }

      if (!window.fbq._fbq_initialized_ids) {
        window.fbq._fbq_initialized_ids = {};
      }

      if (!window.fbq._fbq_initialized_ids[metaPixelId]) {
        window.fbq("init", metaPixelId);
        window.fbq._fbq_initialized_ids[metaPixelId] = true;
      }

      window.fbq("track", "PageView");
    }
  }, [location.pathname, marketing]);

  return null;
}

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
function LandingPage({ user, authChecked, advisor }) {
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
      <Navbar user={user} onOpenDashboard={handleOpenDashboard} advisor={advisor} />
      <Hero user={user} onOpenDashboard={handleOpenDashboard} advisor={advisor} />
      <Services onOpenDashboard={handleOpenDashboard} />
      <Testimonials />
      <Footer user={user} onOpenDashboard={handleOpenDashboard} advisor={advisor} />
    </div>
  );
}

// ─── Auth page (connexion / inscription) ─────────────────────────────────────
function AuthPage({ mode, user, authChecked, advisor }) {
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
      advisor={advisor}
    />
  );
}

// ─── Dashboard page (protected) ───────────────────────────────────────────────
function DashboardPage({ user, authChecked, advisor }) {
  const navigate = useNavigate();
  const { tab } = useParams();

  return (
    <ProtectedRoute user={user} authChecked={authChecked}>
      <ClientDashboard
        initialMode="login"
        initialTab={tab}
        onBack={() => navigate('/accueil')}
        onAuthSuccess={() => navigate('/mon-espace')}
        advisor={advisor}
      />
    </ProtectedRoute>
  );
}

// ─── Root App with Router ─────────────────────────────────────────────────────
function AppRoutes() {
  const { user, authChecked } = useAuth();
  const [advisor, setAdvisor] = useState(null);
  const [marketing, setMarketing] = useState(null);

  useEffect(() => {
    const advisorRef = doc(db, 'settings', 'advisor');
    const unsubAdvisor = onSnapshot(advisorRef, (snap) => {
      if (snap.exists()) {
        setAdvisor(snap.data());
      }
    });
    return () => unsubAdvisor();
  }, []);

  useEffect(() => {
    const marketingRef = doc(db, 'marketing', 'settings');
    const unsubMarketing = onSnapshot(marketingRef, (snap) => {
      if (snap.exists()) {
        setMarketing(snap.data());
      }
    });
    return () => unsubMarketing();
  }, []);

  // ─── Meta Pixel & Messenger Integration ────────────────────────────────────────
  useEffect(() => {
    if (!marketing) return;
    const { metaPixelId, metaPixelEnabled, messengerPageId, messengerEnabled } = marketing;
    
    // Resolve dynamic creatives
    let activeTitle = marketing.ogTitle;
    let activeDescription = marketing.ogDescription;
    let activeImageUrl = marketing.ogImageUrl;
    let activeVideoUrl = marketing.ogVideoUrl;

    const params = new URLSearchParams(window.location.search);
    const creaId = params.get('crea');
    if (creaId && marketing.creatives && marketing.creatives[creaId]) {
      const targetCrea = marketing.creatives[creaId];
      if (targetCrea.ogTitle) activeTitle = targetCrea.ogTitle;
      if (targetCrea.ogDescription) activeDescription = targetCrea.ogDescription;
      if (targetCrea.ogImageUrl) activeImageUrl = targetCrea.ogImageUrl;
      if (targetCrea.ogVideoUrl) activeVideoUrl = targetCrea.ogVideoUrl;
    }

    // 1. Meta Pixel Script Loader is handled by FacebookPixelTracker component below.

    // 2. Facebook Messenger Chat Widget (m.me floating button)
    const existingButton = document.getElementById('messenger-floating-btn');
    if (existingButton) existingButton.remove();

    // Check if the current route is a public route (not starting with /mon-espace)
    const isPublicRoute = !window.location.pathname.startsWith('/mon-espace');

    if (messengerEnabled && messengerPageId && isPublicRoute) {
      const btn = document.createElement('a');
      btn.id = 'messenger-floating-btn';
      btn.href = `https://m.me/${messengerPageId}`;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.setAttribute('aria-label', 'Discuter sur Messenger');
      
      // Inline styles for a premium glassmorphic, animated floating button matching our design guidelines
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        backgroundColor: '#0084ff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0, 132, 255, 0.4)',
        zIndex: '9999',
        transition: 'transform 0.3s ease, background-color 0.3s ease',
        cursor: 'pointer'
      });

      // Hover effects
      btn.onmouseenter = () => {
        btn.style.transform = 'scale(1.1) translateY(-4px)';
        btn.style.backgroundColor = '#0073e6';
      };
      btn.onmouseleave = () => {
        btn.style.transform = 'scale(1) translateY(0)';
        btn.style.backgroundColor = '#0084ff';
      };

      // Modern Messenger SVG logo
      btn.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.145 2 11.25c0 2.91 1.455 5.513 3.734 7.238.196.149.324.37.333.614l.08 2.052c.01.272.296.463.557.382l2.302-.716a.78.78 0 0 1 .45-.027c.808.243 1.666.377 2.544.377 5.523 0 10-4.145 10-9.25S17.523 2 12 2zm1.225 11.758-2.038-2.176-3.972 2.176 4.368-4.637 2.083 2.176 3.927-2.176-4.368 4.637z" fill="white"/>
        </svg>
      `;

      document.body.appendChild(btn);
    }

    // 3. Open Graph Metadata Updater
    if (activeTitle) {
      document.title = activeTitle;
      let tag = document.querySelector('meta[property="og:title"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', 'og:title');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', activeTitle);
    }
    if (activeDescription) {
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', activeDescription);

      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement('meta');
        desc.setAttribute('name', 'description');
        document.head.appendChild(desc);
      }
      desc.setAttribute('content', activeDescription);
    }
    if (activeImageUrl) {
      let tag = document.querySelector('meta[property="og:image"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', 'og:image');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', activeImageUrl);
    }
    if (activeVideoUrl) {
      let tag = document.querySelector('meta[property="og:video"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', 'og:video');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', activeVideoUrl);
    }
  }, [marketing, window.location.pathname]);

  return (
    <>
      <FacebookPixelTracker marketing={marketing} />
      <Routes>
      {/* Landing page */}
      <Route path="/" element={<Navigate to="/accueil" replace />} />
      <Route path="/accueil" element={<LandingPage user={user} authChecked={authChecked} advisor={advisor} />} />
      <Route path="/mentions-legales" element={<LegalMentions advisor={advisor} />} />
      <Route path="/confidentialite" element={<Confidentialite advisor={advisor} />} />

      {/* Auth routes */}
      <Route path="/connexion" element={<AuthPage mode="login" user={user} authChecked={authChecked} advisor={advisor} />} />
      <Route path="/inscription" element={<AuthPage mode="signup" user={user} authChecked={authChecked} advisor={advisor} />} />

      {/* Protected dashboard route */}
      <Route path="/mon-espace" element={<DashboardPage user={user} authChecked={authChecked} advisor={advisor} />} />
      <Route path="/mon-espace/:tab" element={<DashboardPage user={user} authChecked={authChecked} advisor={advisor} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
