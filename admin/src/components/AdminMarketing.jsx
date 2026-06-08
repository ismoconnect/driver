import React from 'react';

const AdminMarketing = ({
  advisorSettings,
  setAdvisorSettings,
  handleSaveSettings,
  savingSettings,
  settingsSuccess
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {settingsSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
          Intégration Facebook enregistrée avec succès !
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <span className="text-xl">📢</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Marketing & Intégrations Facebook (Meta)</h4>
          </div>

          {/* Meta Pixel Config */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-sm font-bold text-white">Pixel Meta (Facebook Pixel)</h5>
                <p className="text-[11px] text-slate-500 mt-1">Suivez les visiteurs et les conversions pour optimiser vos publicités Facebook.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={advisorSettings.metaPixelEnabled === true || advisorSettings.metaPixelEnabled === 'true'}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, metaPixelEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Identifiant du Pixel (Pixel ID)</label>
              <input
                type="text"
                value={advisorSettings.metaPixelId || ''}
                onChange={(e) => setAdvisorSettings(prev => ({ ...prev, metaPixelId: e.target.value }))}
                placeholder="Ex: 123456789012345"
                className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                disabled={!(advisorSettings.metaPixelEnabled === true || advisorSettings.metaPixelEnabled === 'true')}
              />
              <span className="text-[10px] text-slate-500 block">Les événements standard <strong>PageView</strong> (visites) et <strong>CompleteRegistration</strong> (inscription de candidat validée) seront automatiquement envoyés.</span>
            </div>
          </div>

          {/* Messenger Chat Config */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-sm font-bold text-white">Bulle de discussion Messenger (Chat Client)</h5>
                <p className="text-[11px] text-slate-500 mt-1">Affichez le widget de chat officiel de Facebook pour répondre en direct depuis votre page.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={advisorSettings.messengerEnabled === true || advisorSettings.messengerEnabled === 'true'}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, messengerEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Identifiant de la page Facebook (Page ID)</label>
              <input
                type="text"
                value={advisorSettings.messengerPageId || ''}
                onChange={(e) => setAdvisorSettings(prev => ({ ...prev, messengerPageId: e.target.value }))}
                placeholder="Ex: 104839201948293"
                className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                disabled={!(advisorSettings.messengerEnabled === true || advisorSettings.messengerEnabled === 'true')}
              />
              <span className="text-[10px] text-slate-500 block">N'oubliez pas d'ajouter le domaine de votre site web dans la liste blanche de votre page Facebook (Paramètres de la page &gt; Messagerie avancée).</span>
            </div>
          </div>

          {/* Open Graph Preview Manager */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h5 className="text-sm font-bold text-white">Open Graph (Partage Réseaux Sociaux)</h5>
              <p className="text-[11px] text-slate-500 mt-1">Configurez le visuel et les textes qui apparaissent lorsque le lien de votre site est partagé sur Facebook.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titre du partage (og:title)</label>
                <input
                  type="text"
                  value={advisorSettings.ogTitle || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                  placeholder="Ex: Obtenez votre Permis de Conduire en Belgique en quelques clics"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description (og:description)</label>
                <textarea
                  value={advisorSettings.ogDescription || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                  placeholder="Ex: Inscription rapide et sécurisée. Accompagnement de A à Z..."
                  rows={3}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[70px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">URL de l'image d'illustration (og:image)</label>
                <input
                  type="text"
                  value={advisorSettings.ogImageUrl || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogImageUrl: e.target.value }))}
                  placeholder="Ex: https://votre-site.com/image-partage.jpg"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {savingSettings ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            "Enregistrer les Paramètres Marketing ➔"
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminMarketing;
