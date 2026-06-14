import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Confidentialite({ advisor }) {
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
          Protection des données
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white mb-6 sm:mb-8">
          Politique de Confidentialité
        </h1>

        <div className="space-y-6 sm:space-y-8 text-slate-400 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">1. Collecte des informations</h2>
            <p className="mb-3">
              Nous collectons uniquement les informations nécessaires au traitement de votre dossier d'homologation de permis de conduire belge :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Données d'identification (Nom, prénom, date de naissance).</li>
              <li>Coordonnées (Adresse postale, numéro de téléphone, adresse e-mail).</li>
              <li>Documents justificatifs (Copie d'identité recto/verso, photo d'identité, signature).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">2. Utilisation et transmission des données</h2>
            <p className="mb-3">
              Vos informations personnelles sont strictement confidentielles. Elles sont uniquement utilisées pour :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Valider votre profil d'éligibilité.</li>
              <li>Constituer votre dossier auprès des services d'homologation et autorités de délivrance belges.</li>
              <li>Vous contacter dans le cadre du suivi de votre dossier via notre messagerie interne sécurisée.</li>
            </ul>
            <p className="mt-3">
              Aucune donnée n'est revendue à des tiers à des fins publicitaires.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">3. Protection et sécurité</h2>
            <p className="mb-3">
              Nous mettons en œuvre des mesures de sécurité techniques avancées pour préserver la sécurité de vos informations personnelles :
            </p>
            <p className="mb-3">
              Vos documents d'identité et de paiement sont chiffrés de bout en bout (SSL/TLS). L'accès aux dossiers est strictement réservé à votre conseiller agréé attitré.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/30 border border-white/5 p-5 sm:p-8 rounded-2xl">
            <h2 className="text-white font-extrabold text-base sm:text-lg mb-4">4. Vos droits (RGPD)</h2>
            <p className="mb-3">
              Conformément à la réglementation européenne sur la protection des données (RGPD), vous disposez à tout moment d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles.
            </p>
            <p>
              Pour exercer ce droit, vous pouvez envoyer votre demande de suppression ou de modification de vos informations à l'adresse suivante : <strong>{advisor?.contactEmail || "contact@permisdeconduirebe.com"}</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
