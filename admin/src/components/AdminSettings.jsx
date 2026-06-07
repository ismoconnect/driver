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

  const subTabs = [
    { id: 'advisor', label: '👨‍💼 Conseiller', desc: 'Identité & statut' },
    { id: 'site', label: '⚙️ Site & Contacts', desc: 'Coordonnées & visuels' },
    { id: 'bank', label: '🏦 Banque (RIB)', desc: 'Facturation virement' },
    { id: 'pricing', label: '💳 Tarifs & Formules', desc: 'Montants & descriptifs' }
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
    </div>
  );
};

export default AdminSettings;
