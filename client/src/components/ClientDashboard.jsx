import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Navbar from './Navbar';

export default function ClientDashboard({ onBack, initialMode = 'login', onAuthSuccess, onSwitchMode }) {
  // Authentication states
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'
  const chatEndRef = useRef(null);

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
  const [mandatAccepted, setMandatAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('wizard'); // Default to wizard on entry
  const [wizardStep, setWizardStep] = useState(1); // Default to Step 1 on entry

  // Client Theme State (light / dark mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('clientTheme') || 'dark');

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('clientTheme', theme);
  }, [theme]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('new');
  const [billingActive, setBillingActive] = useState(false);
  const [paymentValidated, setPaymentValidated] = useState(false);
  const [soldeValidated, setSoldeValidated] = useState(false);
  const [selectedPath, setSelectedPath] = useState('perception');
  const [perceptionPaid, setPerceptionPaid] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [attestationUrl, setAttestationUrl] = useState('');

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

  // Advisor settings state
  const [advisor, setAdvisor] = useState({
    name: "Jean-Pierre Dumont",
    title: "Expert Agréé SPF Belgique",
    isOnline: true,
    avatarEmoji: "👨‍💼"
  });

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

    if (selectedPath === 'pratique') {
      return {
        isSplit: false,
        total: totalStr,
        firstPayment: totalStr,
        secondPayment: null
      };
    }

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

  useEffect(() => {
    const advisorRef = doc(db, 'settings', 'advisor');
    const unsubAdvisor = onSnapshot(advisorRef, (snap) => {
      if (snap.exists()) {
        setAdvisor(snap.data());
      }
    });
    return () => unsubAdvisor();
  }, []);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Listen to chat messages in Firestore
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'chats', user.uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          sender: data.sender,
          text: data.text,
          time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant",
        });
      });

      if (list.length === 0) {
        setMessages([
          {
            id: 'welcome-1',
            sender: 'advisor',
            text: `Bonjour ! Je suis ${advisor.name}, votre conseiller dédié. Bienvenue dans votre Espace Permis sécurisé. 🇧🇪`,
            time: "Aujourd'hui, 10:15",
          },
          {
            id: 'welcome-2',
            sender: 'advisor',
            text: "Pour lancer officiellement votre dossier d'obtention sans examen, veuillez vous rendre dans l'onglet 'Faire ma demande' et compléter les étapes.",
            time: "Aujourd'hui, 10:16",
          }
        ]);
      } else {
        // Marc les messages de l'admin comme lus par le client
        const lastMsg = list[list.length - 1];
        if (lastMsg.sender === 'advisor') {
          updateDoc(doc(db, 'chats', user.uid), {
            unreadByClient: false
          }).catch(err => console.error("Error updating unreadByClient:", err));
        }
        setMessages(list);
      }
    });

    return () => unsubscribe();
  }, [user, advisor.name]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
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
            setBillingActive(leadData?.billingActive || false);
            setPaymentValidated(leadData?.paymentValidated || false);
            setSoldeValidated(leadData?.soldeValidated || false);
            setAttestationUrl(leadData?.attestationUrl || '');
            setSelectedPath(leadData?.isSubmitted ? (leadData?.selectedPath || 'perception') : 'perception');
            setPerceptionPaid(leadData?.perceptionPaid || false);
            setApplicationStatus(leadData?.status || userData?.status || (leadData?.isSubmitted ? 'processing' : 'new'));
            
            // Re-simulate or populate file uploads if metadata is in DB
            if (leadData?.uploads) {
              setUploads(leadData.uploads);
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
            setBillingActive(false);
            setPaymentValidated(false);
            setSoldeValidated(false);
            setAttestationUrl('');
            setSelectedPath('perception');
            setPerceptionPaid(false);
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
          setIsInitializing(false);
        }

        // Real-time listeners: update UI instantly when admin changes status/reset
        const leadRef2 = doc(db, 'leads', currentUser.uid);
        const userRef2 = doc(db, 'users', currentUser.uid);
        
        const unsubLead = onSnapshot(leadRef2, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsSubmitted(data.isSubmitted === true);
            setBillingActive(data.billingActive === true);
            setPaymentValidated(data.paymentValidated === true);
            setSoldeValidated(data.soldeValidated === true);
            setAttestationUrl(data.attestationUrl || '');
            if (data.isSubmitted) {
              setSelectedPath(data.selectedPath || 'perception');
            }
            setPerceptionPaid(data.perceptionPaid === true);
            setApplicationStatus(data.status || 'new');
          }
        });

        const unsubUser = onSnapshot(userRef2, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status) {
              setApplicationStatus(data.status);
            }
          }
        });

        // Store unsubscribe functions for cleanup
        window.__unsubLeadListener = unsubLead;
        window.__unsubUserListener = unsubUser;
      } else {
        setIsInitializing(false);
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

  // Détection mobile
  const isMobile = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  // Upload réel vers Cloudinary
  const uploadToCloudinary = async (fieldName, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [fieldName]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'monpermis');
      formData.append('folder', `monpermis/${user?.uid}/${fieldName}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setUploads(prev => ({ ...prev, [fieldName]: data.secure_url }));
        // Sauvegarder l'URL dans Firestore immédiatement
        if (user) {
          const { doc: firestoreDoc, setDoc: firestoreSetDoc } = await import('firebase/firestore');
          const leadRef = firestoreDoc(db, 'leads', user.uid);
          await firestoreSetDoc(leadRef, {
            uploads: { ...uploads, [fieldName]: data.secure_url },
            uid: user.uid,
            email: user.email,
          }, { merge: true });
        }
      } else {
        alert('Erreur lors du téléversement. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleUpgradeToDirect = async () => {
    try {
      const leadRef = doc(db, 'leads', user.uid);
      const alreadyPaid = paymentValidated;
      await updateDoc(leadRef, {
        selectedPath: 'direct',
        amount: advisor.directLicenseAmount || "1200,00 €",
        paymentValidated: false,
        billingActive: true,
        status: 'new',
        perceptionPaid: alreadyPaid
      });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'new'
      });
      setActiveTab('wizard');
      setShowUpgradeConfirm(false);
    } catch (err) {
      console.error(err);
    }
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
        selectedPath: selectedPath || 'perception',
        amount: selectedPath === 'direct' ? (advisor.directLicenseAmount || "1200,00 €") :
                selectedPath === 'theorique' ? (advisor.theoriqueAmount || "550,00 €") :
                selectedPath === 'pratique' ? (advisor.pratiqueAmount || "2100,00 €") :
                (advisor.perceptionAmount || "350,00 €"),
        isSubmitted: true,
        uploads: uploads,
        submittedAt: new Date().toISOString(),
        uid: user.uid,
        email: user.email,
      };

      await setDoc(doc(db, 'leads', user.uid), leadData);
      setIsSubmitted(true);
      
      // Save success message in Firestore from advisor
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const chatDocRef = doc(db, 'chats', user.uid);
      await addDoc(messagesRef, {
        sender: 'advisor',
        text: `Félicitations ${formData.firstName || 'Candidat'} ! J'ai bien reçu votre demande complète. Nous venons d'initier la phase 'Constitution du Dossier' auprès des services agréés. 🚀`,
        timestamp: serverTimestamp()
      });
      await setDoc(chatDocRef, {
        userId: user.uid,
        userName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || user.email,
        userEmail: user.email,
        lastMessageText: `Félicitations ${formData.firstName || 'Candidat'} ! J'ai bien reçu votre demande complète...`,
        lastMessageTime: serverTimestamp(),
        unreadByAdmin: false,
        unreadByClient: true
      }, { merge: true });

    } catch (error) {
      console.error("Firestore writing error:", error);
      alert("Erreur lors de l'enregistrement de votre demande. Veuillez réessayer.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Chat message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const messageText = chatInput;
    setChatInput('');

    try {
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const chatDocRef = doc(db, 'chats', user.uid);
      
      // 1. Add message to subcollection
      await addDoc(messagesRef, {
        sender: 'student',
        text: messageText,
        timestamp: serverTimestamp()
      });

      // Get user name for the chat list
      const userName = formData.firstName || formData.lastName 
        ? `${formData.firstName} ${formData.lastName}`.trim() 
        : user.email;

      // 2. Set/Update main chat session document
      await setDoc(chatDocRef, {
        userId: user.uid,
        userName: userName,
        userEmail: user.email,
        lastMessageText: messageText,
        lastMessageTime: serverTimestamp(),
        unreadByAdmin: true,
        unreadByClient: false
      }, { merge: true });

    } catch (err) {
      console.error("Error sending message:", err);
    }
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
    <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white dark-theme' : 'bg-slate-50 text-slate-900 light-theme'} flex flex-col font-sans selection:bg-brand-orange selection:text-white relative transition-colors duration-300`}>
      {/* Loading overlay for database synchronization */}
      {isLoadingData && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-white/70">Synchronisation en cours avec la base de données...</p>
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <header className="bg-slate-900 border-b-2 border-emerald-500 px-4 py-2 sm:px-6 sm:py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-opacity-80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Mon Permis Logo" className="h-9 sm:h-10 rounded-lg" />
          <span className="ml-3 hidden sm:inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            🔒 Espace Sécurisé SSL
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all text-sm shadow-sm hover:scale-105 cursor-pointer ${
              theme === 'dark' 
                ? 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="hidden md:inline-block text-xs text-white/50 truncate max-w-[240px] font-semibold">
            Candidat : {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : user.email}
          </span>
          {/* Desktop: Retour au site */}
          <button 
            onClick={onBack}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white/50 text-xs sm:text-sm transition-all duration-300 bg-white/5 hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site
          </button>

          {/* Mobile: Se déconnecter */}
          <button 
            onClick={handleLogout}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/15 text-red-400/90 transition-all duration-300 cursor-pointer"
            title="Se déconnecter"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* --- DASHBOARD WRAPPER --- */}
      <div className={`flex-1 flex flex-col md:flex-row w-full gap-4 md:gap-6 min-h-0 ${activeTab === 'chat' ? 'p-0 md:p-8' : 'p-3 pt-3 px-3 pb-[74px] sm:p-6 lg:p-8 md:pb-8'}`}>
        
        {/* --- SIDEBAR --- */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col sticky top-24 pr-6 border-r border-white/10 self-start">
          
          {/* User profile card */}
          <div className={`bg-slate-800/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-4 mb-6`}>
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
                {applicationStatus === 'completed' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Dossier validé</span>
                  </>
                ) : applicationStatus === 'processing' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Dossier en cours</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Dossier transmis</span>
                  </>
                )}
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
              onClick={() => {
                setActiveTab('wizard');
                setWizardStep(1);
              }}
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
        <main className={`flex-1 min-w-0 relative flex flex-col min-h-0 h-full md:h-full ${
          activeTab === 'chat' 
            ? `rounded-none border-0 p-4 md:rounded-[32px] md:border ${theme === 'dark' ? 'md:border-white' : 'md:border-slate-950'} md:bg-slate-900 md:shadow-2xl md:p-6` 
            : `rounded-none border-0 md:rounded-[32px] md:border ${theme === 'dark' ? 'md:border-white' : 'md:border-slate-950'} md:bg-slate-900 md:shadow-2xl p-2 sm:p-5 overflow-y-auto scrollbar-none`
        }`}>
          {/* Ambient glow behind main area */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex-1 flex flex-col gap-2.5 sm:gap-4 relative z-10 animate-[bubbleIn_0.5s_ease-out] overflow-y-auto scrollbar-hidden min-h-0">
              
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
                    style={{ width: isSubmitted ? (applicationStatus === 'processing' ? '55%' : applicationStatus === 'completed' ? '80%' : '30%') : '20%' }}
                  />

                  <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3 pb-3 scrollbar-none snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
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
                        icon: '👁️',
                        title: 'Perception du Risque',
                        desc_done: 'Dispense académique validée — aucun examen requis.',
                        desc_pending: !isSubmitted 
                          ? 'Débloqué après validation de votre dossier.'
                          : (selectedPath ? 'En attente du virement de votre formule.' : 'Veuillez choisir votre parcours dans l\'onglet "Faire ma demande".'),
                        status: (selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct') 
                          ? 'done' 
                          : (selectedPath === 'perception' && (paymentValidated || perceptionPaid) ? 'done' : 'active'),
                        badge: (selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'perception' && (paymentValidated || perceptionPaid))) 
                          ? '✓ Dispense' 
                          : (!isSubmitted ? '● Action requise' : (selectedPath ? '● Paiement en attente' : '● Choix requis')),
                      },
                      {
                        num: 3,
                        icon: '📖',
                        title: 'Examen Théorique',
                        desc_done: 'Certificat de dispense théorique validé.',
                        desc_pending: !isSubmitted 
                          ? 'Débloqué après validation de votre dossier.'
                          : (selectedPath ? 'En attente du virement de votre formule.' : 'Veuillez choisir votre parcours dans l\'onglet "Faire ma demande".'),
                        status: (selectedPath === 'pratique' || selectedPath === 'direct') 
                          ? 'done' 
                          : (selectedPath === 'theorique' && (paymentValidated || perceptionPaid) ? 'done' : (selectedPath === 'theorique' ? 'active' : 'locked')),
                        badge: (selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'theorique' && (paymentValidated || perceptionPaid))) 
                          ? '✓ Dispense' 
                          : (selectedPath === 'theorique' ? (!isSubmitted ? '● Action requise' : '● Paiement en attente') : (selectedPath ? '🔒 Non inclus' : '🔒 À venir')),
                      },
                      {
                        num: 4,
                        icon: '🚗',
                        title: 'Examen Pratique',
                        desc_done: 'Dispense d\'examen pratique certifiée & enregistrée.',
                        desc_pending: !isSubmitted
                          ? 'Validé après constitution complète du dossier.'
                          : 'En attente de votre règlement de formule.',
                        status: (selectedPath === 'direct') 
                          ? 'done' 
                          : (selectedPath === 'pratique' && (paymentValidated || perceptionPaid) ? 'done' : (selectedPath === 'pratique' ? 'active' : 'locked')),
                        badge: (selectedPath === 'direct' || (selectedPath === 'pratique' && (paymentValidated || perceptionPaid))) 
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
                          {/* Badge status */}
                          <span className={`self-start text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border transition-all duration-300 ${
                            isDone ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : isActive ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange animate-pulse'
                            : isReady ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange animate-pulse'
                            : 'bg-white/5 border-white/10 text-white/30 group-hover:bg-white/10 group-hover:text-white/60 group-hover:border-white/20'
                          }`}>
                            {phase.badge}
                          </span>

                          {/* Icon & Title */}
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

                          {/* Description */}
                          <p className={`text-[10px] leading-relaxed transition-colors duration-300 ${
                            isDone ? 'text-white/55'
                            : isActive || isReady ? 'text-white/55'
                            : 'text-white/20 group-hover:text-white/50'
                          }`}>
                            {isDone ? phase.desc_done : phase.desc_pending}
                          </p>

                          {/* Tooltip hover pour les phases verrouillées */}
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
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="mt-2.5 sm:mt-3 w-full py-1.5 sm:py-2 rounded-full text-xs font-bold bg-white/5 border border-white/15 hover:border-brand-orange hover:bg-brand-orange/10 transition-all duration-300"
                  >
                    Lui écrire un message
                  </button>
                </div>

                {/* Info Card / Action Card */}
                <div className={`lg:col-span-2 bg-gradient-to-br from-slate-950/60 to-slate-950/90 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between`}>
                  <div>
                    <h4 className="text-white/70 font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-4">Statut & Actions Requises</h4>
                    
                    {isSubmitted ? (
                      <div className="flex items-start gap-2.5 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-xs sm:text-sm flex-shrink-0">
                          ✓
                        </div>
                        <div>
                          <h5 className="text-white font-bold text-xs sm:text-sm">Dossier reçu et sauvegardé</h5>
                          <p className="text-white/60 text-[10px] sm:text-xs mt-1 leading-relaxed">
                            Votre demande a été enregistrée de façon sécurisée dans notre base de données. {(advisor.name || '').split(' ')[0]} analyse vos documents d'identité pour constitution physique. Aucune action supplémentaire n'est requise.
                          </p>
                        </div>
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
                      className="mt-6 w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-md shadow-brand-orange/20 hover:scale-[1.02] transition-all duration-300 self-start animate-pulse"
                    >
                      Initier mon dossier maintenant ➔
                    </button>
                  )}

                  {isSubmitted && selectedPath === 'perception' && (
                    <button 
                      onClick={() => setShowUpgradeConfirm(true)}
                      className="mt-6 w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:scale-[1.02] transition-all duration-300 self-start text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      ⚡ Passer au Permis Direct
                    </button>
                  )}
                </div>
              </div>

              {/* Promo card removed */}

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
                !selectedPath ? (
                  // PATH SELECTION SCREEN
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-4 animate-[bubbleIn_0.6s_ease-out]">
                    <div className="inline-flex items-center gap-2 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
                      <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                      Dossier Transmis — Choix du Parcours
                    </div>

                    <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                      CHOISISSEZ VOTRE CIRCUIT D'OBTENTION 🛣️
                    </h2>
                    <p className="text-white/60 text-xs mt-2 leading-relaxed max-w-xl">
                      Félicitations <strong>{formData.firstName || 'Candidat'}</strong> ! Vos pièces justificatives ont bien été transmises. Veuillez maintenant sélectionner la formule correspondante à votre besoin pour lancer l'analyse officielle.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6">
                      {/* Option 1: Perception du Risque */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const leadRef = doc(db, 'leads', user.uid);
                            await updateDoc(leadRef, {
                              selectedPath: 'perception',
                              amount: advisor.perceptionAmount || "350,00 €"
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} hover:border-brand-orange hover:bg-slate-950/90 rounded-3xl p-5 text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-full group shadow-lg cursor-pointer`}
                      >
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                            👁️
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1.5">Phase 2 - Perception du Risque</h4>
                          <p className="text-xs text-white/50 leading-relaxed mb-3">
                            Validation officielle de la dispense de l'examen de perception du risque (Phase 2). Idéal si vous effectuez le reste par vous-même.
                          </p>
                        </div>
                        <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                          <span className="text-[9px] uppercase font-bold text-brand-orange">Perception</span>
                          <span className="text-base font-black text-white">{advisor.perceptionAmount || "350,00 €"}</span>
                        </div>
                      </button>

                      {/* Option 2: Examen Théorique */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const leadRef = doc(db, 'leads', user.uid);
                            await updateDoc(leadRef, {
                              selectedPath: 'theorique',
                              amount: advisor.theoriqueAmount || "550,00 €"
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} hover:border-brand-orange hover:bg-slate-950/90 rounded-3xl p-5 text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-full group shadow-lg cursor-pointer`}
                      >
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                            📖
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1.5">Phase 3 - Examen Théorique</h4>
                          <p className="text-xs text-white/50 leading-relaxed mb-3">
                            Obtention complète de la dispense académique pour l'examen théorique officiel (Phase 3).
                          </p>
                        </div>
                        <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                          <span className="text-[9px] uppercase font-bold text-brand-orange">Théorique</span>
                          <span className="text-base font-black text-white">{advisor.theoriqueAmount || "550,00 €"}</span>
                        </div>
                      </button>

                      {/* Option 3: Examen Pratique */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const leadRef = doc(db, 'leads', user.uid);
                            await updateDoc(leadRef, {
                              selectedPath: 'pratique',
                              amount: advisor.pratiqueAmount || "2100,00 €"
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} hover:border-brand-orange hover:bg-slate-950/90 rounded-3xl p-5 text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-full group shadow-lg cursor-pointer`}
                      >
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                            🚗
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1.5">Phase 4 - Examen Pratique</h4>
                          <p className="text-xs text-white/50 leading-relaxed mb-3">
                            Dispense officielle et homologation pour l'examen pratique (Phase 4). Comprenant 30 heures obligatoires à 70 € / heure.
                          </p>
                        </div>
                        <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                          <span className="text-[9px] uppercase font-bold text-brand-orange">Pratique</span>
                          <span className="text-base font-black text-white">{advisor.pratiqueAmount || "2100,00 €"}</span>
                        </div>
                      </button>

                      {/* Option 4: Permis Définitif */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const leadRef = doc(db, 'leads', user.uid);
                            await updateDoc(leadRef, {
                              selectedPath: 'direct',
                              amount: advisor.directLicenseAmount || "1200,00 €"
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} hover:border-brand-orange hover:bg-slate-950/90 rounded-3xl p-5 text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between h-full group shadow-lg cursor-pointer`}
                      >
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                            🏆
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1.5">Phase 5 - Permis Définitif</h4>
                          <p className="text-xs text-white/50 leading-relaxed mb-3">
                            Validation complète et automatique de toutes les phases (Phases 2 à 5) pour l'obtention directe de votre permis définitif.
                          </p>
                        </div>
                        <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                          <span className="text-[9px] uppercase font-bold text-brand-orange">Dossier Complet</span>
                          <span className="text-base font-black text-white">{advisor.directLicenseAmount || "1200,00 €"}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : billingActive && (!paymentValidated || (applicationStatus === 'completed' && getSplitPaymentDetails().isSplit && !soldeValidated)) ? (
                  // BILLING STATE WITH RIB
                  <div className="flex-1 flex flex-col items-center justify-start text-center max-w-xl md:max-w-4xl mx-auto py-1 md:py-2 animate-[bubbleIn_0.6s_ease-out]">
                    {/* Premium Danger/Alert Badge */}
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold tracking-widest uppercase px-3.5 py-1 md:py-1 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {paymentValidated ? "Règlement Requis — Solde Final" : "Règlement Requis — Émission en cours"}
                    </div>

                    {/* Icon with complex glow */}
                    <div className="relative mb-3 md:hidden">
                      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-125" />
                      <div className="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-2xl shadow-2xl">
                        💳
                      </div>
                    </div>

                    <h2 className="text-xl md:text-lg font-display font-extrabold text-white tracking-tight">
                      {paymentValidated ? (
                        selectedPath === 'perception' ? "VOTRE ATTESTATION DE PERCEPTION EST DISPONIBLE ! 📄" :
                        selectedPath === 'theorique' ? "VOTRE DISPENSE D'EXAMEN EST DISPONIBLE ! 📄" :
                        "VOTRE PERMIS DE CONDUIRE EST DISPONIBLE ! 🏆"
                      ) : "RÈGLEMENT DE VOTRE DOSSIER ⌛"}
                    </h2>
                    <p className="text-white/60 text-xs md:text-[11px] mt-1 md:mt-1 leading-relaxed max-w-xl">
                      {paymentValidated ? (
                        `Félicitations ${formData.firstName || 'Candidat'} ! Votre ${
                          selectedPath === 'perception' ? "attestation de perception" :
                          selectedPath === 'theorique' ? "dispense d'examen théorique" :
                          "permis de conduire"
                        } est disponible ! Pour finaliser son obtention et pouvoir la télécharger, veuillez régler le solde restant de votre formule ci-dessous.`
                      ) : (
                        `Félicitations ${formData.firstName || 'Candidat'} ! Votre dossier a été analysé et validé par nos conseillers. Afin de finaliser l'enregistrement et de procéder à l'édition officielle ${
                          selectedPath === 'perception' ? "de votre attestation de perception" :
                          selectedPath === 'theorique' ? "de votre dispense d'examen théorique" :
                          selectedPath === 'pratique' ? "de votre dispense d'examen pratique" :
                          "de votre permis de conduire"
                        } auprès du SPF Mobilité, veuillez procéder au règlement des frais administratifs ci-dessous.`
                      )}
                    </p>

                    {/* Grid wrapper for Invoice & RIB */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4 w-full mt-3 text-left items-stretch">
                      {/* Facture Détaillée */}
                      <div className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-3 md:p-3.5 flex flex-col justify-between relative overflow-hidden group`}>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-2 md:mb-1.5 flex items-center gap-2">
                            <span>📄</span> Frais de dossier réglementaires ({
                              selectedPath === 'perception' ? 'Phase 2 - Perception du Risque' : 
                              selectedPath === 'theorique' ? 'Phase 3 - Examen Théorique' :
                              selectedPath === 'pratique' ? 'Phase 4 - Examen Pratique' : 'Phase 5 - Permis Définitif'
                            })
                          </h4>
                          <div className="space-y-1.5 text-xs border-b border-white/5 pb-2">
                            {selectedPath === 'perception' && (
                              <>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.perceptionLabel1 || "Frais de timbre fiscal & enregistrement SPF Belgique"}</span>
                                  <span className="text-white font-semibold">{advisor.perceptionAmount1 || "50,00 €"}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.perceptionLabel2 || "Administration - Dispense d'Examen Théorique"}</span>
                                  <span className="text-white font-semibold">{advisor.perceptionAmount2 || "300,00 €"}</span>
                                </div>
                              </>
                            )}
                            {selectedPath === 'theorique' && (
                              <>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.theoriqueLabel1 || "Frais d'enregistrement Examen Théorique"}</span>
                                  <span className="text-white font-semibold">{advisor.theoriqueAmount1 || "150,00 €"}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.theoriqueLabel2 || "Constitution du dossier de dispense théorique"}</span>
                                  <span className="text-white font-semibold">{advisor.theoriqueAmount2 || "400,00 €"}</span>
                                </div>
                              </>
                            )}
                            {selectedPath === 'pratique' && (
                              <>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.pratiqueLabel1 || "Frais de dépôt Examen Pratique"}</span>
                                  <span className="text-white font-semibold">{advisor.pratiqueAmount1 || "700,00 €"}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.pratiqueLabel2 || "Dossier d'homologation dispense pratique (30h à 70€/h)"}</span>
                                  <span className="text-white font-semibold">{advisor.pratiqueAmount2 || "1400,00 €"}</span>
                                </div>
                              </>
                            )}
                            {selectedPath === 'direct' && (
                              <>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.directLabel1 || "Constitution du dossier d'homologation complet"}</span>
                                  <span className="text-white font-semibold">{advisor.directAmount1 || "400,00 €"}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>{advisor.directLabel2 || "Frais d'édition & timbres fiscaux (SPF Belgique)"}</span>
                                  <span className="text-white font-semibold">{advisor.directAmount2 || "80,00 €"}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-white/5 space-y-1 text-xs font-bold">
                          {getSplitPaymentDetails().isSplit ? (
                            <>
                              <div className="flex justify-between text-white/50">
                                <span>Total de la formule :</span>
                                <span className="text-white">{getSplitPaymentDetails().total}</span>
                              </div>
                              <div className="flex justify-between text-brand-orange text-[13px] md:text-sm">
                                <span>Acompte à régler (1er virement) :</span>
                                <span className="text-base font-black">{getSplitPaymentDetails().firstPayment}</span>
                              </div>
                              {getSplitPaymentDetails().secondPayment && (
                                <div className="flex justify-between text-white/35 text-[10px]">
                                  <span>Solde ({
                                    selectedPath === 'perception' ? "à l'obtention de l'attestation de perception" :
                                    selectedPath === 'theorique' ? "à l'obtention de la dispense d'examen" :
                                    "à l'obtention du permis de conduire"
                                  }) :</span>
                                  <span>{getSplitPaymentDetails().secondPayment}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex justify-between text-brand-orange text-sm md:text-base">
                              <span>Total TTC à régler :</span>
                              <span className="text-base font-black">{getSplitPaymentDetails().total}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations de paiement (RIB) */}
                      <div className="bg-slate-905 border border-brand-orange/30 rounded-2xl p-3 md:p-3.5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-xl" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 md:mb-1.5 flex items-center gap-2">
                            <span>🏦</span> Informations bancaires (RIB / Virement)
                          </h4>

                          {getSplitPaymentDetails().isSplit && (
                            <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[9.5px] font-bold uppercase tracking-wider text-center leading-normal">
                              💡 Acompte de 200 € à régler pour lancer le dossier, le solde ({getSplitPaymentDetails().secondPayment}) {
                                selectedPath === 'perception' ? "à l'obtention de l'attestation de perception" :
                                selectedPath === 'theorique' ? "à l'obtention de la dispense d'examen" :
                                "à l'obtention du document"
                              }.
                            </div>
                          )}
                          
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">Bénéficiaire :</span>
                              <span className="text-white font-bold">{advisor.beneficiary || "Mon Permis SRL"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">Banque :</span>
                              <span className="text-white font-semibold">{advisor.bankName || "BNP Paribas Fortis"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">IBAN :</span>
                              <span className="text-white font-mono font-bold tracking-wider">{advisor.iban || "BE96 3630 1234 5678"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">Code BIC/SWIFT :</span>
                              <span className="text-white font-mono font-semibold">{advisor.bic || "GEBA BEBB"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">Montant à transférer :</span>
                              <span className="text-brand-orange font-black font-mono text-sm">
                                {getTransferAmount()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Communication :</span>
                              <span className="text-brand-orange font-bold font-mono">MPB-{formData.firstName?.toUpperCase()}-{formData.lastName?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-[9px] text-amber-300 leading-normal flex items-start gap-1.5">
                          <span className="text-xs">⚠️</span>
                          <span>
                            <strong>IMPORTANT</strong> : Indiquez la communication exacte. Envoyez le justificatif (capture d'écran) à votre conseiller depuis le chat pour accélérer le traitement.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="px-6 py-2 rounded-full text-xs font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-[0_8px_20px_rgba(255,152,0,0.25)] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-white flex items-center justify-center gap-2"
                      >
                        💬 Envoyer le justificatif à mon conseiller
                      </button>
                    </div>
                  </div>
                ) : (
                  // SUCCESS STATE (RÉSULTAT DE L'ANALYSE)
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-1 sm:py-4 animate-[bubbleIn_0.6s_ease-out]">
                    {/* Premium Success Badge */}
                    <div className={`inline-flex items-center gap-2 text-[9px] sm:text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 sm:px-4 sm:py-1.5 rounded-full mb-1.5 sm:mb-4 ${
                      applicationStatus === 'completed'
                        ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
                        : paymentValidated 
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                          : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                    }`}>
                      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-ping ${applicationStatus === 'completed' ? 'bg-indigo-400' : paymentValidated ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {applicationStatus === 'completed' ? "Dossier Clôturé & Validé" : paymentValidated ? "Paiement Validé — Dossier Homologué" : "Dossier en Cours d'Analyse"}
                    </div>

                    {/* Icon with complex glow */}
                    <div className="relative mb-1.5 sm:mb-4">
                      <div className={`absolute inset-0 rounded-full blur-xl scale-125 ${applicationStatus === 'completed' ? 'bg-indigo-500/20' : paymentValidated ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`} />
                      <div className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-900 border-2 flex items-center justify-center text-xl sm:text-2xl shadow-2xl ${
                        applicationStatus === 'completed' ? 'border-indigo-500' : paymentValidated ? 'border-emerald-500' : 'border-amber-500'
                      }`}>
                        {applicationStatus === 'completed' ? '🏆' : paymentValidated ? '💳' : '📩'}
                      </div>
                    </div>

                    <h2 className="text-base sm:text-2xl font-display font-extrabold text-white tracking-tight">
                      {applicationStatus === 'completed' ? "DOSSIER CLÔTURÉ AVEC SUCCÈS ! 🏆" : paymentValidated ? "PAIEMENT CONFIRMÉ ! 🚀" : "DOSSIER SOUMIS AVEC SUCCÈS ! 🚀"}
                    </h2>
                    <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 sm:mt-2 leading-relaxed max-w-md">
                      {applicationStatus === 'completed'
                        ? (selectedPath === 'perception'
                          ? `Félicitations ${formData.firstName || 'Candidat'} ! Votre attestation de perception a été validée officiellement. Elle est désormais disponible et vous a été envoyée par e-mail. Merci pour votre confiance.`
                          : `Félicitations ${formData.firstName || 'Candidat'} ! Votre permis de conduire officiel est prêt. Vous pouvez dès à présent vous rendre en commune pour le retirer. Merci pour votre confiance.`)
                        : paymentValidated 
                          ? (selectedPath === 'perception'
                            ? `Félicitations ${formData.firstName || 'Candidat'} ! Votre paiement a été reçu et validé. Votre attestation de perception est en cours d'édition. Sa disponibilité vous sera communiquée par e-mail. Merci.`
                            : `Félicitations ${formData.firstName || 'Candidat'} ! Votre paiement a été reçu et validé. Votre demande de permis définitif est en cours d'enregistrement officiel. Les modalités et la date de retrait en commune vous seront communiquées par e-mail. Merci.`)
                          : `Merci ${formData.firstName || 'Candidat'} ! Votre dossier est désormais entièrement constitué et transmis à nos services pour vérification. Nos conseillers analysent vos pièces sous 24h/48h.`
                      }
                    </p>
                    
                    {/* Results Details Card */}
                    <div className={`bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-2xl p-2 sm:p-4 w-full mt-2 sm:mt-4 text-left relative overflow-hidden group`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                        paymentValidated ? 'bg-emerald-500/5' : 'bg-amber-500/5'
                      }`} />
                      <h4 className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange mb-1 sm:mb-2.5 flex items-center gap-2">
                        <span>📋</span> Détails du dossier enregistré
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:gap-4 text-[9px] sm:text-xs">
                        <div className="space-y-1 sm:space-y-2">
                          <p className="text-white/50 truncate">Candidat : <span className="text-white font-semibold block sm:inline">{formData.firstName} {formData.lastName}</span></p>
                          <p className="text-white/50 truncate">N° Registre : <span className="text-white font-mono block sm:inline">{formData.nationalRegister || "Non spécifié"}</span></p>
                          <p className="text-white/50 truncate">Formule : <span className="text-brand-orange font-semibold block sm:inline">{selectedPath === 'perception' ? "Perception" : "Permis Direct"}</span></p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <p className="text-white/50 truncate">Permis : <span className="text-brand-orange font-semibold block sm:inline">Catégorie B ({formData.transmission})</span></p>
                          <p className="text-white/50 truncate">Pièces : <span className="text-emerald-400 font-semibold block sm:inline">{Object.values(uploads).filter(Boolean).length} / 4 OK</span></p>
                        </div>
                      </div>

                      <div className="mt-1.5 pt-1.5 sm:mt-2.5 sm:pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[11px]">
                        <span className="text-white/40 text-[9px] sm:text-[10px]">Statut :</span>
                        {applicationStatus === 'completed' ? (
                          attestationUrl ? (
                            <a
                              href={attestationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all text-[8px] sm:text-[10px] flex items-center gap-1"
                            >
                              📥 Télécharger
                            </a>
                          ) : (
                            <span className="text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-indigo-500/20 text-[8px] sm:text-[10px]">
                              {selectedPath === 'perception' ? "Attestation délivrée" : "Permis en commune"}
                            </span>
                          )
                        ) : paymentValidated ? (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-emerald-500/20 text-[8px] sm:text-[10px]">
                            {selectedPath === 'perception' ? "Édition en cours" : " SPF homologué"}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-amber-500/20 text-[8px] sm:text-[10px]">
                            Analyse en cours
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 sm:mt-4 flex flex-col sm:flex-row gap-1.5 sm:gap-2.5 w-full justify-center">
                      {applicationStatus === 'completed' && attestationUrl && (
                        <a
                          href={attestationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-1.5 sm:px-8 sm:py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-[0_8px_20px_rgba(99,102,241,0.25)] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-white flex items-center justify-center gap-1.5"
                        >
                          📥 Télécharger mon attestation
                        </a>
                      )}
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="px-6 py-1.5 sm:px-8 sm:py-2.5 rounded-full text-xs font-bold bg-brand-orange hover:bg-brand-orange-dark shadow-[0_8px_20px_rgba(255,152,0,0.25)] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer text-white"
                      >
                        Suivre mon dossier en temps réel ➔
                      </button>
                      {selectedPath === 'perception' && applicationStatus === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setShowUpgradeConfirm(true)}
                          className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-[0_8px_20px_rgba(99,102,241,0.25)] transition-all duration-300 cursor-pointer text-white flex items-center justify-center gap-1.5"
                        >
                          ⚡ Passer au Permis Direct
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold bg-white/5 border border-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer text-white/90"
                      >
                        Contacter mon conseiller
                      </button>
                    </div>
                  </div>
                )
              ) : (
                // ACTIVE WIZARD STATE
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
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors"
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
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors"
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
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors"
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
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Numéro de Registre National Belge (Simulé)
                          </label>
                          <input 
                            required
                            type="text" 
                            name="nationalRegister"
                            value={formData.nationalRegister}
                            onChange={handleInputChange}
                            placeholder="Ex. 95.05.23-123.45" 
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-3 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: DOCUMENT UPLOADS */}
                    {wizardStep === 2 && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-[bubbleIn_0.4s_ease-out]">

                        {/* Composant réutilisable pour chaque zone d'upload */}
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
                                // Miniature si image uploadée
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
                                // Zone d'upload vide
                                <div className="border border-dashed border-white/15 hover:border-brand-orange rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-colors gap-1.5 sm:gap-2">
                                  <span className="hidden sm:block text-xl text-white/30">{emoji}</span>
                                  <span className="hidden sm:block text-[10px] text-white/55 font-medium">
                                    {isMobile() ? 'Choisir' : 'Glisser ou cliquer'}
                                  </span>

                                  {/* Boutons selon device */}
                                  {isMobile() ? (
                                    <div className="flex flex-col gap-1.5 w-full">
                                      {/* Bouton Fichier */}
                                      <label className="relative cursor-pointer w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold rounded-lg transition-colors">
                                        📁 Fichier
                                        <input type="file" accept={accept} className="absolute inset-0 opacity-0 cursor-pointer"
                                          onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                                      </label>
                                      {/* Bouton Caméra (mobile uniquement) */}
                                      {accept.includes('image') && (
                                        <label className="relative cursor-pointer w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange text-[9px] font-bold rounded-lg transition-colors border border-brand-orange/30">
                                          📷 Photo
                                          <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => uploadToCloudinary(field, e.target.files[0])} />
                                        </label>
                                      )}
                                    </div>
                                  ) : (
                                    // Desktop: zone cliquable classique
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

                        {/* Recap circuit */}
                        <div className={`col-span-2 bg-slate-950/60 border ${theme === 'dark' ? 'border-white' : 'border-emerald-500'} rounded-xl p-2 sm:p-2.5`}>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-orange mb-1">🛣️ Circuit d'obtention</p>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { icon: '📋', label: 'Affiliation Candidat', done: true },
                              { icon: '👁️', label: 'Perception de Risque', done: selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct', active: selectedPath === 'perception' || !selectedPath },
                              { icon: '📖', label: 'Examen Théorique', done: selectedPath === 'pratique' || selectedPath === 'direct', active: selectedPath === 'theorique', locked: selectedPath === 'perception' || !selectedPath },
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

                        {/* CHOIX DU PARCOURS */}
                        <div className="col-span-2">

                          {/* Échecs + Transmission — EN HAUT sur une ligne */}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Échecs à l'examen
                              </label>
                              <select
                                name="failedAttempts"
                                value={formData.failedAttempts}
                                onChange={handleInputChange}
                                className="w-full bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-colors text-white/80"
                              >
                                <option value="0">Aucun</option>
                                <option value="1">1 échec</option>
                                <option value="2">2 échecs</option>
                                <option value="3">3 échecs</option>
                                <option value="4+">4+</option>
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

                          {/* Formules — SOUS les sélecteurs */}
                          <label className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Formule d'obtention souhaitée
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Option 1: Perception du Risque */}
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedPath('perception');
                                if (user) {
                                  try {
                                    await updateDoc(doc(db, 'leads', user.uid), {
                                      selectedPath: 'perception',
                                      amount: advisor.perceptionAmount || "350,00 €"
                                    });
                                  } catch (e) { console.error(e); }
                                }
                              }}
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
                                <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phase 2 — Perception du Risque.</p>
                              </div>
                              <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 2</span>
                                <span className="text-[10px] font-black text-white">{advisor.perceptionAmount || "350,00 €"}</span>
                              </div>
                            </button>

                            {/* Option 2: Examen Théorique */}
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedPath('theorique');
                                if (user) {
                                  try {
                                    await updateDoc(doc(db, 'leads', user.uid), {
                                      selectedPath: 'theorique',
                                      amount: advisor.theoriqueAmount || "550,00 €"
                                    });
                                  } catch (e) { console.error(e); }
                                }
                              }}
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
                                <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phases 2 &amp; 3 — Perception + Théorique.</p>
                              </div>
                              <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 3</span>
                                <span className="text-[10px] font-black text-white">{advisor.theoriqueAmount || "550,00 €"}</span>
                              </div>
                            </button>

                            {/* Option 3: Examen Pratique */}
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedPath('pratique');
                                if (user) {
                                  try {
                                    await updateDoc(doc(db, 'leads', user.uid), {
                                      selectedPath: 'pratique',
                                      amount: advisor.pratiqueAmount || "2100,00 €"
                                    });
                                  } catch (e) { console.error(e); }
                                }
                              }}
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
                                <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phases 2, 3 &amp; 4 — + conduite 30h.</p>
                              </div>
                              <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[7px] uppercase font-bold text-brand-orange">Phase 4</span>
                                <span className="text-[10px] font-black text-white">{advisor.pratiqueAmount || "750,00 €"}</span>
                              </div>
                            </button>

                            {/* Option 4: Permis Direct */}
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedPath('direct');
                                if (user) {
                                  try {
                                    await updateDoc(doc(db, 'leads', user.uid), {
                                      selectedPath: 'direct',
                                      amount: advisor.directLicenseAmount || "1200,00 €"
                                    });
                                  } catch (e) { console.error(e); }
                                }
                              }}
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
                                <p className="text-[7.5px] text-white/50 leading-tight mt-0.5">Phases 2–5 — Homologation.</p>
                              </div>
                              <div className="mt-1 pt-0.5 border-t border-white/5 flex justify-between items-center">
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

                        {/* COLONNE GAUCHE — Récapitulatif du dossier */}
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
                              <span className="text-brand-orange font-semibold">Cat. B — {formData.transmission}</span>
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

                        {/* COLONNE DROITE — Mandat + Checkbox */}
                        <div className="flex flex-col gap-2">

                          {/* Mandat légal */}
                          <div className="bg-brand-orange/5 border border-brand-orange/25 rounded-2xl p-2.5 flex-1">
                            <h4 className="font-bold text-[9px] text-brand-orange flex items-center gap-1 mb-1.5 leading-tight">
                              🛡️ Mandat SPF Belgique
                            </h4>
                            <p className="text-[8.5px] text-white/70 leading-snug">
                              En soumettant ce dossier, vous conférez mandat de représentation pour l'enregistrement officiel de votre équivalence de permis auprès du SPF Mobilité. <span className="text-brand-orange font-semibold">Aucun examen requis.</span>
                            </p>
                          </div>

                          {/* Checkbox mandat final */}
                          <label className="flex items-start gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-brand-orange/30 p-2.5 rounded-2xl cursor-pointer transition-all duration-300">
                            <input
                              type="checkbox"
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
                        onClick={async () => {
                          const newStep = wizardStep - 1;
                          setWizardStep(newStep);
                          if (user) {
                            try {
                              await setDoc(doc(db, 'leads', user.uid), {
                                firstName:      formData.firstName,
                                lastName:       formData.lastName,
                                birthDate:      formData.birthDate,
                                phone:          formData.phone,
                                address:        formData.address,
                                nationalRegister: formData.nationalRegister,
                                failedAttempts: formData.failedAttempts,
                                transmission:   formData.transmission,
                                selectedPath:   selectedPath || 'perception',
                                amount:         selectedPath === 'direct' ? (advisor.directLicenseAmount || "1200,00 €") :
                                                selectedPath === 'theorique' ? (advisor.theoriqueAmount || "550,00 €") :
                                                selectedPath === 'pratique' ? (advisor.pratiqueAmount || "2100,00 €") :
                                                (advisor.perceptionAmount || "350,00 €"),
                                uploads:        uploads,
                                uid:            user.uid,
                                email:          user.email,
                                wizardStep:     newStep,
                              }, { merge: true });
                            } catch (e) {
                              console.error('Auto-save error on Retour:', e);
                            }
                          }
                        }}
                        className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full border border-white/20 hover:border-white/50 text-[11px] sm:text-xs font-bold transition-colors"
                      >
                        Retour
                      </button>
                    ) : (
                      <div />
                    )}
                    {wizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          // Auto-sauvegarde dans Firestore à chaque étape
                          if (user) {
                            try {
                              await setDoc(doc(db, 'leads', user.uid), {
                                firstName:      formData.firstName,
                                lastName:       formData.lastName,
                                birthDate:      formData.birthDate,
                                phone:          formData.phone,
                                address:        formData.address,
                                nationalRegister: formData.nationalRegister,
                                failedAttempts: formData.failedAttempts,
                                transmission:   formData.transmission,
                                selectedPath:   selectedPath || 'perception',
                                amount:         selectedPath === 'direct' ? (advisor.directLicenseAmount || "1200,00 €") :
                                                selectedPath === 'theorique' ? (advisor.theoriqueAmount || "550,00 €") :
                                                selectedPath === 'pratique' ? (advisor.pratiqueAmount || "2100,00 €") :
                                                (advisor.perceptionAmount || "350,00 €"),
                                uploads:        uploads,
                                uid:            user.uid,
                                email:          user.email,
                                wizardStep:     wizardStep + 1,
                                // Ne pas écraser isSubmitted ou status si déjà définis
                              }, { merge: true });
                            } catch (e) {
                              console.error('Auto-save error:', e);
                            }
                          }
                          setWizardStep(s => s + 1);
                        }}
                        className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 shadow-md shadow-brand-orange/20 bg-brand-orange hover:bg-brand-orange-dark text-white cursor-pointer"
                      >
                        Continuer ➔
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!mandatAccepted}
                        className={`px-4 py-1.5 sm:px-8 sm:py-3 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 shadow-md flex items-center gap-2 ${
                          mandatAccepted 
                            ? 'bg-brand-orange hover:bg-brand-orange-dark shadow-brand-orange/30 text-white cursor-pointer hover:scale-[1.02]' 
                            : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        🚀 Soumettre ma Demande
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SUPPORT CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-6 relative z-10 h-[calc(100vh-144px)] md:h-full min-h-0 animate-[bubbleIn_0.5s_ease-out]">
              
              {/* Desktop Left Sidebar: Advisor Info */}
              <div className={`hidden md:flex flex-col justify-between items-center text-center p-6 border rounded-2xl bg-slate-950/60 ${theme === 'dark' ? 'border-white' : 'border-slate-950'}`}>
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-6">Votre Conseiller Agréé</h4>
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-brand-orange flex items-center justify-center text-3xl shadow-lg border-2 border-brand-orange/30">
                      {advisor.avatarEmoji || '👨‍💼'}
                    </div>
                    <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 border-2 border-slate-950 rounded-full ${advisor.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                  </div>
                  <h5 className="text-white font-bold text-lg mt-4">{advisor.name}</h5>
                  <p className="text-brand-orange text-xs font-semibold uppercase mt-0.5">{advisor.title}</p>
                  
                  <div className="w-full border-t border-white/10 mt-6 pt-6 text-left space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚡</span>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Réponse moyenne</p>
                        <p className="text-xs text-white/80 font-medium">Moins de 10 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Disponibilité</p>
                        <p className="text-xs text-white/80 font-medium">Lundi au Samedi (9h - 19h)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-3 mt-6">
                  <p className="text-[10px] text-brand-orange font-semibold leading-relaxed">
                    Espace d'échange crypté SSL. Vos documents d'identité et de paiement sont cryptés de bout en bout.
                  </p>
                </div>
              </div>

              {/* Chat Area (Right 2 cols on desktop) */}
              <div className={`md:col-span-2 flex flex-col h-full bg-slate-950/20 border rounded-2xl p-4 min-h-0 relative ${theme === 'dark' ? 'border-white' : 'border-slate-950'}`}>
                
                {/* Header Info */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4 flex-shrink-0 md:relative fixed top-[53px] md:top-auto left-0 md:left-auto right-0 md:right-auto px-4 py-3 md:p-0 bg-slate-900 md:bg-transparent z-10">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-lg font-bold">
                      {advisor.avatarEmoji || '👨‍💼'}
                    </div>
                    {advisor.isOnline ? (
                      <>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-ping" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                      </>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-500 border-2 border-slate-900 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{advisor.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold tracking-wider uppercase ${advisor.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                        {advisor.isOnline ? 'Conseiller en Ligne — répond immédiatement' : 'Conseiller hors-ligne'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message log */}
                <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2 border border-white/5 rounded-2xl bg-slate-950/30 mb-4 p-4 min-h-0 pt-20 md:pt-4 pb-20 md:pb-4">
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
                  <div ref={chatEndRef} />
                </div>

                {/* Input field Form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0 md:relative fixed bottom-16 md:bottom-auto left-0 md:left-auto right-0 md:right-auto p-4 md:p-0 bg-slate-900 md:bg-transparent border-t border-white/10 md:border-0 z-10">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Posez votre question à ${(advisor.name || '').split(' ')[0]} (ex. Délai, Légalité...)`}
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
            </div>
          )}



        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t-2 border-x border-emerald-500 rounded-t-3xl px-4 py-2 flex items-center justify-around shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`group flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            activeTab === 'overview' 
              ? 'text-brand-orange bg-brand-orange/10 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'overview' ? 'text-brand-orange' : 'text-white/40 group-hover:text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider font-semibold">Circuit</span>
        </button>
        
        <button
          onClick={() => {
            setActiveTab('wizard');
            setWizardStep(1);
          }}
          className={`group relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            activeTab === 'wizard' 
              ? 'text-brand-orange bg-brand-orange/10 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'wizard' ? 'text-brand-orange' : 'text-white/40 group-hover:text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider font-semibold">Demande</span>
          {!isSubmitted && (
            <span className="absolute top-2 right-5 w-2 h-2 rounded-full bg-brand-orange animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`group relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            activeTab === 'chat' 
              ? 'text-brand-orange bg-brand-orange/10 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'chat' ? 'text-brand-orange' : 'text-white/40 group-hover:text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider font-semibold">Conseiller</span>
          <span className="absolute top-2.5 right-6 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
        </button>
      </nav>

      {showUpgradeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-[scaleIn_0.3s_ease-out] flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl mb-5 animate-pulse text-indigo-400">
              ⚡
            </div>
            <h3 className="text-xl font-display font-extrabold text-white mb-2">
              Passer au Permis Direct
            </h3>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
              Voulez-vous passer à la formule <strong>Permis Définitif / Direct</strong> ?<br />
              Un nouveau règlement correspondant à cette formule sera requis. Votre validation de la Perception du Risque restera enregistrée.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setShowUpgradeConfirm(false)}
                className="flex-1 px-5 py-3 rounded-full text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 transition-all duration-300 cursor-pointer order-2 sm:order-1"
              >
                Annuler
              </button>
              <button
                onClick={handleUpgradeToDirect}
                className="flex-1 px-5 py-3 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] text-white transition-all duration-300 cursor-pointer order-1 sm:order-2"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles: animations + light theme */}
      <style>{`
        @keyframes bubbleIn {
          0%  { opacity: 0; transform: translateY(8px) scale(0.97); }
          100%{ opacity: 1; transform: translateY(0px)  scale(1);   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        /* ═══════════════════════════════════════════════════════
           GLOBAL PREMIUM CUSTOM SCROLLBAR (DARK & LIGHT THEMES)
        ═══════════════════════════════════════════════════════ */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent !important;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.25) !important;
          border-radius: 9999px !important;
          border: 2px solid transparent !important;
          background-clip: padding-box !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.45) !important;
          border: 2px solid transparent !important;
          background-clip: padding-box !important;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.25) transparent;
        }

        /* ═══════════════════════════════════════════════════════════════
           SOLUTION DÉFINITIVE — MODE CLAIR (attribute-selector approach)
           [class*="..."] capture TOUTES les variantes Tailwind d'un coup.
        ═══════════════════════════════════════════════════════════════ */

        .light-theme {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* ── HEADER ── */
        .light-theme header {
          background-color: #0f172a !important;
          border-bottom: 2px solid #10b981 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          color: #ffffff !important;
        }
        .light-theme header * { color: #ffffff !important; }
        .light-theme header [class*="border-white"]  { border-color: rgba(255, 255, 255, 0.1) !important; }
        .light-theme header [class*="bg-white"]      { background-color: rgba(255, 255, 255, 0.05) !important; }
        .light-theme header [class*="bg-emerald"]    { background-color: rgba(16, 185, 129, 0.1) !important; border-color: rgba(16, 185, 129, 0.2) !important; }
        .light-theme header [class*="text-emerald"]  { color: #34d399 !important; }
        .light-theme header [class*="text-white\\/"] { color: rgba(255, 255, 255, 0.5) !important; }

        /* ── SIDEBAR ── */
        .light-theme aside {
          background-color: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
        }
        .light-theme aside * { color: #0f172a !important; }
        .light-theme aside [class*="text-white\\/"]  { color: #334155 !important; }
        .light-theme aside [class*="text-slate-4"],
        .light-theme aside [class*="text-slate-5"]   { color: #64748b !important; }
        .light-theme aside [class*="border-white"]   { border-color: #e2e8f0 !important; }
        .light-theme aside [class*="bg-slate-"],
        .light-theme aside [class*="bg-white\\/"]    { background-color: #f8fafc !important; border-color: #e2e8f0 !important; }
        .light-theme aside [class*="text-red-"]      { color: #dc2626 !important; }
        .light-theme aside [class*="text-emerald"]   { color: #15803d !important; }

        /* ── MAIN AREA ── */
        .light-theme main {
          background-color: #ffffff !important;
          border-color: #0f172a !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04) !important;
          color: #0f172a !important;
        }

        /* Toutes les cartes sombres → fond clair */
        .light-theme main [class*="bg-slate-9"],
        .light-theme main [class*="bg-slate-8"],
        .light-theme main [class*="bg-slate-950"] {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        /* Gradients sombres → gradient clair */
        .light-theme main [class*="bg-gradient-to-br"],
        .light-theme main [class*="bg-gradient-to-r"] {
          background: #eff6ff !important;
          background-image: none !important;
          border-color: #bae6fd !important;
        }
        /* Sauf la barre de progression orange */
        .light-theme main [class*="from-brand-orange"],
        .light-theme main [class*="from-emerald-5"] {
          background: linear-gradient(to right, #f97316, #fbbf24) !important;
        }

        /* bg-white/x → gris très clair */
        .light-theme main [class*="bg-white\\/"] {
          background-color: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
        }

        /* Toutes les bordures blanc → gris clair */
        .light-theme main [class*="border-white"] { border-color: #e2e8f0 !important; }
        .light-theme main [class*="divide-white"] > * { border-color: #e2e8f0 !important; }

        /* text-white et TOUTES ses variantes → sombre lisible */
        .light-theme main [class*="text-white"]          { color: #0f172a !important; }
        .light-theme main [class*="text-white\\/9"]      { color: #0f172a !important; }
        .light-theme main [class*="text-white\\/8"]      { color: #1e293b !important; }
        .light-theme main [class*="text-white\\/7"]      { color: #334155 !important; }
        .light-theme main [class*="text-white\\/6"]      { color: #334155 !important; }
        .light-theme main [class*="text-white\\/5"]      { color: #475569 !important; }
        .light-theme main [class*="text-white\\/4"]      { color: #64748b !important; }
        .light-theme main [class*="text-white\\/3"]      { color: #94a3b8 !important; }
        .light-theme main [class*="text-white\\/2"]      { color: #94a3b8 !important; }

        /* Titres et textes */
        .light-theme main h1,.light-theme main h2,.light-theme main h3,
        .light-theme main h4,.light-theme main h5,.light-theme main h6 { color: #0f172a !important; }
        .light-theme main p      { color: #334155 !important; }
        .light-theme main label  { color: #475569 !important; font-weight: 600; }
        .light-theme main strong { color: #0f172a !important; }
        .light-theme main [class*="text-slate-4"] { color: #475569 !important; }
        .light-theme main [class*="text-slate-5"] { color: #64748b !important; }
        .light-theme main [class*="text-slate-3"] { color: #334155 !important; }

        /* Badges statuts */
        .light-theme main [class*="bg-emerald-5"] {
          background-color: #dcfce7 !important; color: #15803d !important; border-color: #86efac !important;
        }
        .light-theme main [class*="text-emerald-"] { color: #15803d !important; }
        .light-theme main [class*="border-emerald"] { border-color: #10b981 !important; border-width: 2px !important; }
        .light-theme main [class*="bg-amber-5"] {
          background-color: #fef9c3 !important; color: #b45309 !important; border-color: #fde68a !important;
        }
        .light-theme main [class*="text-amber-"]  { color: #b45309 !important; }
        .light-theme main [class*="bg-indigo-5"] {
          background-color: #e0e7ff !important; color: #4338ca !important; border-color: #c7d2fe !important;
        }
        .light-theme main [class*="text-indigo-"] { color: #4338ca !important; }
        .light-theme main [class*="bg-red-5"]     { background-color: #fef2f2 !important; border-color: #fecaca !important; }
        .light-theme main [class*="text-red-4"]   { color: #dc2626 !important; }

        /* Brand orange */
        .light-theme main [class*="text-brand-orange"]  { color: #c2410c !important; }
        .light-theme main [class*="bg-brand-orange\\/"] { background-color: #fff7ed !important; border-color: #fed7aa !important; }
        .light-theme main [class*="border-brand-orange"]{ border-color: #fdba74 !important; }

        /* Formulaires */
        .light-theme main input,
        .light-theme main select,
        .light-theme main textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .light-theme main input:focus,
        .light-theme main select:focus,
        .light-theme main textarea:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        .light-theme main input::placeholder { color: #94a3b8 !important; }

        /* Zone upload dashed */
        .light-theme main [class*="border-dashed"] {
          border-color: #cbd5e1 !important; background-color: #f8fafc !important;
        }

        /* Google AI Pro card text */
        .light-theme main [class*="bg-gradient-to-r"] h4   { color: #1e3a8a !important; }
        .light-theme main [class*="bg-gradient-to-r"] p    { color: #1e40af !important; }
        .light-theme main [class*="bg-gradient-to-r"] span { color: #1d4ed8 !important; }
        .light-theme main [class*="bg-gradient-to-r"] a    { background-color: #1e3a8a !important; color: #ffffff !important; }

        /* Chat bubbles côté client */
        .light-theme main [class*="bg-white\\/10"] {
          background-color: #f1f5f9 !important; border-color: #e2e8f0 !important;
        }
        .light-theme main [class*="bg-white\\/10"] p,
        .light-theme main [class*="bg-white\\/10"] span { color: #334155 !important; }

        /* Tooltip */
        .light-theme main [class*="bg-slate-8"].absolute {
          background-color: #1e293b !important;
          color: #ffffff !important;
          border-color: #475569 !important;
        }

        /* ─── HOVER EFFECTS & CARD HIGHLIGHTS (LIGHT THEME) ─── */
        
        /* Base opacity and smooth transitions for locked/upcoming cards */
        .light-theme main .opacity-40 {
          opacity: 0.55 !important;
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Hover state for locked/upcoming phase cards */
        .light-theme main .opacity-40:hover {
          opacity: 1 !important;
          background-color: #ffffff !important;
          border-color: #f97316 !important; /* Soft orange highlight border on hover */
          box-shadow: 0 10px 25px rgba(249, 115, 22, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) !important;
        }

        /* General hover text color accentuation inside all .group elements */
        .light-theme .group:hover [class*="text-white\\/2"] { color: #475569 !important; }
        .light-theme .group:hover [class*="text-white\\/3"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/4"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/5"] { color: #1e293b !important; }
        .light-theme .group:hover [class*="text-white\\/6"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/7"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/8"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/9"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white"]    { color: #0f172a !important; }

        /* Prevent tooltip from being darkened when hovering over the card group */
        .light-theme .group:hover [class*="bg-slate-8"].absolute {
          color: #ffffff !important;
        }

        /* Grayscale and opacity recovery for icons and text elements inside group on hover */
        .light-theme .group:hover img,
        .light-theme .group:hover svg {
          filter: grayscale(0) !important;
          opacity: 1 !important;
        }

        /* Pre/code */
        .light-theme main pre { background-color: #f8fafc !important; color: #334155 !important; border-color: #e2e8f0 !important; }

        /* Scrollbar */
        .light-theme ::-webkit-scrollbar-thumb { background: #cbd5e1 !important; }
        .light-theme ::-webkit-scrollbar-track  { background: transparent !important; }
      `}</style>
    </div>
  );
}
