import React, { useState } from 'react';

const AdminMarketing = ({
  advisorSettings,
  setAdvisorSettings,
  handleSaveSettings,
  savingSettings,
  settingsSuccess
}) => {
  const [ogUploading, setOgUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  
  // State for temporary uploader indicators for individual custom creatives
  const [creaUploading, setCreaUploading] = useState({}); // { [creaId_type]: boolean }

  const handleFileUpload = async (file, type, targetCreaId = null) => {
    if (!file) return null;
    const isVideo = type === 'video';
    
    // Set proper loading state
    if (targetCreaId) {
      setCreaUploading(prev => ({ ...prev, [`${targetCreaId}_${type}`]: true }));
    } else {
      if (isVideo) setVideoUploading(true);
      else setOgUploading(true);
    }

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'monpermis');
      formData.append('folder', 'monpermis/settings');

      const resourceType = isVideo ? 'video' : 'image';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        alert("Erreur lors du téléversement du fichier.");
        return null;
      }
    } catch (err) {
      console.error(err);
      alert("Échec du téléversement.");
      return null;
    } finally {
      if (targetCreaId) {
        setCreaUploading(prev => ({ ...prev, [`${targetCreaId}_${type}`]: false }));
      } else {
        if (isVideo) setVideoUploading(false);
        else setOgUploading(false);
      }
    }
  };

  const handleDefaultImageChange = async (e) => {
    const file = e.target.files?.[0];
    const url = await handleFileUpload(file, 'image');
    if (url) {
      setAdvisorSettings(prev => ({ ...prev, ogImageUrl: url }));
    }
  };

  const handleDefaultVideoChange = async (e) => {
    const file = e.target.files?.[0];
    const url = await handleFileUpload(file, 'video');
    if (url) {
      setAdvisorSettings(prev => ({ ...prev, ogVideoUrl: url }));
    }
  };

  // Add a new custom creative structure
  const handleAddCreative = () => {
    const newId = `crea-${Date.now().toString().slice(-4)}`;
    const newCrea = {
      id: newId,
      name: `Nouvelle Créa ${Object.keys(advisorSettings.creatives || {}).length + 1}`,
      ogTitle: "Mon Permis de Conduire Belge",
      ogDescription: "Obtenez votre permis de conduire facilement.",
      ogImageUrl: "",
      ogVideoUrl: ""
    };

    setAdvisorSettings(prev => ({
      ...prev,
      creatives: {
        ...(prev.creatives || {}),
        [newId]: newCrea
      }
    }));
  };

  // Update a field inside a custom creative
  const handleUpdateCreaField = (creaId, field, value) => {
    setAdvisorSettings(prev => {
      const currentCreatives = { ...(prev.creatives || {}) };
      if (currentCreatives[creaId]) {
        currentCreatives[creaId] = {
          ...currentCreatives[creaId],
          [field]: value
        };
      }
      return {
        ...prev,
        creatives: currentCreatives
      };
    });
  };

  // Upload file for a specific creative
  const handleCreaFileChange = async (e, creaId, type) => {
    const file = e.target.files?.[0];
    const url = await handleFileUpload(file, type, creaId);
    if (url) {
      handleUpdateCreaField(creaId, type === 'video' ? 'ogVideoUrl' : 'ogImageUrl', url);
    }
  };

  // Delete a creative
  const handleDeleteCreative = (creaId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette créa publicitaire ?")) return;
    setAdvisorSettings(prev => {
      const currentCreatives = { ...(prev.creatives || {}) };
      delete currentCreatives[creaId];
      return {
        ...prev,
        creatives: currentCreatives
      };
    });
  };

  // Copy tracking link to clipboard
  const handleCopyLink = (creaId) => {
    const siteUrl = "https://www.permisdeconduirebe.com";
    const fullLink = `${siteUrl}?crea=${creaId}`;
    navigator.clipboard.writeText(fullLink);
    alert(`Lien copié : ${fullLink}`);
  };

  const creativesList = Object.values(advisorSettings.creatives || {});

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-white">
      {settingsSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
          Paramètres et créas de marketing enregistrés avec succès !
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
            </div>
          </div>

          {/* Messenger Chat Config */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-sm font-bold text-white">Bulle de discussion Messenger</h5>
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
            </div>
          </div>

          {/* Default Open Graph Preview Manager */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h5 className="text-sm font-bold text-white">Créa par Défaut (Page d'accueil standard)</h5>
              <p className="text-[11px] text-slate-500 mt-1">Visuel de partage principal affiché si aucun paramètre spécial n'est défini dans l'URL.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titre du partage (og:title)</label>
                <input
                  type="text"
                  value={advisorSettings.ogTitle || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                  placeholder="Ex: Obtenez votre Permis de Conduire en Belgique en 1 clic"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description (og:description)</label>
                <textarea
                  value={advisorSettings.ogDescription || ''}
                  onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                  placeholder="Ex: Inscription rapide et sécurisée. Accompagnement de A à Z..."
                  rows={2}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white min-h-[50px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default Image Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Image d'illustration (og:image)</label>
                  <div className="flex items-center gap-3">
                    {advisorSettings.ogImageUrl && (
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={advisorSettings.ogImageUrl} alt="Illustration" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={advisorSettings.ogImageUrl || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogImageUrl: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 pr-20 text-xs focus:outline-none transition-colors text-white font-mono"
                        placeholder="Image URL"
                      />
                      <label className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                        {ogUploading ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "📤 Image"
                        )}
                        <input type="file" accept="image/*" onChange={handleDefaultImageChange} className="hidden" disabled={ogUploading} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Default Video Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Vidéo publicitaire (og:video - Optionnel)</label>
                  <div className="flex items-center gap-3">
                    {advisorSettings.ogVideoUrl && (
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-lg">🎬</span>
                      </div>
                    )}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={advisorSettings.ogVideoUrl || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, ogVideoUrl: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 pr-20 text-xs focus:outline-none transition-colors text-white font-mono"
                        placeholder="Video URL (.mp4)"
                      />
                      <label className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                        {videoUploading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "📤 Vidéo"
                        )}
                        <input type="file" accept="video/mp4" onChange={handleDefaultVideoChange} className="hidden" disabled={videoUploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Creatives List & A/B Tests */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <h5 className="text-sm font-bold text-white">🎯 Créas Publicitaires & Tests A/B</h5>
                <p className="text-[11px] text-slate-500 mt-1">Créez plusieurs visuels de partages simultanés et obtenez des liens uniques de campagnes publicitaires.</p>
              </div>
              <button
                type="button"
                onClick={handleAddCreative}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                + Ajouter une créa
              </button>
            </div>

            {creativesList.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">Aucune créa publicitaire personnalisée. Cliquez sur "Ajouter une créa" ci-dessus pour commencer.</p>
            ) : (
              <div className="space-y-6">
                {creativesList.map((crea, index) => (
                  <div key={crea.id} className="relative bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-4">
                    {/* Header: Title, Copy Link, Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold font-mono">#{index + 1}</span>
                        <input
                          type="text"
                          value={crea.name}
                          onChange={(e) => handleUpdateCreaField(crea.id, 'name', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 focus:outline-none font-bold text-sm text-white py-0.5 px-1 rounded transition-colors"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(crea.id)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] font-bold rounded-lg transition-all"
                        >
                          🔗 Copier le lien de pub
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCreative(crea.id)}
                          className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-lg transition-all"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>

                    {/* Creative parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {/* URL ID Slug */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Slug d'identifiant (dans le lien)</label>
                          <input
                            type="text"
                            value={crea.id}
                            onChange={(e) => handleUpdateCreaField(crea.id, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            placeholder="Ex: promo-mai"
                            className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                          />
                        </div>

                        {/* OG Title */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Titre spécifique (og:title)</label>
                          <input
                            type="text"
                            value={crea.ogTitle || ''}
                            onChange={(e) => handleUpdateCreaField(crea.id, 'ogTitle', e.target.value)}
                            placeholder="Titre de la publicité"
                            className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        {/* OG Description */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Description spécifique (og:description)</label>
                          <textarea
                            value={crea.ogDescription || ''}
                            onChange={(e) => handleUpdateCreaField(crea.id, 'ogDescription', e.target.value)}
                            placeholder="Description de la publicité"
                            rows={2}
                            className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Image & Video fields */}
                      <div className="space-y-3">
                        {/* Image Upload */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Image d'illustration (og:image)</label>
                          <div className="flex items-center gap-2">
                            {crea.ogImageUrl && (
                              <img src={crea.ogImageUrl} alt="Crea" className="w-10 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                            )}
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={crea.ogImageUrl || ''}
                                onChange={(e) => handleUpdateCreaField(crea.id, 'ogImageUrl', e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-2 pr-16 text-xs text-white font-mono"
                                placeholder="Image URL"
                              />
                              <label className="absolute right-1 top-1 bottom-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[9px] font-bold rounded flex items-center justify-center cursor-pointer">
                                {creaUploading[`${crea.id}_image`] ? (
                                  <div className="w-3 h-3 border border-slate-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  "Image"
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleCreaFileChange(e, crea.id, 'image')} className="hidden" disabled={creaUploading[`${crea.id}_image`]} />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Video Upload */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Vidéo d'illustration (og:video - Optionnel)</label>
                          <div className="flex items-center gap-2">
                            {crea.ogVideoUrl && (
                              <span className="text-base w-10 h-10 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center">🎬</span>
                            )}
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={crea.ogVideoUrl || ''}
                                onChange={(e) => handleUpdateCreaField(crea.id, 'ogVideoUrl', e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-2 pr-16 text-xs text-white font-mono"
                                placeholder="Vidéo URL (.mp4)"
                              />
                              <label className="absolute right-1 top-1 bottom-1 px-2 bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-bold rounded flex items-center justify-center cursor-pointer">
                                {creaUploading[`${crea.id}_video`] ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  "Vidéo"
                                )}
                                <input type="file" accept="video/mp4" onChange={(e) => handleCreaFileChange(e, crea.id, 'video')} className="hidden" disabled={creaUploading[`${crea.id}_video`]} />
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* URL Preview indicator */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 block">Lien généré : <code className="text-emerald-400 font-mono select-all">https://www.permisdeconduirebe.com/?crea={crea.id}</code></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            "Enregistrer les Paramètres & Créas ➔"
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminMarketing;
