import React, { useState } from 'react';
import { sendPaymentValidationEmail, sendSoldeInitiatedEmail } from '../utils/notifications';

const AdminLeadDetail = ({
  selectedLead,
  closeDetail,
  handleReset,
  handleDelete,
  setPreviewUrl,
  setPreviewLabel,
  updating,
  setUpdating,
  isEditingPath,
  setIsEditingPath,
  advisorSettings,
  handleSelectPath,
  handleUpdateStatus,
  getAdminSplitPaymentDetails,
  db,
  doc,
  updateDoc,
  addDoc,
  setDoc,
  collection,
  serverTimestamp,
  attestationUrlInput,
  setAttestationUrlInput,
  attestationUploadStatus,
  setAttestationUploadStatus,
  attestationUploadProgress,
  setAttestationUploadProgress
}) => {
  const [editingUrlDirectly, setEditingUrlDirectly] = useState(false);

  const handleAttestationUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttestationUploadStatus('uploading');
    setAttestationUploadProgress(20);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'monpermis');
      formData.append('folder', `monpermis/attestations/${selectedLead.uid}`);

      const resourceType = (file.type.startsWith('image/') || file.type === 'application/pdf') ? 'image' : 'raw';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      setAttestationUploadProgress(50);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.secure_url) {
        throw new Error("Upload error");
      }
      setAttestationUploadProgress(90);
      const secureUrl = data.secure_url;
      
      const leadId = selectedLead.rawLead?.id || selectedLead.uid;
      await updateDoc(doc(db, "leads", leadId), {
        attestationUrl: secureUrl
      });
      
      setAttestationUrlInput(secureUrl);
      setAttestationUploadStatus('success');
      setAttestationUploadProgress(100);
    } catch (err) {
      console.error("Attestation upload error:", err);
      setAttestationUploadStatus('error');
    }
  };

  const handleSaveAttestationUrl = async () => {
    setUpdating(true);
    try {
      const leadId = selectedLead.rawLead?.id || selectedLead.uid;
      await updateDoc(doc(db, "leads", leadId), {
        attestationUrl: attestationUrlInput
      });
      setAttestationUploadStatus(attestationUrlInput ? 'success' : 'idle');
      setEditingUrlDirectly(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setUpdating(false);
    }
  };

  const uploads = selectedLead.rawLead?.uploads || {};
  const DOC_META = {
    idFront:   { label: "Carte d'Identité Recto", icon: '🪪', color: 'emerald' },
    idBack:    { label: "Carte d'Identité Verso",  icon: '🪪', color: 'emerald' },
    photo:     { label: "Photo d'Identité",        icon: '📸', color: 'indigo'  },
    signature: { label: "Signature Numérisée",     icon: '✍️', color: 'amber'   },
  };
  const allKeys = Object.keys(DOC_META);

  const hasSelectedPath = !!selectedLead.rawLead?.selectedPath;
  const isBillingActive = !!selectedLead.rawLead?.billingActive;
  const isPaymentValidated = !!selectedLead.rawLead?.paymentValidated;
  const splitDetails = getAdminSplitPaymentDetails(selectedLead.rawLead);
  const isSplit = splitDetails.isSplit;
  const isSoldeValidated = !!selectedLead.rawLead?.soldeValidated;
  const isSoldeInitiated = !!selectedLead.rawLead?.soldeInitiated;
  const currentStatus = selectedLead.status || 'new';
  const selectedPath = selectedLead.rawLead?.selectedPath || '';

  const phases = [
    {
      num: 1,
      icon: '📋',
      title: 'Phase 1 : Affiliation Candidat',
      desc: 'Compte agréé & affilié à notre réseau officiel. Le candidat est actif sur la plateforme.',
      status: 'done',
      badge: '✓ Agréé',
    },
    {
      num: 2,
      icon: '📖',
      title: selectedPath === 'theorique' ? `Phase 2 : Examen Théorique — ${splitDetails.total}` : 'Phase 2 : Examen Théorique',
      desc: (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct')
        ? 'Certificat de dispense théorique validé.'
        : (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'Certificat de dispense théorique validé (payé).'
        : (selectedPath === 'theorique')
        ? 'Phase active : nécessite l\'activation de la facturation et la validation des virements.'
        : 'En attente de la progression ou non incluse.',
      status: (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct')
        ? 'done'
        : (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'done'
        : (selectedPath === 'theorique' ? 'active' : 'locked'),
      badge: (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed')))
        ? '✓ Dispense'
        : (selectedPath === 'theorique' ? '● Action requise' : '🔒 Non inclus'),
    },
    {
      num: 3,
      icon: '👁️',
      title: selectedPath === 'perception' ? `Phase 3 : Perception du Risque — ${splitDetails.total}` : 'Phase 3 : Perception du Risque',
      desc: (selectedPath === 'pratique' || selectedPath === 'direct')
        ? 'Dispense académique validée — aucun examen requis.'
        : (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'Dispense académique validée — aucun examen requis (payé).'
        : (selectedPath === 'perception')
        ? 'Phase active : nécessite l\'activation de la facturation et la validation des virements.'
        : 'En attente de la progression ou non incluse.',
      status: (selectedPath === 'pratique' || selectedPath === 'direct')
        ? 'done'
        : (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'done'
        : (selectedPath === 'perception' ? 'active' : 'locked'),
      badge: (selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed')))
        ? '✓ Dispense'
        : (selectedPath === 'perception' ? '● Action requise' : '🔒 Non inclus'),
    },
    {
      num: 4,
      icon: '🚗',
      title: selectedPath === 'pratique' ? `Phase 4 : Examen Pratique — ${splitDetails.total}` : 'Phase 4 : Examen Pratique',
      desc: (selectedPath === 'direct')
        ? 'Dispense d\'examen pratique certifiée & enregistrée.'
        : (selectedPath === 'pratique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'Dispense d\'examen pratique certifiée & enregistrée (payé).'
        : (selectedPath === 'pratique')
        ? 'Phase active : nécessite l\'activation de la facturation et la validation du paiement complet.'
        : 'En attente de la progression ou non incluse.',
      status: (selectedPath === 'direct')
        ? 'done'
        : (selectedPath === 'pratique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'done'
        : (selectedPath === 'pratique' ? 'active' : 'locked'),
      badge: (selectedPath === 'direct' || (selectedPath === 'pratique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed')))
        ? '✓ Certifié'
        : (selectedPath === 'pratique' ? '● Action requise' : '🔒 Non inclus'),
    },
    {
      num: 5,
      icon: '🏆',
      title: selectedPath === 'direct' ? `Phase 5 : Permis Définitif — ${splitDetails.total}` : 'Phase 5 : Permis Définitif',
      desc: (selectedPath === 'direct' && currentStatus === 'completed')
        ? 'Votre permis officiel est prêt — retrait en commune.'
        : (selectedPath === 'direct' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'Votre permis officiel est validé (payé).'
        : (selectedPath === 'direct')
        ? 'Phase active : nécessite l\'activation de la facturation et la validation des virements.'
        : 'En attente de la progression ou non incluse.',
      status: (selectedPath === 'direct' && currentStatus === 'completed')
        ? 'done'
        : (selectedPath === 'direct' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? 'done'
        : (selectedPath === 'direct' ? 'active' : 'locked'),
      badge: (selectedPath === 'direct' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
        ? '✓ Prêt'
        : (selectedPath === 'direct' ? '● Action requise' : '🔒 Non inclus'),
    }
  ];

  let progressPercent = 15;
  let nextActionLabel = "Sélectionner la formule du candidat";

  if (!hasSelectedPath) {
    progressPercent = 15;
    nextActionLabel = "Sélectionner la formule du candidat";
  } else if (!isBillingActive) {
    progressPercent = 35;
    nextActionLabel = "Activer la facturation & le RIB";
  } else if (!isPaymentValidated) {
    progressPercent = 55;
    nextActionLabel = isSplit ? "Valider le virement d'acompte (200 €)" : `Valider le virement complet (${splitDetails.total})`;
  } else if (isSplit && !isSoldeValidated) {
    progressPercent = 80;
    nextActionLabel = `Valider le virement du solde (${splitDetails.secondPayment})`;
  } else {
    progressPercent = 100;
    nextActionLabel = `Dossier payé & validé (Statut: ${currentStatus === 'completed' ? 'Terminé' : 'En cours'})`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* === TOP BANNER === */}
      <div className="bg-slate-900/80 rounded-3xl border border-white/5 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full transform translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl sm:text-2xl font-black text-emerald-400 flex-shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              {(selectedLead.name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{selectedLead.name}</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">ID : <span className="text-emerald-400 font-mono">#{selectedLead.id?.slice(0, 12)}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm ${
              selectedLead.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              selectedLead.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              {selectedLead.status === 'new' ? '● Nouveau' : selectedLead.status === 'processing' ? '● En Cours' : '● Terminé'}
            </span>
            <button
              onClick={() => { handleReset({ stopPropagation: () => {} }, selectedLead); }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* === INFORMATIONS PERSONNELLES === */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Informations Personnelles</h3>
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: 'Nom complet', value: selectedLead.name },
            { label: 'Email', value: selectedLead.email },
            { label: 'Téléphone', value: selectedLead.phone || 'Non renseigné' },
            { label: 'Date de naissance', value: selectedLead.rawLead?.birthDate || selectedLead.rawUser?.birthDate || 'Non renseigné' },
            { label: 'Adresse', value: selectedLead.rawLead?.address || selectedLead.rawUser?.address || 'Non renseigné' },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="font-bold text-white text-sm break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* === DÉTAILS DE LA DEMANDE === */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Détails de la Demande</h3>
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: 'Catégorie permis', value: `Permis ${selectedLead.rawLead?.licenseCategory || selectedLead.rawUser?.licenseCategory || 'B'} (${selectedLead.rawLead?.transmission || selectedLead.rawUser?.transmission || 'Manuel'})` },
            { label: 'Tentatives ratées', value: selectedLead.rawLead?.failedAttempts || '0' },
            { label: 'Service demandé', value: selectedLead.service || 'Inscription simple' },
            { label: 'Date d\'inscription', value: selectedLead.date },
            { label: 'Date de soumission', value: selectedLead.rawLead?.submittedAt ? new Date(selectedLead.rawLead.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Non soumis' },
            { label: 'Dossier soumis', value: selectedLead.rawLead?.isSubmitted ? '✅ Oui' : '❌ Non' },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="font-bold text-white text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* === FICHIERS TÉLÉVERSÉS === */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">
          Fichiers Téléversés
          <span className="ml-3 text-emerald-400 font-black">
            {allKeys.filter(k => uploads[k] && uploads[k].startsWith('http')).length}/{allKeys.length}
          </span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allKeys.map(key => {
            const meta = DOC_META[key];
            const url = uploads[key];
            const isValid = url && url.startsWith('http');
            const colorMap = {
              emerald: { ring: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', thumb: 'bg-emerald-500/5' },
              indigo:  { ring: 'border-indigo-500/30',  badge: 'bg-indigo-500/10 text-indigo-400',   thumb: 'bg-indigo-500/5'  },
              amber:   { ring: 'border-amber-500/30',   badge: 'bg-amber-500/10 text-amber-400',     thumb: 'bg-amber-500/5'   },
            };
            const c = colorMap[meta.color];

            return (
              <div key={key} className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{meta.label}</span>
                {isValid ? (
                  <button
                    onClick={() => { setPreviewUrl(url); setPreviewLabel(`${selectedLead.name} — ${meta.label}`); }}
                    className={`relative group rounded-2xl overflow-hidden border ${c.ring} bg-slate-800 hover:border-opacity-60 transition-all hover:scale-[1.02] hover:shadow-lg`}
                  >
                    {!url.toLowerCase().includes('.pdf') ? (
                      <img src={url} alt={meta.label} className="w-full h-28 object-cover" />
                    ) : (
                      <div className={`w-full h-28 flex flex-col items-center justify-center gap-2 ${c.thumb}`}>
                        <span className="text-3xl">📄</span>
                        <span className="text-[10px] font-bold text-slate-400">PDF</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg">🔍 Voir</span>
                    </div>
                    <div className={`${c.badge} py-1 text-center`}>
                      <span className="text-[10px] font-bold">✓ Reçu</span>
                    </div>
                  </button>
                ) : url ? (
                  <div className="w-full rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center gap-2 py-6 px-2 text-center">
                    <span className="text-xl">⚠️</span>
                    <span className="text-[9px] text-amber-400 font-bold">Ancien format</span>
                    <span className="text-[8px] text-slate-500 font-mono break-all">{url}</span>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/40 flex flex-col items-center justify-center gap-2 py-8">
                    <span className="text-2xl opacity-20">{meta.icon}</span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Non reçu</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* === WORKFLOW & SUIVI CHRONOLOGIQUE === */}
      <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛣️</span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                Workflow & Suivi Chronologique du Dossier
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Pilotez le dossier étape par étape. Les actions suivantes se débloquent automatiquement.
            </p>
          </div>
          <div className="w-full md:w-64 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Progression</span>
              <span className="text-brand-orange text-amber-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-[2px] border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 italic font-medium truncate">
              👉 Suivant : {nextActionLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0 relative pl-4 sm:pl-6">
          <div className="absolute left-[31px] sm:left-[39px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-800 pointer-events-none" />

          {phases.map((phase) => {
            const isDone = phase.status === 'done';
            const isActive = phase.status === 'active';

            return (
              <div key={phase.num} className="relative flex gap-6 pb-10 transition-all duration-300">
                <div className="absolute left-[-21px] sm:left-[-29px] top-1 z-10 flex items-center justify-center">
                  {isDone ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 border border-emerald-400 text-slate-950 flex items-center justify-center text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      ✓
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500 border border-orange-400 text-white flex items-center justify-center text-xs font-black ring-4 ring-orange-500/20 animate-pulse">
                      {phase.num}
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center text-xs font-black">
                      {phase.num}
                    </div>
                  )}
                </div>

                <div className={`flex-1 bg-slate-950/40 border rounded-2xl p-5 transition-all duration-300 ${isActive ? 'border-orange-500/30 bg-orange-500/[0.02] shadow-[0_0_20px_rgba(249,115,22,0.05)]' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className={`text-xs font-black uppercase tracking-wider ${isDone ? 'text-emerald-400' : isActive ? 'text-orange-500' : 'text-slate-500'}`}>
                          {phase.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isActive
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
                            : 'bg-white/5 text-slate-500 border-white/5'
                        }`}>
                          {phase.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{phase.desc}</p>
                    </div>

                  </div>

                  {phase.num === 2 && (!hasSelectedPath || isEditingPath) && (
                    <div className="mt-4 p-4 bg-slate-900/40 border border-orange-500/20 rounded-xl flex flex-col gap-3">
                      <p className="text-xs font-bold text-slate-300">
                        {isEditingPath ? "Modifier la formule attribuée au candidat :" : "⚠️ Aucune formule sélectionnée. Sélectionnez un parcours ci-dessous :"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          { path: 'perception', label: '📖 Perception', desc: 'Phase 2', amount: advisorSettings.perceptionAmount || "350,00 €" },
                          { path: 'theorique', label: '📚 Théorique', desc: 'Phase 3', amount: advisorSettings.theoriqueAmount || "550,00 €" },
                          { path: 'pratique', label: '🚗 Pratique', desc: 'Phase 4', amount: advisorSettings.pratiqueAmount || "2100,00 €" },
                          { path: 'direct', label: '🏆 Direct', desc: 'Phase 5', amount: advisorSettings.directLicenseAmount || "1200,00 €" }
                        ].map((opt) => (
                          <button
                            key={opt.path}
                            disabled={updating}
                            onClick={() => handleSelectPath(opt.path)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              selectedLead.rawLead?.selectedPath === opt.path
                                ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                                : 'bg-slate-950 hover:bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-black">{opt.label}</span>
                            <span className="text-[9px] text-slate-500 font-medium">{opt.desc}</span>
                            <span className="text-[10px] font-bold text-orange-500">{opt.amount}</span>
                          </button>
                        ))}
                      </div>
                      {isEditingPath && (
                        <button
                          onClick={() => setIsEditingPath(false)}
                          className="mt-1 self-end text-[10px] font-bold text-slate-500 hover:text-slate-300 underline"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  )}

                  {isActive && hasSelectedPath && !isEditingPath && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                      {/* Lancer Facturation */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-slate-900/20 border border-white/5 rounded-xl">
                        <div>
                          <h5 className="text-xs font-bold text-slate-300">Action 1 : Lancer la Facturation (Visibilité RIB)</h5>
                          <p className="text-[10px] text-slate-500">Rendre visible le devis détaillé et le RIB sur le profil du client.</p>
                        </div>
                        <button
                          disabled={updating}
                          onClick={async () => {
                            setUpdating(true);
                            try {
                              const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                              await updateDoc(doc(db, "leads", leadId), { 
                                billingActive: !isBillingActive
                              });
                            } catch (err) {
                              console.error(err);
                            }
                            setUpdating(false);
                          }}
                          className={`w-full sm:w-64 justify-center flex items-center px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border cursor-pointer ${
                            isBillingActive
                              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-emerald-500/30'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                          }`}
                        >
                          {isBillingActive ? '🔴 Désactiver la facture' : '⚡ Activer la facture & RIB'}
                        </button>
                      </div>

                      {/* Valider Payment */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-slate-900/20 border border-white/5 rounded-xl">
                        <div>
                          <h5 className="text-xs font-bold text-slate-300">
                            {isSplit
                              ? `Action 2 : Valider l'acompte de la formule — ${splitDetails.firstPayment}`
                              : `Action 2 : Valider le paiement complet — ${splitDetails.total}`
                            }
                          </h5>
                          <p className="text-[10px] text-slate-500">
                            {isPaymentValidated
                              ? "Paiement reçu et validé. Le dossier est en cours de traitement."
                              : !isBillingActive
                              ? "⚠️ Activez la facture d'abord pour débloquer cette étape."
                              : `Vérifiez la réception du virement de ${isSplit ? splitDetails.firstPayment : splitDetails.total} pour démarrer.`
                            }
                          </p>
                        </div>
                        <button
                          disabled={updating || !isBillingActive}
                          onClick={async () => {
                            setUpdating(true);
                            try {
                              const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                              const nextVal = !isPaymentValidated;
                              const targetStatus = nextVal ? (isSplit ? 'processing' : 'completed') : 'new';

                              const updatePayload = {
                                paymentValidated: nextVal,
                                status: targetStatus
                              };
                              if (!nextVal) {
                                updatePayload.soldeInitiated = false;
                                updatePayload.soldeValidated = false;
                              }
                              await updateDoc(doc(db, "leads", leadId), updatePayload);

                              if (selectedLead.rawUser && selectedLead.rawUser.uid) {
                                await updateDoc(doc(db, "users", selectedLead.rawUser.uid), { 
                                  status: targetStatus
                                });
                              }

                              if (nextVal) {
                                const email = selectedLead.email || selectedLead.rawUser?.email;
                                if (email) {
                                  const formulaLabel = selectedLead.rawLead?.selectedPath === 'perception' ? 'Perception du Risque' :
                                                       selectedLead.rawLead?.selectedPath === 'theorique' ? 'Théorique' :
                                                       selectedLead.rawLead?.selectedPath === 'pratique' ? 'Pratique' :
                                                       selectedLead.rawLead?.selectedPath === 'direct' ? 'Permis Direct' : 'Formule';
                                  const text = isSplit ? `Acompte Formule ${formulaLabel}` : `Formule ${formulaLabel} (Complet)`;
                                  const amt = isSplit ? splitDetails.firstPayment : splitDetails.total;
                                  sendPaymentValidationEmail(email, selectedLead.name?.split(' ')[0] || 'Candidat', amt, text, advisorSettings).catch(e => console.error(e));
                                }
                              }

                              const messagesRef = collection(db, 'chats', selectedLead.uid, 'messages');
                              const chatDocRef = doc(db, 'chats', selectedLead.uid);
                              
                              let textMessage = "";
                              if (nextVal) {
                                if (isSplit) {
                                  textMessage = `✅ Votre acompte de 200,00 € pour la formule ${selectedLead.rawLead?.selectedPath === 'perception' ? 'Perception' : selectedLead.rawLead?.selectedPath === 'theorique' ? 'Théorique' : selectedLead.rawLead?.selectedPath === 'pratique' ? 'Pratique' : 'Permis Direct'} a été validé ! Votre dossier est maintenant en cours de traitement. 🚀`;
                                } else {
                                  textMessage = "✅ Votre paiement pour la Phase 4 - Examen Pratique a été validé avec succès ! Votre dossier est en cours. 🚗";
                                }
                              } else {
                                textMessage = "ℹ️ Votre paiement a été marqué comme non validé. Veuillez contacter votre conseiller.";
                              }

                              await addDoc(messagesRef, {
                                sender: 'advisor',
                                text: textMessage,
                                timestamp: serverTimestamp()
                              });

                              await setDoc(chatDocRef, {
                                lastMessageText: textMessage,
                                lastMessageTime: serverTimestamp(),
                                unreadByClient: true
                              }, { merge: true });

                            } catch (err) {
                              console.error(err);
                            }
                            setUpdating(false);
                          }}
                          className={`w-full sm:w-64 justify-center flex items-center px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border cursor-pointer ${
                            !isBillingActive
                              ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-55'
                              : isPaymentValidated
                              ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                          }`}
                        >
                          {isPaymentValidated ? "🔴 Annuler le paiement" : `✓ Valider le virement (${isSplit ? splitDetails.firstPayment : splitDetails.total})`}
                        </button>
                      </div>

                      {/* Valider Solde */}
                      {isSplit && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-slate-900/20 border border-white/5 rounded-xl">
                          <div>
                            <h5 className="text-xs font-bold text-slate-300">
                              Action 3 : Valider le solde de la formule — {splitDetails.secondPayment}
                            </h5>
                            <p className="text-[10px] text-slate-500">
                              {isSoldeValidated
                                ? "Solde reçu et validé. Phase payée en totalité."
                                : !isPaymentValidated
                                ? "⚠️ Validez d'abord le paiement d'acompte."
                                : !isSoldeInitiated
                                ? "⚠️ Le paiement du solde doit être initié pour le candidat."
                                : `Le paiement a été initié. Validez dès réception du virement final de ${splitDetails.secondPayment} pour clore financièrement.`
                              }
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                              disabled={updating || !isPaymentValidated || isSoldeValidated}
                              onClick={async () => {
                                setUpdating(true);
                                try {
                                  const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                                  const nextVal = !isSoldeInitiated;
                                  await updateDoc(doc(db, "leads", leadId), { 
                                    soldeInitiated: nextVal
                                  });
                                  
                                  const messagesRef = collection(db, 'chats', selectedLead.uid, 'messages');
                                  const chatDocRef = doc(db, 'chats', selectedLead.uid);
                                  
                                  let responseMessage = "";
                                  if (nextVal) {
                                    const docName = selectedLead.rawLead?.selectedPath === 'perception' ? "attestation de perception" : selectedLead.rawLead?.selectedPath === 'theorique' ? "certificat d'examen théorique" : selectedLead.rawLead?.selectedPath === 'pratique' ? "certificat d'examen pratique" : "permis de conduire";
                                    const adj = selectedLead.rawLead?.selectedPath === 'perception' ? "prête" : "prêt";
                                    responseMessage = `⚡ Votre ${docName} est ${adj} ! Vous pouvez dès à présent régler le solde restant de ${splitDetails.secondPayment} par virement bancaire.`;
                                  } else {
                                    responseMessage = "ℹ️ La demande de règlement du solde a été annulée.";
                                  }

                                  await addDoc(messagesRef, {
                                    sender: 'advisor',
                                    text: responseMessage,
                                    timestamp: serverTimestamp()
                                  });

                                  await setDoc(chatDocRef, {
                                    lastMessageText: responseMessage,
                                    lastMessageTime: serverTimestamp(),
                                    unreadByClient: true
                                  }, { merge: true });

                                  if (nextVal) {
                                    const email = selectedLead.email || selectedLead.rawUser?.email;
                                    if (email) {
                                      const formulaLabel = selectedLead.rawLead?.selectedPath === 'perception' ? 'Perception du Risque' :
                                                           selectedLead.rawLead?.selectedPath === 'theorique' ? 'Théorique' :
                                                           selectedLead.rawLead?.selectedPath === 'pratique' ? 'Pratique' :
                                                           selectedLead.rawLead?.selectedPath === 'direct' ? 'Permis Direct' : 'Formule';
                                      sendSoldeInitiatedEmail(email, selectedLead.name?.split(' ')[0] || 'Candidat', formulaLabel, splitDetails.secondPayment, advisorSettings).catch(e => console.error(e));
                                    }
                                  }

                                } catch (err) {
                                  console.error(err);
                                }
                                setUpdating(false);
                              }}
                              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border justify-center flex items-center cursor-pointer ${
                                !isPaymentValidated || isSoldeValidated
                                  ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-55'
                                  : isSoldeInitiated
                                  ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-amber-500/30'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                              }`}
                            >
                              {isSoldeInitiated ? "🔴 Annuler l'initiation" : `⚡ Initier le paiement (${splitDetails.secondPayment})`}
                            </button>
                            <button
                              disabled={updating || !isPaymentValidated || !isSoldeInitiated}
                              onClick={async () => {
                                setUpdating(true);
                                try {
                                  const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                                  const nextSoldeVal = !isSoldeValidated;
                                  const targetStatus = nextSoldeVal ? 'completed' : 'processing';

                                  await updateDoc(doc(db, "leads", leadId), { 
                                    soldeValidated: nextSoldeVal,
                                    status: targetStatus
                                  });

                                  if (selectedLead.rawUser && selectedLead.rawUser.uid) {
                                    await updateDoc(doc(db, "users", selectedLead.rawUser.uid), { 
                                      status: targetStatus
                                    });
                                  }

                                  if (nextSoldeVal) {
                                    const email = selectedLead.email || selectedLead.rawUser?.email;
                                    if (email) {
                                      const formulaLabel = selectedLead.rawLead?.selectedPath === 'perception' ? 'Perception du Risque' :
                                                           selectedLead.rawLead?.selectedPath === 'theorique' ? 'Théorique' :
                                                           selectedLead.rawLead?.selectedPath === 'pratique' ? 'Pratique' :
                                                           selectedLead.rawLead?.selectedPath === 'direct' ? 'Permis Direct' : 'Formule';
                                      const text = `Solde Formule ${formulaLabel}`;
                                      sendPaymentValidationEmail(email, selectedLead.name?.split(' ')[0] || 'Candidat', splitDetails.secondPayment, text, advisorSettings).catch(e => console.error(e));
                                    }
                                  }

                                  const messagesRef = collection(db, 'chats', selectedLead.uid, 'messages');
                                  const chatDocRef = doc(db, 'chats', selectedLead.uid);
                                  
                                  let responseMessage = "";
                                  if (nextSoldeVal) {
                                    const docName = selectedLead.rawLead?.selectedPath === 'perception' ? "attestation de perception" : selectedLead.rawLead?.selectedPath === 'theorique' ? "certificat d'examen théorique" : selectedLead.rawLead?.selectedPath === 'pratique' ? "certificat d'examen pratique" : "permis de conduire";
                                    const agreement = selectedLead.rawLead?.selectedPath === 'perception' ? "validée" : "validé";
                                    responseMessage = `✅ Le solde de votre formule a été validé ! Votre ${docName} est maintenant officiellement ${agreement} et disponible. 🏆`;
                                  } else {
                                    responseMessage = "ℹ️ Le solde de votre paiement a été marqué comme non validé.";
                                  }

                                  await addDoc(messagesRef, {
                                    sender: 'advisor',
                                    text: responseMessage,
                                    timestamp: serverTimestamp()
                                  });

                                  await setDoc(chatDocRef, {
                                    lastMessageText: responseMessage,
                                    lastMessageTime: serverTimestamp(),
                                    unreadByClient: true
                                  }, { merge: true });

                                } catch (err) {
                                  console.error(err);
                                }
                                setUpdating(false);
                              }}
                              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border justify-center flex items-center cursor-pointer ${
                                !isPaymentValidated || !isSoldeInitiated
                                  ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-55'
                                  : isSoldeValidated
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                              }`}
                            >
                              {isSoldeValidated ? '🔴 Annuler le solde' : `✓ Valider le solde (${splitDetails.secondPayment})`}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Finale */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl mt-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-300">Action Finale : Clôturer & Valider la Phase</h5>
                          <p className="text-[10px] text-slate-500">
                            {selectedLead.status === 'completed'
                              ? 'La phase est marquée comme terminée.'
                              : (isSplit ? !isSoldeValidated : !isPaymentValidated)
                              ? '⚠️ Veuillez d\'abord valider l\'intégralité des règlements de cette phase.'
                              : 'Cliquez pour finaliser cette phase et débloquer les étapes suivantes.'
                            }
                          </p>
                        </div>
                        <button
                          disabled={updating || (selectedLead.status !== 'completed' && (isSplit ? !isSoldeValidated : !isPaymentValidated))}
                          onClick={() => handleUpdateStatus(selectedLead.status === 'completed' ? 'processing' : 'completed')}
                          className={`w-full sm:w-64 justify-center flex items-center px-4 py-2 rounded-lg font-black text-xs transition-all duration-300 border cursor-pointer ${
                            selectedLead.status === 'completed'
                              ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                              : (selectedLead.status !== 'completed' && (isSplit ? !isSoldeValidated : !isPaymentValidated))
                              ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-55'
                              : 'bg-indigo-500 hover:bg-indigo-400 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                          }`}
                        >
                          {selectedLead.status === 'completed' ? '🔴 Annuler la validation (En Cours)' : '✓ Terminer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Evolution status indicators */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
              Évolution du dossier :
            </p>
            <div className="flex gap-2">
              {[
                { status: 'new', label: '🟢 Nouveau' },
                { status: 'processing', label: '🟡 En Cours' },
                { status: 'completed', label: '🟣 Terminé' }
              ].map((st) => (
                <div
                  key={st.status}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex-1 text-center select-none border ${
                    selectedLead.status === st.status
                      ? st.status === 'new'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/40'
                        : st.status === 'processing'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
                        : 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)] ring-2 ring-indigo-400/40'
                      : 'bg-white/5 text-slate-500 border-white/5 opacity-35'
                  }`}
                >
                  {st.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === ATTESTATION UPLOAD SECTION === */}
      <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <span className="text-xl">📄</span>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Attestation du Candidat</h4>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Téléversez ou modifiez le lien vers l'attestation officielle ou certificat de réussite du candidat (PDF/Image). Le candidat y aura accès directement sur son portail.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Action buttons or URL display */}
            <div className="flex-1 w-full space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Lien URL de l'attestation</label>
              {editingUrlDirectly ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attestationUrlInput}
                    onChange={(e) => setAttestationUrlInput(e.target.value)}
                    placeholder="https://cloudinary.com/..."
                    className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono"
                  />
                  <button
                    onClick={handleSaveAttestationUrl}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingUrlDirectly(false)}
                    className="px-3 py-2 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-xs text-slate-300 truncate">
                  <span className="truncate pr-4">{attestationUrlInput || "(Aucune attestation enregistrée)"}</span>
                  <button
                    onClick={() => setEditingUrlDirectly(true)}
                    className="text-xs font-bold text-indigo-400 hover:underline flex-shrink-0"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Téléverser le fichier</span>
              <label className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-xs text-white text-center cursor-pointer transition-colors block">
                {attestationUploadStatus === 'uploading' ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Chargement ({attestationUploadProgress}%)
                  </span>
                ) : (
                  "📂 Choisir un document"
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAttestationUpload}
                  disabled={attestationUploadStatus === 'uploading'}
                />
              </label>
            </div>
          </div>

          {attestationUrlInput && (
            <div className="flex gap-2 items-center pt-2">
              <button
                onClick={() => { setPreviewUrl(attestationUrlInput); setPreviewLabel("Attestation officielle"); }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                🔍 Visualiser l'attestation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === ZONE DANGER === */}
      <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4 ml-1">Zone Dangereuse</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={(e) => { handleReset(e, selectedLead); }}
            className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-slate-400 bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 transition-all"
          >
            🔄 Réinitialiser le dossier
          </button>
          <button
            onClick={(e) => { handleDelete(e, selectedLead); closeDetail(); }}
            className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-slate-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
          >
            🗑️ Supprimer définitivement
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminLeadDetail;
