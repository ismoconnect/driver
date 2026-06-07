import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const AdminAIBV = () => {
  const [subTab, setSubTab] = useState('send'); // 'send' | 'config' | 'logs'
  const [leads, setLeads] = useState([]);
  
  // SMTP Config State
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '465',
    user: '',
    pass: '',
    fromName: 'AIBV Service'
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Email Composer State
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { success: boolean, message: string }

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load SMTP Config
  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'aibv_smtp'));
        if (docSnap.exists()) {
          setSmtpConfig(docSnap.data());
        }
      } catch (err) {
        console.error("Erreur chargement SMTP AIBV:", err);
      }
    };
    fetchSmtpConfig();
  }, []);

  // Fetch Leads for recipient picker
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const leadsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            leadsData.push({ id: doc.id, name: data.name, email: data.email });
          }
        });
        setLeads(leadsData);
      } catch (err) {
        console.error("Erreur chargement leads:", err);
      }
    };
    if (subTab === 'send') {
      fetchLeads();
    }
  }, [subTab]);

  // Fetch Logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const q = query(collection(db, 'aibv_emails_logs'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const logsData = [];
      querySnapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
    } catch (err) {
      console.error("Erreur chargement logs AIBV:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'logs') {
      fetchLogs();
    }
  }, [subTab]);

  // Save SMTP Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'aibv_smtp'), smtpConfig);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde de la configuration SMTP.");
    } finally {
      setConfigLoading(false);
    }
  };

  // Lead selection handler
  const handleSelectLead = (leadId) => {
    setSelectedLeadId(leadId);
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setEmailForm(prev => ({ ...prev, to: lead.email }));
      }
    } else {
      setEmailForm(prev => ({ ...prev, to: '' }));
    }
  };

  // Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      alert("Veuillez d'abord configurer vos paramètres SMTP AIBV.");
      setSubTab('config');
      return;
    }

    setSending(true);
    setSendResult(null);

    // Dynamic HTML Wrapper
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #eeeeee; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0;">${smtpConfig.fromName || 'Service AIBV'}</h2>
        </div>
        <div style="font-size: 14px;">
          ${emailForm.body.replace(/\n/g, '<br />')}
        </div>
        <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 11px; color: #888888;">
          Ce message a été envoyé par le service professionnel indépendant AIBV.
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://www.permisdeconduirebe.com/api/send-email-aibv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailForm.to,
          subject: emailForm.subject,
          html: htmlContent,
          smtpConfig
        })
      });

      const data = await response.json();
      
      const logStatus = data.success ? 'Success' : 'Failed';
      const logErr = data.success ? '' : (data.details || data.error || 'Erreur inconnue');

      // Save to logs
      await addDoc(collection(db, 'aibv_emails_logs'), {
        to: emailForm.to,
        subject: emailForm.subject,
        timestamp: serverTimestamp(),
        status: logStatus,
        error: logErr
      });

      if (data.success) {
        setSendResult({ success: true, message: "E-mail professionnel envoyé avec succès !" });
        setEmailForm({ to: '', subject: '', body: '' });
        setSelectedLeadId('');
      } else {
        setSendResult({ success: false, message: `Échec : ${data.error || 'Erreur SMTP'}` });
      }
    } catch (err) {
      console.error(err);
      setSendResult({ success: false, message: `Erreur de connexion : ${err.message}` });
      
      // Log failure even if fetch fails
      try {
        await addDoc(collection(db, 'aibv_emails_logs'), {
          to: emailForm.to,
          subject: emailForm.subject,
          timestamp: serverTimestamp(),
          status: 'Failed',
          error: err.message
        });
      } catch (logErr) {
        console.error(logErr);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-950/60 border border-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setSubTab('send')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            subTab === 'send'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📧 Envoyer un E-mail
        </button>
        <button
          onClick={() => setSubTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            subTab === 'config'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ⚙️ Config SMTP AIBV
        </button>
        <button
          onClick={() => setSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            subTab === 'logs'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📜 Historique des envois
        </button>
      </div>

      {/* SEND EMAIL TAB */}
      {subTab === 'send' && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <span className="text-xl">✉️</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Nouveau Message Professionnel (AIBV)</h4>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-5">
            {sendResult && (
              <div className={`p-4 rounded-xl text-sm font-medium border ${
                sendResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {sendResult.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Recipient Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sélectionner un Candidat (Optionnel)</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Destinataire (E-mail)</label>
                <input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="Ex: destinataire@gmail.com"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Objet du mail</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ex: Confirmation de votre dossier partenaire AIBV"
                className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Corps du message (Texte libre)</label>
              <textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Écrivez votre message ici..."
                rows={8}
                className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white resize-y font-sans"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <span>🚀 Envoyer l'E-mail</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SMTP CONFIG TAB */}
      {subTab === 'config' && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <span className="text-xl">⚙️</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Configuration SMTP Serveur AIBV</h4>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            {configSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                Configuration SMTP AIBV enregistrée avec succès !
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* SMTP Host */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hôte SMTP</label>
                <input
                  type="text"
                  value={smtpConfig.host || ''}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="Ex: mail.aibv.com ou cp5.obambu.com"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>

              {/* SMTP Port */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Port SMTP</label>
                <input
                  type="text"
                  value={smtpConfig.port || '465'}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: e.target.value }))}
                  placeholder="Ex: 465 (SSL) ou 587 (TLS)"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* SMTP User */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Utilisateur (E-mail)</label>
                <input
                  type="text"
                  value={smtpConfig.user || ''}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                  placeholder="Ex: contact@aibv.com"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>

              {/* SMTP Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe SMTP</label>
                <input
                  type="password"
                  value={smtpConfig.pass || ''}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="Mot de passe du compte mail"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de l'expéditeur affiché</label>
              <input
                type="text"
                value={smtpConfig.fromName || 'AIBV Service'}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="Ex: Service AIBV"
                className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={configLoading}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                {configLoading ? "Sauvegarde..." : "💾 Sauvegarder la configuration"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SENT LOGS TAB */}
      {subTab === 'logs' && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <span className="text-xl">📜</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Historique des messages envoyés via AIBV</h4>
          </div>

          {logsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Aucun e-mail envoyé pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Destinataire</th>
                    <th className="py-3 px-4">Objet</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Détails/Erreur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">{log.to}</td>
                      <td className="py-3 px-4 font-semibold">{log.subject}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'En cours...'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'Success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.status === 'Success' ? 'Réussi' : 'Échec'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={log.error}>
                        {log.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAIBV;
