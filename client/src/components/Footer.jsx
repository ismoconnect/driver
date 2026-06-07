import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ user, onOpenDashboard }) => {
  const navigate = useNavigate();
  return (
    <footer id="contact" className="relative bg-brand-dark overflow-hidden">

      {/* Decorative auroras */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,152,0,0.5) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.6) 0%, transparent 70%)' }} />
      </div>

      {/* ---- CONTACT SECTION ---- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: Brand + Info */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
              Contactez-nous
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white leading-tight mb-6">
              Prêt à obtenir votre{' '}
              <span className="text-brand-orange">permis ?</span>
            </h2>

            <p className="text-slate-400 text-base leading-relaxed max-w-md mb-10">
              Notre équipe est disponible pour vous accompagner pas à pas. Contactez-nous maintenant et obtenez une réponse rapide.
            </p>

            {/* Contact links */}
            <div className="space-y-5">
              <a
                href="mailto:contact@mpdcb.com"
                className="flex items-center gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-orange/10 group-hover:border-brand-orange/30 transition-all duration-300">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Email</div>
                  <div className="text-white font-medium group-hover:text-brand-orange transition-colors">contact@mpdcb.com</div>
                </div>
              </a>

              <a
                href="https://wa.me/32466902299"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500/10 group-hover:border-green-500/30 transition-all duration-300">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-green-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">WhatsApp</div>
                  <div className="text-white font-medium group-hover:text-green-400 transition-colors">+32 466 90 22 99</div>
                </div>
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-3">
              {['100% Légal', 'Procédure Sécurisée', '98.6% de Réussite', 'Réponse Rapide'].map((badge) => (
                <span key={badge} className="text-xs font-semibold text-slate-400 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full">
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Registration / Account Creation CTA */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[350px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl" />
            <div className="relative z-10 text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white mb-4">
                Créez votre espace en 1 clic 🚀
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Pour garantir un traitement prioritaire de votre demande et obtenir un suivi direct avec votre conseiller attitré, veuillez créer votre compte. L'inscription est simplifiée à l'extrême : <strong>seulement 2 informations demandées</strong> (votre nom et votre numéro) et un véritable email pour recevoir les mises à jour en temps réel.
              </p>
              <button
                onClick={() => onOpenDashboard(user ? 'overview' : 'signup')}
                className="group w-full relative inline-flex items-center justify-center px-6 py-4 rounded-full text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,152,0,0.35)] hover:scale-[1.02] overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <span>{user ? "Accéder à mon espace" : "Créer mon compte en 2 secondes"}</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <p className="text-center lg:text-left text-[11px] text-slate-500 mt-4 flex items-center justify-center lg:justify-start gap-1">
                <span>🔒</span> Inscription 100% sécurisée, gratuite et sans engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-2xl font-display font-bold text-white tracking-wider">
            MON <span className="text-brand-orange">PERMIS</span>
          </span>
          <p className="text-slate-500 text-sm text-center">
            © {new Date().getFullYear()} Permis de Conduire Belgique. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="/mentions-legales" onClick={(e) => { e.preventDefault(); navigate('/mentions-legales'); }} className="text-slate-500 hover:text-brand-orange text-xs transition-colors">Mentions légales</a>
            <a href="/confidentialite" onClick={(e) => { e.preventDefault(); navigate('/confidentialite'); }} className="text-slate-500 hover:text-brand-orange text-xs transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
