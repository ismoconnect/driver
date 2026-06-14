import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onOpenDashboard, forceScrolled, advisor }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(forceScrolled || false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (forceScrolled) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [forceScrolled]);

  const links = [
    { label: 'Accueil', href: '/accueil' },
    { label: 'Services', href: '/accueil#services' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const [targetPath, targetHash] = href.split('#');
    
    if (window.location.pathname === targetPath) {
      if (targetHash) {
        const el = document.getElementById(targetHash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      {/* Mobile menu backdrop overlay - placed outside <nav> to guarantee click interception across the whole viewport */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-400 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm shadow-slate-900/50'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* Logo */}
            <a href="/accueil" onClick={(e) => { e.preventDefault(); navigate('/accueil'); }} className="flex-shrink-0 flex items-center gap-2">
              <img src={advisor?.logoUrl || "/logo.png"} alt="Mon Permis Logo" className="h-8 sm:h-10 rounded-lg" />
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-8">
              {links.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`text-sm font-medium transition-colors duration-300 hover:text-brand-orange text-white/80`}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => onOpenDashboard('signup')}
                className="group relative inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-orange/30 overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                Nous contacter
              </button>

              {user ? (
                <button
                  onClick={() => onOpenDashboard('login')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border cursor-pointer transition-all duration-300 hover:scale-[1.03] border-white/30 text-white hover:border-white hover:bg-white/10`}
                >
                  👤 Mon Espace
                </button>
              ) : (
                <div className="flex items-center gap-4 border-l border-white/20 pl-6 ml-2">
                  <button
                    onClick={() => onOpenDashboard('login')}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-orange/30 overflow-hidden cursor-pointer"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    Connexion
                  </button>
                </div>
              )}
            </div>

            {/* Mobile quick-access button */}
            <button
              onClick={() => onOpenDashboard('login')}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white ml-auto mr-1 cursor-pointer transition-all duration-200 active:scale-95"
            >
              <span>👤</span>
              <span>{user ? 'Espace' : 'Connexion'}</span>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 bg-white ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 bg-white ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 bg-white ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>



        {/* Mobile menu */}
        <div 
          className={`md:hidden fixed inset-x-0 top-20 h-[380px] z-40 bg-slate-950 border-t border-white/5 rounded-b-[32px] shadow-[0_16px_30px_rgba(0,0,0,0.6)] overflow-y-auto transition-all duration-300 ${
            menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="px-6 py-12 flex flex-col gap-6 items-center justify-center">
            {links.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  setMenuOpen(false);
                  handleLinkClick(e, link.href);
                }}
                className={`text-lg font-bold tracking-wide text-white/80 hover:text-brand-orange transition-all duration-300 transform ${
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenDashboard('signup');
              }}
              className={`w-full max-w-xs text-center bg-brand-orange text-white px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/20 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${links.length * 50}ms` }}
            >
              Nous contacter
            </button>

            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDashboard('login');
                }}
                className={`w-full max-w-xs text-center bg-white/5 border border-white/15 text-white hover:bg-white/10 px-6 py-3.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: `${(links.length + 1) * 50}ms` }}
              >
                👤 Mon Espace client
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDashboard('login');
                }}
                className={`w-full max-w-xs text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: `${(links.length + 1) * 50}ms` }}
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
