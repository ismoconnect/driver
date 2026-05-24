import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Dashboard = ({ onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadUid, setSelectedLeadUid] = useState(() => localStorage.getItem('adminSelectedLeadUid') || null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'demandes');

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

  // Advisor Settings States
  const [advisorSettings, setAdvisorSettings] = useState({
    name: "Jean-Pierre Dumont",
    title: "Expert Agréé SPF Belgique",
    isOnline: true,
    avatarEmoji: "👨‍💼"
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

  // Listen to advisor settings in real-time
  useEffect(() => {
    const docRef = doc(db, "settings", "advisor");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdvisorSettings(docSnap.data());
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
        avatarEmoji: advisorSettings.avatarEmoji || "👨‍💼"
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

  // Real-time synchronization of leads and users combined
  useEffect(() => {
    setLoading(true);

    const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubLeads = onSnapshot(leadsQuery, (leadsSnap) => {
      const leadsData = leadsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const usersQuery = query(collection(db, "users"));
      const unsubUsers = onSnapshot(usersQuery, (usersSnap) => {
        const usersData = usersSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const combinedLeads = [];

        // Add all leads, enriching with user data if available
        for (const lead of leadsData) {
          const matchingUser = usersData.find(u => u.uid === lead.uid);
          const mergedName = `${lead.firstName || matchingUser?.firstName || ''} ${lead.lastName || matchingUser?.lastName || ''}`.trim() || lead.email;
          combinedLeads.push({
            id: lead.id,
            uid: lead.uid,
            name: mergedName,
            email: lead.email,
            phone: lead.phone || matchingUser?.phone || '',
            service: "Permis Définitif",
            date: new Date(lead.createdAt || lead.submittedAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            status: lead.status || (lead.isSubmitted ? 'processing' : 'new'),
            rawLead: lead,
            rawUser: matchingUser
          });
        }

        // Add users that don't have a lead yet (signed up but no lead doc)
        for (const user of usersData) {
          if (!combinedLeads.find(l => l.uid === user.uid)) {
            const mergedName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            combinedLeads.push({
              id: user.uid,
              uid: user.uid,
              name: mergedName,
              email: user.email,
              phone: user.phone || '',
              service: "Inscription simple",
              date: new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
              status: user.status || 'new',
              rawLead: null,
              rawUser: user
            });
          }
        }

        setLeads(combinedLeads);
        setLoading(false);
      }, (err) => {
        console.error("Error listening to users:", err);
      });

      window.__unsubUsersRealtime = unsubUsers;
    }, (err) => {
      console.error("Error listening to leads:", err);
    });

    return () => {
      unsubLeads();
      if (window.__unsubUsersRealtime) window.__unsubUsersRealtime();
    };
  }, []);

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
      const isSubmittedState = newStatus !== 'new';
      
      if (selectedLead.rawLead && selectedLead.rawLead.id) {
        await updateDoc(doc(db, "leads", selectedLead.rawLead.id), { 
          status: newStatus,
          isSubmitted: isSubmittedState
        });
      }
      if (selectedLead.rawUser && selectedLead.rawUser.uid) {
        await updateDoc(doc(db, "users", selectedLead.rawUser.uid), { 
          status: newStatus,
          isSubmitted: isSubmittedState
        });
      }
    } catch (err) {
      console.error(err);
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
        if (leadToReset.rawLead && leadToReset.rawLead.id) {
          await updateDoc(doc(db, "leads", leadToReset.rawLead.id), { 
            status: "new",
            isSubmitted: false
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
          
          <nav className="mt-8 px-4 space-y-2">
            <button 
              onClick={() => setActiveTab('demandes')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'demandes' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">📂</span> 
              Dossiers & Demandes
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
              Utilisateurs
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
              Messagerie
              {chats.some(c => c.unreadByAdmin) && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
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
            {activeTab === 'demandes' && "Dossiers & Demandes"}
            {activeTab === 'detail' && selectedLead && (
              <span className="flex items-center gap-3">
                <button onClick={closeDetail} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  ←
                </button>
                Dossier de {selectedLead.name}
              </span>
            )}
            {activeTab === 'users' && "Gestion des Utilisateurs"}
            {activeTab === 'messages' && "Messagerie Centrale"}
            {activeTab === 'settings' && "Paramètres du Conseiller"}
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
                    { label: 'Catégorie permis', value: `Permis B (${selectedLead.rawLead?.transmission || selectedLead.rawUser?.transmission || 'Manuel'})` },
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
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Fichiers Téléversés</h3>
                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                  {(() => {
                    const uploads = selectedLead.rawLead?.uploads;
                    const documents = selectedLead.rawUser?.documents;
                    const hasUploads = uploads && Object.values(uploads).some(v => v);
                    const hasDocs = documents && Object.keys(documents).length > 0;

                    if (!hasUploads && !hasDocs) {
                      return (
                        <div className="text-center py-10">
                          <div className="text-4xl mb-3">📭</div>
                          <p className="text-slate-500 font-medium text-sm">Aucun fichier téléversé pour le moment.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {hasUploads && Object.entries(uploads).filter(([,v]) => v).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">📄</div>
                              <div>
                                <p className="text-white font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{typeof val === 'string' ? val : 'Fichier téléversé'}</p>
                              </div>
                            </div>
                            <span className="text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-lg text-xs font-bold">Téléversé ✓</span>
                          </div>
                        ))}
                        {hasDocs && Object.entries(documents).map(([key, url]) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">📎</div>
                              <div>
                                <p className="text-white font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-slate-500 text-xs mt-0.5">Document stocké</p>
                              </div>
                            </div>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-colors">
                              Ouvrir ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* === DONNÉES BRUTES FIRESTORE === */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Données Brutes Firestore</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">Collection: leads</p>
                    {selectedLead.rawLead ? (
                      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        {JSON.stringify(selectedLead.rawLead, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-slate-500 text-sm">Aucun document dans la collection leads.</p>
                    )}
                  </div>
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Collection: users</p>
                    {selectedLead.rawUser ? (
                      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        {JSON.stringify(selectedLead.rawUser, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-slate-500 text-sm">Aucun document dans la collection users.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* === ACTIONS SUR LE STATUT === */}
              <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 ml-1">Mettre à jour le statut</h3>
                <div className="flex flex-wrap gap-4">
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus('new')}
                    className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex-1 min-w-[140px] ${
                      selectedLead.status === 'new' 
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    🟢 Nouveau
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus('processing')}
                    className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex-1 min-w-[140px] ${
                      selectedLead.status === 'processing' 
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    🟡 En Cours
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdateStatus('completed')}
                    className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex-1 min-w-[140px] ${
                      selectedLead.status === 'completed' 
                        ? 'bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.3)] ring-2 ring-indigo-400/50' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    🟣 Terminé
                  </button>
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

          {activeTab === 'users' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-xl font-bold text-white mb-2">Module en développement</h3>
                <p className="text-slate-500 text-sm">Cette section sera bientôt disponible.</p>
              </div>
            </div>
          )}

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
