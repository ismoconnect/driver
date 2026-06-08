import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LegalMentions({ advisor }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-orange selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <a href="/accueil" onClick={(e) => { e.preventDefault(); navigate('/accueil'); }} className="flex items-center gap-2 flex-shrink min-w-0">
            <img src={advisor?.logoUrl || "/logo.png"} alt="Mon Permis Logo" className="h-8 sm:h-10 rounded-lg object-contain" />
          </a>
          <button
            onClick={() => navigate('/accueil')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <span className="hidden sm:inline">← Retour à l'accueil</span>
            <span className="inline sm:hidden">← Accueil</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
        <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
          Informations légales
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white mb-6 sm:mb-8">
          Mentions Légales
        </h1>

        <div className="space-y-6 sm:space-y-8 text-slate-400 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">1. Présentation de la plateforme</h2>
            <p className="mb-3">
              Le site <strong>Mon Permis</strong> (ci-après "la plateforme") est un service d'accompagnement administratif en ligne pour l'obtention du permis de conduire belge.
            </p>
            <p>
              <strong>Éditeur de la plateforme :</strong> Mon Permis Belgique, service d'accompagnement pour les candidats au permis de conduire.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">2. Hébergement</h2>
            <p>
              Cette plateforme est hébergée sur des infrastructures cloud hautement sécurisées conformes aux normes européennes en matière d'hébergement de données.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">3. Propriété intellectuelle</h2>
            <p className="mb-3">
              L'ensemble du contenu présent sur cette plateforme (textes, images, graphismes, logos, icônes, animations) est la propriété exclusive de l'éditeur ou de ses partenaires.
            </p>
            <p>
              Toute reproduction, distribution, modification ou adaptation de ces différents éléments est strictement interdite sans l'accord préalable écrit de l'éditeur.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">4. Limitation de responsabilité</h2>
            <p className="mb-3">
              L'éditeur s'efforce de fournir des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions ou des inexactitudes dans les informations transmises par les autorités partenaires.
            </p>
            <p>
              La plateforme contient des espaces d'échanges sécurisés (chat avec votre conseiller). L'éditeur se réserve le droit de modérer ou de bloquer l'accès en cas de propos à caractère illicite ou injurieux.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
