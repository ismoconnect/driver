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
  uploadToCloudinary,
  deleteDocument
}) {
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [previewLabel, setPreviewLabel] = React.useState('');
  
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const licenseGroups = [
    {
      label: "Voitures & Véhicules légers",
      options: [
        { value: "Permis B (Voiture)", label: "Permis B (Voiture)" },
        { value: "Permis B96 (Voiture + Remorque)", label: "Permis B96 (Voiture + Remorque)" },
        { value: "Permis BE (Voiture + Remorque lourde)", label: "Permis BE (Voiture + Remorque lourde)" }
      ]
    },
    {
      label: "Deux-roues & Motos",
      options: [
        { value: "Permis AM (Cyclomoteur 50cc)", label: "Permis AM (Cyclomoteur 50cc)" },
        { value: "Permis A1 (Moto légère 125cc)", label: "Permis A1 (Moto légère 125cc)" },
        { value: "Permis A2 (Moto moyenne ≤ 35kW)", label: "Permis A2 (Moto moyenne ≤ 35kW)" },
        { value: "Permis A (Moto lourde > 35kW)", label: "Permis A (Moto lourde > 35kW)" }
      ]
    },
    {
      label: "Camions (Transport de marchandises)",
      options: [
        { value: "Permis C1 (Camion 3.5t - 7.5t)", label: "Permis C1 (Camion 3.5t - 7.5t)" },
        { value: "Permis C1E (Camion 3.5t - 7.5t + Remorque)", label: "Permis C1E (Camion 3.5t - 7.5t + Remorque)" },
        { value: "Permis C (Camion > 3.5t)", label: "Permis C (Camion > 3.5t)" },
        { value: "Permis CE (Camion + Remorque lourde)", label: "Permis CE (Camion + Remorque lourde)" }
      ]
    },
    {
      label: "Autobus & Autocars",
      options: [
        { value: "Permis D1 (Minibus max 16 passagers)", label: "Permis D1 (Minibus max 16 passagers)" },
        { value: "Permis D1E (Minibus + Remorque)", label: "Permis D1E (Minibus + Remorque)" },
        { value: "Permis D (Bus / Autocar)", label: "Permis D (Bus / Autocar)" },
        { value: "Permis DE (Bus + Remorque lourde)", label: "Permis DE (Bus + Remorque lourde)" }
      ]
    },
    {
      label: "Autres",
      options: [
        { value: "Permis G (Tracteur agricole)", label: "Permis G (Tracteur agricole)" }
      ]
    }
  ];

  const handleSelectCategory = (value) => {
    handleInputChange({ target: { name: 'licenseCategory', value } });
    setIsCategoryOpen(false);
  };
  
  React.useEffect(() => {
    // Scroll scrollable containers to top on step change
    const scrollableContainers = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableContainers.forEach(el => {
      el.scrollTop = 0;
    });
    const dashboardContainer = document.querySelector('.h-screen');
    if (dashboardContainer) {
      dashboardContainer.scrollTop = 0;
    }
    window.scrollTo({ top: 0 });
  }, [wizardStep]);

  const isMobile = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  const validateStep1 = () => {
    setWizardError('');
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.birthDate || !formData.phone?.trim() || !formData.address?.trim()) {
      setWizardError('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setWizardError('');
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
    <form onSubmit={handleSubmitDemand} className="flex-1 flex flex-col justify-start gap-3 overflow-hidden md:overflow-visible min-h-0 md:min-h-fit pb-2 md:pb-16">
      <div className="overflow-y-auto md:overflow-y-visible">
        {/* Header */}
        <div className="border-b-2 border-white/30 pb-2 mb-3 md:pb-5 md:mb-6">
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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 gap-y-5 sm:gap-y-8 animate-[bubbleIn_0.4s_ease-out]">
            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-2.5">Prénom</label>
              <input 
                required
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ex. Sarah" 
                className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm md:text-base focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-2.5">Nom de famille</label>
              <input 
                required
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ex. Peeters" 
                className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm md:text-base focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-2.5">Date de naissance</label>
              <input 
                required
                type="date" 
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm md:text-base focus:outline-none transition-colors text-white/80"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-2.5">Téléphone</label>
              <input 
                required
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex. +32 495 12 34 56" 
                className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm md:text-base focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-2.5">Adresse</label>
              <input 
                required
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rue de la Loi 16, 1000 Bruxelles" 
                className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm md:text-base focus:outline-none transition-colors text-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DOCUMENT UPLOADS */}
        {wizardStep === 2 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-[bubbleIn_0.4s_ease-out]">
            <div className="col-span-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] sm:text-xs md:text-sm p-3 rounded-2xl mb-2 flex items-start gap-2.5 shadow-sm">
              <span className="text-sm flex-shrink-0">💡</span>
              <span><strong>Optionnel pour l'instant :</strong> Vous pouvez continuer sans téléverser vos documents maintenant et les ajouter plus tard depuis votre espace candidat.</span>
            </div>
            {[
              { field: 'idFront', label: 'Carte d\'Identité (Recto)', badge: 'Optionnel', accept: 'image/*,application/pdf', emoji: '🪪' },
              { field: 'idBack',  label: 'Carte d\'Identité (Verso)',  badge: 'Optionnel',  accept: 'image/*,application/pdf', emoji: '🪪' },
              { field: 'photo',   label: 'Photo d\'Identité Récente',  badge: 'Optionnel', accept: 'image/*', emoji: '📸' },
              { field: 'signature', label: 'Signature Numérisée (Fond blanc)', badge: 'Optionnel', accept: 'image/*', emoji: '✍️' },
            ].map(({ field, label, badge, accept, emoji }) => (
              <div key={field} className={`bg-slate-950/40 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-2 sm:p-3 flex flex-col justify-between`}>
                <div>
                  <span className="text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">{badge}</span>
                  <div className="flex items-center gap-1.5 mt-0.5 mb-2">
                    <span className="text-sm sm:text-base">{emoji}</span>
                    <h5 className="font-bold text-[10px] sm:text-xs text-white leading-tight">{label}</h5>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-auto">
                  {uploads[field] ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between bg-slate-950/60 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs text-emerald-400 font-medium w-full">
                        <span className="truncate max-w-[80px]">✓ Ajouté</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(uploads[field]);
                              setPreviewLabel(label);
                            }}
                            className="text-[9px] font-bold text-white bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition cursor-pointer"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDocument(field)}
                            className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20 transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept={accept}
                        disabled={uploading[field]}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadToCloudinary(field, file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <button
                        type="button"
                        disabled={uploading[field]}
                        className={`w-full py-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${
                          uploading[field]
                            ? 'bg-slate-900 border-white/10 text-white/40 cursor-wait'
                            : 'bg-white/5 border-white/15 hover:border-brand-orange hover:bg-brand-orange/5 text-white/80'
                        }`}
                      >
                        {uploading[field] ? 'Envoi...' : 'Ajouter ➔'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: PATH SELECTION */}
        {wizardStep === 3 && (
          <div className="flex flex-col gap-4 animate-[bubbleIn_0.4s_ease-out]">
            {/* Interactive obtention visual circuit component on step 3 */}
            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3">
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange mb-2.5 flex items-center gap-1">
                <span>🗺️</span> Circuit d'obtention
              </h4>
              <div className="flex items-center justify-between gap-0.5 xs:gap-1 max-w-lg mx-auto">
                {[
                  { num: 1, label: 'Affiliation', done: true },
                  { num: 2, label: 'Théorique', done: selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct' },
                  { num: 3, label: 'Perception', done: selectedPath === 'pratique' || selectedPath === 'direct', locked: selectedPath === 'theorique' },
                  { num: 4, label: 'Pratique', done: selectedPath === 'direct', locked: selectedPath === 'theorique' || selectedPath === 'perception' },
                  { num: 5, label: 'Permis', locked: selectedPath !== 'direct' }
                ].map((item, index) => (
                  <div 
                    key={item.num}
                    className={`flex-1 flex flex-col items-center justify-center p-1 py-1.5 xs:p-2 rounded-lg border text-center transition-all ${
                      item.done 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : item.locked
                        ? 'bg-white/5 border-white/5 text-white/30'
                        : 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange font-bold animate-pulse'
                    }`}
                  >
                    <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] uppercase tracking-wider block opacity-75">{item.label}</span>
                    {item.done && <span className="text-[9px] sm:text-xs">✓</span>}
                    {item.locked && <span className="text-[9px] sm:text-xs">🔒</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                <div>
                  <label className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Catégorie de permis
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="w-full bg-slate-950/80 border border-white/40 rounded-xl px-3 py-2.5 sm:py-3.5 text-xs md:text-[15px] focus:outline-none transition-colors text-white flex items-center justify-between text-left cursor-pointer"
                    >
                      <span>{formData.licenseCategory || 'Permis B (Voiture)'}</span>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-slate-900 border border-white/15 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto py-1.5">
                        {licenseGroups.map((group, groupIdx) => (
                          <div key={groupIdx} className="mb-2 last:mb-0">
                            <div className="px-3 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-950/30">
                              {group.label}
                            </div>
                            {group.options.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelectCategory(option.value)}
                                className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-brand-orange/15 transition-colors flex items-center justify-between ${
                                  (formData.licenseCategory || 'Permis B (Voiture)') === option.value
                                    ? 'bg-brand-orange/10 text-brand-orange font-bold'
                                    : 'text-white/80'
                                }`}
                              >
                                <span>{option.label}</span>
                                {(formData.licenseCategory || 'Permis B (Voiture)') === option.value && (
                                  <span className="text-brand-orange font-bold">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Échecs à l'examen
                  </label>
                  <select
                    name="failedAttempts"
                    value={formData.failedAttempts}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-white/40 focus:border-brand-orange rounded-xl px-3 py-2.5 sm:py-3.5 text-xs md:text-[15px] focus:outline-none transition-colors text-white"
                  >
                    <option value="Jamais">Aucun</option>
                    <option value="1 fois">1 échec</option>
                    <option value="2 fois">2 échecs</option>
                    <option value="3 fois ou plus">3 échecs ou +</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Type de transmission
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transmission: 'Manuel' }))}
                      className={`py-2.5 sm:py-3.5 rounded-xl border text-xs md:text-[15px] font-semibold transition-all duration-300 cursor-pointer ${
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
                      className={`py-2.5 sm:py-3.5 rounded-xl border text-xs md:text-[15px] font-semibold transition-all duration-300 cursor-pointer ${
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

              <label className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                Formule d'obtention souhaitée
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPath('theorique')}
                  className={`p-3 md:p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'theorique'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[11px] md:text-base font-bold text-white flex items-center gap-1">
                      <span>📖</span> <span className="truncate">Théorique</span>
                    </h4>
                    <p className="text-[8px] md:text-sm text-white/50 leading-tight mt-1">Phase 2 — Examen Théorique.</p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7.5px] md:text-xs uppercase font-bold text-brand-orange">Phase 2</span>
                    <span className="text-[11px] md:text-base font-black text-white">{advisor.theoriqueAmount || "550,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('perception')}
                  className={`p-3 md:p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'perception'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[11px] md:text-base font-bold text-white flex items-center gap-1">
                      <span>👁️</span> <span className="truncate">Perception</span>
                    </h4>
                    <p className="text-[8px] md:text-sm text-white/50 leading-tight mt-1">Phase 3 — Perception du Risque.</p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7.5px] md:text-xs uppercase font-bold text-brand-orange">Phase 3</span>
                    <span className="text-[11px] md:text-base font-black text-white">{advisor.perceptionAmount || "350,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('pratique')}
                  className={`p-3 md:p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'pratique'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[11px] md:text-base font-bold text-white flex items-center gap-1">
                      <span>🚗</span> <span className="truncate">Pratique</span>
                    </h4>
                    <p className="text-[8px] md:text-sm text-white/50 leading-tight mt-1">Phases 2-4 — Dispense pratique.</p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7.5px] md:text-xs uppercase font-bold text-brand-orange">Phase 4</span>
                    <span className="text-[11px] md:text-base font-black text-white">{advisor.pratiqueAmount || "2100,00 €"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPath('direct')}
                  className={`p-3 md:p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedPath === 'direct'
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-lg'
                      : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h4 className="text-[11px] md:text-base font-bold text-white flex items-center gap-1">
                      <span>🏆</span> <span className="truncate">Permis Direct</span>
                    </h4>
                    <p className="text-[8px] md:text-sm text-white/50 leading-tight mt-1">Phases 2–5 — Homologation complète.</p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center w-full">
                    <span className="text-[7.5px] md:text-xs uppercase font-bold text-brand-orange">Phase 5</span>
                    <span className="text-[11px] md:text-base font-black text-white">{advisor.directLicenseAmount || "1200,00 €"}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MANDAT DE LÉGALITÉ & CONFIRMATION */}
        {wizardStep === 4 && (
          <div className="grid grid-cols-2 gap-4 animate-[bubbleIn_0.4s_ease-out]">
            <div className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-4 md:p-5`}>
              <h4 className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-brand-orange mb-3 flex items-center gap-1.5">
                <span>📋</span> Récapitulatif
              </h4>
              <div className="space-y-2 md:space-y-3 text-[10px] md:text-sm">
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Candidat</span>
                  <span className="text-white font-semibold truncate block md:text-base">{formData.firstName} {formData.lastName}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Date de naissance</span>
                  <span className="text-white font-semibold md:text-base">{formData.birthDate || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Téléphone</span>
                  <span className="text-white font-semibold md:text-base">{formData.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Permis souhaité</span>
                  <span className="text-brand-orange font-semibold md:text-base">{formData.licenseCategory?.startsWith('Permis') ? formData.licenseCategory : `Permis ${formData.licenseCategory || 'B'}`} — {formData.transmission}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Adresse</span>
                  <span className="text-white font-semibold truncate block md:text-base">{formData.address || '—'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[8px] md:text-xs">Pièces justificatives</span>
                  <span className="text-emerald-400 font-semibold md:text-base">{Object.values(uploads).filter(Boolean).length} / 4 ✓</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-brand-orange/5 border border-brand-orange/25 rounded-2xl p-4 md:p-5 flex-1">
                <h4 className="font-bold text-[10px] md:text-sm text-brand-orange flex items-center gap-1.5 mb-2 md:mb-3 leading-tight">
                  🛡️ Mandat SPF Belgique
                </h4>
                <p className="text-[9.5px] md:text-sm text-white/70 leading-relaxed">
                  En soumettant ce dossier, vous conférez mandat de représentation pour l'enregistrement officiel de votre équivalence de permis auprès du SPF Mobilité. <span className="text-brand-orange font-semibold">Aucun examen requis.</span>
                </p>
              </div>

              <label className="flex items-start gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-brand-orange/30 p-3 md:p-4 rounded-2xl cursor-pointer transition-all duration-300">
                <input
                  type="checkbox"
                  required
                  checked={mandatAccepted}
                  onChange={(e) => setMandatAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded border-white/20 bg-slate-950 accent-brand-orange flex-shrink-0 cursor-pointer"
                />
                <span className="text-[9.5px] md:text-sm text-white/80 leading-relaxed select-none min-w-0">
                  Je certifie l'exactitude de ces informations et donne mandat à <strong>Mon Permis</strong>. <span className="text-brand-orange font-bold">(Requis)</span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Actions buttons */}
      <div className="flex-shrink-0 mt-6 pt-4 border-t-2 border-white/30 flex items-center justify-start gap-4">
        {wizardStep < 4 ? (
          <button
            key="btn-continue"
            type="button"
            onClick={() => {
              if (wizardStep === 1 && validateStep1()) setWizardStep(2);
              else if (wizardStep === 2 && validateStep2()) setWizardStep(3);
              else if (wizardStep === 3 && validateStep3()) setWizardStep(4);
            }}
            className="px-6 py-2 md:px-8 md:py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-slate-950 text-xs md:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            Continuer ➔
          </button>
        ) : (
          <button
            key="btn-submit"
            type="submit"
            disabled={!mandatAccepted}
            className={`px-6 py-2 md:px-8 md:py-3 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all ${
              mandatAccepted 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer hover:scale-[1.02]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Transmettre ma Demande Agréée ➔
          </button>
        )}

        {wizardStep > 1 && (
          <button
            type="button"
            onClick={() => setWizardStep(prev => prev - 1)}
            className="px-4 py-2 md:px-5 md:py-3 text-xs md:text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Retour
          </button>
        )}
      </div>
      {/* Lightbox globale */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-bold cursor-pointer bg-transparent border-0"
            >
              ✕ Fermer
            </button>
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-bold text-sm">{previewLabel}</span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-3 py-1.5 rounded-lg hover:bg-brand-orange/20 transition-colors cursor-pointer text-center"
                >
                  ⬇️ Ouvrir / Télécharger
                </a>
              </div>
              {previewUrl.toLowerCase().includes('.pdf') ? (
                <div className="w-full h-[70vh] bg-slate-950">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Aperçu du document"
                  />
                </div>
              ) : (
                <img src={previewUrl} alt={previewLabel} className="w-full max-h-[70vh] object-contain bg-slate-950 p-4" />
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
