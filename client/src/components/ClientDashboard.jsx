import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Subcomponents
import ClientAuth from './ClientAuth';
import ClientOverview from './ClientOverview';
import ClientWizard from './ClientWizard';
import ClientChat from './ClientChat';

export default function ClientDashboard({ onBack, initialMode = 'login', onAuthSuccess, onSwitchMode, initialTab }) {
  const navigate = useNavigate();
  // Authentication states
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'
  const chatEndRef = useRef(null);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Dashboard state
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [mandatAccepted, setMandatAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'wizard'); // Default to wizard on entry
  const [wizardStep, setWizardStep] = useState(1); // Default to Step 1 on entry
  const [wizardError, setWizardError] = useState('');

  // Client Theme State (light / dark mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('clientTheme') || 'dark');

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('clientTheme', theme);
  }, [theme]);

  // Sync activeTab state when URL path parameter (initialTab) changes
  useEffect(() => {
    if (initialTab && ['overview', 'wizard', 'chat'].includes(initialTab)) {
      if (activeTab !== initialTab) {
        setActiveTab(initialTab);
      }
    } else if (!initialTab) {
      if (activeTab !== 'wizard') {
        setActiveTab('wizard');
      }
    }
  }, [initialTab]);

  // Update URL subpath when activeTab state changes internally
  useEffect(() => {
    if (user && activeTab) {
      navigate(`/mon-espace/${activeTab}`);
    }
  }, [activeTab, user, navigate]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('new');
  const [billingActive, setBillingActive] = useState(false);
  const [paymentValidated, setPaymentValidated] = useState(false);
  const [soldeValidated, setSoldeValidated] = useState(false);
  const [soldeInitiated, setSoldeInitiated] = useState(false);
  const [selectedPath, setSelectedPath] = useState('theorique');
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
    failedAttempts: 'Jamais',
    transmission: 'Manuel',
    licenseCategory: 'Permis B (Voiture)',
  });

  // Simulated uploads state
  const [uploads, setUploads] = useState({
    idFront: null,
    idBack: null,
    photo: null,
    signature: null,
  });

  // Upload animations state
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
  const [chatUploading, setChatUploading] = useState(false);
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

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setIsLoadingData(true);
        try {
          const leadRef = doc(db, 'leads', currentUser.uid);
          const leadSnap = await getDoc(leadRef);
          let leadData = null;
          if (leadSnap.exists()) {
            leadData = leadSnap.data();
          }

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
              failedAttempts: leadData?.failedAttempts || leadData?.answers?.failures || 'Jamais',
              transmission: leadData?.transmission || 'Manuel',
              licenseCategory: leadData?.licenseCategory || 'Permis B (Voiture)',
            });
            setIsSubmitted(leadData?.isSubmitted || false);
            setBillingActive(leadData?.billingActive || false);
            setPaymentValidated(leadData?.paymentValidated || false);
            setSoldeValidated(leadData?.soldeValidated || false);
            setSoldeInitiated(leadData?.soldeInitiated || false);
            setAttestationUrl(leadData?.attestationUrl || '');
            setSelectedPath(leadData?.isSubmitted ? (leadData?.selectedPath || 'theorique') : 'theorique');
            setPerceptionPaid(leadData?.perceptionPaid || false);
            setApplicationStatus(leadData?.status || userData?.status || (leadData?.isSubmitted ? 'processing' : 'new'));
            
            if (leadData?.uploads) {
              setUploads(leadData.uploads);
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
        } finally {
          setIsLoadingData(false);
          setIsInitializing(false);
        }

        const leadRef2 = doc(db, 'leads', currentUser.uid);
        const userRef2 = doc(db, 'users', currentUser.uid);
        
        const unsubLead = onSnapshot(leadRef2, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsSubmitted(data.isSubmitted === true);
            setBillingActive(data.billingActive === true);
            setPaymentValidated(data.paymentValidated === true);
            setSoldeValidated(data.soldeValidated === true);
            setSoldeInitiated(data.soldeInitiated === true);
            setAttestationUrl(data.attestationUrl || '');
            if (data.isSubmitted) {
              setSelectedPath(data.selectedPath || 'theorique');
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onBack();
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatBelgianPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadToCloudinary = async (fieldName, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [fieldName]: true }));

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('file', file);
      formDataPayload.append('upload_preset', 'monpermis');
      formDataPayload.append('folder', `monpermis/${user?.uid}/${fieldName}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formDataPayload }
      );
      const data = await res.json();

      if (data.secure_url) {
        const updatedUploads = { ...uploads, [fieldName]: data.secure_url };
        setUploads(updatedUploads);
        if (user) {
          const leadRef = doc(db, 'leads', user.uid);
          await setDoc(leadRef, {
            uploads: updatedUploads,
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

  const handleUpgradeToPath = async (targetPath) => {
    try {
      const leadRef = doc(db, 'leads', user.uid);
      const alreadyPaid = paymentValidated;
      let targetAmount = advisor.directLicenseAmount || "1200,00 €";
      if (targetPath === 'theorique') targetAmount = advisor.theoriqueAmount || "550,00 €";
      else if (targetPath === 'pratique') targetAmount = advisor.pratiqueAmount || "2100,00 €";
      else if (targetPath === 'perception') targetAmount = advisor.perceptionAmount || "350,00 €";

      await updateDoc(leadRef, {
        selectedPath: targetPath,
        amount: targetAmount,
        paymentValidated: false,
        billingActive: true,
        status: 'new',
        perceptionPaid: alreadyPaid,
        soldeInitiated: false,
        soldeValidated: false
      });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'new'
      });

      try {
        const messagesRef = collection(db, 'chats', user.uid, 'messages');
        const chatDocRef = doc(db, 'chats', user.uid);
        const formulaName = targetPath === 'perception' ? 'Perception du Risque' : targetPath === 'pratique' ? 'Examen Pratique' : targetPath === 'theorique' ? 'Examen Théorique' : 'Permis Direct';
        const textMessage = `Félicitations ${formData.firstName || 'Candidat'} ! J'ai bien reçu votre demande de changement de formule. Nous venons d'initier votre formule '${formulaName}'. Nous vous invitons à régler votre acompte de 200,00 € par virement bancaire pour démarrer. 🚀`;

        await addDoc(messagesRef, {
          sender: 'advisor',
          text: textMessage,
          timestamp: serverTimestamp()
        });

        await setDoc(chatDocRef, {
          userId: user.uid,
          userName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || user.email,
          userEmail: user.email,
          lastMessageText: textMessage,
          lastMessageTime: serverTimestamp(),
          unreadByAdmin: false,
          unreadByClient: true
        }, { merge: true });
      } catch (chatErr) {
        console.error("Failed to write migration chat message:", chatErr);
      }

      setActiveTab('wizard');
      setShowUpgradeConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

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
        licenseCategory: formData.licenseCategory || 'Permis B (Voiture)',
        selectedPath: selectedPath || 'theorique',
        amount: selectedPath === 'direct' ? (advisor.directLicenseAmount || "1200,00 €") :
                selectedPath === 'theorique' ? (advisor.theoriqueAmount || "550,00 €") :
                selectedPath === 'pratique' ? (advisor.pratiqueAmount || "2100,00 €") :
                (advisor.perceptionAmount || "350,00 €"),
        isSubmitted: true,
        billingActive: true,
        uploads: uploads,
        submittedAt: new Date().toISOString(),
        uid: user.uid,
        email: user.email,
      };

      await setDoc(doc(db, 'leads', user.uid), leadData);
      setIsSubmitted(true);
      
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
    } {
      setIsLoadingData(false);
    }
  };

  const handleClientChatFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Le fichier dépasse 20 Mo.");
      return;
    }

    setChatUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const formDataPayload = new FormData();
      formDataPayload.append('file', file);
      formDataPayload.append('upload_preset', 'monpermis');
      formDataPayload.append('folder', `monpermis/chats/${user.uid}`);

      const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formDataPayload
      });
      const data = await res.json();
      if (!data.secure_url) {
        throw new Error("Erreur de téléversement Cloudinary");
      }

      const fileUrl = data.secure_url;
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const chatDocRef = doc(db, 'chats', user.uid);

      await addDoc(messagesRef, {
        sender: 'student',
        text: fileUrl,
        timestamp: serverTimestamp()
      });

      const userNameStr = `${formData.firstName} ${formData.lastName}`.trim() || user.email;

      await setDoc(chatDocRef, {
        userId: user.uid,
        userName: userNameStr,
        userEmail: user.email,
        lastMessageText: file.type.startsWith('image/') ? "📷 Photo envoyée" : "📄 Document envoyé",
        lastMessageTime: serverTimestamp(),
        unreadByAdmin: true,
        unreadByClient: false
      }, { merge: true });

    } catch (err) {
      console.error("Chat upload error:", err);
      alert("Échec de l'envoi du fichier.");
    } finally {
      setChatUploading(false);
      e.target.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const messageText = chatInput;
    setChatInput('');

    try {
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const chatDocRef = doc(db, 'chats', user.uid);
      
      await addDoc(messagesRef, {
        sender: 'student',
        text: messageText,
        timestamp: serverTimestamp()
      });

      const userName = `${formData.firstName} ${formData.lastName}`.trim() || user.email;

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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-sm font-medium">Initialisation de votre espace sécurisé...</p>
      </div>
    );
  }

  // Render Authentication screen if not logged in
  if (!user) {
    return (
      <ClientAuth
        onBack={onBack}
        initialMode={authMode}
        onAuthSuccess={onAuthSuccess}
        onSwitchMode={(mode) => {
          setAuthMode(mode);
          if (onSwitchMode) onSwitchMode(mode);
        }}
      />
    );
  }

  // Render Secured Dashboard if logged in
  return (
    <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white dark-theme' : 'bg-slate-50 text-slate-900 light-theme'} flex flex-col font-sans selection:bg-brand-orange selection:text-white relative transition-colors duration-300`}>
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
          <button 
            onClick={onBack}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white/50 text-xs sm:text-sm transition-all duration-300 bg-white/5 hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site
          </button>

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
      <div className={`flex-1 flex flex-col md:flex-row w-full gap-6 pb-24 md:pb-8 min-h-0 ${activeTab === 'chat' ? 'p-0 md:p-8' : 'p-4 sm:p-6 lg:p-8'}`}>
        
        {/* --- SIDEBAR --- */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col sticky top-24 pr-6 border-r border-white/10 self-start">
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

          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 mb-2">Navigation</p>

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
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

          {activeTab === 'overview' && (
            <ClientOverview
              user={user}
              formData={formData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setWizardStep={setWizardStep}
              advisor={advisor}
              selectedPath={selectedPath}
              billingActive={billingActive}
              paymentValidated={paymentValidated}
              soldeValidated={soldeValidated}
              soldeInitiated={soldeInitiated}
              applicationStatus={applicationStatus}
              attestationUrl={attestationUrl}
              theme={theme}
              showUpgradeConfirm={showUpgradeConfirm}
              setShowUpgradeConfirm={setShowUpgradeConfirm}
              handleUpgradeToPath={handleUpgradeToPath}
            />
          )}

          {activeTab === 'wizard' && (
            isSubmitted ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl mb-4 animate-pulse">
                  ✓
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">Dossier Transmis avec Succès !</h2>
                <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
                  Votre demande a bien été envoyée à nos services pour vérification légale. Votre conseiller dédié, {advisor.name}, analyse vos pièces.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-6 justify-center">
                  <button onClick={() => setActiveTab('overview')} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-orange hover:bg-brand-orange-dark text-white transition-all cursor-pointer">
                    Suivre mon dossier ➔
                  </button>
                  <button onClick={() => setActiveTab('chat')} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer">
                    Contacter mon conseiller
                  </button>
                </div>
              </div>
            ) : (
              <ClientWizard
                formData={formData}
                setFormData={setFormData}
                wizardStep={wizardStep}
                setWizardStep={setWizardStep}
                wizardError={wizardError}
                setWizardError={setWizardError}
                uploads={uploads}
                uploading={uploading}
                theme={theme}
                selectedPath={selectedPath}
                setSelectedPath={setSelectedPath}
                advisor={advisor}
                mandatAccepted={mandatAccepted}
                setMandatAccepted={setMandatAccepted}
                handleSubmitDemand={handleSubmitDemand}
                handleInputChange={handleInputChange}
                uploadToCloudinary={uploadToCloudinary}
              />
            )
          )}

          {activeTab === 'chat' && (
            <ClientChat
              user={user}
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatUploading={chatUploading}
              isTyping={isTyping}
              advisor={advisor}
              theme={theme}
              handleSendMessage={handleSendMessage}
              handleClientChatFileUpload={handleClientChatFileUpload}
              chatEndRef={chatEndRef}
            />
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

      {/* Global CSS style block */}
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

        .light-theme {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

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

        .light-theme main {
          background-color: #ffffff !important;
          border-color: #0f172a !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04) !important;
          color: #0f172a !important;
        }

        .light-theme main [class*="bg-slate-9"],
        .light-theme main [class*="bg-slate-8"],
        .light-theme main [class*="bg-slate-950"] {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        .light-theme main [class*="bg-gradient-to-br"],
        .light-theme main [class*="bg-gradient-to-r"] {
          background: #eff6ff !important;
          background-image: none !important;
          border-color: #bae6fd !important;
        }
        .light-theme main [class*="from-brand-orange"],
        .light-theme main [class*="from-emerald-5"] {
          background: linear-gradient(to right, #f97316, #fbbf24) !important;
        }

        .light-theme main [class*="bg-white\\/"] {
          background-color: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
        }

        .light-theme main [class*="border-white"] { border-color: #e2e8f0 !important; }
        .light-theme main [class*="divide-white"] > * { border-color: #e2e8f0 !important; }

        .light-theme main [class*="text-white"]          { color: #0f172a !important; }
        .light-theme main [class*="text-white\\/9"]      { color: #0f172a !important; }
        .light-theme main [class*="text-white\\/8"]      { color: #1e293b !important; }
        .light-theme main [class*="text-white\\/7"]      { color: #334155 !important; }
        .light-theme main [class*="text-white\\/6"]      { color: #334155 !important; }
        .light-theme main [class*="text-white\\/5"]      { color: #475569 !important; }
        .light-theme main [class*="text-white\\/4"]      { color: #64748b !important; }
        .light-theme main [class*="text-white\\/3"]      { color: #94a3b8 !important; }
        .light-theme main [class*="text-white\\/2"]      { color: #94a3b8 !important; }

        .light-theme main h1,.light-theme main h2,.light-theme main h3,
        .light-theme main h4,.light-theme main h5,.light-theme main h6 { color: #0f172a !important; }
        .light-theme main p      { color: #334155 !important; }
        .light-theme main label  { color: #475569 !important; font-weight: 600; }
        .light-theme main strong { color: #0f172a !important; }
        .light-theme main [class*="text-slate-4"] { color: #475569 !important; }
        .light-theme main [class*="text-slate-5"] { color: #64748b !important; }
        .light-theme main [class*="text-slate-3"] { color: #334155 !important; }

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

        .light-theme main [class*="text-brand-orange"]  { color: #c2410c !important; }
        .light-theme main [class*="bg-brand-orange\\/"] { background-color: #fff7ed !important; border-color: #fed7aa !important; }
        .light-theme main [class*="border-brand-orange"]{ border-color: #fdba74 !important; }

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

        .light-theme main [class*="border-dashed"] {
          border-color: #cbd5e1 !important; background-color: #f8fafc !important;
        }

        .light-theme main [class*="bg-gradient-to-r"] h4   { color: #1e3a8a !important; }
        .light-theme main [class*="bg-gradient-to-r"] p    { color: #1e40af !important; }
        .light-theme main [class*="bg-gradient-to-r"] span { color: #1d4ed8 !important; }
        .light-theme main [class*="bg-gradient-to-r"] a    { background-color: #1e3a8a !important; color: #ffffff !important; }

        .light-theme main [class*="bg-white\\/10"] {
          background-color: #f1f5f9 !important; border-color: #e2e8f0 !important;
        }
        .light-theme main [class*="bg-white\\/10"] p,
        .light-theme main [class*="bg-white\\/10"] span { color: #334155 !important; }

        .light-theme main [class*="bg-slate-8"].absolute {
          background-color: #1e293b !important;
          color: #ffffff !important;
          border-color: #475569 !important;
        }

        .light-theme main .opacity-40 {
          opacity: 0.55 !important;
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .light-theme main .opacity-40:hover {
          opacity: 1 !important;
          background-color: #ffffff !important;
          border-color: #f97316 !important;
          box-shadow: 0 10px 25px rgba(249, 115, 22, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) !important;
        }

        .light-theme .group:hover [class*="text-white\\/2"] { color: #475569 !important; }
        .light-theme .group:hover [class*="text-white\\/3"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/4"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/5"] { color: #1e293b !important; }
        .light-theme .group:hover [class*="text-white\\/6"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/7"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/8"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/9"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white"]    { color: #0f172a !important; }

        .light-theme .group:hover [class*="bg-slate-8"].absolute {
          color: #ffffff !important;
        }

        .light-theme .group:hover img,
        .light-theme .group:hover svg {
          filter: grayscale(0) !important;
          opacity: 1 !important;
        }

        .light-theme main pre { background-color: #f8fafc !important; color: #334155 !important; border-color: #e2e8f0 !important; }
        .light-theme ::-webkit-scrollbar-thumb { background: #cbd5e1 !important; }
        .light-theme ::-webkit-scrollbar-track  { background: transparent !important; }
      `}</style>
    </div>
  );
}
