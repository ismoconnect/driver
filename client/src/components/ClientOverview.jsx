import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ClientOverview({
  user,
  formData,
  isSubmitted: propIsSubmitted,
  activeTab,
  setActiveTab,
  setWizardStep,
  advisor,
  selectedPath,
  billingActive,
  paymentValidated,
  soldeValidated,
  soldeInitiated,
  applicationStatus,
  attestationUrl,
  theme,
  showUpgradeConfirm,
  setShowUpgradeConfirm,
  handleUpgradeToPath,
  uploads = {},
  uploading = {},
  uploadToCloudinary
}) {
  
  const getTotalAmount = () => {
    let val = "0,00 €";
    if (selectedPath === 'perception') val = advisor.perceptionAmount || "350,00 €";
    else if (selectedPath === 'theorique') val = advisor.theoriqueAmount || "550,00 €";
    else if (selectedPath === 'pratique') val = advisor.pratiqueAmount || "2100,00 €";
    else if (selectedPath === 'direct') val = advisor.directLicenseAmount || "1200,00 €";
    return val;
  };

  const getSplitPaymentDetails = () => {
    const totalStr = getTotalAmount();
    const clean = totalStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const totalNum = parseFloat(clean) || 0;

    const firstPaymentNum = Math.min(200, totalNum);
    const secondPaymentNum = Math.max(0, totalNum - firstPaymentNum);

    const fmt = (num) => `${num.toFixed(2).replace('.', ',')} €`;

    return {
      isSplit: true,
      total: totalStr,
      firstPayment: fmt(firstPaymentNum),
      secondPayment: secondPaymentNum > 0 ? fmt(secondPaymentNum) : null
    };
  };

  const getTransferAmount = () => {
    const details = getSplitPaymentDetails();
    if (details.isSplit && paymentValidated) {
      return details.secondPayment || details.total;
    }
    return details.firstPayment;
  };

  const isSubmitted = propIsSubmitted !== undefined ? propIsSubmitted : (formData.isSubmitted || applicationStatus !== 'new');

  return (
    <div className="flex-1 flex flex-col gap-2.5 sm:gap-4 relative z-10 animate-[bubbleIn_0.5s_ease-out] overflow-y-auto md:overflow-y-visible min-h-0 md:min-h-fit">
      
      {/* Header card info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-1.5 sm:pb-3">
        <div>
          <h2 className="text-xl sm:text-3xl font-display font-extrabold text-white">
            Bonjour, {formData.firstName || 'Candidat'} 👋
          </h2>
          <p className="text-white/60 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
            {isSubmitted 
              ? "Votre demande d'obtention de permis officiel est en cours de traitement." 
              : "Complétez votre demande pour initier l'obtention de votre permis de conduire."}
          </p>
        </div>
        <div className={`bg-slate-800/80 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl px-3 py-1 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3`}>
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-[10px] sm:text-xs font-semibold text-white/95 uppercase tracking-wide">
            ID Dossier : {isSubmitted ? `#MPB-${user.uid.slice(0, 5).toUpperCase()}` : "MPB-NON-INITIALISÉ"}
          </span>
        </div>
      </div>

      {/* TIMELINE DU CIRCUIT */}
      <div className="flex flex-col gap-1.5 sm:gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-brand-orange">
            🛣️ Votre Circuit d'Obtention
          </h3>
          <span className="text-[9px] sm:text-[10px] text-white/40 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/10">5 phases officielles</span>
        </div>

        {/* Ligne de progression horizontale */}
        <div className="relative">
          {/* Trait de connexion fond */}
          <div className="hidden lg:block absolute top-8 left-[calc(10%+16px)] right-[calc(10%+16px)] h-0.5 bg-white/5 z-0" />
          {/* Trait de progression coloré */}
          <div
            className="hidden lg:block absolute top-8 left-[calc(10%+16px)] h-0.5 bg-gradient-to-r from-emerald-500 to-brand-orange z-0 transition-all duration-700"
            style={{ 
              width: !isSubmitted 
                ? '20%' 
                : (() => {
                    const p2Status = (billingActive && (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct')) 
                      ? 'done' 
                      : (selectedPath === 'theorique' && applicationStatus === 'completed' ? 'done'
                        : (selectedPath === 'theorique' || selectedPath === 'perception') ? 'active'
                        : 'locked');

                    const p3Status = (billingActive && (selectedPath === 'pratique' || selectedPath === 'direct')) 
                      ? 'done' 
                      : (selectedPath === 'perception' && applicationStatus === 'completed' ? 'done'
                        : selectedPath === 'perception' && billingActive ? 'active'
                        : 'locked');

                    const p4Status = (billingActive && selectedPath === 'direct') 
                      ? 'done' 
                      : (selectedPath === 'pratique' && (applicationStatus === 'completed') ? 'done' : (selectedPath === 'pratique' ? 'active' : 'locked'));

                    const p5Status = (selectedPath === 'direct' && applicationStatus === 'completed') 
                      ? 'done' 
                      : (selectedPath === 'direct' && paymentValidated ? 'ready' : (selectedPath === 'direct' ? 'active' : 'locked'));

                    let lastUnlocked = 1;
                    if (p2Status !== 'locked') {
                      lastUnlocked = 2;
                      if (p3Status !== 'locked') {
                        lastUnlocked = 3;
                        if (p4Status !== 'locked') {
                          lastUnlocked = 4;
                          if (p5Status !== 'locked') {
                            lastUnlocked = 5;
                          }
                        }
                      }
                    }

                    if (lastUnlocked === 1) return '10%';
                    if (lastUnlocked === 2) return '30%';
                    if (lastUnlocked === 3) return '50%';
                    if (lastUnlocked === 4) return '70%';
                    return '88%';
                  })()
            }}
          />

          <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3 pb-3 scrollbar-none snap-x snap-mandatory lg:mx-0 lg:px-0">
            {[
              {
                num: 1,
                icon: '📋',
                title: 'Affiliation Candidat',
                desc_done: 'Compte agréé & affilié à notre réseau officiel.',
                desc_pending: 'Inscription sur la plateforme officielle.',
                status: 'done',
                badge: '✓ Agréé',
              },
              {
                num: 2,
                icon: '📖',
                title: 'Examen Théorique',
                desc_done: 'Certificat de dispense théorique validé.',
                desc_pending: !isSubmitted 
                  ? 'Débloqué après validation de votre dossier.'
                  : (billingActive && !paymentValidated)
                  ? "En attente de votre règlement d'acompte."
                  : (billingActive && selectedPath === 'theorique' && !soldeValidated)
                  ? 'En attente de votre règlement de solde.'
                  : (selectedPath === 'theorique'
                    ? 'Dossier complet et en cours de validation.'
                    : 'Formule non sélectionnée.'),
                status: (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'theorique' && applicationStatus === 'completed')) 
                  ? 'done'
                  : (selectedPath === 'theorique' && billingActive) 
                  ? 'active'
                  : 'locked',
                badge: (selectedPath === 'perception' || selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'theorique' && applicationStatus === 'completed')) 
                  ? '✓ Validé' 
                  : (billingActive && selectedPath === 'theorique' && !paymentValidated)
                  ? '● Paiement en attente'
                  : (billingActive && selectedPath === 'theorique' && !soldeValidated)
                  ? '● Paiement en attente'
                  : (selectedPath === 'theorique'
                    ? (!isSubmitted ? '● Action requise' : '● Prérequis')
                    : '🔒 Non inclus'),
              },
              {
                num: 3,
                icon: '👁️',
                title: 'Perception du Risque',
                desc_done: 'Dispense académique validée — aucun examen requis.',
                desc_pending: !isSubmitted 
                  ? 'Débloqué après validation du Théorique.'
                  : (selectedPath === 'perception' ? 'Débloqué après le prérequis Théorique.' : 'En attente de votre formule.'),
                status: (selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'perception' && applicationStatus === 'completed')) 
                  ? 'done'
                  : (selectedPath === 'perception' && paymentValidated) 
                  ? 'active'
                  : 'locked',
                badge: (selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'perception' && applicationStatus === 'completed')) 
                  ? '✓ Dispense' 
                  : (selectedPath === 'perception' && paymentValidated && !soldeValidated) 
                  ? '● Paiement en attente' 
                  : (selectedPath === 'perception' ? '🔒 Après Théorique' : '🔒 Non inclus'),
              },
              {
                num: 4,
                icon: '🚗',
                title: 'Examen Pratique',
                desc_done: 'Dispense d\'examen pratique certifiée & enregistrée.',
                desc_pending: !isSubmitted
                  ? 'Validé après constitution complète du dossier.'
                  : 'En attente de votre règlement de formule.',
                status: (billingActive && selectedPath === 'direct') 
                  ? 'done' 
                  : (selectedPath === 'pratique' && (applicationStatus === 'completed') ? 'done' : (selectedPath === 'pratique' ? 'active' : 'locked')),
                badge: (billingActive && selectedPath === 'direct' || (selectedPath === 'pratique' && (applicationStatus === 'completed'))) 
                  ? '✓ Certifié' 
                  : (selectedPath === 'pratique' ? (!isSubmitted ? '● Action requise' : '● Paiement en attente') : (selectedPath ? '🔒 Non inclus' : '🔒 À venir')),
              },
              {
                num: 5,
                icon: '🏆',
                title: 'Permis Définitif',
                desc_done: 'Votre permis officiel est prêt — retrait en commune.',
                desc_pending: !isSubmitted
                  ? 'Production & livraison du titre officiel en commune.'
                  : 'En attente de votre règlement de formule.',
                status: (selectedPath === 'direct' && applicationStatus === 'completed') 
                  ? 'done' 
                  : (selectedPath === 'direct' && paymentValidated ? 'ready' : (selectedPath === 'direct' ? 'active' : 'locked')),
                badge: (selectedPath === 'direct' && applicationStatus === 'completed') 
                  ? '✓ Prêt' 
                  : (selectedPath === 'direct' && paymentValidated ? '⌛ À retirer' : (selectedPath === 'direct' ? (!isSubmitted ? '● Action requise' : '● Paiement en attente') : (selectedPath ? '🔒 Non inclus' : '🔒 À venir'))),
              },
            ].map((phase) => {
              const isDone = phase.status === 'done';
              const isActive = phase.status === 'active';
              const isReady = phase.status === 'ready';
              const isLocked = phase.status === 'locked';
              return (
                <div
                  key={phase.num}
                  className={`group relative p-2.5 sm:p-3.5 rounded-2xl flex flex-col gap-1 sm:gap-1.5 transition-all duration-500 border cursor-default flex-shrink-0 w-[240px] sm:w-[260px] lg:w-auto snap-start ${
                    isDone
                      ? 'bg-slate-950/50 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_4px_20px_rgba(52,211,153,0.08)]'
                    : isActive
                      ? 'bg-white/5 border-brand-orange/40 shadow-[0_8px_20px_rgba(255,152,0,0.08)] hover:border-brand-orange/70'
                    : isReady
                      ? 'bg-brand-orange/8 border-brand-orange/40 shadow-[0_8px_20px_rgba(255,152,0,0.1)] hover:border-brand-orange/70'
                    : 'bg-slate-950/30 border-white/8 opacity-40 hover:opacity-100 hover:bg-slate-900/60 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <span className={`self-start text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border transition-all duration-300 ${
                    isDone ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : isActive ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange animate-pulse'
                    : isReady ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange animate-pulse'
                    : 'bg-white/5 border-white/10 text-white/30 group-hover:bg-white/10 group-hover:text-white/60 group-hover:border-white/20'
                  }`}>
                    {phase.badge}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className={`text-xl transition-all duration-300 ${isLocked ? 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80' : ''}`}>
                      {phase.icon}
                    </span>
                    <div>
                      <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${isLocked ? 'text-white/20 group-hover:text-white/40' : 'text-white/30'}`}>
                        Phase {phase.num}
                      </p>
                      <h4 className={`font-bold text-xs leading-tight transition-colors duration-300 ${
                        isDone ? 'text-white'
                        : isActive || isReady ? 'text-white'
                        : 'text-white/35 group-hover:text-white/80'
                      }`}>
                        {phase.title}
                      </h4>
                    </div>
                  </div>

                  <p className={`text-[10px] leading-relaxed transition-colors duration-300 ${
                    isDone ? 'text-white/55'
                    : isActive || isReady ? 'text-white/55'
                    : 'text-white/20 group-hover:text-white/50'
                  }`}>
                    {isDone ? phase.desc_done : phase.desc_pending}
                  </p>

                  {isLocked && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/15 text-white/80 text-[9px] font-semibold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                      🔓 Se débloque après validation du dossier
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-white/15 rotate-45 -mt-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTION CALL / ADVISOR ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-1 sm:mt-1.5">
        
        {/* Advisor Card */}
        <div className={`lg:col-span-1 bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between items-center text-center`}>
          <div>
            <h4 className="text-white/70 font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 sm:mb-2.5">Votre Conseiller Agréé</h4>
            <div className="relative inline-block">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-brand-orange flex items-center justify-center text-xl sm:text-xl shadow-lg border-2 border-brand-orange/30">
                {advisor.avatarEmoji || '👨‍💼'}
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-slate-950 rounded-full ${advisor.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
            </div>
            <h5 className="text-white font-bold text-sm sm:text-base mt-2">{advisor.name}</h5>
            <p className="text-brand-orange text-[10px] sm:text-xs font-medium uppercase mt-0.5">{advisor.title}</p>
          </div>
          <div className="flex flex-col gap-2 w-full mt-2.5 sm:mt-3">
            <button 
              onClick={() => setActiveTab('chat')}
              className="w-full py-1.5 sm:py-2 rounded-full text-xs font-bold bg-white/5 border border-white/15 hover:border-brand-orange hover:bg-brand-orange/10 transition-all duration-300 cursor-pointer"
            >
              💬 Lui écrire sur le site
            </button>
            <a 
              href={`https://wa.me/${advisor?.contactWhatsapp || '32466902299'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 sm:py-2 rounded-full text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Discuter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Info Card / Action Card */}
        <div className={`lg:col-span-2 bg-gradient-to-br from-slate-950/60 to-slate-950/90 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between`}>
          <div>
            <h4 className="text-white/70 font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-4">Statut & Actions Requises</h4>
            
            {isSubmitted ? (
              <div className="flex items-start gap-2.5 sm:gap-4">
                {applicationStatus === 'completed' ? (
                  <>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-xs sm:text-sm flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                      🏆
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-xs sm:text-sm">Dossier Validé & Clôturé</h5>
                      <p className="text-white/60 text-[10px] sm:text-xs mt-1 leading-relaxed">
                        {selectedPath === 'perception'
                          ? "Félicitations ! Votre dossier de perception du risque a été validé officiellement. Votre attestation officielle est disponible ci-dessous."
                          : "Félicitations ! L'ensemble de vos dispenses d'examens officielles a été validé et enregistré. Votre permis de conduire définitif est désormais disponible et prêt pour le retrait en commune."
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-xs sm:text-sm flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-xs sm:text-sm">Dossier reçu et sauvegardé</h5>
                      <p className="text-white/60 text-[10px] sm:text-xs mt-1 leading-relaxed">
                        Votre demande a été enregistrée de façon sécurisée dans notre base de données. {(advisor.name || '').split(' ')[0]} analyse vos documents d'identité pour constitution physique. Aucune action supplémentaire n'est requise.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange text-xs sm:text-sm flex-shrink-0 animate-pulse">
                  !
                </div>
                <div>
                  <h5 className="text-white font-bold text-xs sm:text-sm">Demande en attente d'initialisation</h5>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed">
                    Pour lancer l'analyse de votre profil et la demande légale de votre permis de conduire auprès de l'administration officielle, veuillez compléter votre dossier en fournissant vos pièces.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isSubmitted && (
            <button 
              onClick={() => {
                setActiveTab('wizard');
                setWizardStep(1);
              }}
              className="mt-6 w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-md shadow-brand-orange/20 hover:scale-[1.02] transition-all duration-300 self-start animate-pulse cursor-pointer"
            >
              Initier mon dossier maintenant ➔
            </button>
          )}

          {isSubmitted && (selectedPath === 'perception' || selectedPath === 'theorique' || selectedPath === 'pratique') && (() => {
            const isPaymentPending = !paymentValidated || (getSplitPaymentDetails().isSplit && !soldeValidated) || applicationStatus !== 'completed';
            return (
              <button 
                disabled={isPaymentPending}
                onClick={() => setShowUpgradeConfirm(true)}
                className={`mt-6 w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold transition-all duration-300 self-start flex items-center justify-center gap-1.5 ${
                  isPaymentPending
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:scale-[1.02] cursor-pointer'
                }`}
              >
                {isPaymentPending ? (
                  <>🔒 Modification de formule indisponible (Validation en cours)</>
                ) : (
                  <>
                    ⚡ Changer de formule ({
                      selectedPath === 'perception' ? 'Pratique, Direct' :
                      selectedPath === 'theorique' ? 'Perception, Pratique, Direct' :
                      'Direct'
                    })
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* legal disclaimer compliance */}
      <div className="border-t border-white/10 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 md:pr-28">
        <span className="text-[10px] text-white/45 leading-relaxed max-w-xl text-center sm:text-left">
          ⚖️ <strong className="text-white/60">Mentions légales & Conformité</strong> : Procédure 100% encadrée par les directives administratives européennes et les articles de réciprocité en vigueur. Enregistré au registre officiel belge.
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-white/5 px-2.5 py-1 rounded-md text-white/40 font-bold border border-white/5 tracking-wider uppercase">CE 2006/126</span>
          <span className="text-[9px] bg-white/5 px-2.5 py-1 rounded-md text-white/40 font-bold border border-white/5 tracking-wider uppercase">SPF MOBILITÉ</span>
        </div>
      </div>    </div>
  );
}
