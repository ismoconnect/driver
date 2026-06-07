import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Navbar from './Navbar';

export default function ClientAuth({ onBack, initialMode = 'login', onAuthSuccess, onSwitchMode }) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'

  React.useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Signup fields
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Diagnostic Quiz states
  const [signupStep, setSignupStep] = useState(1);
  const [failures, setFailures] = useState('');
  const [region, setRegion] = useState('');
  const [hasDossier, setHasDossier] = useState('');

  const formatBelgianPhone = (val) => {
    if (!val) return '';
    let cleaned = val.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('04')) {
      cleaned = '+324' + cleaned.slice(2);
    }
    if (cleaned.startsWith('+324')) {
      let rest = cleaned.slice(4);
      rest = rest.replace(/\D/g, '').slice(0, 8);
      let formatted = '+32 4';
      if (rest.length > 0) formatted += rest.slice(0, 2);
      if (rest.length > 2) formatted += ' ' + rest.slice(2, 4);
      if (rest.length > 4) formatted += ' ' + rest.slice(4, 6);
      if (rest.length > 6) formatted += ' ' + rest.slice(6, 8);
      return formatted;
    }
    return cleaned;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'signup' && authPassword !== authConfirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (!signupFirstName.trim() || !signupLastName.trim()) {
          setAuthError('Veuillez renseigner votre nom et prénom.');
          setAuthLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const newUser = userCredential.user;

        // Créer l'utilisateur dans Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim(),
          phone: signupPhone.trim(),
          createdAt: new Date().toISOString(),
          status: 'new',
        });

        // Créer le dossier dans la collection leads avec les réponses du diagnostic
        await setDoc(doc(db, 'leads', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim(),
          phone: signupPhone.trim(),
          status: 'new',
          createdAt: new Date().toISOString(),
          isSubmitted: false,
          source: 'quiz_eligibility',
          answers: {
            failures: failures || 'Non renseigné',
            region: region || 'Non renseignée',
            hasDossier: hasDossier || 'Non renseigné'
          }
        });
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (error) {
      console.error("Auth error:", error);
      let frenchMessage = "Une erreur est survenue lors de l'authentification.";
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          frenchMessage = "Identifiants incorrects. Veuillez vérifier votre email et mot de passe.";
          break;
        case 'auth/email-already-in-use':
          frenchMessage = "Cet email est déjà associé à un compte candidat.";
          break;
        case 'auth/weak-password':
          frenchMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case 'auth/invalid-email':
          frenchMessage = "Format d'adresse email invalide.";
          break;
        case 'auth/too-many-requests':
          frenchMessage = "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
          break;
      }
      setAuthError(frenchMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-sans relative overflow-hidden pt-32 px-6 pb-12">
      <Navbar 
        user={null} 
        onOpenDashboard={(mode) => {
          setAuthMode(mode);
          if (mode === 'signup') {
            setSignupStep(1);
          }
          if (onSwitchMode) onSwitchMode(mode);
        }} 
        onGoHome={onBack} 
        forceScrolled={true} 
      />
      
      {/* Background Auroras */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60" style={{
          background: 'radial-gradient(circle, rgba(255, 152, 0, 0.15) 0%, transparent 75%)'
        }} />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60" style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.1) 0%, transparent 75%)'
        }} />
      </div>

      {/* Login/Signup Container Card */}
      <div className={`w-full my-auto relative z-10 bg-white/40 text-slate-900 border-2 border-slate-900 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl overflow-hidden group transition-all duration-300 ${
        authMode === 'login' ? 'max-w-md p-8 sm:p-10' : 'max-w-4xl p-0'
      }`}>
        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
          style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255,152,0,0.04) 0%, transparent 60%)' }} 
        />

        {authMode === 'login' ? (
          <>
            <button
              onClick={onBack}
              className="relative z-10 inline-flex items-center gap-2 text-[11px] text-slate-600 bg-white/70 hover:bg-white/90 border border-slate-200 shadow-sm px-4 py-2 rounded-full font-bold transition-all focus:outline-none mb-8 hover:text-brand-orange hover:shadow-md cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à l'accueil
            </button>

            <div className="relative z-10 flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0114.9 8.9L16 7.414A2 2 0 0116 5H3z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-display font-bold tracking-wider text-slate-900">
                  MON <span className="text-brand-orange">PERMIS</span>
                </span>
                <span className="ml-2 inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">
                  🔒 SSL
                </span>
              </div>
            </div>

            <div className="relative z-10 mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                Se connecter
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5">
                Accédez à votre dossier de permis de conduire.
              </p>
            </div>

            {authError && (
              <div className="relative z-10 bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-2xl mb-6 flex items-start gap-2.5 shadow-sm">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="relative z-10 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Adresse Email</label>
                <input 
                  required
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="nom@exemple.be" 
                  className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Mot de Passe</label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? 'text' : 'password'} 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-bold shadow-[0_8px_20px_rgba(255,152,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Se connecter ➔'
                )}
              </button>
            </form>

            <div className="relative z-10 mt-6 pt-6 border-t border-slate-200 text-center">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setSignupStep(1);
                  setAuthError('');
                  if (onSwitchMode) onSwitchMode('signup');
                }}
                className="text-xs text-slate-500 hover:text-brand-orange font-bold transition-colors focus:outline-none cursor-pointer"
              >
                Pas encore de compte ? S'inscrire
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
            {/* Left Column - SSL Logo, Info & Trust */}
            <div className="md:col-span-5 bg-slate-900/5 border-b md:border-b-0 md:border-r border-slate-900/10 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="relative z-10 flex items-center gap-2.5 mb-8">
                  <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0114.9 8.9L16 7.414A2 2 0 0116 5H3z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-base font-display font-bold tracking-wider text-slate-900">
                      MON <span className="text-brand-orange">PERMIS</span>
                    </span>
                    <span className="ml-2 inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">
                      🔒 SSL
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-display font-extrabold text-slate-900 leading-tight mb-4">
                  Diagnostic d'Éligibilité Officiel
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Obtenez votre permis de conduire officiel belge sans examen. Remplissez le diagnostic sécurisé pour enregistrer votre dossier auprès de nos services agréés.
                </p>
                
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Enregistrement officiel SPF Belgique
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Zéro examen pratique ni théorique
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Accompagnement par un conseiller dédié
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-900/10 hidden md:block">
                <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">🔒 Démarche 100% Sécurisée</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Vos documents et données sont protégés par le protocole de chiffrement SSL.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Registration Form & Diagnostic steps */}
            <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center relative z-10">
              <button
                onClick={onBack}
                className="inline-flex self-start items-center gap-2 text-[11px] text-slate-600 bg-white/70 hover:bg-white/90 border border-slate-200 shadow-sm px-4 py-2 rounded-full font-bold transition-all focus:outline-none mb-6 hover:text-brand-orange hover:shadow-md cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour à l'accueil
              </button>

              <div className="w-full bg-slate-200 h-1 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-brand-orange h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(((signupStep - 1) / 3) * 100, 100)}%` }}
                />
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-extrabold text-slate-900">
                  {signupStep === 4 ? 'Créer un compte' : "Diagnostic d'Éligibilité"}
                </h2>
                <p className="text-slate-600 text-xs mt-1 font-semibold">
                  {signupStep === 4 
                    ? 'Éligibilité validée ! Finalisez votre inscription sécurisée.'
                    : `Étape ${signupStep} sur 3 : Répondez pour vérifier vos droits.`}
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-2xl mb-6 flex items-start gap-2.5 shadow-sm animate-fadeIn">
                  <span className="text-sm flex-shrink-0">⚠️</span>
                  <span>{authError}</span>
                </div>
              )}

              {/* STEP 1: Driving test failures */}
              {signupStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 text-center leading-snug">
                    Combien de fois avez-vous échoué à l'examen de conduite ?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "🆕 Jamais (Premier essai)", val: "Jamais" },
                      { label: "❌ 1 fois", val: "1 fois" },
                      { label: "❌ 2 fois", val: "2 fois" },
                      { label: "❌ 3 fois ou plus", val: "3 fois ou plus" }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setFailures(opt.val); setSignupStep(2); }}
                        className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 font-bold text-sm text-left transition-all duration-200 cursor-pointer shadow-sm hover:border-brand-orange hover:text-brand-orange"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Belgium Region */}
              {signupStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 text-center leading-snug">
                    Dans quelle région de Belgique résidez-vous ?
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: "🏙️ Bruxelles (Région de Bruxelles-Capitale)", val: "Bruxelles" },
                      { label: "🌳 Wallonie (Région wallonne)", val: "Wallonie" },
                      { label: "🌾 Flandre (Région flamande)", val: "Flandre" }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setRegion(opt.val); setSignupStep(3); }}
                        className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 font-bold text-sm text-left transition-all duration-200 cursor-pointer shadow-sm hover:border-brand-orange hover:text-brand-orange"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-brand-orange flex items-center gap-1 cursor-pointer transition-colors mt-2"
                  >
                    ← Étape précédente
                  </button>
                </div>
              )}

              {/* STEP 3: Existing Auto-école dossier */}
              {signupStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 text-center leading-snug">
                    Avez-vous déjà un dossier d'inscription actif en auto-école ?
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: "📝 Oui, j'ai déjà un dossier actif", val: "Oui" },
                      { label: "❌ Non, aucun dossier en cours", val: "Non" }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setHasDossier(opt.val); setSignupStep(4); }}
                        className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 font-bold text-sm text-left transition-all duration-200 cursor-pointer shadow-sm hover:border-brand-orange hover:text-brand-orange"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-brand-orange flex items-center gap-1 cursor-pointer transition-colors mt-2"
                  >
                    ← Étape précédente
                  </button>
                </div>
              )}

              {/* STEP 4: Final account registration */}
              {signupStep === 4 && (
                <form onSubmit={handleAuthSubmit} className="space-y-4 animate-fadeIn">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Prénom</label>
                      <input
                        required
                        type="text"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        placeholder="Jean"
                        className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nom</label>
                      <input
                        required
                        type="text"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(formatBelgianPhone(e.target.value))}
                      placeholder="+32 470 00 00 00"
                      className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Adresse Email</label>
                    <input 
                      required
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="nom@exemple.be" 
                      className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Mot de Passe</label>
                      <div className="relative">
                        <input 
                          required
                          type={showPassword ? 'text' : 'password'} 
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-3 py-2.5 pr-12 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Confirmer le Mot de Passe</label>
                      <div className="relative">
                        <input 
                          required
                          type={showConfirmPassword ? 'text' : 'password'} 
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-3 py-2.5 pr-12 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 mt-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-bold shadow-[0_8px_20px_rgba(255,152,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Créer mon compte ➔'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupStep(3)}
                    className="text-xs font-bold text-slate-500 hover:text-brand-orange flex items-center gap-1 cursor-pointer transition-colors mt-2"
                  >
                    ← Étape précédente
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    if (onSwitchMode) onSwitchMode('login');
                  }}
                  className="text-xs text-slate-500 hover:text-brand-orange font-bold transition-colors focus:outline-none cursor-pointer"
                >
                  Déjà inscrit ? Se connecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
