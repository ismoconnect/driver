import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const AdminAIBV = ({ leads = [] }) => {
  const [subTab, setSubTab] = useState('send'); // 'send' | 'config' | 'logs'
  const [showPassword, setShowPassword] = useState(false);

  // SMTP Config State
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '465',
    user: '',
    pass: '',
    fromName: 'AIBV Service',
    headerBgColor: '#0f172a',
    accentColor: '#3b82f6',
    headerTextColor: '#ffffff',
    footerTitle: 'SERVICE PROFESSIONNEL INDÉPENDANT AIBV',
    footerContent: "Ce courriel et ses pièces jointes sont confidentiels et établis à l'attention exclusive de ses destinataires."
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
  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await setDoc(doc(db, 'settings', 'aibv_email_template'), {
        subject: emailForm.subject,
        body: emailForm.body
      });
      alert("Modèle d'e-mail sauvegardé avec succès !");
    } catch (err) {
      console.error("Erreur sauvegarde modèle:", err);
      alert("Erreur lors de la sauvegarde du modèle.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'aibv_email_template'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEmailForm(prev => ({
          ...prev,
          subject: data.subject || '',
          body: data.body || ''
        }));
      }
    } catch (err) {
      console.error("Erreur chargement modèle:", err);
    }
  };

  // Load Saved Email Template on Mount
  useEffect(() => {
    if (subTab === 'send') {
      handleLoadTemplate();
    }
  }, [subTab]);

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null); // { subject, html } or null

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
    if (leadId && leadId !== 'other') {
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

    const formattedBody = emailForm.body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

    // Dynamic HTML Wrapper
    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${smtpConfig.headerBgColor || '#0f172a'}; padding: 28px 24px; text-align: center; border-bottom: 3px solid ${smtpConfig.accentColor || '#3b82f6'};">
            <span style="color: ${smtpConfig.headerTextColor || '#ffffff'}; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
              ${smtpConfig.fromName || 'AIBV SERVICE'}
            </span>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px; min-height: 200px; font-size: 15px; color: #334155;">
            ${formattedBody}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">${smtpConfig.footerTitle || 'SERVICE PROFESSIONNEL INDÉPENDANT AIBV'}</p>
            <p style="margin: 0; line-height: 1.5;">${smtpConfig.footerContent || "Ce courriel et ses pièces jointes sont confidentiels et établis à l'attention exclusive de ses destinataires."}</p>
          </div>
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

  const handleShowPreview = () => {
    if (!emailForm.subject || !emailForm.body) {
      alert("Veuillez d'abord saisir un objet et un message.");
      return;
    }
    const formattedBody = emailForm.body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${smtpConfig.headerBgColor || '#0f172a'}; padding: 28px 24px; text-align: center; border-bottom: 3px solid ${smtpConfig.accentColor || '#3b82f6'};">
            <span style="color: ${smtpConfig.headerTextColor || '#ffffff'}; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
              ${smtpConfig.fromName || 'AIBV SERVICE'}
            </span>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px; min-height: 200px; font-size: 15px; color: #334155;">
            ${formattedBody}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">${smtpConfig.footerTitle || 'SERVICE PROFESSIONNEL INDÉPENDANT AIBV'}</p>
            <p style="margin: 0; line-height: 1.5;">${smtpConfig.footerContent || "Ce courriel et ses pièces jointes sont confidentiels et établis à l'attention exclusive de ses destinataires."}</p>
          </div>
        </div>
      </div>
    `;
    setPreviewEmail({
      subject: emailForm.subject,
      html: htmlContent
    });
  };

  return (
    <>
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
                  {leads.filter(l => l.email).map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                  <option value="other">Autre (Saisie manuelle)</option>
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

            <div className="flex justify-end gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleLoadTemplate}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span>📂 Charger le modèle</span>
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span>{savingTemplate ? "Sauvegarde..." : "💾 Enregistrer le modèle"}</span>
              </button>
              <button
                type="button"
                onClick={handleShowPreview}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span>👁️ Aperçu HTML</span>
              </button>
              <button
                type="submit"
                disabled={sending}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)] cursor-pointer text-xs sm:text-sm"
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpConfig.pass || ''}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                    placeholder="Mot de passe du compte mail"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none transition-colors text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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

            {/* Color Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Couleur de fond En-tête</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={smtpConfig.headerBgColor || '#0f172a'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, headerBgColor: e.target.value }))}
                    className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={smtpConfig.headerBgColor || '#0f172a'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, headerBgColor: e.target.value }))}
                    className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-colors text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Couleur du texte En-tête</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={smtpConfig.headerTextColor || '#ffffff'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, headerTextColor: e.target.value }))}
                    className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={smtpConfig.headerTextColor || '#ffffff'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, headerTextColor: e.target.value }))}
                    className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-colors text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Couleur d'accentuation (Ligne)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={smtpConfig.accentColor || '#3b82f6'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-12 h-10 bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={smtpConfig.accentColor || '#3b82f6'}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-colors text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Footer Customization */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titre du pied de page (Footer)</label>
                <input
                  type="text"
                  value={smtpConfig.footerTitle || ''}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, footerTitle: e.target.value }))}
                  placeholder="Ex: SERVICE PROFESSIONNEL INDÉPENDANT AIBV"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contenu du pied de page (Footer)</label>
                <textarea
                  value={smtpConfig.footerContent || ''}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, footerContent: e.target.value }))}
                  placeholder="Ex: Ce courriel et ses pièces jointes sont confidentiels..."
                  rows={3}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white resize-y"
                />
              </div>
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

      {/* PREVIEW EMAIL MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Aperçu du mail (Service AIBV)</span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">Sujet : {previewEmail.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center font-bold text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body / Iframe Content */}
            <div className="flex-1 bg-white overflow-hidden p-2">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.html}
                className="w-full h-full border-0 min-h-[480px]"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAIBV;
