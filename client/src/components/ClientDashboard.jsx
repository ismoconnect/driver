import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import Navbar from './Navbar';

export default function ClientDashboard({ onBack, initialMode = 'login', onAuthSuccess, onSwitchMode }) {
  // Authentication states
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Signup extra fields
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Dashboard state
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, wizard, chat, documents
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('new');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    address: '',
    nationalRegister: '',
    failedAttempts: '0',
    transmission: 'Manuel',
  });

  // Simulated uploads state
  const [uploads, setUploads] = useState({
    idFront: null,
    idBack: null,
    photo: null,
    signature: null,
  });

  // Mock upload animations state
  const [uploading, setUploading] = useState({
    idFront: false,
    idBack: false,
    photo: false,
    signature: false,
  });

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'advisor',
      text: "Bonjour ! Je suis Jean-Pierre, votre conseiller dédié. Bienvenue dans votre Espace Permis sécurisé. 🇧🇪",
      time: "Aujourd'hui, 10:15",
    },
    {
      id: 2,
      sender: 'advisor',
      text: "Pour lancer officiellement votre dossier d'obtention sans examen, veuillez vous rendre dans l'onglet 'Faire ma demande' et compléter les étapes.",
      time: "Aujourd'hui, 10:16",
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
      
      if (currentUser) {
        // Fetch existing lead data from Firestore
        setIsLoadingData(true);
        try {
          // Fetch from 'leads' first
          const leadRef = doc(db, 'leads', currentUser.uid);
          const leadSnap = await getDoc(leadRef);
          let leadData = null;
          if (leadSnap.exists()) {
            leadData = leadSnap.data();
          }

          // Fetch from 'users' as fallback/signup source
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          let userData = null;
          if (userSnap.exists()) {
            userData = userSnap.data();
          }

          const resolvedFirstName = leadData?.firstName || userData?.firstName || currentUser.displayName?.split(' ')[0] || '';
          const resolvedLastName = leadData?.lastName || userData?.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '';
          const resolvedPhone = leadData?.phone || userData?.phone || '';

          if (leadData || userData) {
            setFormData({
              firstName: resolvedFirstName,
              lastName: resolvedLastName,
              birthDate: leadData?.birthDate || '',
              phone: resolvedPhone,
              address: leadData?.address || '',
              nationalRegister: leadData?.nationalRegister || '',
              failedAttempts: leadData?.failedAttempts || '0',
              transmission: leadData?.transmission || 'Manuel',
            });
            setIsSubmitted(leadData?.isSubmitted || false);
            setApplicationStatus(leadData?.status || userData?.status || (leadData?.isSubmitted ? 'processing' : 'new'));
            
            // Re-simulate or populate file uploads if metadata is in DB
            if (leadData?.uploads) {
              setUploads(leadData.uploads);
            }

            // Restore custom welcoming messages
            if (resolvedFirstName) {
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  sender: 'advisor',
                  text: `Ravi de vous revoir ${resolvedFirstName} ! Votre dossier est sécurisé chez nous. La phase '${leadData?.isSubmitted ? "Constitution du Dossier" : "Analyse du Profil"}' est active. 🚀`,
                  time: "À l'instant",
                }
              ]);
            }
          } else {
            // New user, reset local states
            setFormData({
              firstName: '',
              lastName: '',
              birthDate: '',
              phone: '',
              address: '',
              nationalRegister: '',
              failedAttempts: '0',
              transmission: 'Manuel',
            });
            setIsSubmitted(false);
            setUploads({
              idFront: null,
              idBack: null,
              photo: null,
              signature: null,
            });
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
        } finally {
          setIsLoadingData(false);
        }

        // Real-time listeners: update UI instantly when admin changes status/reset
        const leadRef2 = doc(db, 'leads', currentUser.uid);
        const userRef2 = doc(db, 'users', currentUser.uid);
        
        const unsubLead = onSnapshot(leadRef2, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsSubmitted(data.isSubmitted === true);
            setApplicationStatus(data.status || 'new');
          }
        });

        const unsubUser = onSnapshot(userRef2, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            // If the users doc has isSubmitted explicitly set, use it
            if (data.isSubmitted !== undefined) {
              setIsSubmitted(data.isSubmitted === true);
            }
            if (data.status) {
              setApplicationStatus(data.status);
            }
          }
        });

        // Store unsubscribe functions for cleanup
        window.__unsubLeadListener = unsubLead;
        window.__unsubUserListener = unsubUser;
      }
    });

    return () => {
      unsubscribe();
      if (window.__unsubLeadListener) window.__unsubLeadListener();
      if (window.__unsubUserListener) window.__unsubUserListener();
    };
  }, []);

  // Handle authentication (Login / Signup)
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
        // Validation champs inscription
        if (!signupFirstName.trim() || !signupLastName.trim()) {
          setAuthError('Veuillez renseigner votre nom et prénom.');
          setAuthLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const newUser = userCredential.user;
        // Créer le document dans la collection "users"
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim(),
          phone: signupPhone.trim(),
          createdAt: new Date().toISOString(),
          status: 'new',
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

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Enregistrer/Récupérer les infos dans Firestore
      const docRef = doc(db, 'leads', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: user.email,
          createdAt: new Date().toISOString(),
          status: 'new',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || ''
        });
      }
      
      if (onAuthSuccess) onAuthSuccess();
    } catch (error) {
      console.error("Google Auth error:", error);
      setAuthError("Erreur lors de la connexion avec Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onBack(); // Go back to landing page on logout
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  // Handle Wizard input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Simulating document upload
  const simulateUpload = (fieldName, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [fieldName]: true }));
    
    setTimeout(() => {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
      setUploads(prev => ({ ...prev, [fieldName]: file.name }));
    }, 1500);
  };

  // Form submission directly to Firestore
  const handleSubmitDemand = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsLoadingData(true);
    try {
      const leadData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        phone: formData.phone,
        address: formData.address,
        nationalRegister: formData.nationalRegister,
        failedAttempts: formData.failedAttempts,
        transmission: formData.transmission,
        isSubmitted: true,
        uploads: uploads,
        submittedAt: new Date().toISOString(),
        uid: user.uid,
        email: user.email,
      };

      await setDoc(doc(db, 'leads', user.uid), leadData);
      setIsSubmitted(true);
      
      // Add success message to chat from advisor
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'advisor',
            text: `Félicitations ${formData.firstName || 'Candidat'} ! J'ai bien reçu votre demande complète. Nous venons d'initier la phase 'Constitution du Dossier' auprès des services agréés. 🚀`,
            time: "À l'instant",
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error("Firestore writing error:", error);
      alert("Erreur lors de l'enregistrement de votre demande. Veuillez réessayer.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Chat message sending
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'student',
      text: chatInput,
      time: "À l'instant",
    };

    setMessages(prev => [...prev, userMsg]);
    const question = chatInput.toLowerCase();
    setChatInput('');
    setIsTyping(true);

    // Auto replies based on questions
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "J'examine actuellement vos documents. Tout semble parfait, je vous tiens au courant dès la validation de la prochaine étape !";
      
      if (question.includes('examen') || question.includes('passer') || question.includes('repasser')) {
        replyText = "C'est la force de notre filière : la validation se fait à 100% sur dossier administratif. Vous n'aurez aucun examen pratique ou théorique à repasser !";
      } else if (question.includes('temps') || question.includes('quand') || question.includes('delai') || question.includes('délai')) {
        replyText = "En moyenne, l'obtention et l'enregistrement du permis en commune prennent entre 3 et 4 semaines après soumission complète de votre dossier.";
      } else if (question.includes('legal') || question.includes('légal') || question.includes('loi') || question.includes('officiel')) {
        replyText = "Absolument légal ! Notre procédure exploite les accords de réciprocité administrative au sein de l'Union Européenne et est pleinement agréée par le SPF Mobilité.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'advisor',
          text: replyText,
          time: "À l'instant",
        }
      ]);
    }, 2000);
  };

  // ----------------------------------------------------
  // RENDER: LOADING STATE DURING INIT
  // ----------------------------------------------------
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-sm font-medium">Initialisation de votre espace sécurisé...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: LOGIN/SIGNUP SCREEN (IF NOT LOGGED IN)
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-sans relative overflow-hidden pt-32 px-6 pb-12">
        <Navbar user={user} onOpenDashboard={(mode) => setAuthMode(mode)} onGoHome={onBack} forceScrolled={true} />
        
        {/* --- Background Auroras --- */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60" style={{
            background: 'radial-gradient(circle, rgba(255, 152, 0, 0.15) 0%, transparent 75%)'
          }} />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60" style={{
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.1) 0%, transparent 75%)'
          }} />
        </div>

        {/* --- Login Card --- */}
        <div className="max-w-md w-full my-auto relative z-10 bg-white/40 text-slate-900 border-2 border-slate-900 p-8 sm:p-10 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl overflow-hidden group">
          
          {/* Ambient glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
            style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255,152,0,0.04) 0%, transparent 60%)' }} 
          />

          {/* Back link — styled as a small card */}
          <button
            onClick={onBack}
            className="relative z-10 inline-flex items-center gap-2 text-[11px] text-slate-600 bg-white/70 hover:bg-white/90 border border-slate-200 shadow-sm px-4 py-2 rounded-full font-bold transition-all focus:outline-none mb-8 hover:text-brand-orange hover:shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </button>

          {/* Logo inline */}
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
              {authMode === 'login' ? 'Se connecter' : 'Créer un compte'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5">
              {authMode === 'login' 
                ? 'Accédez à votre dossier de permis de conduire.' 
                : 'Initiez votre démarche officielle belge sans examen.'}
            </p>
          </div>

          {/* Error display */}
          {authError && (
            <div className="relative z-10 bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-2xl mb-6 flex items-start gap-2.5 shadow-sm">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <div className="relative z-10 mb-6">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm border border-slate-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuer avec Google
            </button>
            
            <div className="relative flex items-center mt-6">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">ou</span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="relative z-10 space-y-4">

            {/* Champs supplémentaires affichés uniquement en mode inscription */}
            {authMode === 'signup' && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Prénom</label>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nom</label>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+32 470 00 00 00"
                    className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                  />
                </div>
              </>
            )}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
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

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Confirmer le Mot de Passe</label>
                <div className="relative">
                  <input 
                    required
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/70 border-2 border-slate-900 focus:border-brand-orange focus:bg-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all duration-200 text-slate-900 placeholder-slate-500 hover:border-black shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
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
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-bold shadow-[0_8px_20px_rgba(255,152,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                authMode === 'login' ? 'Se connecter ➔' : 'Créer mon compte ➔'
              )}
            </button>
          </form>

          <div className="relative z-10 mt-6 pt-6 border-t border-slate-200 text-center">
            <button
              onClick={() => {
                const newMode = authMode === 'login' ? 'signup' : 'login';
                setAuthMode(newMode);
                setAuthError('');
                setAuthConfirmPassword('');
                if (onSwitchMode) onSwitchMode(newMode);
              }}
              className="text-xs text-slate-500 hover:text-brand-orange font-bold transition-colors focus:outline-none"
            >
              {authMode === 'login' 
                ? "Pas encore de compte ? S'inscrire" 
                : "Déjà inscrit ? Se connecter"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: SECURED CLIENT DASHBOARD (IF LOGGED IN)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-brand-orange selection:text-white relative">
      {/* Loading overlay for database synchronization */}
      {isLoadingData && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-white/70">Synchronisation en cours avec la base de données...</p>
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <header className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-opacity-80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-md shadow-brand-orange/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0114.9 8.9L16 7.414A2 2 0 0116 5H3z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-display font-bold tracking-wider">
              MON <span className="text-brand-orange">PERMIS</span>
            </span>
            <span className="ml-3 hidden sm:inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              🔒 Espace Sécurisé SSL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-xs text-white/50 truncate max-w-[240px]">
            Candidat : {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : user.email}
          </span>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white/50 text-xs sm:text-sm transition-all duration-300 bg-white/5 hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site
          </button>
        </div>
      </header>

      {/* --- DASHBOARD WRAPPER --- */}
      <div className="flex-1 flex flex-col md:flex-row w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* --- SIDEBAR --- */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col sticky top-24 pr-6 border-r border-white/10 self-start">
          
          {/* User profile card */}
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange/20 border-2 border-brand-orange/40 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-orange font-bold text-sm">
                  {(formData.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Mon Espace'}
                </p>
                <p className="text-white/40 text-[11px] truncate">
                  {formData.firstName || formData.lastName ? 'Candidat Agréé' : user.email}
                </p>
              </div>
            </div>
            {isSubmitted && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Dossier en cours</span>
              </div>
            )}
          </div>

          {/* Navigation — ordre chronologique */}
          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 mb-2">Navigation</p>

            {/* 1 — Vue d'ensemble */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full ${
                activeTab === 'overview'
                  ? 'bg-brand-orange text-white shadow-[0_4px_16px_rgba(255,152,0,0.35)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70'}`}>1</span>
              <span>Vue d'ensemble</span>
            </button>

            {/* 2 — Faire ma demande */}
            <button
              onClick={() => setActiveTab('wizard')}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full ${
                activeTab === 'wizard'
                  ? 'bg-brand-orange text-white shadow-[0_4px_16px_rgba(255,152,0,0.35)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${activeTab === 'wizard' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70'}`}>2</span>
              <span>Faire ma demande</span>
              {!isSubmitted && (
                <span className="ml-auto w-2 h-2 rounded-full bg-brand-orange animate-ping" />
              )}
              {isSubmitted && (
                <svg className="ml-auto w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* 3 — Mon Conseiller */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full ${
                activeTab === 'chat'
                  ? 'bg-brand-orange text-white shadow-[0_4px_16px_rgba(255,152,0,0.35)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${activeTab === 'chat' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70'}`}>3</span>
              <span>Mon Conseiller</span>
              <span className="ml-auto flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </button>


          </nav>

          {/* Bottom section: Déconnexion */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-200 w-full cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* --- MAIN MAIN AREA --- */}
        <main className="flex-1 min-w-0 bg-slate-900 rounded-[32px] border border-white/10 p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative flex flex-col">
          {/* Ambient glow behind main area */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex-1 flex flex-col gap-8 relative z-10 animate-[bubbleIn_0.5s_ease-out]">
              
              {/* Header card info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                    Bonjour, {formData.firstName || 'Candidat'} 👋
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">
                    {isSubmitted 
                      ? "Votre demande d'obtention de permis officiel est en cours de traitement." 
                      : "Complétez votre demande pour initier l'obtention de votre permis de conduire."}
                  </p>
                </div>
                <div className="bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                  <span className="text-xs font-semibold text-white/95 uppercase tracking-wide">
                    ID Dossier : {isSubmitted ? `#MPB-${user.uid.slice(0, 5).toUpperCase()}` : "MPB-NON-INITIALISÉ"}
                  </span>
                </div>
              </div>

              {/* TIMELINE */}
              <div className="flex flex-col gap-6">
                <h3 className="text-base font-bold uppercase tracking-wider text-brand-orange">
                  Suivi de votre demande
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                  {/* Step 1: Examen Théorique */}
                  <div className="bg-slate-950/50 border border-emerald-500/30 p-5 rounded-2xl relative flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300">
                    <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      ✓ Validé
                    </span>
                    <div>
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block mb-1">Étape 1</span>
                      <h4 className="text-white font-bold text-sm">Examen Théorique</h4>
                      <p className="text-white/60 text-[11px] mt-2 leading-relaxed">
                        Dispense académique validée et enregistrée auprès des services administratifs.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Permis Provisoire */}
                  <div className={`p-5 rounded-2xl relative flex flex-col justify-between transition-all duration-300 ${
                    applicationStatus === 'processing' || applicationStatus === 'completed'
                      ? 'bg-slate-950/50 border border-emerald-500/30 hover:border-emerald-500/50' 
                      : 'bg-white/5 border border-brand-orange/30 hover:border-brand-orange/60 shadow-[0_8px_20px_rgba(255,152,0,0.05)]'
                  }`}>
                    <span className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      applicationStatus === 'processing' || applicationStatus === 'completed'
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                        : 'bg-brand-orange/15 border border-brand-orange/30 text-brand-orange animate-pulse'
                    }`}>
                      {applicationStatus === 'processing' || applicationStatus === 'completed' ? '✓ Émis' : '● Action requise'}
                    </span>
                    <div>
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block mb-1">Étape 2</span>
                      <h4 className="text-white font-bold text-sm">Permis Provisoire</h4>
                      <p className="text-white/60 text-[11px] mt-2 leading-relaxed">
                        {applicationStatus === 'processing' || applicationStatus === 'completed'
                          ? "Homologation officielle de votre équivalence enregistrée." 
                          : "Formulaire, pièces d'identité et signature requis pour l'émission."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Test de Perception de Risque */}
                  <div className={`p-5 rounded-2xl relative flex flex-col justify-between border transition-all duration-300 ${
                    applicationStatus === 'completed'
                      ? 'bg-slate-950/50 border-emerald-500/30 hover:border-emerald-500/50'
                      : applicationStatus === 'processing'
                        ? 'bg-white/5 border-brand-orange/30 hover:border-brand-orange/60 shadow-[0_8px_20px_rgba(255,152,0,0.05)]' 
                        : 'bg-slate-950/20 border-white/5 opacity-50'
                  }`}>
                    {applicationStatus === 'completed' ? (
                      <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        ✓ Dispense
                      </span>
                    ) : applicationStatus === 'processing' ? (
                      <span className="absolute top-4 right-4 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[9px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                        ⌛ En cours
                      </span>
                    ) : (
                      <span className="absolute top-4 right-4 text-xs">🔒</span>
                    )}
                    <div>
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block mb-1">Étape 3</span>
                      <h4 className="text-white font-bold text-sm">Perception de Risque</h4>
                      <p className="text-white/60 text-[11px] mt-2 leading-relaxed">
                        {applicationStatus === 'completed'
                          ? "Certificat légal de dispense validé par l'administration." 
                          : applicationStatus === 'processing' 
                            ? "Traitement et validation de votre dispense du test de perception." 
                            : "Débloqué après soumission de votre dossier administratif."}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Examen Pratique */}
                  <div className={`p-5 rounded-2xl relative flex flex-col justify-between border transition-all duration-300 ${
                    applicationStatus === 'completed'
                      ? 'bg-slate-950/50 border-emerald-500/30 hover:border-emerald-500/50'
                      : applicationStatus === 'processing'
                        ? 'bg-white/5 border-brand-orange/30 hover:border-brand-orange/60 shadow-[0_8px_20px_rgba(255,152,0,0.05)]' 
                        : 'bg-slate-950/20 border-white/5 opacity-50'
                  }`}>
                    {applicationStatus === 'completed' ? (
                      <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        ✓ Certifié
                      </span>
                    ) : applicationStatus === 'processing' ? (
                      <span className="absolute top-4 right-4 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[9px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                        ⌛ En cours
                      </span>
                    ) : (
                      <span className="absolute top-4 right-4 text-xs">🔒</span>
                    )}
                    <div>
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block mb-1">Étape 4</span>
                      <h4 className="text-white font-bold text-sm">Examen Pratique</h4>
                      <p className="text-white/60 text-[11px] mt-2 leading-relaxed">
                        {applicationStatus === 'completed'
                          ? "Dispense d'examen pratique finalisée et officiellement enregistrée." 
                          : applicationStatus === 'processing' 
                            ? "Enregistrement légal de dispense de conduite en cours de validation." 
                            : "Débloqué après validation de la constitution du dossier."}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Permis Définitif */}
                  <div className={`p-5 rounded-2xl relative flex flex-col justify-between border transition-all duration-300 ${
                    applicationStatus === 'completed'
                      ? 'bg-white/5 border-brand-orange/30 hover:border-brand-orange/60 shadow-[0_8px_20px_rgba(255,152,0,0.05)]' 
                      : 'bg-slate-950/20 border-white/5 opacity-50'
                  }`}>
                    {applicationStatus === 'completed' ? (
                      <span className="absolute top-4 right-4 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[9px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                        ⌛ À retirer
                      </span>
                    ) : (
                      <span className="absolute top-4 right-4 text-xs">🔒</span>
                    )}
                    <div>
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block mb-1">Résultat</span>
                      <h4 className="text-white font-bold text-sm">Permis Définitif</h4>
                      <p className="text-white/60 text-[11px] mt-2 leading-relaxed">
                        {applicationStatus === 'completed'
                          ? "Votre permis officiel est prêt ! Veuillez vous présenter à votre commune pour le retrait."
                          : "Impression sécurisée et livraison finale du titre de permis physique en commune."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION CALL / ADVISOR ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                
                {/* Advisor Card */}
                <div className="lg:col-span-1 bg-slate-950/60 border border-white/10 p-6 rounded-2xl flex flex-col justify-between items-center text-center">
                  <div>
                    <h4 className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-4">Votre Conseiller Agréé</h4>
                    <div className="relative inline-block">
                      <div className="w-16 h-16 rounded-full bg-brand-orange flex items-center justify-center text-2xl shadow-lg border-2 border-brand-orange/30">
                        👨‍💼
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full" />
                    </div>
                    <h5 className="text-white font-bold text-base mt-3">Jean-Pierre Dumont</h5>
                    <p className="text-brand-orange text-xs font-medium uppercase mt-0.5">Expert Agréé SPF Belgique</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="mt-6 w-full py-2.5 rounded-full text-xs font-bold bg-white/5 border border-white/15 hover:border-brand-orange hover:bg-brand-orange/10 transition-all duration-300"
                  >
                    Lui écrire un message
                  </button>
                </div>

                {/* Info Card / Action Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-950/60 to-slate-950/90 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-4">Statut & Actions Requises</h4>
                    
                    {isSubmitted ? (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          ✓
                        </div>
                        <div>
                          <h5 className="text-white font-bold text-sm">Dossier reçu et sauvegardé</h5>
                          <p className="text-white/60 text-xs mt-1 leading-relaxed">
                            Votre demande a été enregistrée de façon sécurisée dans notre base de données. Jean-Pierre analyse vos documents d'identité pour constitution physique. Aucune action supplémentaire n'est requise.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange flex-shrink-0 animate-pulse">
                          !
                        </div>
                        <div>
                          <h5 className="text-white font-bold text-sm">Demande en attente d'initialisation</h5>
                          <p className="text-white/60 text-xs mt-1 leading-relaxed">
                            Pour lancer l'analyse de votre profil et la demande légale de votre permis de conduire auprès de l'administration officielle, veuillez compléter votre dossier en fournissant vos pièces.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isSubmitted && (
                    <button 
                      onClick={() => setActiveTab('wizard')}
                      className="mt-6 w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-md shadow-brand-orange/20 hover:scale-[1.02] transition-all duration-300 self-start animate-pulse"
                    >
                      Initier mon dossier maintenant ➔
                    </button>
                  )}
                </div>
              </div>

              {/* legal disclaimer compliance */}
              <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] text-white/40 leading-normal max-w-xl text-center sm:text-left">
                  ⚖️ **Mentions légales & Conformité** : Procédure 100% encadrée par les directives administratives européennes et les articles de réciprocité en vigueur. Enregistré au registre officiel belge.
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] bg-white/10 px-2.5 py-1 rounded text-white/50 font-bold border border-white/5">CE 2006/126</span>
                  <span className="text-[9px] bg-white/10 px-2.5 py-1 rounded text-white/50 font-bold border border-white/5">SPF MOBILITÉ</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WIZARD FORM */}
          {activeTab === 'wizard' && (
            <div className="flex-1 flex flex-col justify-between relative z-10 animate-[bubbleIn_0.5s_ease-out]">
              {isSubmitted ? (
                // SUCCESS STATE (RÉSULTAT DE L'ANALYSE)
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8 animate-[bubbleIn_0.6s_ease-out]">
                  {/* Premium Success Badge */}
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Analyse du Profil Complétée
                  </div>

                  {/* Icon with complex glow */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125" />
                    <div className="relative w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-4xl shadow-2xl">
                      ✅
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                    RÉSULTAT : ADMISSIBLE ! 🎉
                  </h2>
                  <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-md">
                    Félicitations <strong>{formData.firstName || 'Candidat'}</strong> ! L'analyse de votre profil confirme à 100% votre éligibilité pour notre filière d'obtention légale sans examen. Votre dossier est désormais entièrement constitué et enregistré de manière sécurisée.
                  </p>
                  
                  {/* Results Details Card */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 w-full mt-8 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
                      <span>📋</span> Détails du dossier enregistré
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2.5">
                        <p className="text-white/50">Candidat : <span className="text-white font-semibold">{formData.firstName} {formData.lastName}</span></p>
                        <p className="text-white/50">Registre National : <span className="text-white font-mono">{formData.nationalRegister || "Non spécifié"}</span></p>
                      </div>
                      <div className="space-y-2.5">
                        <p className="text-white/50">Permis souhaité : <span className="text-brand-orange font-semibold">Catégorie B ({formData.transmission})</span></p>
                        <p className="text-white/50">Pièces justificatives : <span className="text-emerald-400 font-semibold">{Object.values(uploads).filter(Boolean).length} / 4 téléversées</span></p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Statut du dossier :</span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                        Constitution & Envoi en cours
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-[0_8px_20px_rgba(255,152,0,0.25)] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-white"
                    >
                      Suivre mon dossier en temps réel ➔
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-white/5 border border-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer text-white/90"
                    >
                      Contacter mon conseiller
                    </button>
                  </div>
                </div>
              ) : (
                // ACTIVE WIZARD STATE
                <form onSubmit={handleSubmitDemand} className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                          Initier ma Demande Officielle
                        </h2>
                        <p className="text-white/60 text-xs mt-1">
                          {wizardStep === 1 && "Étape 1 sur 4 — Renseignez vos informations d'identité."}
                          {wizardStep === 2 && "Étape 2 sur 4 — Téléversez vos pièces justificatives requises (ID, photo, signature)."}
                          {wizardStep === 3 && "Étape 3 sur 4 — Configurez les options de votre permis de conduire."}
                          {wizardStep === 4 && "Étape 4 sur 4 — Signez le mandat de légalité pour finaliser votre demande."}
                        </p>
                      </div>
                      
                      {/* Step Bubbles */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((s) => (
                          <div 
                            key={s} 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                              wizardStep === s 
                                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/30' 
                                : wizardStep > s 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-white/5 border border-white/10 text-white/40'
                            }`}
                          >
                            {wizardStep > s ? '✓' : s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* STEP 1: IDENTITY */}
                    {wizardStep === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-[bubbleIn_0.4s_ease-out]">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Prénom</label>
                          <input 
                            required
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Ex. Sarah" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de famille</label>
                          <input 
                            required
                            type="text" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Ex. Peeters" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date de naissance</label>
                          <input 
                            required
                            type="date" 
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white/80"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Téléphone</label>
                          <input 
                            required
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Ex. +32 495 12 34 56" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse de résidence en Belgique</label>
                          <input 
                            required
                            type="text" 
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Rue de la Loi 16, 1000 Bruxelles" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Numéro de Registre National Belge (Simulé)
                          </label>
                          <input 
                            required
                            type="text" 
                            name="nationalRegister"
                            value={formData.nationalRegister}
                            onChange={handleInputChange}
                            placeholder="Ex. 95.05.23-123.45" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: DOCUMENT UPLOADS */}
                    {wizardStep === 2 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-[bubbleIn_0.4s_ease-out]">
                        
                        {/* Front ID */}
                        <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requis Front</span>
                            <h4 className="text-white font-semibold text-xs mt-1">Carte d'Identité (Recto)</h4>
                          </div>
                          
                          <div className="mt-4 border-2 border-dashed border-white/15 hover:border-brand-orange rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              onChange={(e) => simulateUpload('idFront', e.target.files[0])}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {uploading.idFront ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-white/50">Téléversement...</span>
                              </div>
                            ) : uploads.idFront ? (
                              <div className="text-center">
                                <span className="text-xl">📄</span>
                                <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[150px] mt-1">{uploads.idFront}</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-xl text-white/30">📤</span>
                                <span className="text-[10px] text-white/55 mt-1.5 font-medium">Glisser ou cliquer</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Back ID */}
                        <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requis Back</span>
                            <h4 className="text-white font-semibold text-xs mt-1">Carte d'Identité (Verso)</h4>
                          </div>
                          
                          <div className="mt-4 border-2 border-dashed border-white/15 hover:border-brand-orange rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              onChange={(e) => simulateUpload('idBack', e.target.files[0])}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {uploading.idBack ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-white/50">Téléversement...</span>
                              </div>
                            ) : uploads.idBack ? (
                              <div className="text-center">
                                <span className="text-xl">📄</span>
                                <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[150px] mt-1">{uploads.idBack}</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-xl text-white/30">📤</span>
                                <span className="text-[10px] text-white/55 mt-1.5 font-medium">Glisser ou cliquer</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Photo ID */}
                        <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requis Officiel</span>
                            <h4 className="text-white font-semibold text-xs mt-1">Photo d'Identité Récente</h4>
                          </div>
                          
                          <div className="mt-4 border-2 border-dashed border-white/15 hover:border-brand-orange rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => simulateUpload('photo', e.target.files[0])}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {uploading.photo ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-white/50">Téléversement...</span>
                              </div>
                            ) : uploads.photo ? (
                              <div className="text-center">
                                <span className="text-xl">📸</span>
                                <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[150px] mt-1">{uploads.photo}</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-xl text-white/30">📤</span>
                                <span className="text-[10px] text-white/55 mt-1.5 font-medium">Glisser ou cliquer</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Signature Digital */}
                        <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signature</span>
                            <h4 className="text-white font-semibold text-xs mt-1">Signature Numérisée (Fond blanc)</h4>
                          </div>
                          
                          <div className="mt-4 border-2 border-dashed border-white/15 hover:border-brand-orange rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => simulateUpload('signature', e.target.files[0])}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {uploading.signature ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-white/50">Téléversement...</span>
                              </div>
                            ) : uploads.signature ? (
                              <div className="text-center">
                                <span className="text-xl">✒️</span>
                                <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[150px] mt-1">{uploads.signature}</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-xl text-white/30">📤</span>
                                <span className="text-[10px] text-white/55 mt-1.5 font-medium">Glisser ou cliquer</span>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* STEP 3: EXPERIENCE & CONFIG */}
                    {wizardStep === 3 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-[bubbleIn_0.4s_ease-out]">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Nombre d'échecs précédents à l'examen
                          </label>
                          <select 
                            name="failedAttempts"
                            value={formData.failedAttempts}
                            onChange={handleInputChange}
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white/80"
                          >
                            <option value="0">Aucun (1ère demande)</option>
                            <option value="1">1 échec</option>
                            <option value="2">2 échecs</option>
                            <option value="3">3 échecs</option>
                            <option value="4+">4 échecs ou plus</option>
                          </select>
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Type de transmission souhaité
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, transmission: 'Manuel' }))}
                              className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                                formData.transmission === 'Manuel' 
                                  ? 'border-brand-orange bg-brand-orange/10 text-white' 
                                  : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                              }`}
                            >
                              🕹️ Manuelle
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, transmission: 'Automatique' }))}
                              className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                                formData.transmission === 'Automatique' 
                                  ? 'border-brand-orange bg-brand-orange/10 text-white' 
                                  : 'border-white/15 bg-slate-950/50 text-white/60 hover:border-white/30'
                              }`}
                            >
                              ⚡ Automatique
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: FRAIS ADMINISTRATIFS & MANDAT */}
                    {wizardStep === 4 && (
                      <div className="grid grid-cols-1 gap-6 animate-[bubbleIn_0.4s_ease-out]">
                        
                        {/* Legal Reminder Box */}
                        <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-5">
                          <h4 className="font-bold text-sm text-brand-orange flex items-center gap-2">
                            🛡️ Mandat de Constitution Officielle
                          </h4>
                          <p className="text-[11px] text-white/70 leading-relaxed mt-2">
                            En validant cette étape, vous donnez officiellement mandat de représentation administrative à nos services agréés pour le traitement, le suivi et l'enregistrement de votre dossier d'équivalence légale de permis de conduire auprès du SPF Mobilité en Belgique. Aucun examen théorique ou pratique ne vous sera demandé.
                          </p>
                        </div>

                        {/* Pricing Invoice Box */}
                        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-6">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                            💳 Détail des Frais d'Exécution & Enregistrement
                          </h4>
                          
                          <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between items-center text-white/70 pb-2 border-b border-white/5">
                              <span>Frais de dossier, analyse et constitution administrative :</span>
                              <span className="font-semibold text-white">120,00 €</span>
                            </div>
                            <div className="flex justify-between items-center text-white/70 pb-2 border-b border-white/5">
                              <span>Droits de timbre fiscal & frais d'enregistrement officiels :</span>
                              <span className="font-semibold text-white">110,00 €</span>
                            </div>
                            <div className="flex justify-between items-center text-white/70 pb-2 border-b border-white/5">
                              <span>Support plastique sécurisé officiel & édition prioritaire :</span>
                              <span className="font-semibold text-white">59,00 €</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 text-sm font-bold text-brand-orange">
                              <span>Montant Total de la prestation (TVA incluse) :</span>
                              <span className="text-lg bg-brand-orange/15 px-3 py-1 rounded border border-brand-orange/20">289,00 €</span>
                            </div>
                          </div>

                          {/* Important payment instruction note */}
                          <div className="mt-5 bg-white/[0.03] border border-white/5 rounded-xl p-4 flex gap-3">
                            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                            <p className="text-[10px] text-white/60 leading-relaxed">
                              <strong>Information importante concernant le règlement :</strong> Aucun paiement n'est requis immédiatement à cette étape. Suite à la soumission de votre dossier, nos conseillers analysent vos pièces sous 12h. Dès validation finale de votre admissibilité légale, vous recevrez vos instructions sécurisées pour procéder au paiement et lancer la production de votre permis.
                            </p>
                          </div>
                        </div>

                        {/* Mandate & Agreement Checkbox */}
                        <label className="flex items-start gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-brand-orange/30 p-4 rounded-2xl cursor-pointer transition-all duration-300">
                          <input 
                            type="checkbox"
                            checked={paymentAccepted}
                            onChange={(e) => setPaymentAccepted(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-white/20 text-brand-orange focus:ring-brand-orange bg-slate-950 accent-brand-orange flex-shrink-0 cursor-pointer"
                          />
                          <span className="text-[11px] text-white/80 leading-normal select-none">
                            Je certifie sur l'honneur l'exactitude de mes informations fournies et je m'engage à régler le montant total de <strong>289,00 €</strong> dès confirmation de mon admissibilité légale par mon conseiller afin d'initier la production physique et la livraison de mon permis de conduire. <span className="text-brand-orange font-bold">(Requis pour soumettre)</span>
                          </span>
                        </label>

                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-8 pt-4 border-t border-white/10 flex justify-between">
                    {wizardStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(s => s - 1)}
                        className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white/50 text-xs font-bold transition-colors"
                      >
                        Retour
                      </button>
                    ) : (
                      <div />
                    )}

                    {wizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(s => s + 1)}
                        className="px-6 py-2.5 rounded-full bg-brand-orange hover:bg-brand-orange-dark text-xs font-bold transition-all duration-300 shadow-md shadow-brand-orange/20"
                      >
                        Continuer
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!paymentAccepted}
                        className={`px-8 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shadow-md flex items-center gap-2 ${
                          paymentAccepted 
                            ? 'bg-brand-orange hover:bg-brand-orange-dark shadow-brand-orange/30 text-white cursor-pointer hover:scale-[1.02]' 
                            : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        Soumettre ma Demande Officielle ➔
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SUPPORT CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col relative z-10 h-full animate-[bubbleIn_0.5s_ease-out]">
              
              {/* Header Info */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-lg font-bold">
                    👨‍💼
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-ping" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Jean-Pierre Dumont</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-green-400 font-semibold tracking-wider uppercase">
                      Conseiller en Ligne — répond immédiatement
                    </span>
                  </div>
                </div>
              </div>

              {/* Message log */}
              <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2 max-h-[300px] sm:max-h-[340px] border border-white/5 rounded-2xl bg-slate-950/30 mb-4 p-4 min-h-[220px]">
                {messages.map((m) => {
                  const isUser = m.sender === 'student';
                  return (
                    <div 
                      key={m.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-brand-orange text-white rounded-br-sm shadow-md shadow-brand-orange/10' 
                          : 'bg-white/10 border border-white/5 text-white/90 rounded-bl-sm'
                      }`}>
                        <p>{m.text}</p>
                        <span className="block text-[8px] sm:text-[9px] text-white/40 text-right mt-1.5">{m.time}</span>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input field Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Posez votre question à Jean-Pierre (ex. Délai, Légalité...)"
                  className="flex-1 bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors"
                />
                <button 
                  type="submit"
                  className="w-12 h-12 rounded-2xl bg-brand-orange hover:bg-brand-orange-dark flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
                >
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          )}



        </main>
      </div>

      {/* Bubble animation keyframe injected via style tag */}
      <style>{`
        @keyframes bubbleIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
