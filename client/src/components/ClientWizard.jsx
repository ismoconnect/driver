import React from 'react';

export default function ClientWizard({
  formData,
  setFormData,
  wizardStep,
  setWizardStep,
  wizardError,
  setWizardError,
  uploads,
  uploading,
  theme,
  selectedPath,
  setSelectedPath,
  advisor,
  mandatAccepted,
  setMandatAccepted,
  handleSubmitDemand,
  handleInputChange,
  uploadToCloudinary
}) {
  
  const isMobile = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  const validateStep1 = () => {
    setWizardError('');
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.birthDate || !formData.phone?.trim() || !formData.address?.trim() || !formData.nationalRegister?.trim()) {
      setWizardError('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    // Validation du numéro de registre national belge
    const cleanNr = formData.nationalRegister.replace(/[^\d]/g, '');
    if (cleanNr.length < 11) {
      setWizardError('Format de Registre National Belge invalide (Ex. 95.05.23-123.45). Doit contenir 11 chiffres.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setWizardError('');
    const missing = [];
    if (!uploads.idFront) missing.push("Carte d'Identité (Recto)");
    if (!uploads.idBack) missing.push("Carte d'Identité (Verso)");
    if (!uploads.photo) missing.push("Photo d'Identité Récente");
    if (!uploads.signature) missing.push("Signature Numérisée");

    if (missing.length > 0) {
      setWizardError(`Veuillez téléverser les pièces requises : ${missing.join(', ')}.`);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setWizardError('');
    if (!selectedPath) {
      setWizardError('Veuillez choisir votre formule d\'obtention.');
      return false;
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmitDemand} className="flex-1 flex flex-col justify-start gap-3 overflow-hidden min-h-0">
      <div className="overflow-y-auto scrollbar-hidden">
        {/* Header */}
        <div className="border-b border-white/10 pb-2 mb-3 md:pb-5 md:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-2xl font-display font-extrabold text-white">
                Initier ma Demande Officielle
              </h2>
              <p className="text-white/50 text-[10px] sm:text-xs mt-1">
                {wizardStep === 1 && "Étape 1 sur 4 — Vos informations personnelles d'identité."}
                {wizardStep === 2 && "Étape 2 sur 4 — Pièces justificatives (carte d'identité, photo, signature)."}
                {wizardStep === 3 && "Étape 3 sur 4 — Votre parcours et configuration du permis souhaité."}
                {wizardStep === 4 && "Étape 4 sur 4 — Signature du mandat pour finaliser votre dossier officiel."}
              </p>
            </div>
            {/* Step Bubbles */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                    wizardStep === s 
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/30 scale-105' 
                      : wizardStep > s 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white/5 border border-white/10 text-white/30'
                  }`}
                >
                  {wizardStep > s ? '✓' : s}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 sm:mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-orange to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {wizardError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-2xl mt-4 flex items-start gap-2.5 shadow-sm animate-fadeIn">
            <span className="text-sm flex-shrink-0">⚠️</span>
            <span>{wizardError}</span>
          </div>
        )}

        {/* STEP 1: IDENTITY */}
        {wizardStep === 1 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 animate-[bubbleIn_0.4s_ease-out]">
            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Prénom</label>
              <input 
                required
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ex. Sarah" 
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nom de famille</label>
              <input 
                required
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ex. Peeters" 
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date de naissance</label>
              <input 
                required
                type="date" 
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white/80"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Téléphone</label>
              <input 
                required
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex. +32 495 12 34 56" 
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Adresse de résidence en Belgique</label>
              <input 
                required
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rue de la Loi 16, 1000 Bruxelles" 
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Numéro de Registre National Belge (11 chiffres)
              </label>
              <input 
                required
                type="text" 
                name="nationalRegister"
                value={formData.nationalRegister}
                onChange={handleInputChange}
                placeholder="Ex. 95.05.23-123.45" 
                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors text-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DOCUMENT UPLOADS */}
        {wizardStep === 2 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-[bubbleIn_0.4s_ease-out]">
            {[
              { field: 'idFront', label: 'Carte d\'Identité (Recto)', badge: 'Requis Front', accept: 'image/*,application/pdf', emoji: '🪪' },
              { field: 'idBack',  label: 'Carte d\'Identité (Verso)',  badge: 'Requis Back',  accept: 'image/*,application/pdf', emoji: '🪪' },
              { field: 'photo',   label: 'Photo d\'Identité Récente',  badge: 'Requis Officiel', accept: 'image/*', emoji: '📸' },
              { field: 'signature', label: 'Signature Numérisée (Fond blanc)', badge: 'Signature', accept: 'image/*', emoji: '✍️' },
            ].map(({ field, label, badge, accept, emoji }) => (
              <div key={field} className={`bg-slate-950/40 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-2 sm:p-3 flex flex-col justify-between`}>
                <div>
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">{badge}</span>
                  <h4 className="text-white font-semibold text-[10px] sm:text-xs mt-0.5 leading-tight">{label}</h4>
                </div>

                <div className="mt-2 sm:mt-4">
                  {uploading[field] ? (
                    <div className="border border-dashed border-brand-orange/40 rounded-xl p-3 sm:p-6 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-6 sm:h-6 border border-brand-orange border-t-transparent rounded-full animate-spin" />
                      <span className="text-[8px] sm:text-[10px] text-white/50">Chargement...</span>
                    </div>
                  ) : uploads[field] ? (
                    <div className="relative group rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900">
                      {uploads[field].match(/\.(jpg|jpeg|png|gif|webp)$/i) || uploads[field].includes('cloudinary') ? (
                        <img
                          src={uploads[field]}
                          alt={label}
                          className="w-full h-14 sm:h-20 object-cover"
                        />
                      ) : (
                        <div className="w-full h-14 sm:h-20 flex items-center justify-center bg-emerald-500/10">
                          <span className="text-lg sm:text-3xl">📄</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2">
                        <a href={uploads[field]} target="_blank" rel="noopener noreferrer"
                          className="text-[8px] sm:text-[10px] font-bold text-white bg-white/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg hover:bg-white/30">
                          Voir ↗
                        </a>
                        <label className="text-[8px] sm:text-[10px] font-bold text-white bg-brand-orange/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg hover:bg-brand-orange cursor-pointer">
                          Changer
                          <input type="file" accept={accept} className="hidden"
                            onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                        </label>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1">
                        <span className="text-[8px] sm:text-[9px] text-white font-bold font-sans">✓ Prêt</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/15 hover:border-brand-orange rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-colors gap-1.5 sm:gap-2">
                      <span className="hidden sm:block text-xl text-white/30">{emoji}</span>
                      <span className="hidden sm:block text-[10px] text-white/55 font-medium">
                        {isMobile() ? 'Choisir' : 'Glisser ou cliquer'}
                      </span>

                      {isMobile() ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <label className="relative cursor-pointer w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold rounded-lg transition-colors">
                            📁 Fichier
                            <input type="file" accept={accept} className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                          </label>
                          {accept.includes('image') && (
                            <label className="relative cursor-pointer w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange text-[9px] font-bold rounded-lg transition-colors border border-brand-orange/30">
                              📷 Photo
                              <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      ) : (
                        <label className="relative cursor-pointer w-full">
                          <input type="file" accept={accept} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                          <span className="block text-[10px] font-bold text-brand-orange underline underline-offset-2">
                            Parcourir...
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: EXPERIENCE & CONFIG */}
        {wizardStep === 3 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-[bubbleIn_0.4s_ease-out]">
            <div className={`col-span-2 bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-xl p-2 sm:p-2.5`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-orange mb-1">🛣️ Circuit d'obtention</p>
              <div className="flex flex-wrap gap-1">
                {[
                  { icon: '📋', label: 'Affiliation Candidat', done: true },
                  { icon: '📖', label: 'Examen Théorique', done: selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct', active: selectedPath === 'theorique' || !selectedPath },
                  { icon: '👁️', label: 'Perception de Risque', done: selectedPath === 'pratique' || selectedPath === 'direct', active: selectedPath === 'perception', locked: selectedPath === 'theorique' || !selectedPath },
                  { icon: '🚗', label: 'Examen Pratique', done: selectedPath === 'direct', active: selectedPath === 'pratique', locked: selectedPath === 'perception' || selectedPath === 'theorique' || !selectedPath },
                  { icon: '🏆', label: 'Permis Définitif', active: selectedPath === 'direct', locked: selectedPath !== 'direct' || !selectedPath },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[9.5px] font-semibold border ${
                    item.done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : item.active ? 'bg-brand-orange/15 border-brand-orange/40 text-brand-orange animate-pulse' 
                      : 'bg-white/5 border-white/10 text-white/30'
                  }`}>
                    <span>{item.icon}</span>
                    <span className="hidden xs:inline">{item.label}</span>
                    {item.done && <span>✓</span>}
                    {item.locked && <span>🔒</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Catégorie de permis
                  </label>
                  <select
                    name="licenseCategory"
                    value={formData.licenseCategory || 'Permis B (Voiture)'}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-colors text-white"
                  >
                    <optgroup label="Voitures & Véhicules légers" className="bg-slate-900 text-white font-bold">
                      <option value="Permis B (Voiture)">Permis B (Voiture)</option>
                      <option value="Permis B96 (Voiture + Remorque)">Permis B96 (Voiture + Remorque)</option>
                      <option value="Permis BE (Voiture + Remorque lourde)">Permis BE (Voiture + Remorque lourde)</option>
                    </optgroup>
                    <optgroup label="Deux-roues & Motos" className="bg-slate-900 text-white font-bold">
                      <option value="Permis AM (Cyclomoteur 50cc)">Permis AM (Cyclomoteur 50cc)</option>
                      <option value="Permis A1 (Moto légère 125cc)">Permis A1 (Moto légère 125cc)</option>
                      <option value="Permis A2 (Moto moyenne ≤ 35kW)">Permis A2 (Moto moyenne ≤ 35kW)</option>
                      <option value="Permis A (Moto lourde > 35kW)">Permis A (Moto lourde &gt; 35kW)</option>
                    </optgroup>
                    <optgroup label="Camions (Transport de marchandises)" className="bg-slate-900 text-white font-bold">
                      <option value="Permis C1 (Camion 3.5t - 7.5t)">Permis C1 (Camion 3.5t - 7.5t)</option>
                      <option value="Permis C1E (Camion 3.5t - 7.5t + Remorque)">Permis C1E (Camion 3.5t - 7.5t + Remorque)</option>
                      <option value="Permis C (Camion > 3.5t)">Permis C (Camion &gt; 3.5t)</option>
                      <option value="Permis CE (Camion + Remorque lourde)">Permis CE (Camion + Remorque lourde)</option>
                    </optgroup>
                    <optgroup label="Autobus & Autocars" className="bg-slate-900 text-white font-bold">
                      <option value="Permis D1 (Minibus max 16 passagers)">Permis D1 (Minibus max 16 passagers)</option>
                      <option value="Permis D1E (Minibus + Remorque)">Permis D1E (Minibus + Remorque)</option>
                      <option value="Permis D (Bus / Autocar)">Permis D (Bus / Autocar)</option>
                      <option value="Permis DE (Bus + Remorque lourde)">Permis DE (Bus + Remorque lourde)</option>
                    </optgroup>
                    <optgroup label="Autres" className="bg-slate-900 text-white font-bold">
                      <option value="Permis G (Tracteur agricole)">Permis G (Tracteur agricole)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Échecs à l'examen
                  </label>
                  <select
                    name="failedAttempts"
                    value={formData.failedAttempts}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-colors text-white"
                  >
                    <option value="Jamais">Aucun</option>
                    <option value="1 fois">1 échec</option>
                    <option value="2 fois">2 échecs</option>
                    <option value="3 fois ou plus">3 échecs ou +</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Type de transmission
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transmission: 'Manuel' }))}
                      className={`py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
                        formData.transmission === 'Manuel'
                          ? 'border-brand-orange bg-brand-orange/10 text-white'
                          : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                      }`}
                    >
                      Manuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transmission: 'Automatique' }))}
                      className={`py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
                        formData.transmission === 'Automatique'
                          ? 'border-brand-orange bg-brand-orange/10 text-white'
                          : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Formule d'obtention souhaitée
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPath('theorique')}
                  className={`p-1.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'theorique'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[10px] font-bold text-white flex items-center gap-0.5">
                      <span>📖</span> <span className="truncate">Théorique</span>
                    </h4>
                    <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phase 2 — Examen Théorique.</p>
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 2</span>
                    <span className="text-[10px] font-black text-white">{advisor.theoriqueAmount || "550,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('perception')}
                  className={`p-1.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'perception'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[10px] font-bold text-white flex items-center gap-0.5">
                      <span>👁️</span> <span className="truncate">Perception</span>
                    </h4>
                    <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phase 3 — Perception du Risque.</p>
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 3</span>
                    <span className="text-[10px] font-black text-white">{advisor.perceptionAmount || "350,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('pratique')}
                  className={`p-1.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'pratique'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[10px] font-bold text-white flex items-center gap-0.5">
                      <span>🚗</span> <span className="truncate">Pratique</span>
                    </h4>
                    <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phases 2-4 — Dispense pratique.</p>
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 4</span>
                    <span className="text-[10px] font-black text-white">{advisor.pratiqueAmount || "2100,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('direct')}
                  className={`p-1.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'direct'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[10px] font-bold text-white flex items-center gap-0.5">
                      <span>🏆</span> <span className="truncate">Permis Direct</span>
                    </h4>
                    <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phases 2–5 — Homologation complète.</p>
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 5</span>
                    <span className="text-[10px] font-black text-white">{advisor.directLicenseAmount || "1200,00 €"}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MANDAT DE LÉGALITÉ & CONFIRMATION */}
        {wizardStep === 4 && (
          <div className="grid grid-cols-2 gap-2 animate-[bubbleIn_0.4s_ease-out]">
            <div className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-2.5`}>
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-brand-orange mb-2 flex items-center gap-1">
                <span>📋</span> Récapitulatif
              </h4>
              <div className="space-y-1.5 text-[9px]">
                <div>
                  <span className="text-white/40 block text-[8px]">Candidat</span>
                  <span className="text-white font-semibold truncate block">{formData.firstName} {formData.lastName}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px]">Date de naissance</span>
                  <span className="text-white font-semibold">{formData.birthDate || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px]">Téléphone</span>
                  <span className="text-white font-semibold">{formData.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px]">Permis souhaité</span>
                  <span className="text-brand-orange font-semibold">{formData.licenseCategory?.startsWith('Permis') ? formData.licenseCategory : `Permis ${formData.licenseCategory || 'B'}`} — {formData.transmission}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px]">Adresse</span>
                  <span className="text-white font-semibold truncate block">{formData.address || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px]">Pièces justificatives</span>
                  <span className="text-emerald-400 font-semibold">{Object.values(uploads).filter(Boolean).length} / 4 ✓</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-brand-orange/5 border border-brand-orange/25 rounded-2xl p-2.5 flex-1">
                <h4 className="font-bold text-[9px] text-brand-orange flex items-center gap-1 mb-1.5 leading-tight">
                  🛡️ Mandat SPF Belgique
                </h4>
                <p className="text-[8.5px] text-white/70 leading-snug">
                  En soumettant ce dossier, vous conférez mandat de représentation pour l'enregistrement officiel de votre équivalence de permis auprès du SPF Mobilité. <span className="text-brand-orange font-semibold">Aucun examen requis.</span>
                </p>
              </div>

              <label className="flex items-start gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-brand-orange/30 p-2.5 rounded-2xl cursor-pointer transition-all duration-300">
                <input
                  type="checkbox"
                  required
                  checked={mandatAccepted}
                  onChange={(e) => setMandatAccepted(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-slate-950 accent-brand-orange flex-shrink-0 cursor-pointer"
                />
                <span className="text-[8.5px] text-white/80 leading-snug select-none min-w-0">
                  Je certifie l'exactitude de ces informations et donne mandat à <strong>Mon Permis</strong>. <span className="text-brand-orange font-bold">(Requis)</span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Actions buttons */}
      <div className="flex-shrink-0 mt-2.5 pt-1.5 border-t border-white/10 flex justify-between">
        {wizardStep > 1 ? (
          <button
            type="button"
            onClick={() => setWizardStep(prev => prev - 1)}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Retour
          </button>
        ) : (
          <div />
        )}

        {wizardStep < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (wizardStep === 1 && validateStep1()) setWizardStep(2);
              else if (wizardStep === 2 && validateStep2()) setWizardStep(3);
              else if (wizardStep === 3 && validateStep3()) setWizardStep(4);
            }}
            className="px-6 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Continuer ➔
          </button>
        ) : (
          <button
            type="submit"
            disabled={!mandatAccepted}
            className={`px-6 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
              mandatAccepted 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer hover:scale-[1.02]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Transmettre ma Demande Agréée ➔
          </button>
        )}
      </div>
    </form>
  );
}
