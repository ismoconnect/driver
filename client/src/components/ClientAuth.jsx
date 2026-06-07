import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { sendWelcomeEmail } from '../utils/notifications';

export default function ClientAuth({ onBack, initialMode = 'login', onAuthSuccess, onSwitchMode, advisor }) {
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

  const formatBelgianPhone = (val) => {
    if (!val) return '';
    
    // Allow deleting the prefix naturally
    if (val === '+' || val === '+3' || val === '+32' || val === '+32 ') {
      return val;
    }

    let cleaned = val.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('04')) {
      cleaned = '+324' + cleaned.slice(2);
    }
    
    if (cleaned.startsWith('+324')) {
      let rest = cleaned.slice(4);
      rest = rest.replace(/\D/g, '').slice(0, 8);
      let formatted = '+32 4';
      if (rest.length > 0) formatted += ' ' + rest.slice(0, 2);
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

        // Créer le dossier dans la collection leads
        await setDoc(doc(db, 'leads', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim(),
          phone: signupPhone.trim(),
          status: 'new',
          createdAt: new Date().toISOString(),
          isSubmitted: false,
          source: 'account_creation',
          answers: {
            failures: 'Non renseigné',
            region: 'Non renseignée',
            hasDossier: 'Non renseigné'
          }
        });

        // Envoyer l'email de bienvenue
        sendWelcomeEmail(newUser.email, signupFirstName.trim(), advisor).catch(err => {
          console.error("Failed to send welcome email:", err);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-sans relative overflow-hidden pt-24 px-6 pb-6">
      <Navbar 
        user={null} 
        onOpenDashboard={(mode) => {
          setAuthMode(mode);
          if (onSwitchMode) onSwitchMode(mode);
        }} 
        onGoHome={onBack} 
        forceScrolled={true} 
        advisor={advisor}
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
        authMode === 'login' ? 'max-w-md p-8 sm:p-10' : 'max-w-6xl p-0'
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

            <div className="relative z-10 flex items-center justify-between bg-slate-950 border border-slate-900 px-5 py-3 rounded-2xl mb-8 shadow-sm">
              <img src={advisor?.logoUrl || "/logo.png"} alt="Mon Permis Logo" className="h-9 rounded-lg" />
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider align-middle">
                🔒 SSL
              </span>
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
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
            {/* Left Column - SSL Logo, Info & Trust */}
            <div className="md:col-span-5 bg-slate-900/5 border-b md:border-b-0 md:border-r border-slate-900/10 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-slate-950/5">
              <div>
                <div className="relative z-10 flex items-center justify-between bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-2xl mb-4 shadow-sm">
                  <img src={advisor?.logoUrl || "/logo.png"} alt="Mon Permis Logo" className="h-8 rounded-lg" />
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider align-middle">
                    🔒 SSL
                  </span>
                </div>

                {/* Promotional Card containing the Hero Image */}
                <div className="relative z-10 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md mb-4 hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row md:h-24">
                  <div className="h-28 md:h-full md:w-4/12 relative overflow-hidden flex-shrink-0">
                    <img 
                      src={advisor?.heroImageUrl || "/smiling_driver.png"} 
                      alt="Conducteur Belge Souriant" 
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent" />
                    <span className="absolute bottom-1 left-1 bg-brand-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                      ★ 4.9/5
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 text-white flex-1 flex flex-col justify-center">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-orange mb-0.5">
                      Votre permis belge sans examen
                    </h4>
                    <p className="text-[9px] text-slate-400 font-light leading-relaxed">
                      Plus de 1 240 candidats belges accompagnés avec succès.
                    </p>
                  </div>
                </div>

                <h3 className="text-base font-display font-extrabold text-slate-900 leading-tight mb-2">
                  Créer un compte candidat
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-3">
                  Créez votre compte en quelques secondes pour démarrer votre demande officielle d'homologation de permis en Belgique.
                </p>
                
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Inscription rapide et sécurisée
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Suivi en direct avec votre conseiller
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Garantie de confidentialité des données
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900/10 hidden md:block">
                <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-2.5 text-center">
                  <p className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">🔒 Démarche 100% Certifiée</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Strict respect de la réglementation belge.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Registration Form */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between relative z-10">
              <div>
                <button
                  onClick={onBack}
                  className="inline-flex self-end items-center gap-2 text-[11px] text-slate-600 bg-white/70 hover:bg-white/90 border border-slate-200 shadow-sm px-4 py-1.5 rounded-full font-bold transition-all focus:outline-none mb-3 hover:text-brand-orange hover:shadow-md cursor-pointer animate-[fadeIn_0.2s_ease-out]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour à l'accueil
                </button>

                <div className="mb-3">
                  <h2 className="text-2xl font-display font-extrabold text-slate-900">
                    Créer un compte
                  </h2>
                  <p className="text-slate-600 text-xs mt-0.5 font-semibold">
                    Renseignez vos coordonnées pour démarrer l'accompagnement légal.
                  </p>
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-2xl mb-4 flex items-start gap-2.5 shadow-sm animate-fadeIn">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3 animate-fadeIn">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Prénom</label>
                      <input
                        required
                        type="text"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        placeholder="Jean"
                        className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nom</label>
                      <input
                        required
                        type="text"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(formatBelgianPhone(e.target.value))}
                      onFocus={() => {
                        if (!signupPhone) {
                          setSignupPhone('+32 ');
                        }
                      }}
                      onBlur={() => {
                        if (signupPhone.trim() === '+32' || signupPhone.trim() === '+') {
                          setSignupPhone('');
                        }
                      }}
                      placeholder="+32 470 00 00 00"
                      className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Adresse Email</label>
                    <input 
                      required
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="nom@exemple.be" 
                      className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Mot de Passe</label>
                      <div className="relative">
                        <input 
                          required
                          type={showPassword ? 'text' : 'password'} 
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-3 py-2 pr-12 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer text-xs"
                          tabIndex={-1}
                        >
                          {showPassword ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Confirmer le Mot de Passe</label>
                      <div className="relative">
                        <input 
                          required
                          type={showConfirmPassword ? 'text' : 'password'} 
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-3 py-2 pr-12 text-xs focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer text-xs"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 mt-1 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-bold shadow-[0_8px_20px_rgba(255,152,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Créer mon compte ➔'
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/50 text-center">
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
