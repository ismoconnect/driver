import React from 'react';

export default function ClientDocuments({
  uploads = {},
  uploading = {},
  uploadToCloudinary,
  theme,
  isSubmitted = false,
  applicationStatus = 'new',
  rejectedDocs = {},
  setActiveTab,
  setWizardStep,
  deleteDocument
}) {
  const isMobile = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  // Detect if any document has been rejected by the admin
  const hasRejectedDocs = Object.keys(rejectedDocs).length > 0 && Object.values(rejectedDocs).some(msg => msg && msg.trim() !== '');

  // Render Lock Screen if no request has been submitted yet (or reset)
  if (!isSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12 animate-[bubbleIn_0.4s_ease-out] min-h-[450px]">
        <div className="w-20 h-20 rounded-full bg-slate-950/60 border-2 border-dashed border-white/20 flex items-center justify-center text-3xl mb-6 shadow-xl">
          📂
        </div>
        <h3 className="text-white font-display font-extrabold text-xl sm:text-2xl mb-2">
          Aucun Document Disponible
        </h3>
        <p className="text-white/50 text-sm max-w-md mb-8 leading-relaxed">
          Votre dossier d'homologation officielle est actuellement en attente d'initialisation. Afin d'activer cet espace sécurisé et de procéder au dépôt de vos pièces justificatives, veuillez compléter et valider votre demande officielle.
        </p>
        <button
          onClick={() => {
            setActiveTab('wizard');
            if (setWizardStep) setWizardStep(1);
          }}
          className="px-8 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-slate-950 text-sm font-bold shadow-md shadow-brand-orange/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          Commencer ma demande ➔
        </button>
      </div>
    );
  }

  const totalUploaded = Object.values(uploads || {}).filter(Boolean).length;

  // Render Lock Screen if submitted but pending processing (no rejected docs, not completed, and all 4 docs are uploaded)
  if (isSubmitted && applicationStatus !== 'completed' && !hasRejectedDocs && totalUploaded === 4) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12 animate-[bubbleIn_0.4s_ease-out] min-h-[450px]">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 rounded-full border-2 border-brand-orange/30 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-slate-950/60 border-2 border-brand-orange flex items-center justify-center text-2xl shadow-xl">
            ⏳
          </div>
        </div>
        <h3 className="text-white font-display font-extrabold text-xl sm:text-2xl mb-2">
          Documents en cours d'analyse
        </h3>
        <p className="text-white/50 text-sm max-w-lg mb-8 leading-relaxed">
          Votre demande a bien été transmise à votre conseiller dédié. Vos pièces justificatives sont actuellement en cours d'examen et de validation auprès du SPF Mobilité Belgique. Aucune action n'est requise de votre part pour le moment.
        </p>

        {/* Stepper Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-2xl w-full bg-slate-950/40 border-2 border-white/10 rounded-3xl p-6 text-left">
          {[
            { label: "Demande envoyée", status: "done", desc: "Votre dossier a été enregistré." },
            { label: "Validation des pièces", status: "active", desc: "Analyse en cours par votre conseiller." },
            { label: "Homologation SPF", status: "pending", desc: "Traitement par l'administration." },
            { label: "Disponible", status: "pending", desc: "Retrait de votre document." }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col gap-1.5 relative">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.status === 'done' ? 'bg-emerald-500 text-white' :
                  step.status === 'active' ? 'bg-brand-orange text-slate-950 animate-pulse' :
                  'bg-white/5 border border-white/10 text-white/30'
                }`}>
                  {step.status === 'done' ? '✓' : idx + 1}
                </div>
                <span className={`text-[11px] font-bold uppercase ${
                  step.status === 'done' ? 'text-emerald-400' :
                  step.status === 'active' ? 'text-brand-orange' :
                  'text-white/35'
                }`}>{step.label}</span>
              </div>
              <p className="text-[10px] text-white/50 leading-snug pl-8">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If we reach here, either it is:
  // - Unlocked with rejected documents (need correction)
  // - Completed/Success view (read-only downloads)
  const docTypes = [
    { field: 'idFront', label: 'Carte d\'Identité (Recto)', badge: 'Identité Front', accept: 'image/*,application/pdf', emoji: '🪪', desc: 'Copie lisible du recto de votre pièce d\'identité officielle.' },
    { field: 'idBack',  label: 'Carte d\'Identité (Verso)',  badge: 'Identité Back',  accept: 'image/*,application/pdf', emoji: '🪪', desc: 'Copie lisible du verso de votre pièce d\'identité officielle.' },
    { field: 'photo',   label: 'Photo d\'Identité Récente',  badge: 'Photo Officielle', accept: 'image/*', emoji: '📸', desc: 'Photo portrait sur fond clair neutre, visage dégagé.' },
    { field: 'signature', label: 'Signature Numérisée', badge: 'Signature', accept: 'image/*', emoji: '✍️', desc: 'Signature noire sur feuille blanche unie, bien éclairée.' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-start gap-6 animate-[bubbleIn_0.4s_ease-out] pb-16">
      {/* Header */}
      <div className="border-b-2 border-white/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
          Mes Documents Officiels
        </h2>
        <p className="text-white/50 text-xs mt-1">
          {applicationStatus === 'completed' 
            ? "Votre dossier a été approuvé. Vous pouvez visualiser ou télécharger vos documents homologués."
            : totalUploaded < 4 
            ? "Veuillez téléverser les pièces requises ci-dessous pour compléter votre dossier d'homologation."
            : "Veuillez corriger les documents signalés ci-dessous pour finaliser l'homologation de votre dossier."
          }
        </p>
      </div>

      {/* Warning/Success Alert Banners */}
      {applicationStatus === 'completed' ? (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 text-xs sm:text-sm p-4 rounded-3xl flex items-start gap-3 shadow-lg">
          <span className="text-lg">🎉</span>
          <div>
            <strong className="block text-white">Félicitations ! Dossier validé</strong>
            <span>L'ensemble de vos documents d'identité a été validé et enregistré par l'administration SPF Mobilité. Votre permis de conduire est prêt.</span>
          </div>
        </div>
      ) : hasRejectedDocs ? (
        <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 text-xs sm:text-sm p-4 rounded-3xl flex items-start gap-3 shadow-lg animate-[bounce_1s_ease-in-out_2]">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="block text-white">Action requise : Documents non conformes</strong>
            <span>Certains documents ont été rejetés par l'administration. Veuillez téléverser les pièces corrigées afin de débloquer l'enregistrement de votre dossier.</span>
          </div>
        </div>
      ) : totalUploaded < 4 ? (
        <div className="bg-brand-orange/10 border-2 border-brand-orange/30 text-brand-orange text-xs sm:text-sm p-4 rounded-3xl flex items-start gap-3 shadow-lg">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="block text-white">Action requise : Pièces justificatives manquantes ({totalUploaded} / 4 fournies)</strong>
            <span>Votre demande officielle a été enregistrée, mais des pièces d'identité sont toujours manquantes. Veuillez ajouter les documents ci-dessous pour lancer l'homologation légale.</span>
          </div>
        </div>
      ) : null}

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border-2 border-white/35 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-lg text-brand-orange font-bold">
            📂
          </div>
          <div>
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Statut Général</span>
            <p className="text-white font-semibold text-sm mt-0.5">
              {applicationStatus === 'completed' ? 'Dossier Validé' : 'Correction Requise'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border-2 border-white/35 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg text-emerald-400 font-bold">
            ✓
          </div>
          <div>
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Pièces Validées</span>
            <p className="text-white font-semibold text-sm mt-0.5">
              {applicationStatus === 'completed' ? '4 sur 4' : `${4 - Object.keys(rejectedDocs).filter(k => rejectedDocs[k]).length} sur 4`}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border-2 border-white/35 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg text-indigo-400 font-bold">
            🛡️
          </div>
          <div>
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Sécurité</span>
            <p className="text-white font-semibold text-sm mt-0.5">
              Accès Chiffré SSL
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docTypes.map(({ field, label, badge, accept, emoji, desc }) => {
          const fileUrl = uploads[field];
          const isUploading = uploading[field];
          const rejectionReason = rejectedDocs[field];
          const isRejected = rejectionReason && rejectionReason.trim() !== '';

          // If the document is not rejected AND it's already submitted (or the dossier is completed) AND all 4 documents are uploaded, it's locked.
          const isLocked = applicationStatus === 'completed' || (!isRejected && fileUrl && totalUploaded === 4);

          return (
            <div key={field} className={`bg-slate-950/60 border-2 ${isRejected ? 'border-red-500/50 shadow-red-500/5' : 'border-white/35'} rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[200px] transition-all`}>
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{badge}</span>
                    <h4 className="text-white font-bold text-base mt-1 flex items-center gap-1.5">
                      <span>{emoji}</span> {label}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isRejected ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    isLocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {isRejected ? '✘ Rejeté' : isLocked ? '✓ Validé' : '⚠️ En attente'}
                  </span>
                </div>

                {/* Rejection Reason Alert Box */}
                {isRejected && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-2.5 rounded-xl leading-normal">
                    <strong>Motif du rejet :</strong> {rejectionReason}
                  </div>
                )}

                <p className="text-white/50 text-xs mt-2 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-4">
                {isUploading ? (
                  <div className="border-2 border-dashed border-brand-orange/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-white/50">Téléversement sur Cloudinary en cours...</span>
                  </div>
                ) : fileUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/35 bg-slate-900/80 p-1.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileUrl.includes('cloudinary') ? (
                        <img
                          src={fileUrl}
                          alt={label}
                          className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
                          <span className="text-2xl">📄</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-xs truncate">
                          {isRejected ? "Fichier non conforme" : "Fichier sécurisé"}
                        </p>
                        <p className="text-white/40 text-[10px] truncate">
                          {isLocked ? "Validé par l'administration" : "À modifier"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pr-1">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                        Voir ↗
                      </a>
                      {!isLocked && (
                        <>
                          <button
                            type="button"
                            onClick={() => deleteDocument && deleteDocument(field)}
                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-0"
                          >
                            Supprimer
                          </button>
                          <label className="text-xs font-bold text-slate-950 bg-brand-orange hover:bg-brand-orange-dark px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                            Remplacer
                            <input type="file" accept={accept} className="hidden"
                              onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/35 hover:border-brand-orange/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors gap-2 bg-slate-950/20">
                    <span className="text-2xl text-white/20">{emoji}</span>
                    <span className="text-xs text-white/50 font-medium">Aucun fichier sélectionné</span>

                    <div className="flex gap-2 w-full mt-2 justify-center">
                      <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors border-2 border-white/35">
                        📁 Choisir un fichier
                        <input type="file" accept={accept} className="hidden"
                          onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                      </label>

                      {isMobile() && accept.includes('image') && (
                        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange text-xs font-bold rounded-xl transition-colors border-2 border-brand-orange/40">
                          📷 Prendre une photo
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
