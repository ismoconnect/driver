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
function AuthPage({ mode, user, authChecked, advisor, marketing }) {
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
      marketing={marketing}
    />
  );
}

// ─── Dashboard page (protected) ───────────────────────────────────────────────
function DashboardPage({ user, authChecked, advisor, marketing }) {
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
        marketing={marketing}
      />
    </ProtectedRoute>
  );
}

// ─── Root App with Router ─────────────────────────────────────────────────────
function AppRoutes() {
  const { user, authChecked } = useAuth();
  const [advisor, setAdvisor] = useState(null);
  const [marketing, setMarketing] = useState(null);
  const location = useLocation();

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
    const isPublicRoute = !location.pathname.startsWith('/mon-espace');

    // WhatsApp Floating Button - omnipresent across all routes
    const existingWaButton = document.getElementById('whatsapp-floating-btn');
    if (existingWaButton) existingWaButton.remove();

    const contactWhatsapp = advisor?.contactWhatsapp || '32466902299';
    const hasMessenger = messengerEnabled && messengerPageId;

    if (contactWhatsapp) {
      const waBtn = document.createElement('a');
      waBtn.id = 'whatsapp-floating-btn';
      waBtn.href = `https://wa.me/${contactWhatsapp}`;
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.setAttribute('aria-label', 'Discuter sur WhatsApp');

      const isMobile = window.innerWidth < 768;
      const isMemberSpace = location.pathname.startsWith('/mon-espace');
      const isChatTab = location.pathname.endsWith('/chat');
      let bottomOffset = '24px';
      if (hasMessenger) {
        if (isMemberSpace && isMobile) {
          bottomOffset = isChatTab ? '225px' : '155px';
        } else {
          bottomOffset = '96px';
        }
      } else {
        if (isMemberSpace && isMobile) {
          bottomOffset = isChatTab ? '155px' : '85px';
        } else {
          bottomOffset = '24px';
        }
      }

      Object.assign(waBtn.style, {
        position: 'fixed',
        bottom: bottomOffset,
        right: '24px',
        width: '60px',
        height: '60px',
        backgroundColor: '#25D366',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
        zIndex: '9999',
        transition: 'transform 0.3s ease, background-color 0.3s ease',
        cursor: 'pointer'
      });

      waBtn.onmouseenter = () => {
        waBtn.style.transform = 'scale(1.1) translateY(-4px)';
        waBtn.style.backgroundColor = '#128C7E';
      };
      waBtn.onmouseleave = () => {
        waBtn.style.transform = 'scale(1) translateY(0)';
        waBtn.style.backgroundColor = '#25D366';
      };

      waBtn.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="white"/>
        </svg>
      `;

      document.body.appendChild(waBtn);
    }

    if (hasMessenger) {
      const btn = document.createElement('a');
      btn.id = 'messenger-floating-btn';
      btn.href = `https://m.me/${messengerPageId}`;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.setAttribute('aria-label', 'Discuter sur Messenger');
      
      const isMobile = window.innerWidth < 768;
      const isMemberSpace = location.pathname.startsWith('/mon-espace');
      const isChatTab = location.pathname.endsWith('/chat');
      const bottomPos = (isMemberSpace && isMobile) ? (isChatTab ? '155px' : '85px') : '24px';

      // Inline styles for a premium glassmorphic, animated floating button matching our design guidelines
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: bottomPos,
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
  }, [marketing, location.pathname]);

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
      <Route path="/connexion" element={<AuthPage mode="login" user={user} authChecked={authChecked} advisor={advisor} marketing={marketing} />} />
      <Route path="/inscription" element={<AuthPage mode="signup" user={user} authChecked={authChecked} advisor={advisor} marketing={marketing} />} />

      {/* Protected dashboard route */}
      <Route path="/mon-espace" element={<DashboardPage user={user} authChecked={authChecked} advisor={advisor} marketing={marketing} />} />
      <Route path="/mon-espace/:tab" element={<DashboardPage user={user} authChecked={authChecked} advisor={advisor} marketing={marketing} />} />

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
