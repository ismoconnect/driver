import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Dashboard = ({ onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('demandes');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Fetch leads
      const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Merge data: users that have leads, and users that just signed up
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
          service: "Permis Définitif", // Fixed or from lead if added later
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
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSignOut = () => {
    signOut(auth).then(() => onLogout());
  };

  const openDetail = (lead) => {
    setSelectedLead(lead);
    setActiveTab('detail');
  };

  const closeDetail = () => {
    setSelectedLead(null);
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
      setLeads(leads.map(l => l.uid === selectedLead.uid ? { ...l, status: newStatus } : l));
      setSelectedLead({ ...selectedLead, status: newStatus });
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
        setLeads(leads.filter(l => l.uid !== leadToDelete.uid));
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
        setLeads(leads.map(l => l.uid === leadToReset.uid ? { ...l, status: "new" } : l));
      } catch (err) {
        console.error(err);
      }
      setUpdating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
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
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'messages' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">💬</span> 
              Messagerie
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
          </h2>
          <div className="flex items-center gap-4">
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

          {activeTab !== 'demandes' && activeTab !== 'detail' && (
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
    </div>
  );
};

export default Dashboard;
