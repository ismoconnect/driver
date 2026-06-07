import React, { useState } from 'react';

const AdminSettings = ({
  advisorSettings,
  setAdvisorSettings,
  handleSaveSettings,
  savingSettings,
  settingsSuccess,
  handlePerceptionTotalChange,
  handleTheoriqueTotalChange,
  handlePratiqueTotalChange,
  handleDirectTotalChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState('advisor'); // 'advisor' | 'site' | 'bank' | 'pricing'
  const [previewEmail, setPreviewEmail] = useState(null); // { subject, html } or null

  const handleShowPreview = (type) => {
    let subject = "";
    let bodyText = "";
    let formattedBody = "";
    let titleHtml = "";
    let buttonHtml = "";
    let extraHtml = "";

    if (type === 'welcome') {
      subject = advisorSettings.emailWelcomeSubject || "🚀 Bienvenue sur Mon Permis - Compte Candidat Activé";
      bodyText = advisorSettings.emailWelcomeBody || "Votre compte candidat a été créé avec succès...";
      
      formattedBody = bodyText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      titleHtml = `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Félicitations Jean ! 🚀</h2>`;
      buttonHtml = `
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="#" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(249,115,22,0.25); font-family: sans-serif;">Accéder à mon Espace ➔</a>
        </div>
      `;
      extraHtml = `<p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Si vous avez la moindre question, vous pouvez envoyer un message direct à votre conseiller depuis votre tableau de bord.</p>`;
    } else if (type === 'payment') {
      subject = advisorSettings.emailPaymentSubject || "✅ Votre paiement a été validé - Mon Permis";
      bodyText = advisorSettings.emailPaymentBody || "Nous avons le plaisir de vous informer...";
      
      const parsedBody = bodyText
        .replace(/{amount}/g, "200,00 €")
        .replace(/{formulaName}/g, "Formule Théorique (Acompte)");

      formattedBody = parsedBody
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      titleHtml = `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Paiement Validé ! ✅</h2>`;
      buttonHtml = `
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="#" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.25); font-family: sans-serif;">Voir mon dossier ➔</a>
        </div>
      `;
    } else if (type === 'message') {
      subject = advisorSettings.emailMessageSubject || "💬 Nouveau message de {senderName} - Mon Permis";
      bodyText = advisorSettings.emailMessageBody || "Vous avez reçu un nouveau message...";
      
      subject = subject.replace(/{senderName}/g, advisorSettings.name || "Jean-Pierre Dumont");
      const parsedBody = bodyText.replace(/{senderName}/g, advisorSettings.name || "Jean-Pierre Dumont");

      formattedBody = parsedBody
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      titleHtml = `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Nouveau message reçu 💬</h2>`;
      buttonHtml = `
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 0 12px 12px 0; font-style: italic; color: #334155; font-size: 13px; margin-bottom: 32px;">
          "Bonjour, j'ai bien mis à jour vos documents d'identité pour validation. Bonne journée !"
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="#" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(15,23,42,0.25); font-family: sans-serif;">Répondre depuis mon espace ➔</a>
        </div>
      `;
    } else if (type === 'formula') {
      subject = advisorSettings.emailFormulaSelectedSubject || "📋 Votre inscription est bien reçue - Mon Permis";
      bodyText = advisorSettings.emailFormulaSelectedBody || "Nous avons bien reçu votre dossier d'inscription...";
      
      const parsedBody = bodyText
        .replace(/{amount}/g, "550,00 €")
        .replace(/{formulaName}/g, "Formule Théorique");

      formattedBody = parsedBody
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      titleHtml = `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Inscription Reçue 📋</h2>`;
      buttonHtml = `
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="#" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(249,115,22,0.25); font-family: sans-serif;">Voir les détails du dossier ➔</a>
        </div>
      `;
    } else if (type === 'solde') {
      subject = advisorSettings.emailSoldeInitiatedSubject || "⚡ Votre document est prêt & Appel de solde - Mon Permis";
      bodyText = advisorSettings.emailSoldeInitiatedBody || "Félicitations, l'attestation ou le certificat lié...";
      
      const parsedBody = bodyText
        .replace(/{amount}/g, "350,00 €")
        .replace(/{formulaName}/g, "Formule Théorique");

      formattedBody = parsedBody
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

      titleHtml = `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Appel de Solde ⚡</h2>`;
      buttonHtml = `
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="#" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.25); font-family: sans-serif;">Régler mon solde ➔</a>
        </div>
      `;
    }

    const isOrange = type === 'welcome' || type === 'formula';
    const mainColor = isOrange ? '#f97316' : '#10b981';
    const html = `
      <div style="font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6; min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 2px solid ${mainColor};">
            <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-decoration: none; display: inline-block; font-family: sans-serif;">MON <span style="color: ${mainColor};">PERMIS</span></span>
          </div>
          <div style="padding: 40px 32px;">
            ${titleHtml}
            <p style="font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.6;">Bonjour Jean,</p>
            <p style="font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${formattedBody}</p>
            ${buttonHtml}
            ${extraHtml || ''}
          </div>
          <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Permis de Conduire Belgique. Tous droits réservés.</p>
            <p style="margin: 0;">Espace d'échange sécurisé SSL. Vos informations d'identité sont cryptées de bout en bout.</p>
          </div>
        </div>
      </div>
    `;

    setPreviewEmail({ subject, html });
  };

  const subTabs = [
    { id: 'advisor', label: '👨‍💼 Conseiller', desc: 'Identité & statut' },
    { id: 'site', label: '⚙️ Site & Contacts', desc: 'Coordonnées & visuels' },
    { id: 'bank', label: '🏦 Banque (RIB)', desc: 'Facturation virement' },
    { id: 'pricing', label: '💳 Tarifs & Formules', desc: 'Montants & descriptifs' },
    { id: 'emails', label: '📧 Templates E-mails', desc: 'Modèles & messages' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 min-w-[150px] p-3 rounded-2xl text-left border transition-all duration-300 cursor-pointer flex flex-col gap-0.5 ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="text-xs sm:text-sm font-bold">{tab.label}</span>
              <span className="text-[9px] font-normal text-slate-500 block">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* CONSEILLER ET IDENTITE */}
        {activeSubTab === 'advisor' && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <span className="text-xl">👨‍💼</span>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Conseiller Référent</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom du conseiller</label>
                <input
                  type="text"
                  value={advisorSettings.name || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Jean-Pierre Dumont"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titre / Rôle</label>
                <input
                  type="text"
                  value={advisorSettings.title || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Expert Agréé SPF Belgique"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Statut de présence</label>
                <select
                  value={String(advisorSettings.isOnline)}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, isOnline: e.target.value === 'true' }))}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white cursor-pointer"
                >
                  <option value="true">🟢 En ligne (Disponible)</option>
                  <option value="false">🔴 Hors ligne (Indisponible)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Emoji Avatar</label>
                <input
                  type="text"
                  value={advisorSettings.avatarEmoji || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, avatarEmoji: e.target.value }))}
                  placeholder="Ex: 👨‍💼"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATION CONTACTS & IDENTITÉ VISUELLE */}
        {activeSubTab === 'site' && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <span className="text-xl">⚙️</span>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Configuration Contacts & Identité Visuelle</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email de contact</label>
                <input
                  type="email"
                  value={advisorSettings.contactEmail || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="Ex: contact@permisdeconduirebe.com"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Téléphone de contact</label>
                <input
                  type="text"
                  value={advisorSettings.contactPhone || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="Ex: +32 466 90 22 99"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Numéro WhatsApp (Format: 32...)</label>
                <input
                  type="text"
                  value={advisorSettings.contactWhatsapp || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, contactWhatsapp: e.target.value }))}
                  placeholder="Ex: 32466902299"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">URL du Logo du site (Optionnel)</label>
                <input
                  type="text"
                  value={advisorSettings.logoUrl || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="Par défaut: /logo.png"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">URL de l'Image d'arrière-plan Hero (Optionnel)</label>
                <input
                  type="text"
                  value={advisorSettings.heroImageUrl || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                  placeholder="Par défaut: /smiling_driver.png"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* BANKING DETAILS / RIB */}
        {activeSubTab === 'bank' && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <span className="text-xl">🏦</span>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Coordonnées Bancaires (RIB Factures)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bénéficiaire</label>
                <input
                  type="text"
                  value={advisorSettings.beneficiary || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, beneficiary: e.target.value }))}
                  placeholder="Ex: Mon Permis SRL"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de la banque</label>
                <input
                  type="text"
                  value={advisorSettings.bankName || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Ex: BNP Paribas Fortis"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">IBAN</label>
                <input
                  type="text"
                  value={advisorSettings.iban || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="Ex: BE96 3630 1234 5678"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">BIC</label>
                <input
                  type="text"
                  value={advisorSettings.bic || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, bic: e.target.value }))}
                  placeholder="Ex: GEBA BEBB"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* PRICING FORMULAS DETAILS */}
        {activeSubTab === 'pricing' && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <span className="text-xl">💳</span>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Configuration des Tarifs & Lignes de Facture</h4>
            </div>

            {/* CONFIGURATION PERCEPTION DU RISQUE */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">👁️ Paramètres Perception du Risque (Phase 2)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                  <input
                    type="text"
                    value={advisorSettings.perceptionAmount || ''}
                    onChange={(e) => handlePerceptionTotalChange(e.target.value)}
                    placeholder="Ex: 350,00 €"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Perception Ligne 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.perceptionLabel1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionLabel1: e.target.value }))}
                      placeholder="Ex: Frais de timbre fiscal..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.perceptionAmount1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionAmount1: e.target.value }))}
                      placeholder="Ex: 50,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>

                {/* Perception Ligne 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.perceptionLabel2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionLabel2: e.target.value }))}
                      placeholder="Ex: Administration - Dispense..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.perceptionAmount2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionAmount2: e.target.value }))}
                      placeholder="Ex: 300,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIGURATION EXAMEN THEORIQUE */}
            <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">📚 Paramètres Examen Théorique (Phase 3)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                  <input
                    type="text"
                    value={advisorSettings.theoriqueAmount || ''}
                    onChange={(e) => handleTheoriqueTotalChange(e.target.value)}
                    placeholder="Ex: 550,00 €"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Theorique Ligne 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.theoriqueLabel1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueLabel1: e.target.value }))}
                      placeholder="Ex: Frais d'inscription..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.theoriqueAmount1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueAmount1: e.target.value }))}
                      placeholder="Ex: 150,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>

                {/* Theorique Ligne 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.theoriqueLabel2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueLabel2: e.target.value }))}
                      placeholder="Ex: Administration - Dispense..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.theoriqueAmount2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueAmount2: e.target.value }))}
                      placeholder="Ex: 400,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIGURATION EXAMEN PRATIQUE */}
            <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">🚗 Paramètres Examen Pratique (Phase 4)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                  <input
                    type="text"
                    value={advisorSettings.pratiqueAmount || ''}
                    onChange={(e) => handlePratiqueTotalChange(e.target.value)}
                    placeholder="Ex: 750,00 €"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Pratique Ligne 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.pratiqueLabel1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueLabel1: e.target.value }))}
                      placeholder="Ex: Frais d'homologation..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.pratiqueAmount1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueAmount1: e.target.value }))}
                      placeholder="Ex: 250,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>

                {/* Pratique Ligne 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.pratiqueLabel2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueLabel2: e.target.value }))}
                      placeholder="Ex: Administration - Dispense..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.pratiqueAmount2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueAmount2: e.target.value }))}
                      placeholder="Ex: 500,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIGURATION PERMIS DEFINITIF / DIRECT */}
            <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">🏆 Paramètres Permis Définitif / Direct (Phase 5)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                  <input
                    type="text"
                    value={advisorSettings.directLicenseAmount || ''}
                    onChange={(e) => handleDirectTotalChange(e.target.value)}
                    placeholder="Ex: 1200,00 €"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Direct Ligne 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.directLabel1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directLabel1: e.target.value }))}
                      placeholder="Ex: Constitution du dossier d'homologation..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.directAmount1 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directAmount1: e.target.value }))}
                      placeholder="Ex: 400,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>

                {/* Direct Ligne 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                    <input
                      type="text"
                      value={advisorSettings.directLabel2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directLabel2: e.target.value }))}
                      placeholder="Ex: Frais d'édition & timbres fiscaux..."
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                    <input
                      type="text"
                      value={advisorSettings.directAmount2 || ''}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directAmount2: e.target.value }))}
                      placeholder="Ex: 800,00 €"
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL TEMPLATES CUSTOMIZER */}
        {activeSubTab === 'emails' && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-8 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <span className="text-xl">📧</span>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Modèles d'E-mails Transactionnels</h4>
            </div>

            {/* Welcome Email */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-emerald-400">1. E-mail de Bienvenue (Nouvelle Inscription)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Envoyé instantanément après l'inscription d'un candidat.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowPreview('welcome')}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  👁️ Voir l'aperçu
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du message</label>
                  <input
                    type="text"
                    value={advisorSettings.emailWelcomeSubject || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailWelcomeSubject: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu du message (Markdown / Texte libre)</label>
                  <textarea
                    value={advisorSettings.emailWelcomeBody || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailWelcomeBody: e.target.value }))}
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[100px]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-1">Variables disponibles : Aucun paramètre dynamique requis.</span>
                </div>
              </div>
            </div>

            {/* Formula Selected */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-emerald-400">2. E-mail de Confirmation de Formule / Inscription</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Envoyé lorsque le candidat choisit ou met à niveau sa formule.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowPreview('formula')}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  👁️ Voir l'aperçu
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du message</label>
                  <input
                    type="text"
                    value={advisorSettings.emailFormulaSelectedSubject || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailFormulaSelectedSubject: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu du message</label>
                  <textarea
                    value={advisorSettings.emailFormulaSelectedBody || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailFormulaSelectedBody: e.target.value }))}
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[100px]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-1">Variables disponibles : <strong>{'{amount}'}</strong> (Montant total/acompte), <strong>{'{formulaName}'}</strong> (Nom de la formule sélectionnée).</span>
                </div>
              </div>
            </div>

            {/* Payment Validation */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-emerald-400">3. E-mail de Validation de Paiement (Acompte & Solde)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Envoyé lorsqu'un virement est validé par un administrateur.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowPreview('payment')}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  👁️ Voir l'aperçu
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du message</label>
                  <input
                    type="text"
                    value={advisorSettings.emailPaymentSubject || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailPaymentSubject: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu du message</label>
                  <textarea
                    value={advisorSettings.emailPaymentBody || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailPaymentBody: e.target.value }))}
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[100px]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-1">Variables disponibles : <strong>{'{amount}'}</strong> (Montant validé), <strong>{'{formulaName}'}</strong> (Nom de la formule / phase).</span>
                </div>
              </div>
            </div>

            {/* Solde Initiated (Appel de Solde) */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-emerald-400">4. E-mail de Demande de Règlement de Solde (Appel de solde)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Envoyé lorsque l'attestation est disponible pour demander le virement du solde.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowPreview('solde')}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  👁️ Voir l'aperçu
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du message</label>
                  <input
                    type="text"
                    value={advisorSettings.emailSoldeInitiatedSubject || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailSoldeInitiatedSubject: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu du message</label>
                  <textarea
                    value={advisorSettings.emailSoldeInitiatedBody || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailSoldeInitiatedBody: e.target.value }))}
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[100px]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-1">Variables disponibles : <strong>{'{amount}'}</strong> (Montant du solde), <strong>{'{formulaName}'}</strong> (Nom de la formule / phase).</span>
                </div>
              </div>
            </div>

            {/* New Message offline alert */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-emerald-400">5. E-mail d'Alerte de Message Reçu (Destinataire Hors-Ligne)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Envoyé pour notifier d'un message non lu dans le chat sécurisé.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowPreview('message')}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  👁️ Voir l'aperçu
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du message</label>
                  <input
                    type="text"
                    value={advisorSettings.emailMessageSubject || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailMessageSubject: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu explicatif introductif</label>
                  <textarea
                    value={advisorSettings.emailMessageBody || ''}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, emailMessageBody: e.target.value }))}
                    rows={3}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[80px]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-1">Variables disponibles : <strong>{'{senderName}'}</strong> (Expéditeur), <strong>{'{messageText}'}</strong> (Contenu brut du message automatique).</span>
                </div>
              </div>
            </div>

          </div>
        )}

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {savingSettings ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            "Enregistrer les Paramètres ➔"
          )}
        </button>
      </form>

      {/* PREVIEW EMAIL MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Aperçu du mail</span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">Sujet : {previewEmail.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center font-bold text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body / Iframe Content */}
            <div className="flex-1 bg-white overflow-hidden p-2">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.html}
                className="w-full h-full border-0 min-h-[480px]"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
