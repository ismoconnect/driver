import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import DocumentsUtilisateurs from './DocumentsUtilisateurs';

const Dashboard = ({ onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadUid, setSelectedLeadUid] = useState(() => localStorage.getItem('adminSelectedLeadUid') || null);
  const [updating, setUpdating] = useState(false);
  const [attestationUrlInput, setAttestationUrlInput] = useState('');
  const [attestationUploadStatus, setAttestationUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [attestationUploadProgress, setAttestationUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'overview');
  const [isEditingPath, setIsEditingPath] = useState(false);

  useEffect(() => {
    setIsEditingPath(false);
  }, [selectedLeadUid]);

  // Admin Theme State (light / dark mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  // Derive selectedLead from leads array using stored UID
  const selectedLead = leads.find(l => l.uid === selectedLeadUid) || null;

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Persist selectedLeadUid to localStorage
  useEffect(() => {
    if (selectedLeadUid) {
      localStorage.setItem('adminSelectedLeadUid', selectedLeadUid);
    } else {
      localStorage.removeItem('adminSelectedLeadUid');
    }
  }, [selectedLeadUid]);

  // Sync attestationUrlInput state when selectedLead changes
  useEffect(() => {
    if (selectedLead && selectedLead.rawLead) {
      setAttestationUrlInput(selectedLead.rawLead.attestationUrl || '');
      setAttestationUploadStatus(selectedLead.rawLead.attestationUrl ? 'success' : 'idle');
    } else {
      setAttestationUrlInput('');
      setAttestationUploadStatus('idle');
    }
  }, [selectedLeadUid, selectedLead?.rawLead?.attestationUrl]);

  // Advisor Settings States
  const [advisorSettings, setAdvisorSettings] = useState({
    name: "Jean-Pierre Dumont",
    title: "Expert Agréé SPF Belgique",
    isOnline: true,
    avatarEmoji: "👨‍💼",
    beneficiary: "Mon Permis SRL",
    bankName: "BNP Paribas Fortis",
    iban: "BE96 3630 1234 5678",
    bic: "GEBA BEBB",
    perceptionAmount: "350,00 €",
    perceptionLabel1: "Frais de timbre fiscal & enregistrement SPF Belgique",
    perceptionAmount1: "50,00 €",
    perceptionLabel2: "Administration - Dispense de Perception du Risque",
    perceptionAmount2: "300,00 €",
    theoriqueAmount: "550,00 €",
    theoriqueLabel1: "Frais d'inscription & enregistrement SPF",
    theoriqueAmount1: "150,00 €",
    theoriqueLabel2: "Administration - Dispense Examen Théorique",
    theoriqueAmount2: "400,00 €",
    pratiqueAmount: "2100,00 €",
    pratiqueLabel1: "Frais d'homologation & enregistrement SPF",
    pratiqueAmount1: "700,00 €",
    pratiqueLabel2: "Administration - Dispense Examen Pratique (30h à 70€/h)",
    pratiqueAmount2: "1400,00 €",
    directLicenseAmount: "1200,00 €",
    directLabel1: "Constitution du dossier d'homologation complet",
    directAmount1: "400,00 €",
    directLabel2: "Frais d'édition & timbres fiscaux (SPF Belgique)",
    directAmount2: "800,00 €"
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Chat / Messages States
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(() => localStorage.getItem('adminSelectedChatId') || null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Persist selectedChatId to localStorage
  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem('adminSelectedChatId', selectedChatId);
    } else {
      localStorage.removeItem('adminSelectedChatId');
    }
  }, [selectedChatId]);

  // Users tab filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  // Fichiers téléversés — lightbox
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLabel, setPreviewLabel] = useState('');

  // Listen to advisor settings in real-time
  useEffect(() => {
    const docRef = doc(db, "settings", "advisor");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdvisorSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to all active chats in real-time
  useEffect(() => {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, orderBy("lastMessageTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setChats(chatList);
    });
    return () => unsubscribe();
  }, []);

  // Listen to messages of the selected chat in real-time
  useEffect(() => {
    if (!selectedChatId) {
      setChatMessages([]);
      return;
    }
    setLoadingMessages(true);
    const msgsRef = collection(db, "chats", selectedChatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setChatMessages(msgList);
      setLoadingMessages(false);

      // Mark as read by admin when admin views the chat
      const chatDocRef = doc(db, "chats", selectedChatId);
      updateDoc(chatDocRef, { unreadByAdmin: false }).catch(err => console.error(err));
    });
    return () => unsubscribe();
  }, [selectedChatId]);

  const handlePerceptionTotalChange = (val) => {
    const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    const total = isNaN(parsed) ? 0 : parsed;

    if (total <= 0) {
      setAdvisorSettings(prev => ({ ...prev, perceptionAmount: val }));
      return;
    }

    const l1 = Math.round(total * 0.142857);
    const l2 = total - l1;

    const fmt = (num) => `${num.toFixed(2).replace('.', ',')} €`;

    setAdvisorSettings(prev => ({
      ...prev,
      perceptionAmount: val,
      perceptionAmount1: fmt(l1),
      perceptionAmount2: fmt(l2)
    }));
  };

  const handleTheoriqueTotalChange = (val) => {
    const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    const total = isNaN(parsed) ? 0 : parsed;

    if (total <= 0) {
      setAdvisorSettings(prev => ({ ...prev, theoriqueAmount: val }));
      return;
    }

    const l1 = Math.round(total * 0.272727);
    const l2 = total - l1;

    const fmt = (num) => `${num.toFixed(2).replace('.', ',')} €`;

    setAdvisorSettings(prev => ({
      ...prev,
      theoriqueAmount: val,
      theoriqueAmount1: fmt(l1),
      theoriqueAmount2: fmt(l2)
    }));
  };

  const handlePratiqueTotalChange = (val) => {
    const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    const total = isNaN(parsed) ? 0 : parsed;

    if (total <= 0) {
      setAdvisorSettings(prev => ({ ...prev, pratiqueAmount: val }));
      return;
    }

    const l1 = Math.round(total * 0.333333);
    const l2 = total - l1;

    const fmt = (num) => `${num.toFixed(2).replace('.', ',')} €`;

    setAdvisorSettings(prev => ({
      ...prev,
      pratiqueAmount: val,
      pratiqueAmount1: fmt(l1),
      pratiqueAmount2: fmt(l2)
    }));
  };

  const handleDirectTotalChange = (val) => {
    const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    const total = isNaN(parsed) ? 0 : parsed;

    if (total <= 0) {
      setAdvisorSettings(prev => ({ ...prev, directLicenseAmount: val }));
      return;
    }

    const l1 = Math.round(total * 0.333333);
    const l2 = total - l1;

    const fmt = (num) => `${num.toFixed(2).replace('.', ',')} €`;

    setAdvisorSettings(prev => ({
      ...prev,
      directLicenseAmount: val,
      directAmount1: fmt(l1),
      directAmount2: fmt(l2)
    }));
  };

  const getAdminSplitPaymentDetails = (lead) => {
    const selectedPath = lead?.selectedPath;
    let totalStr = "0,00 €";
    if (selectedPath === 'perception') totalStr = advisorSettings.perceptionAmount || "350,00 €";
    else if (selectedPath === 'theorique') totalStr = advisorSettings.theoriqueAmount || "550,00 €";
    else if (selectedPath === 'pratique') totalStr = advisorSettings.pratiqueAmount || "2100,00 €";
    else if (selectedPath === 'direct') totalStr = advisorSettings.directLicenseAmount || "1200,00 €";

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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const docRef = doc(db, "settings", "advisor");
      await setDoc(docRef, {
        name: advisorSettings.name,
        title: advisorSettings.title,
        isOnline: advisorSettings.isOnline === true || advisorSettings.isOnline === 'true',
        avatarEmoji: advisorSettings.avatarEmoji || "👨‍💼",
        beneficiary: advisorSettings.beneficiary || "Mon Permis SRL",
        bankName: advisorSettings.bankName || "BNP Paribas Fortis",
        iban: advisorSettings.iban || "BE96 3630 1234 5678",
        bic: advisorSettings.bic || "GEBA BEBB",
        perceptionAmount: advisorSettings.perceptionAmount || "350,00 €",
        perceptionLabel1: advisorSettings.perceptionLabel1 || "Frais de timbre fiscal & enregistrement SPF Belgique",
        perceptionAmount1: advisorSettings.perceptionAmount1 || "50,00 €",
        perceptionLabel2: advisorSettings.perceptionLabel2 || "Administration - Dispense de Perception du Risque",
        perceptionAmount2: advisorSettings.perceptionAmount2 || "300,00 €",
        theoriqueAmount: advisorSettings.theoriqueAmount || "550,00 €",
        theoriqueLabel1: advisorSettings.theoriqueLabel1 || "Frais d'inscription & enregistrement SPF",
        theoriqueAmount1: advisorSettings.theoriqueAmount1 || "150,00 €",
        theoriqueLabel2: advisorSettings.theoriqueLabel2 || "Administration - Dispense Examen Théorique",
        theoriqueAmount2: advisorSettings.theoriqueAmount2 || "400,00 €",
        pratiqueAmount: advisorSettings.pratiqueAmount || "2100,00 €",
        pratiqueLabel1: advisorSettings.pratiqueLabel1 || "Frais d'homologation & enregistrement SPF",
        pratiqueAmount1: advisorSettings.pratiqueAmount1 || "700,00 €",
        pratiqueLabel2: advisorSettings.pratiqueLabel2 || "Administration - Dispense Examen Pratique (30h à 70€/h)",
        pratiqueAmount2: advisorSettings.pratiqueAmount2 || "1400,00 €",
        directLicenseAmount: advisorSettings.directLicenseAmount || "1200,00 €",
        directLabel1: advisorSettings.directLabel1 || "Constitution du dossier d'homologation complet",
        directAmount1: advisorSettings.directAmount1 || "400,00 €",
        directLabel2: advisorSettings.directLabel2 || "Frais d'édition & timbres fiscaux (SPF Belgique)",
        directAmount2: advisorSettings.directAmount2 || "800,00 €"
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde des paramètres.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !selectedChatId) return;

    const messageText = adminChatInput;
    setAdminChatInput('');

    try {
      const msgsRef = collection(db, "chats", selectedChatId, "messages");
      const chatDocRef = doc(db, "chats", selectedChatId);

      // 1. Add reply message
      await addDoc(msgsRef, {
        sender: 'advisor',
        text: messageText,
        timestamp: serverTimestamp()
      });

      // 2. Update chat metadata
      await updateDoc(chatDocRef, {
        lastMessageText: messageText,
        lastMessageTime: serverTimestamp(),
        unreadByClient: true,
        unreadByAdmin: false
      });
    } catch (err) {
      console.error("Error sending admin reply:", err);
    }
  };

  // ─── Synchronisation temps réel : deux listeners parallèles ───────────────
  // On garde chaque collection dans une ref pour pouvoir fusionner à chaque update
  const leadsDataRef  = React.useRef([]);
  const usersDataRef  = React.useRef([]);

  const mergeAndSet = () => {
    const leadsData = leadsDataRef.current;
    const usersData = usersDataRef.current;

    // Map pour accès rapide par UID
    const usersMap = Object.fromEntries(usersData.map(u => [u.uid || u.id, u]));
    const combined = [];

    // 1. Tous les documents leads, enrichis avec la collection users
    for (const lead of leadsData) {
      const uid = lead.uid || lead.id;
      const user = usersMap[uid] || {};
      const firstName = lead.firstName || user.firstName || '';
      const lastName  = lead.lastName  || user.lastName  || '';
      const name = `${firstName} ${lastName}`.trim() || lead.email || user.email || '—';
      combined.push({
        id:      lead.id,
        uid,
        name,
        email:   lead.email   || user.email   || '',
        phone:   lead.phone   || user.phone   || '',
        service: lead.isSubmitted ? 'Permis Définitif' : 'Inscription simple',
        date:    new Date(lead.createdAt || lead.submittedAt || Date.now())
                   .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        status:  lead.status  || user.status  || (lead.isSubmitted ? 'processing' : 'new'),
        rawLead: lead,
        rawUser: Object.keys(user).length ? user : null,
      });
    }

    // 2. Utilisateurs sans document leads (inscription simple, pas encore de dossier)
    for (const user of usersData) {
      const uid = user.uid || user.id;
      if (combined.find(c => c.uid === uid)) continue;
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '—';
      combined.push({
        id:      uid,
        uid,
        name,
        email:   user.email  || '',
        phone:   user.phone  || '',
        service: 'Inscription simple',
        date:    new Date(user.createdAt || Date.now())
                   .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        status:  user.status || 'new',
        rawLead: null,
        rawUser: user,
      });
    }

    // Tri : leads soumis en premier, puis par date décroissante
    combined.sort((a, b) => {
      if (a.rawLead?.isSubmitted && !b.rawLead?.isSubmitted) return -1;
      if (!a.rawLead?.isSubmitted && b.rawLead?.isSubmitted) return 1;
      return new Date(b.rawLead?.createdAt || b.rawUser?.createdAt || 0)
           - new Date(a.rawLead?.createdAt || a.rawUser?.createdAt || 0);
    });

    setLeads(combined);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);

    // Listener 1 — collection leads
    const unsubLeads = onSnapshot(
      query(collection(db, 'leads')),
      (snap) => {
        leadsDataRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      },
      (err) => console.error('leads listener error:', err)
    );

    // Listener 2 — collection users (indépendant, pas imbriqué)
    const unsubUsers = onSnapshot(
      query(collection(db, 'users')),
      (snap) => {
        usersDataRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      },
      (err) => console.error('users listener error:', err)
    );

    return () => {
      unsubLeads();
      unsubUsers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ────────────────────────────────────────────────────────────────────────────



  const handleSignOut = () => {
    signOut(auth).then(() => onLogout());
  };

  const openDetail = (lead) => {
    setSelectedLeadUid(lead.uid);
    setActiveTab('detail');
  };

  const closeDetail = () => {
    setSelectedLeadUid(null);
    setActiveTab('demandes');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      if (selectedLead.rawLead && selectedLead.rawLead.id) {
        await updateDoc(doc(db, "leads", selectedLead.rawLead.id), { 
          status: newStatus
        });
      }
      if (selectedLead.rawUser && selectedLead.rawUser.uid) {
        await updateDoc(doc(db, "users", selectedLead.rawUser.uid), { 
          status: newStatus
        });
      }
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
  };

  const handleSelectPath = async (pathName) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const leadId = selectedLead.rawLead?.id || selectedLead.uid;
      await updateDoc(doc(db, "leads", leadId), { 
        selectedPath: pathName
      });
      setIsEditingPath(false);
    } catch (err) {
      console.error("Error setting path:", err);
    }
    setUpdating(false);
  };

  const handleDelete = async (e, leadToDelete) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier et toutes ses données ?")) {
      setUpdating(true);
      try {
        if (leadToDelete.rawLead && leadToDelete.rawLead.id) {
          await deleteDoc(doc(db, "leads", leadToDelete.rawLead.id));
        }
        if (leadToDelete.rawUser && leadToDelete.rawUser.uid) {
          await deleteDoc(doc(db, "users", leadToDelete.rawUser.uid));
        }
        // If the deleted lead is currently open, close it
        if (selectedLeadUid === leadToDelete.uid) {
          setSelectedLeadUid(null);
          setActiveTab('demandes');
        }
      } catch (err) {
        console.error(err);
      }
      setUpdating(false);
    }
  };

  const handleReset = async (e, leadToReset) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment réinitialiser ce dossier au statut 'Nouveau' ?")) {
      setUpdating(true);
      try {
        const uid = leadToReset?.uid;
        if (uid) {
          // Delete all chat messages
          const messagesRef = collection(db, "chats", uid, "messages");
          const msgsSnap = await getDocs(messagesRef);
          const deletePromises = msgsSnap.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);

          // Delete the parent chat document
          await deleteDoc(doc(db, "chats", uid));
        }

        if (leadToReset.rawLead && leadToReset.rawLead.id) {
          await updateDoc(doc(db, "leads", leadToReset.rawLead.id), { 
            status: "new",
            isSubmitted: false,
            billingActive: false,
            paymentValidated: false,
            soldeInitiated: false,
            soldeValidated: false,
            selectedPath: "",
            attestationUrl: ""
          });
        }
        if (leadToReset.rawUser && leadToReset.rawUser.uid) {
          await updateDoc(doc(db, "users", leadToReset.rawUser.uid), { 
            status: "new",
            isSubmitted: false
          });
        }
      } catch (err) {
        console.error(err);
      }
      setUpdating(false);
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-slate-950 text-white dark-theme' : 'bg-slate-50 text-slate-900 light-theme'} overflow-hidden font-sans transition-colors duration-300`}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-white/5 flex flex-col justify-between flex-shrink-0 backdrop-blur-xl relative z-20 shadow-2xl">
        <div>
          <div className="px-8 py-8 border-b border-white/5">
            <h1 className="text-2xl font-black tracking-tighter text-white">
              ADMIN<span className="text-emerald-500">PRO</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 tracking-widest uppercase">Portail de Gestion</p>
          </div>
          
          <nav className="mt-6 px-4 space-y-1">
            {/* Vue d'ensemble */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">🏠</span>
              Vue d'ensemble
            </button>

            <div className="pt-2 pb-1 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Gestion</p>
            </div>

            <button
              onClick={() => setActiveTab('demandes')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'demandes'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">📂</span>
              Les demandes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">👥</span>
              Mes utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative ${
                activeTab === 'messages'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">💬</span>
              Ma messagerie
              {chats.some(c => c.unreadByAdmin) && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'documents'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">📁</span>
              Dossiers utilisateurs
            </button>

            <div className="pt-2 pb-1 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Configuration</p>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">⚙️</span>
              Paramètres
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-xl transition-all duration-300"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950 relative z-10">
        
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-md flex-shrink-0">
          <h2 className="text-lg font-bold text-white capitalize">
            {activeTab === 'overview' && "🏠 Vue d'ensemble"}
            {activeTab === 'demandes' && "📂 Les demandes"}
            {activeTab === 'detail' && selectedLead && (
              <span className="flex items-center gap-3">
                <button onClick={closeDetail} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  ←
                </button>
                Dossier de {selectedLead.name}
              </span>
            )}
            {activeTab === 'users' && "👥 Mes utilisateurs"}
            {activeTab === 'messages' && "💬 Ma messagerie"}
            {activeTab === 'documents' && "📁 Dossiers utilisateurs"}
            {activeTab === 'settings' && "⚙️ Paramètres"}
          </h2>
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
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-8 h-full custom-scrollbar">
          
          {activeTab === 'overview' && (() => {
            const now = new Date();
            const hour = now.getHours();
            const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
            const totalLeads = leads.length;
            const submitted = leads.filter(l => l.rawLead?.isSubmitted).length;
            const inProgress = leads.filter(l => l.status === 'processing').length;
            const completed = leads.filter(l => l.status === 'completed').length;
            const newLeads = leads.filter(l => l.status === 'new').length;
            const unreadChats = chats.filter(c => c.unreadByAdmin).length;
            const withDocs = leads.filter(l => l.rawLead?.uploads && Object.values(l.rawLead.uploads).some(Boolean)).length;
            const recentLeads = [...leads].slice(0, 5);

            return (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Greeting Banner */}
                <div className="relative bg-gradient-to-r from-emerald-500/10 via-slate-900/60 to-slate-900/60 border border-emerald-500/20 rounded-3xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full transform translate-x-1/4 -translate-y-1/4" />
                  <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-semibold mb-1">
                      {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h2 className="text-3xl font-black text-white mb-2">{greeting} 👋</h2>
                    <p className="text-slate-400 text-sm">
                      Vous avez <span className="text-emerald-400 font-bold">{submitted}</span> dossiers soumis
                      {unreadChats > 0 && <> et <span className="text-amber-400 font-bold">{unreadChats} message{unreadChats > 1 ? 's' : ''}</span> non lu{unreadChats > 1 ? 's' : ''}</>}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('demandes')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                  >
                    Voir les demandes →
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total inscrits', value: totalLeads, icon: '👥', color: 'text-white', border: 'border-white/5', glow: '' },
                    { label: 'Dossiers soumis', value: submitted, icon: '📋', color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500/5' },
                    { label: 'En traitement', value: inProgress, icon: '⚡', color: 'text-amber-400', border: 'border-amber-500/20', glow: 'bg-amber-500/5' },
                    { label: 'Terminés', value: completed, icon: '✅', color: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'bg-indigo-500/5' },
                  ].map((kpi, i) => (
                    <div key={i} className={`${kpi.glow || 'bg-slate-900/60'} border ${kpi.border} p-6 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}>
                      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 text-6xl flex items-end justify-end pr-2 pb-1">{kpi.icon}</div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{kpi.label}</p>
                      <p className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Row : Activité + Messages */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Activité récente */}
                  <div className="lg:col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dernières inscriptions</h3>
                      <button onClick={() => setActiveTab('demandes')} className="text-xs text-emerald-400 font-bold hover:underline">Voir tout →</button>
                    </div>
                    <div className="space-y-3">
                      {recentLeads.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Aucune inscription pour le moment.</p>
                      ) : recentLeads.map(lead => (
                        <div
                          key={lead.uid}
                          onClick={() => openDetail(lead)}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-black text-emerald-400">
                              {(lead.name?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold group-hover:text-emerald-400 transition-colors">{lead.name}</p>
                              <p className="text-slate-500 text-xs">{lead.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lead.rawLead?.isSubmitted && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">✓ Soumis</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                              lead.status === 'new' ? 'text-emerald-400 bg-emerald-500/10' :
                              lead.status === 'processing' ? 'text-amber-400 bg-amber-500/10' :
                              'text-indigo-400 bg-indigo-500/10'
                            }`}>
                              {lead.status === 'new' ? 'Nouveau' : lead.status === 'processing' ? 'En cours' : 'Terminé'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel droit */}
                  <div className="flex flex-col gap-4">

                    {/* Messages non lus */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 backdrop-blur-sm shadow-xl flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Messages</h3>
                        <button onClick={() => setActiveTab('messages')} className="text-xs text-emerald-400 font-bold hover:underline">Ouvrir →</button>
                      </div>
                      {unreadChats === 0 ? (
                        <div className="text-center py-6">
                          <div className="text-3xl mb-2">✉️</div>
                          <p className="text-slate-500 text-xs">Tout est lu !</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {chats.filter(c => c.unreadByAdmin).slice(0, 4).map(chat => (
                            <div
                              key={chat.id}
                              onClick={() => { setActiveTab('messages'); }}
                              className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-black text-amber-400 flex-shrink-0">
                                {(chat.userName?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">{chat.userName || 'Candidat'}</p>
                                <p className="text-slate-400 text-[10px] truncate">{chat.lastMessageText}</p>
                              </div>
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5 animate-pulse" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Docs rapides */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 backdrop-blur-sm shadow-xl">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Documents</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Avec documents</span>
                          <span className="text-sm font-bold text-emerald-400">{withDocs}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: totalLeads > 0 ? `${(withDocs/totalLeads)*100}%` : '0%' }} />
                        </div>
                        <button onClick={() => setActiveTab('documents')} className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white border border-white/5 transition-all">
                          📁 Voir tous les dossiers
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })()}

          {activeTab === 'documents' && <DocumentsUtilisateurs />}

          {activeTab === 'demandes' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Dossiers</p>
                  <p className="text-4xl font-black text-white">{leads.length}</p>
                </div>
                <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Nouveaux</p>
                  <p className="text-4xl font-black text-emerald-400">{leads.filter(l => l.status === 'new').length}</p>
                </div>
                <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">En Cours</p>
                  <p className="text-4xl font-black text-amber-400">{leads.filter(l => l.status === 'processing').length}</p>
                </div>
              </div>

              {/* Table / List */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Service</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {leads.map((lead) => (
                        <tr 
                          key={lead.id} 
                          className="hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                          onClick={() => openDetail(lead)}
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{lead.name}</div>
                            <div className="text-xs font-medium text-slate-500 mt-1">{lead.date}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-300">{lead.email}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-3 py-1.5 inline-flex text-xs font-bold rounded-lg bg-slate-800 text-slate-300 border border-white/10 shadow-sm">
                              {lead.service}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                              lead.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              lead.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {lead.status === 'new' ? 'Nouveau' : lead.status === 'processing' ? 'En Cours' : 'Terminé'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openDetail(lead); }}
                              className="text-xs font-bold text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all mr-2"
                              title="Gérer ce dossier"
                            >
                              ⚙️ Gérer
                            </button>
                            <button 
                              onClick={(e) => handleReset(e, lead)}
                              className="text-xs font-bold text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-emerald-500/20 transition-all mr-2"
                              title="Réinitialiser au statut Nouveau"
                            >
                              🔄 Reset
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, lead)}
                              className="text-xs font-bold text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"
                              title="Supprimer définitivement"
                            >
                              🗑️ Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leads.length === 0 && !loading && (
                        <tr>
                          <td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">
                            Aucune demande pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL PAGE — Full Dossier View */}
          {activeTab === 'detail' && selectedLead && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

              {/* === TOP BANNER === */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/5 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full transform translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      {(selectedLead.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">{selectedLead.name}</h2>
                      <p className="text-sm font-medium text-slate-400 mt-1">ID : <span className="text-emerald-400 font-mono">#{selectedLead.id?.slice(0, 12)}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                      selectedLead.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      selectedLead.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {selectedLead.status === 'new' ? '● Nouveau' : selectedLead.status === 'processing' ? '● En Cours' : '● Terminé'}
                    </span>
                    <button
                      onClick={() => { handleReset({ stopPropagation: () => {} }, selectedLead); }}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
                    >
                      🔄 Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* === INFORMATIONS PERSONNELLES === */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Nom complet', value: selectedLead.name },
                    { label: 'Email', value: selectedLead.email },
                    { label: 'Téléphone', value: selectedLead.phone || 'Non renseigné' },
                    { label: 'Date de naissance', value: selectedLead.rawLead?.birthDate || selectedLead.rawUser?.birthDate || 'Non renseigné' },
                    { label: 'Adresse', value: selectedLead.rawLead?.address || selectedLead.rawUser?.address || 'Non renseigné' },
                    { label: 'Registre National', value: selectedLead.rawLead?.nationalRegister || selectedLead.rawUser?.nationalRegister || 'Non spécifié' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{item.label}</p>
                      <p className="font-bold text-white text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* === DÉTAILS DE LA DEMANDE === */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Détails de la Demande</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Catégorie permis', value: `Permis ${selectedLead.rawLead?.licenseCategory || selectedLead.rawUser?.licenseCategory || 'B'} (${selectedLead.rawLead?.transmission || selectedLead.rawUser?.transmission || 'Manuel'})` },
                    { label: 'Tentatives ratées', value: selectedLead.rawLead?.failedAttempts || '0' },
                    { label: 'Service demandé', value: selectedLead.service || 'Inscription simple' },
                    { label: 'Date d\'inscription', value: selectedLead.date },
                    { label: 'Date de soumission', value: selectedLead.rawLead?.submittedAt ? new Date(selectedLead.rawLead.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Non soumis' },
                    { label: 'Dossier soumis', value: selectedLead.rawLead?.isSubmitted ? '✅ Oui' : '❌ Non' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{item.label}</p>
                      <p className="font-bold text-white text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* === FICHIERS TÉLÉVERSÉS === */}
              {(() => {
                const uploads = selectedLead.rawLead?.uploads || {};
                const DOC_META = {
                  idFront:   { label: "Carte d'Identité Recto", icon: '🪪', color: 'emerald' },
                  idBack:    { label: "Carte d'Identité Verso",  icon: '🪪', color: 'emerald' },
                  photo:     { label: "Photo d'Identité",        icon: '📸', color: 'indigo'  },
                  signature: { label: "Signature Numérisée",     icon: '✍️', color: 'amber'   },
                };
                const allKeys = Object.keys(DOC_META);
                const hasAny = allKeys.some(k => uploads[k]);

                return (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">
                      Fichiers Téléversés
                      <span className="ml-3 text-emerald-400 font-black">
                        {allKeys.filter(k => uploads[k] && uploads[k].startsWith('http')).length}/{allKeys.length}
                      </span>
                    </h3>

                    {/* Lightbox interne */}
                    {previewUrl && (
                      <div
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setPreviewUrl(null)}
                      >
                        <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewUrl(null)}
                            className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-bold"
                          >✕ Fermer</button>
                          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
                            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                              <span className="text-white font-bold text-sm">{previewLabel}</span>
                              <a href={previewUrl} target="_blank" rel="noopener noreferrer" download
                                className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
                                ⬇️ Télécharger
                              </a>
                            </div>
                            {previewUrl.toLowerCase().includes('.pdf') ? (
                              <div className="p-10 text-center">
                                <div className="text-5xl mb-3">📄</div>
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm">
                                  Ouvrir le PDF ↗
                                </a>
                              </div>
                            ) : (
                              <img src={previewUrl} alt={previewLabel} className="w-full max-h-[70vh] object-contain bg-slate-950 p-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grille 2x2 */}
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
                                {/* Thumbnail */}
                                {!url.toLowerCase().includes('.pdf') ? (
                                  <img src={url} alt={meta.label} className="w-full h-28 object-cover" />
                                ) : (
                                  <div className={`w-full h-28 flex flex-col items-center justify-center gap-2 ${c.thumb}`}>
                                    <span className="text-3xl">📄</span>
                                    <span className="text-[10px] font-bold text-slate-400">PDF</span>
                                  </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg">🔍 Voir</span>
                                </div>
                                {/* Badge bas */}
                                <div className={`${c.badge} py-1 text-center`}>
                                  <span className="text-[10px] font-bold">✓ Reçu</span>
                                </div>
                              </button>
                            ) : url ? (
                              /* Ancien format — pas une URL */
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
                );
              })()}

              {/* === FIL DE PRODUCTION & SUIVI CHRONOLOGIQUE DU DOSSIER === */}
              {(() => {
                const hasSelectedPath = !!selectedLead.rawLead?.selectedPath;
                const isBillingActive = !!selectedLead.rawLead?.billingActive;
                const isPaymentValidated = !!selectedLead.rawLead?.paymentValidated;
                const splitDetails = getAdminSplitPaymentDetails(selectedLead.rawLead);
                const isSplit = splitDetails.isSplit;
                const isSoldeValidated = !!selectedLead.rawLead?.soldeValidated;
                const isSoldeInitiated = !!selectedLead.rawLead?.soldeInitiated;
                const hasAttestation = !!selectedLead.rawLead?.attestationUrl;
                const currentStatus = selectedLead.status || 'new';

                const pathName = selectedLead.rawLead?.selectedPath || '';
                const selectedPath = pathName;

                // Determine status and configuration for each phase
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
                    desc: (selectedPath === 'pratique' || selectedPath === 'direct')
                      ? 'Certificat de dispense théorique validé.'
                      : (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
                      ? 'Certificat de dispense théorique validé (payé).'
                      : (selectedPath === 'theorique')
                      ? 'Phase active : nécessite l\'activation de la facturation et la validation des virements.'
                      : 'En attente de la progression ou non incluse.',
                    status: (selectedPath === 'pratique' || selectedPath === 'direct')
                      ? 'done'
                      : (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
                      ? 'done'
                      : (selectedPath === 'theorique' ? 'active' : 'locked'),
                    badge: (selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'theorique' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed')))
                      ? '✓ Dispense'
                      : (selectedPath === 'theorique' ? '● Action requise' : '🔒 Non inclus'),
                  },
                  {
                    num: 3,
                    icon: '👁️',
                    title: selectedPath === 'perception' ? `Phase 3 : Perception du Risque — ${splitDetails.total}` : 'Phase 3 : Perception du Risque',
                    desc: (selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct')
                      ? 'Dispense académique validée — aucun examen requis.'
                      : (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
                      ? 'Dispense académique validée — aucun examen requis (payé).'
                      : 'Phase active : nécessite l\'activation de la facturation et la validation des virements.',
                    status: (selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct')
                      ? 'done'
                      : (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed'))
                      ? 'done'
                      : (selectedPath === 'perception' ? 'active' : 'locked'),
                    badge: (selectedPath === 'theorique' || selectedPath === 'pratique' || selectedPath === 'direct' || (selectedPath === 'perception' && ((isSplit ? isSoldeValidated : isPaymentValidated) || currentStatus === 'completed')))
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

                let activeStep = 2;
                let nextActionLabel = "Sélectionner la formule du candidat";
                let progressPercent = 15;

                if (!hasSelectedPath) {
                  activeStep = 2;
                  nextActionLabel = "Sélectionner la formule du candidat";
                  progressPercent = 15;
                } else if (!isBillingActive) {
                  activeStep = 3;
                  nextActionLabel = "Activer la facturation & le RIB";
                  progressPercent = 35;
                } else if (!isPaymentValidated) {
                  activeStep = 4;
                  nextActionLabel = isSplit ? "Valider le virement d'acompte (200 €)" : `Valider le virement complet (${splitDetails.total})`;
                  progressPercent = 55;
                } else if (isSplit && !isSoldeValidated) {
                  activeStep = 5;
                  nextActionLabel = `Valider le virement du solde (${splitDetails.secondPayment})`;
                  progressPercent = 80;
                } else {
                  activeStep = 6;
                  nextActionLabel = !hasAttestation ? "Uploader le document officiel (PDF)" : `Dossier payé et finalisé (Statut: ${currentStatus === 'completed' ? 'Terminé' : 'En cours'})`;
                  progressPercent = !hasAttestation ? 95 : 100;
                }

                return (
                  <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
                    {/* Header with visual progress bar */}
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
                          <span className="text-brand-orange">{progressPercent}%</span>
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

                    {/* Steps Timeline Container */}
                    <div className="flex flex-col gap-0 relative pl-4 sm:pl-6">
                      
                      {/* Vertical connector line background */}
                      <div className="absolute left-[31px] sm:left-[39px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-800 pointer-events-none" />

                      {/* Render Phases 1 to 5 dynamically */}
                      {phases.map((phase) => {
                        const isDone = phase.status === 'done';
                        const isActive = phase.status === 'active';
                        const isLocked = phase.status === 'locked';

                        return (
                          <div key={phase.num} className="relative flex gap-6 pb-10 transition-all duration-300">
                            {/* Timeline Circle */}
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

                            {/* Step Card Content */}
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

                                {/* Formule Selection or Modification (Only in Phase 2 or when editing) */}
                                {phase.num === 2 && (
                                  <>
                                    {hasSelectedPath && !isEditingPath && (
                                      <button
                                        onClick={() => setIsEditingPath(true)}
                                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-lg text-[10px] font-bold transition-all"
                                      >
                                        ✏️ Modifier la formule
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Path selection buttons */}
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

                              {/* Phase Active controls: Billing activation & validation of Payment/Solde */}
                              {isActive && hasSelectedPath && !isEditingPath && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                                  {/* Sub-step 3.1: Active Billing & RIB */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-slate-900/20 border border-white/5 rounded-xl">
                                    <div>
                                      <h5 className="text-xs font-bold text-slate-300">Action 1 : Lancer la Facturation (Visibilité RIB)</h5>
                                      <p className="text-[10px] text-slate-500">Rendre visible le devis détaillé et le RIB sur le profil du client.</p>
                                    </div>
                                    <button
                                      disabled={updating}
                                      onClick={async () => {
                                        if (!selectedLead) return;
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
                                      className={`w-64 justify-center flex items-center px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border cursor-pointer ${
                                        isBillingActive
                                          ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-emerald-500/30'
                                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                                      }`}
                                    >
                                      {isBillingActive ? '🔴 Désactiver la facture' : '⚡ Activer la facture & RIB'}
                                    </button>
                                  </div>

                                  {/* Sub-step 3.2: Validate Payment (Acompte or Full Payment) */}
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
                                        if (!selectedLead) return;
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

                                          const messagesRef = collection(db, 'chats', selectedLead.uid, 'messages');
                                          const chatDocRef = doc(db, 'chats', selectedLead.uid);
                                          
                                          let textMessage = "";
                                          if (nextVal) {
                                            if (isSplit) {
                                              textMessage = `✅ Votre acompte de 200,00 € pour la formule ${selectedLead.rawLead?.selectedPath === 'perception' ? 'Perception' : selectedLead.rawLead?.selectedPath === 'theorique' ? 'Théorique' : 'Permis Direct'} a été validé ! Votre dossier est maintenant en cours de traitement. 🚀`;
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
                                      className={`w-64 justify-center flex items-center px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 border cursor-pointer ${
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

                                                                    {/* Sub-step 3.3: Validate Solde (If split payments apply) */}
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
                                            ? "⚠️ Validez l'acompte (Action 2) d'abord pour débloquer cette étape."
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
                                            if (!selectedLead) return;
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
                                                const docName = selectedLead.rawLead?.selectedPath === 'perception' ? "attestation de perception" : selectedLead.rawLead?.selectedPath === 'theorique' ? "certificat d'examen théorique" : "certificat d'examen pratique";
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
                                            if (!selectedLead) return;
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

                                              const messagesRef = collection(db, 'chats', selectedLead.uid, 'messages');
                                              const chatDocRef = doc(db, 'chats', selectedLead.uid);
                                              
                                              let responseMessage = "";
                                              if (nextSoldeVal) {
                                                const docName = selectedLead.rawLead?.selectedPath === 'perception' ? "attestation de perception" : selectedLead.rawLead?.selectedPath === 'theorique' ? "certificat d'examen théorique" : "certificat d'examen pratique";
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

                                  {/* Action Finale : Terminer la Phase */}
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
                                      className={`w-64 justify-center flex items-center px-4 py-2 rounded-lg font-black text-xs transition-all duration-300 border cursor-pointer ${
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

                      {/* --- STEP 6: DOCUMENTS & FINALISATION --- */}
                      <div className="relative flex gap-6 transition-all duration-300">
                        {/* Timeline Circle */}
                        <div className="absolute left-[-21px] sm:left-[-29px] top-1 z-10 flex items-center justify-center">
                          {hasAttestation && currentStatus === 'completed' ? (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 border border-emerald-400 text-slate-950 flex items-center justify-center text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                              🏆
                            </div>
                          ) : activeStep === 6 ? (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-500 border border-violet-400 text-white flex items-center justify-center text-xs font-black ring-4 ring-violet-500/20 animate-pulse">
                              6
                            </div>
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center text-xs font-black">
                              6
                            </div>
                          )}
                        </div>

                        {/* Step Card Content */}
                        <div className={`flex-1 bg-slate-950/40 border rounded-2xl p-5 transition-all duration-300 ${activeStep === 6 ? 'border-violet-500/30 bg-violet-500/[0.02] shadow-[0_0_20px_rgba(139,92,246,0.05)]' : 'border-white/5'}`}>
                          <div className="flex flex-col gap-4">
                            <div>
                              <div className="flex items-center gap-2.5 mb-1">
                                <span className="text-xs font-black uppercase tracking-wider text-violet-400">
                                  Phase 6 : Document Officiel & Statut Final
                                </span>
                                {hasAttestation && currentStatus === 'completed' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Dossier Terminé</span>
                                ) : activeStep === 6 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 animate-pulse">👉 Action requise</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-slate-500 border border-white/5">⏳ En attente</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Importez le document officiel (PDF) hébergé pour le candidat et mettez à jour le statut global du dossier si nécessaire.
                              </p>
                            </div>

                            {/* Cloudinary Zone inside card */}
                            <div className="mt-2">
                              <label
                                htmlFor="admin-pdf-upload"
                                className={`relative flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 py-6 px-4
                                  ${attestationUploadStatus === 'uploading'
                                    ? 'border-amber-400/50 bg-amber-500/5 animate-pulse'
                                    : attestationUploadStatus === 'success'
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : attestationUploadStatus === 'error'
                                    ? 'border-red-500/50 bg-red-500/5'
                                    : 'border-white/10 bg-white/[0.02] hover:border-brand-orange/50 hover:bg-brand-orange/[0.03]'
                                  }`}
                              >
                                {attestationUploadStatus === 'uploading' ? (
                                  <>
                                    <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                    <span className="text-xs font-semibold text-amber-400">Upload en cours...</span>
                                    <span className="text-[10px] text-slate-500">{attestationUploadProgress}%</span>
                                  </>
                                ) : attestationUploadStatus === 'success' ? (
                                  <>
                                    <span className="text-2xl">✅</span>
                                    <span className="text-xs font-bold text-emerald-400">PDF officiel disponible</span>
                                    <span className="text-[10px] text-slate-400">Cliquez ou glissez pour remplacer</span>
                                  </>
                                ) : attestationUploadStatus === 'error' ? (
                                  <>
                                    <span className="text-2xl">❌</span>
                                    <span className="text-xs font-bold text-red-400">Échec de l'upload</span>
                                    <span className="text-[10px] text-slate-400">Cliquez pour réessayer</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-2xl">📄</span>
                                    <div className="text-center">
                                      <p className="text-xs font-semibold text-white">Déposez l'attestation ou permis officiel (PDF)</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">ou cliquez pour parcourir</p>
                                    </div>
                                  </>
                                )}
                                <input
                                  id="admin-pdf-upload"
                                  type="file"
                                  accept="application/pdf"
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !selectedLead) return;
                                    if (file.size > 20 * 1024 * 1024) {
                                      alert('Le fichier dépasse 20MB.');
                                      return;
                                    }
                                    setAttestationUploadStatus('uploading');
                                    setAttestationUploadProgress(0);
                                    try {
                                      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('upload_preset', 'monpermis');
                                      formData.append('folder', `monpermis/admin/attestations`);
                                      formData.append('resource_type', 'raw');

                                      const url = await new Promise((resolve, reject) => {
                                        const xhr = new XMLHttpRequest();
                                        xhr.upload.addEventListener('progress', (ev) => {
                                          if (ev.lengthComputable) {
                                            setAttestationUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                                          }
                                        });
                                        xhr.addEventListener('load', () => {
                                          const data = JSON.parse(xhr.responseText);
                                          if (data.secure_url) resolve(data.secure_url);
                                          else reject(new Error('No secure_url'));
                                        });
                                        xhr.addEventListener('error', () => reject(new Error('Network error')));
                                        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
                                        xhr.send(formData);
                                      });

                                      const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                                      await updateDoc(doc(db, 'leads', leadId), { attestationUrl: url });
                                      setAttestationUrlInput(url);
                                      setAttestationUploadStatus('success');
                                    } catch (err) {
                                      console.error('Upload error:', err);
                                      setAttestationUploadStatus('error');
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Url display & manual fallback */}
                            {attestationUrlInput && (
                              <div className="flex items-center gap-3 bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5">
                                <span className="text-emerald-400 text-base">📎</span>
                                <a
                                  href={attestationUrlInput}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate"
                                >
                                  {attestationUrlInput}
                                </a>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Supprimer ce lien ?')) return;
                                    const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                                    await updateDoc(doc(db, 'leads', leadId), { attestationUrl: '' });
                                    setAttestationUrlInput('');
                                    setAttestationUploadStatus('idle');
                                  }}
                                  className="text-red-400 hover:text-red-300 text-base transition-colors"
                                  title="Supprimer"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}

                            <details className="mt-1">
                              <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none">
                                Ou saisir le lien manuellement
                              </summary>
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  placeholder="https://exemple.com/attestation.pdf"
                                  value={attestationUrlInput}
                                  onChange={(e) => setAttestationUrlInput(e.target.value)}
                                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange transition-all"
                                />
                                <button
                                  disabled={updating}
                                  onClick={async () => {
                                    if (!selectedLead) return;
                                    setUpdating(true);
                                    try {
                                      const leadId = selectedLead.rawLead?.id || selectedLead.uid;
                                      await updateDoc(doc(db, 'leads', leadId), { attestationUrl: attestationUrlInput });
                                    } catch (err) {
                                      console.error(err);
                                    }
                                    setUpdating(false);
                                  }}
                                  className="px-3 py-2 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </details>

                            {/* Action Finale : Terminer la Phase (Phase 6) */}
                            {activeStep === 6 && (
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl mt-4">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-300">Action Finale : Clôturer & Valider la Phase</h5>
                                  <p className="text-[10px] text-slate-500">
                                    {selectedLead.status === 'completed'
                                      ? 'La phase est marquée comme terminée.'
                                      : 'Cliquez pour finaliser cette phase et clore définitivement le dossier.'
                                    }
                                  </p>
                                </div>
                                <button
                                  disabled={updating}
                                  onClick={() => handleUpdateStatus(selectedLead.status === 'completed' ? 'processing' : 'completed')}
                                  className={`w-64 justify-center flex items-center px-4 py-2 rounded-lg font-black text-xs transition-all duration-300 border cursor-pointer ${
                                    selectedLead.status === 'completed'
                                      ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                                      : 'bg-indigo-500 hover:bg-indigo-400 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                                  }`}
                                >
                                  {selectedLead.status === 'completed' ? '🔴 Annuler la validation (En Cours)' : '✓ Terminer'}
                                </button>
                              </div>
                            )}

                            {/* Status Indicators - read-only evolution */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
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
                                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex-1 text-center select-none ${
                                      selectedLead.status === st.status
                                        ? st.status === 'new'
                                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/40'
                                          : st.status === 'processing'
                                          ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
                                          : 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)] ring-2 ring-indigo-400/40'
                                        : 'bg-white/5 text-slate-500 border border-white/5 opacity-55'
                                    }`}
                                  >
                                    {st.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

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
          )}

          {activeTab === 'messages' && (
            <div className="flex gap-6 h-[calc(100vh-12rem)] animate-fade-in">
              {/* Left pane: Chats List */}
              <div className="w-1/3 bg-slate-900/60 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden backdrop-blur-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conversations Actives</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {chats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 relative flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white truncate max-w-[150px]">
                            {chat.userName || 'Candidat'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {chat.lastMessageTime ? new Date(chat.lastMessageTime.toDate()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate pr-4">
                          {chat.lastMessageText || 'Pas de message'}
                        </p>
                        {chat.unreadByAdmin && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                  {chats.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Aucune conversation pour le moment.
                    </div>
                  )}
                </div>
              </div>

              {/* Right pane: Active Thread */}
              <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm relative">
                {selectedChatId ? (
                  <>
                    {/* Selected Chat Header */}
                    {(() => {
                      const activeChat = chats.find(c => c.id === selectedChatId);
                      return (
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                          <div>
                            <h4 className="font-bold text-white text-sm">{activeChat?.userName || 'Candidat'}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{activeChat?.userEmail}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {loadingMessages && chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        chatMessages.map((m) => {
                          const isAdvisor = m.sender === 'advisor';
                          return (
                            <div key={m.id} className={`flex ${isAdvisor ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                                isAdvisor
                                  ? 'bg-emerald-500 text-slate-950 rounded-br-none font-medium'
                                  : 'bg-white/10 border border-white/5 text-white/90 rounded-bl-none'
                              }`}>
                                <p>{m.text}</p>
                                <span className={`block text-[9px] text-right mt-1.5 ${isAdvisor ? 'text-slate-950 opacity-60 font-semibold' : 'text-white/40'}`}>
                                  {m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendAdminReply} className="p-4 border-t border-white/5 bg-slate-900/20 flex gap-2">
                      <input
                        type="text"
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        placeholder="Tapez votre réponse en tant que conseiller..."
                        className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                      />
                      <button
                        type="submit"
                        className="px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-transform duration-300 hover:scale-105 cursor-pointer"
                      >
                        Envoyer
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-bold text-white mb-2">Sélectionnez une conversation</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Choisissez un candidat dans la liste de gauche pour lui répondre en temps réel.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-sm shadow-2xl animate-fade-in">
              <h3 className="text-base font-bold uppercase tracking-wider text-emerald-400 mb-6">⚙️ Configuration du Conseiller</h3>
              
              {settingsSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs p-4 rounded-2xl mb-6 flex items-center gap-2">
                  <span>✓</span> Les paramètres ont été enregistrés avec succès.
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom du Conseiller</label>
                  <input
                    required
                    type="text"
                    value={advisorSettings.name}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Jean-Pierre Dumont"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titre / Titre SPF Agréé</label>
                  <input
                    required
                    type="text"
                    value={advisorSettings.title}
                    onChange={(e) => setAdvisorSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Expert Agréé SPF Belgique"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Statut de Connexion</label>
                    <select
                      value={advisorSettings.isOnline}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, isOnline: e.target.value === 'true' }))}
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                    >
                      <option value="true">🟢 En Ligne (répond immédiatement)</option>
                      <option value="false">⚫ Hors-ligne (indiqué comme déconnecté)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Avatar (Emoji)</label>
                    <select
                      value={advisorSettings.avatarEmoji}
                      onChange={(e) => setAdvisorSettings(prev => ({ ...prev, avatarEmoji: e.target.value }))}
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                    >
                      <option value="👨‍💼">👨‍💼 Homme d'affaires</option>
                      <option value="👩‍💼">👩‍💼 Femme d'affaires</option>
                      <option value="🤵">🤵 Costume / Smoking</option>
                      <option value="👨‍💻">👨‍💻 Développeur</option>
                      <option value="👩‍💻">👩‍💻 Développeuse</option>
                      <option value="🧑‍⚖️">🧑‍⚖️ Juge / Officiel</option>
                    </select>
                  </div>
                </div>

                {/* --- CONFIGURATION RIB & MONTANT PAR DÉFAUT --- */}
                <div className="border-t border-white/10 pt-6 mt-6 space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400">💳 Paramètres de Facturation & RIB par défaut</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bénéficiaire du Virement</label>
                      <input
                        type="text"
                        value={advisorSettings.beneficiary || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, beneficiary: e.target.value }))}
                        placeholder="Ex: Mon Permis SRL"
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de la Banque</label>
                      <input
                        type="text"
                        value={advisorSettings.bankName || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Ex: BNP Paribas Fortis"
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Code IBAN</label>
                      <input
                        type="text"
                        value={advisorSettings.iban || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, iban: e.target.value }))}
                        placeholder="Ex: BE96 3630 1234 5678"
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Code BIC/SWIFT</label>
                      <input
                        type="text"
                        value={advisorSettings.bic || ''}
                        onChange={(e) => setAdvisorSettings(prev => ({ ...prev, bic: e.target.value }))}
                        placeholder="Ex: GEBA BEBB"
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* CONFIGURATION PERCEPTION DU RISQUE */}
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">📖 Paramètres Perception du Risque (Phase 2)</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                        <input
                          type="text"
                          value={advisorSettings.perceptionAmount || ''}
                          onChange={(e) => handlePerceptionTotalChange(e.target.value)}
                          placeholder="Ex: 350,00 €"
                          className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Perception Ligne 1 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.perceptionLabel1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionLabel1: e.target.value }))}
                            placeholder="Ex: Frais de timbre fiscal..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.perceptionAmount1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionAmount1: e.target.value }))}
                            placeholder="Ex: 50,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>

                      {/* Perception Ligne 2 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.perceptionLabel2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionLabel2: e.target.value }))}
                            placeholder="Ex: Administration - Dispense..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.perceptionAmount2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, perceptionAmount2: e.target.value }))}
                            placeholder="Ex: 300,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONFIGURATION EXAMEN THEORIQUE */}
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">📚 Paramètres Examen Théorique (Phase 3)</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                        <input
                          type="text"
                          value={advisorSettings.theoriqueAmount || ''}
                          onChange={(e) => handleTheoriqueTotalChange(e.target.value)}
                          placeholder="Ex: 550,00 €"
                          className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Theorique Ligne 1 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.theoriqueLabel1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueLabel1: e.target.value }))}
                            placeholder="Ex: Frais d'inscription..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.theoriqueAmount1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueAmount1: e.target.value }))}
                            placeholder="Ex: 150,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>

                      {/* Theorique Ligne 2 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.theoriqueLabel2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueLabel2: e.target.value }))}
                            placeholder="Ex: Administration - Dispense..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.theoriqueAmount2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, theoriqueAmount2: e.target.value }))}
                            placeholder="Ex: 400,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONFIGURATION EXAMEN PRATIQUE */}
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">🚗 Paramètres Examen Pratique (Phase 4)</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                        <input
                          type="text"
                          value={advisorSettings.pratiqueAmount || ''}
                          onChange={(e) => handlePratiqueTotalChange(e.target.value)}
                          placeholder="Ex: 750,00 €"
                          className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Pratique Ligne 1 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.pratiqueLabel1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueLabel1: e.target.value }))}
                            placeholder="Ex: Frais d'homologation..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.pratiqueAmount1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueAmount1: e.target.value }))}
                            placeholder="Ex: 250,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>

                      {/* Pratique Ligne 2 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.pratiqueLabel2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueLabel2: e.target.value }))}
                            placeholder="Ex: Administration - Dispense..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.pratiqueAmount2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, pratiqueAmount2: e.target.value }))}
                            placeholder="Ex: 500,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONFIGURATION PERMIS DEFINITIF / DIRECT */}
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-orange-400">🏆 Paramètres Permis Définitif / Direct (Phase 5)</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Montant Total TTC</label>
                        <input
                          type="text"
                          value={advisorSettings.directLicenseAmount || ''}
                          onChange={(e) => handleDirectTotalChange(e.target.value)}
                          placeholder="Ex: 1200,00 €"
                          className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Direct Ligne 1 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 1 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.directLabel1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directLabel1: e.target.value }))}
                            placeholder="Ex: Constitution du dossier d'homologation..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.directAmount1 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directAmount1: e.target.value }))}
                            placeholder="Ex: 400,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>

                      {/* Direct Ligne 2 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ligne 2 : Intitulé</label>
                          <input
                            type="text"
                            value={advisorSettings.directLabel2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directLabel2: e.target.value }))}
                            placeholder="Ex: Frais d'édition & timbres fiscaux..."
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Montant</label>
                          <input
                            type="text"
                            value={advisorSettings.directAmount2 || ''}
                            onChange={(e) => setAdvisorSettings(prev => ({ ...prev, directAmount2: e.target.value }))}
                            placeholder="Ex: 800,00 €"
                            className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Enregistrer les Paramètres ➔"
                  )}
                </button>
              </form>
            </div>

            
          )}

          {activeTab === 'users' && (() => {
            const filteredUsers = leads.filter(l => {
              const matchSearch =
                l.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                l.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                (l.phone || '').includes(userSearch);
              const matchFilter =
                userFilter === 'all' ||
                (userFilter === 'submitted' && l.rawLead?.isSubmitted) ||
                (userFilter === 'new' && l.status === 'new') ||
                (userFilter === 'processing' && l.status === 'processing') ||
                (userFilter === 'completed' && l.status === 'completed');
              return matchSearch && matchFilter;
            });

            const statsData = [
              { label: 'Total inscrits', value: leads.length, color: 'text-white', bg: '' },
              { label: 'Dossiers soumis', value: leads.filter(l => l.rawLead?.isSubmitted).length, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
              { label: 'En cours', value: leads.filter(l => l.status === 'processing').length, color: 'text-amber-400', bg: 'bg-amber-500/5' },
              { label: 'Terminés', value: leads.filter(l => l.status === 'completed').length, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
            ];

            return (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statsData.map((s, i) => (
                    <div key={i} className={`${s.bg || 'bg-slate-900/60'} border border-white/5 p-5 rounded-2xl backdrop-blur-sm shadow-xl`}>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{s.label}</p>
                      <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Filtres & Recherche */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email ou téléphone..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'all', label: 'Tous' },
                      { key: 'submitted', label: '📋 Soumis' },
                      { key: 'new', label: '🟢 Nouveaux' },
                      { key: 'processing', label: '🟡 En cours' },
                      { key: 'completed', label: '🟣 Terminés' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setUserFilter(f.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          userFilter === f.key
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Résultats */}
                <div className="text-xs text-slate-500 font-semibold -mb-4">
                  {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
                </div>

                {/* Tableau */}
                <div className="bg-slate-900/80 rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                      <thead className="bg-slate-900">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Utilisateur</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Inscription</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Documents</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-16 text-center text-slate-500 font-medium text-sm">
                              Aucun utilisateur trouvé pour cette recherche.
                            </td>
                          </tr>
                        ) : filteredUsers.map(lead => {
                          const uploads = lead.rawLead?.uploads || {};
                          const docsCount = Object.values(uploads).filter(Boolean).length;
                          const hasLead = !!lead.rawLead;

                          return (
                            <tr
                              key={lead.uid}
                              className="hover:bg-white/5 transition-all duration-200 group cursor-pointer"
                              onClick={() => openDetail(lead)}
                            >
                              {/* Utilisateur */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-400 flex-shrink-0">
                                    {(lead.name?.[0] || '?').toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{lead.name}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{lead.uid?.slice(0, 10)}...</p>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-sm text-slate-300 font-medium">{lead.email}</p>
                                {lead.phone && (
                                  <p className="text-xs text-slate-500 mt-0.5">{lead.phone}</p>
                                )}
                              </td>

                              {/* Date inscription */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-sm text-slate-400 font-medium">{lead.date}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {hasLead ? '📋 Dossier créé' : '👤 Inscription seule'}
                                </p>
                              </td>

                              {/* Documents */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {['idFront','idBack','photo','signature'].map(k => (
                                      <div
                                        key={k}
                                        className={`w-2 h-2 rounded-full ${uploads[k] ? 'bg-emerald-500' : 'bg-white/10'}`}
                                        title={k}
                                      />
                                    ))}
                                  </div>
                                  <span className={`text-xs font-bold ${docsCount >= 4 ? 'text-emerald-400' : docsCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                                    {docsCount}/4
                                  </span>
                                </div>
                              </td>

                              {/* Statut */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  lead.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  lead.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  lead.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-white/5 text-slate-500 border border-white/5'
                                }`}>
                                  {lead.status === 'new' ? '● Nouveau' :
                                   lead.status === 'processing' ? '● En cours' :
                                   lead.status === 'completed' ? '● Terminé' : '● Inconnu'}
                                </span>
                                {lead.rawLead?.isSubmitted && (
                                  <span className="ml-2 text-[10px] text-emerald-400 font-bold">✓ Soumis</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openDetail(lead)}
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all"
                                    title="Ouvrir le dossier"
                                  >
                                    ⚙️ Dossier
                                  </button>
                                  <button
                                    onClick={e => handleDelete(e, lead)}
                                    className="text-xs font-bold text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })()}


        </main>
      </div>

      {/* Light Theme Styles */}
      <style>{`
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

        /* ═══════════════════════════════════════════════════════
           PREMIUM LIGHT THEME — ADMIN DASHBOARD
        ═══════════════════════════════════════════════════════ */
        .light-theme {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* High-contrast overrides for Light Theme — Palette 1 */
        .light-theme .text-white { color: #0F172A !important; }
        .light-theme .text-white\/90 { color: #0F172A !important; }
        .light-theme .text-white\/80 { color: #334155 !important; }
        .light-theme .text-white\/60 { color: #64748B !important; }
        .light-theme .text-white\/50 { color: #64748B !important; }
        .light-theme .text-white\/40 { color: #64748B !important; }
        .light-theme .text-white\/30 { color: #94a3b8 !important; }
        .light-theme .text-slate-300 { color: #334155 !important; }
        .light-theme .text-slate-400,
        .light-theme .text-slate-500 { color: #64748B !important; }
        .light-theme header span,
        .light-theme header div,
        .light-theme header p { color: #0F172A !important; }
        .light-theme main h2,
        .light-theme main h3,
        .light-theme main h4,
        .light-theme main h5,
        .light-theme main p,
        .light-theme main span,
        .light-theme main strong { color: #0F172A !important; }
        .light-theme a,
        .light-theme .text-emerald-400 { color: #1E40AF !important; }

        /* ─── Sidebar ─── */
        .light-theme aside {
          background-color: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
          box-shadow: 2px 0 12px rgba(0,0,0,0.04) !important;
        }
        .light-theme aside h1  { color: #0f172a !important; }
        .light-theme aside p   { color: #64748b !important; }
        .light-theme aside .text-white { color: #0f172a !important; }
        .light-theme aside .text-slate-400,
        .light-theme aside .text-slate-500 { color: #64748b !important; }
        .light-theme aside .border-white\/5 { border-color: #f1f5f9 !important; }
        .light-theme aside .hover\\:bg-white\\/5:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .light-theme aside .hover\\:text-white:hover { color: #0f172a !important; }
        .light-theme aside .text-red-400 { color: #dc2626 !important; }
        .light-theme aside .hover\\:text-white.text-red-400:hover { color: #ffffff !important; }
        .light-theme aside .hover\\:bg-red-500\\/20:hover { background-color: #fee2e2 !important; }
        .light-theme aside .hover\\:border-red-500\\/30:hover { border-color: #fca5a5 !important; }

        /* ─── Header ─── */
        .light-theme header {
          background-color: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06) !important;
        }
        .light-theme header h2   { color: #0f172a !important; }
        .light-theme header span { color: #0f172a !important; }
        .light-theme header button { color: #0f172a !important; }
        .light-theme header .text-slate-400,
        .light-theme header .text-slate-500 { color: #64748b !important; }
        .light-theme header .text-emerald-500 { color: #15803d !important; }
        .light-theme header .border-white\/10,
        .light-theme header .border-white\/5 { border-color: #e2e8f0 !important; }
        .light-theme header .bg-white\/5 { background-color: #f8fafc !important; }
        .light-theme header .hover\\:bg-white\\/10:hover { background-color: #f1f5f9 !important; }
        .light-theme header .bg-emerald-500\/20 {
          background-color: #dcfce7 !important;
          border-color: #86efac !important;
        }

        /* ─── Main Scrollable Area ─── */
        .light-theme main {
          background-color: #f1f5f9 !important;
        }
        .light-theme main h2,
        .light-theme main h3,
        .light-theme main h4,
        .light-theme main h5,
        .light-theme main p,
        .light-theme main span,
        .light-theme main strong,
        .light-theme main label { color: #0f172a !important; }

        /* ─── All Card Backgrounds ─── */
        .light-theme main .bg-slate-900\/60,
        .light-theme main .bg-slate-900\/80,
        .light-theme main .bg-slate-900\/40,
        .light-theme main .bg-slate-900,
        .light-theme main .bg-slate-950\/80,
        .light-theme main .bg-slate-950\/50,
        .light-theme main .bg-slate-950\/30,
        .light-theme main .bg-slate-950,
        .light-theme main .bg-white\/5,
        .light-theme main .bg-white\/\\[0\\.07\\],
        .light-theme main .bg-white\/\\[0\\.08\\] {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03) !important;
        }

        /* ─── All Borders ─── */
        .light-theme main .border-white\/5,
        .light-theme main .border-white\/10,
        .light-theme main .border-white\/15,
        .light-theme main .divide-white\/5 > * {
          border-color: #e2e8f0 !important;
        }

        /* ─── Text Opacity Variants ─── */
        .light-theme main .text-white   { color: #0f172a !important; }
        .light-theme main .text-white\/90 { color: #0f172a !important; }
        .light-theme main .text-white\/80 { color: #1e293b !important; }
        .light-theme main .text-white\/40 { color: #64748b !important; }
        .light-theme main .text-slate-300 { color: #334155 !important; }
        .light-theme main .text-slate-400,
        .light-theme main .text-slate-500 { color: #64748b !important; }

        /* ─── Stats Cards ─── */
        .light-theme main .text-4xl.font-black { color: #0f172a !important; }

        /* ─── Table ─── */
        .light-theme main table th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }
        .light-theme main table tbody tr:hover {
          background-color: #f8fafc !important;
        }
        .light-theme main table td {
          border-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .light-theme main table .text-white { color: #0f172a !important; }
        .light-theme main table .text-slate-300,
        .light-theme main table .text-slate-500 { color: #64748b !important; }
        .light-theme main table tr:hover .text-emerald-400 { color: #15803d !important; }
        .light-theme main table .group-hover\\:text-emerald-400:hover { color: #15803d !important; }

        /* ─── Status Badges ─── */
        .light-theme main .bg-emerald-500\/10 {
          background-color: #dcfce7 !important;
          color: #15803d !important;
          border-color: #86efac !important;
        }
        .light-theme main .text-emerald-400   { color: #15803d !important; }
        .light-theme main .border-emerald-500\/20,
        .light-theme main .border-emerald-500\/30 { border-color: #86efac !important; }
        .light-theme main .bg-amber-500\/10 {
          background-color: #fef9c3 !important;
          color: #b45309 !important;
          border-color: #fde68a !important;
        }
        .light-theme main .text-amber-400   { color: #b45309 !important; }
        .light-theme main .border-amber-500\/20 { border-color: #fde68a !important; }
        .light-theme main .bg-indigo-500\/10 {
          background-color: #e0e7ff !important;
          color: #4338ca !important;
          border-color: #c7d2fe !important;
        }
        .light-theme main .text-indigo-400   { color: #4338ca !important; }
        .light-theme main .border-indigo-500\/20 { border-color: #c7d2fe !important; }

        /* ─── Action Buttons in Table ─── */
        .light-theme main .bg-white\/5:not(table *),
        .light-theme main [class*="hover:bg-white"]:not(table *) {
          background-color: #f1f5f9;
          color: #334155;
        }
        .light-theme main .hover\\:bg-indigo-500\\/10:hover {
          background-color: #e0e7ff !important;
          color: #4338ca !important;
        }
        .light-theme main .hover\\:bg-emerald-500\\/10:hover {
          background-color: #dcfce7 !important;
          color: #15803d !important;
        }
        .light-theme main .hover\\:bg-red-500\\/10:hover {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
        }
        .light-theme main .hover\\:bg-amber-500\\/10:hover {
          background-color: #fef9c3 !important;
          color: #b45309 !important;
        }

        /* ─── Detail / Raw Data area ─── */
        .light-theme main pre {
          background-color: #f8fafc !important;
          color: #334155 !important;
          border-color: #e2e8f0 !important;
        }

        /* ─── Danger Zone ─── */
        .light-theme main .bg-red-500\/5 {
          background-color: #fef2f2 !important;
          border-color: #fecaca !important;
        }
        .light-theme main .text-red-400 { color: #dc2626 !important; }

        /* ─── Status Action Buttons ─── */
        .light-theme main button:disabled {
          opacity: 0.5 !important;
        }

        /* ─── Chat / Messages Tab ─── */
        .light-theme main .bg-emerald-500\/10.border-emerald-500\/30 {
          background-color: #dcfce7 !important;
          border-color: #86efac !important;
        }
        .light-theme main .bg-emerald-500 { background-color: #16a34a !important; }
        .light-theme main .hover\\:bg-emerald-600:hover { background-color: #15803d !important; }

        /* ─── Chat Messages (from client = left) ─── */
        .light-theme main .bg-white\/10.border-white\/5 {
          background-color: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
        }
        .light-theme main .bg-white\/10 p,
        .light-theme main .bg-white\/10 span { color: #334155 !important; }

        /* ─── Form Inputs in Settings ─── */
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
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
        }
        .light-theme main input::placeholder { color: #94a3b8 !important; }

        /* ─── Google AI Pro Card ─── */
        .light-theme main .bg-gradient-to-r {
          background: linear-gradient(135deg, #eff6ff, #fefce8, #f0fdf4) !important;
          background-image: none !important;
          border-color: #bfdbfe !important;
        }
        .light-theme main .bg-gradient-to-r h4   { color: #1e3a8a !important; }
        .light-theme main .bg-gradient-to-r p     { color: #1e40af !important; }
        .light-theme main .bg-gradient-to-r span  { color: #1d4ed8 !important; }
        .light-theme main .bg-gradient-to-r .text-white\/60 { color: #1e40af !important; }
        .light-theme main .bg-gradient-to-r a {
          background-color: #1e3a8a !important;
          color: #ffffff !important;
        }
        .light-theme main .bg-gradient-to-r a:hover { background-color: #1e40af !important; }

        /* ─── Emerald Glow Elements ─── */
        .light-theme main .shadow-\\[0_0_15px_rgba\\(16\\,185\\,129\\,0\\.05\\)\\] {
          box-shadow: 0 2px 12px rgba(16,185,129,0.1) !important;
        }
        .light-theme main .shadow-\\[0_0_20px_rgba\\(16\\,185\\,129\\,0\\.15\\)\\] {
          box-shadow: 0 4px 16px rgba(16,185,129,0.15) !important;
        }

        /* ─── HOVER EFFECTS & CARD HIGHLIGHTS (LIGHT THEME) ─── */
        .light-theme .group:hover [class*="text-white\\/2"] { color: #475569 !important; }
        .light-theme .group:hover [class*="text-white\\/3"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/4"] { color: #334155 !important; }
        .light-theme .group:hover [class*="text-white\\/5"] { color: #1e293b !important; }
        .light-theme .group:hover [class*="text-white\\/6"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/7"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/8"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white\\/9"] { color: #0f172a !important; }
        .light-theme .group:hover [class*="text-white"]    { color: #0f172a !important; }

        .light-theme .group:hover img,
        .light-theme .group:hover svg {
          filter: grayscale(0) !important;
          opacity: 1 !important;
        }

        /* ─── Scrollbar ─── */
        .light-theme .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1 !important; }
        .light-theme .custom-scrollbar::-webkit-scrollbar-track { background: transparent !important; }

        /* ─── Misc dividers ─── */
        .light-theme main .border-b.border-white\/5 { border-bottom-color: #e2e8f0 !important; }
        .light-theme main .border-t.border-white\/5 { border-top-color: #e2e8f0 !important; }
        .light-theme main .divide-y.divide-white\/5 > * + * { border-top-color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
};

export default Dashboard;
