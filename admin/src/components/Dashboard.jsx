import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sendNewMessageNotification } from '../utils/notifications';
import DocumentsUtilisateurs from './DocumentsUtilisateurs';

// Modular Components
import AdminOverview from './AdminOverview';
import AdminDemandes from './AdminDemandes';
import AdminUsers from './AdminUsers';
import AdminMessages from './AdminMessages';
import AdminSettings from './AdminSettings';
import AdminLeadDetail from './AdminLeadDetail';
import AdminAIBV from './AdminAIBV';
import AdminManagement from './AdminManagement';

const Dashboard = ({ onLogout, initialTab }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedLeadUid, setSelectedLeadUid] = useState(() => localStorage.getItem('adminSelectedLeadUid') || null);
  const [updating, setUpdating] = useState(false);
  const [attestationUrlInput, setAttestationUrlInput] = useState('');
  const [attestationUploadStatus, setAttestationUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [attestationUploadProgress, setAttestationUploadProgress] = useState(0);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'danger'
  });

  const triggerConfirm = (title, message, onConfirm, variant = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: variant === 'danger' ? 'Supprimer' : 'Réinitialiser',
      cancelText: 'Annuler',
      variant
    });
  };

  // Set activeTab state, syncing with initialTab or fallback
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    return localStorage.getItem('adminActiveTab') || 'overview';
  });

  // Sync state if initialTab changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Navigate to /dashboard/:tab when activeTab updates
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    navigate(`/dashboard/${activeTab}`);
  }, [activeTab, navigate]);

  useEffect(() => {
    setIsEditingPath(false);
  }, [selectedLeadUid]);

  // Admin Theme State (light / dark mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  // Fetch current admin user role with automatic bootstrap if no super_admin exists
  useEffect(() => {
    let unsubAdminsList = () => {};
    const user = auth.currentUser;
    if (user) {
      unsubAdminsList = onSnapshot(collection(db, 'admins'), (snap) => {
        const adminsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const hasSuperAdmin = adminsList.some(a => a.role === 'super_admin');
        const userDoc = adminsList.find(a => a.id === user.uid);
        
        if (!hasSuperAdmin) {
          // Si aucun super_admin n'existe encore en base, on donne temporairement les droits pour éviter le blocage
          setCurrentUserRole('super_admin');
        } else if (userDoc) {
          setCurrentUserRole(userDoc.role || 'admin');
        } else {
          setCurrentUserRole('admin');
        }
      }, (err) => {
        console.error("Error fetching admins list for role:", err);
        setCurrentUserRole('admin');
      });
    } else {
      setCurrentUserRole(null);
    }
    return () => unsubAdminsList();
  }, []);

  // Redirect if non-super_admin tries to access manage_admins
  useEffect(() => {
    if (currentUserRole && currentUserRole !== 'super_admin' && activeTab === 'manage_admins') {
      setActiveTab('overview');
    }
  }, [currentUserRole, activeTab]);

  // Derive selectedLead from leads array using stored UID
  const selectedLead = leads.find(l => l.uid === selectedLeadUid) || null;

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
    contactEmail: "contact@permisdeconduirebe.com",
    contactPhone: "+32 466 90 22 99",
    contactWhatsapp: "32466902299",
    logoUrl: "/logo.png",
    heroImageUrl: "/smiling_driver.png",
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
    directAmount2: "800,00 €",
    
    // Default Email Templates Configuration
    emailWelcomeSubject: "🚀 Bienvenue sur Mon Permis - Compte Candidat Activé",
    emailWelcomeBody: "Votre compte candidat a été créé avec succès sur notre plateforme **Mon Permis Belgique**.\n\nVous êtes maintenant connecté à votre conseiller attitré. Vous pouvez accéder à votre espace en ligne sécurisé pour suivre l'avancement de votre dossier à tout moment.",
    emailPaymentSubject: "✅ Votre paiement a été validé - Mon Permis",
    emailPaymentBody: "Nous avons le plaisir de vous informer que votre règlement de **{amount}** pour la **{formulaName}** a été validé avec succès par nos conseillers.\n\nVotre dossier est en cours de traitement réglementaire. Vous pouvez consulter l'état d'avancement détaillé en vous connectant à votre espace candidat.",
    emailMessageSubject: "💬 Nouveau message de {senderName} - Mon Permis",
    emailMessageBody: "Vous avez reçu un nouveau message de la part de **{senderName}** dans votre espace d'échange sécurisé :",
    
    // New step email templates
    emailFormulaSelectedSubject: "📋 Votre inscription est bien reçue - Mon Permis",
    emailFormulaSelectedBody: "Nous avons bien reçu votre dossier d'inscription pour la **{formulaName}** d'un montant de **{amount}**.\n\nNos équipes procèdent actuellement à la vérification de vos documents d'identité pour démarrer la constitution officielle de votre dossier auprès des services agréés.",
    emailSoldeInitiatedSubject: "⚡ Votre document est prêt & Appel de solde - Mon Permis",
    emailSoldeInitiatedBody: "Félicitations, l'attestation ou le certificat lié à votre phase pour la **{formulaName}** est maintenant prêt.\n\nVous pouvez dès à présent régler le solde restant de **{amount}** par virement bancaire pour finaliser et clore votre dossier."
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Chat / Messages States
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(() => localStorage.getItem('adminSelectedChatId') || null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatUploading, setChatUploading] = useState(false);
  const [selectedChatFile, setSelectedChatFile] = useState(null);
  const [chatFilePreview, setChatFilePreview] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const executeDeleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, "chats", selectedChatId, "messages", messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleDownloadFile = async (url, filename = 'document') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const lowerUrl = url.toLowerCase();
      const isPdf = lowerUrl.includes('.pdf') || blob.type === 'application/pdf';
      
      let cleanExt = 'bin';
      let baseName = 'mon-permis-document';
      
      if (isPdf) {
        cleanExt = 'pdf';
        baseName = 'mon-permis-document';
      } else if (blob.type.startsWith('image/')) {
        const ext = blob.type.split('/')[1] || 'bin';
        cleanExt = ext === 'jpeg' ? 'jpg' : ext;
        baseName = 'mon-permis-image';
      } else {
        const ext = blob.type.split('/')[1] || 'bin';
        cleanExt = ext;
      }
      
      const finalFilename = `${baseName}.${cleanExt}`;

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      window.open(url, '_blank');
    }
  };

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
        contactEmail: advisorSettings.contactEmail || "contact@permisdeconduirebe.com",
        contactPhone: advisorSettings.contactPhone || "+32 466 90 22 99",
        contactWhatsapp: advisorSettings.contactWhatsapp || "32466902299",
        logoUrl: advisorSettings.logoUrl || "/logo.png",
        heroImageUrl: advisorSettings.heroImageUrl || "/smiling_driver.png",
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
        directAmount2: advisorSettings.directAmount2 || "800,00 €",

        // Save Email template configurations
        emailWelcomeSubject: advisorSettings.emailWelcomeSubject || "🚀 Bienvenue sur Mon Permis - Compte Candidat Activé",
        emailWelcomeBody: advisorSettings.emailWelcomeBody || "Votre compte candidat a été créé avec succès sur notre plateforme **Mon Permis Belgique**.\n\nVous êtes maintenant connecté à votre conseiller attitré. Vous pouvez accéder à votre espace en ligne sécurisé pour suivre l'avancement de votre dossier à tout moment.",
        emailPaymentSubject: advisorSettings.emailPaymentSubject || "✅ Votre paiement a été validé - Mon Permis",
        emailPaymentBody: advisorSettings.emailPaymentBody || "Nous avons le plaisir de vous informer que votre règlement de **{amount}** pour la **{formulaName}** a été validé avec succès par nos conseillers.\n\nVotre dossier est en cours de traitement réglementaire. Vous pouvez consulter l'état d'avancement détaillé en vous connectant à votre espace candidat.",
        emailMessageSubject: advisorSettings.emailMessageSubject || "💬 Nouveau message de {senderName} - Mon Permis",
        emailMessageBody: advisorSettings.emailMessageBody || "Vous avez reçu un nouveau message de la part de **{senderName}** dans votre espace d'échange sécurisé :",
        
        emailFormulaSelectedSubject: advisorSettings.emailFormulaSelectedSubject || "📋 Votre inscription est bien reçue - Mon Permis",
        emailFormulaSelectedBody: advisorSettings.emailFormulaSelectedBody || "Nous avons bien reçu votre dossier d'inscription pour la **{formulaName}** d'un montant de **{amount}**.\n\nNos équipes procèdent actuellement à la vérification de vos documents d'identité pour démarrer la constitution officielle de votre dossier auprès des services agréés.",
        emailSoldeInitiatedSubject: advisorSettings.emailSoldeInitiatedSubject || "⚡ Votre document est prêt & Appel de solde - Mon Permis",
        emailSoldeInitiatedBody: advisorSettings.emailSoldeInitiatedBody || "Félicitations, l'attestation ou le certificat lié à votre phase pour la **{formulaName}** est maintenant prêt.\n\nVous pouvez dès à présent régler le solde restant de **{amount}** par virement bancaire pour finaliser et clore votre dossier."
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
    if (!adminChatInput.trim() && !selectedChatFile || !selectedChatId) return;

    const messageText = adminChatInput;
    const fileToSend = selectedChatFile;

    // Clear inputs immediately for fast response
    setAdminChatInput('');
    setSelectedChatFile(null);
    if (chatFilePreview?.url) {
      URL.revokeObjectURL(chatFilePreview.url);
    }
    setChatFilePreview(null);

    setChatUploading(true);

    try {
      const msgsRef = collection(db, "chats", selectedChatId, "messages");
      const chatDocRef = doc(db, "chats", selectedChatId);

      // 1. Send file if selected
      if (fileToSend) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const formDataPayload = new FormData();
        formDataPayload.append('file', fileToSend);
        formDataPayload.append('upload_preset', 'monpermis');
        formDataPayload.append('folder', `monpermis/chats/${selectedChatId}`);

        const resourceType = (fileToSend.type.startsWith('image/') || fileToSend.type === 'application/pdf') ? 'image' : 'raw';
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

        // Add file message
        await addDoc(msgsRef, {
          sender: 'advisor',
          text: fileUrl,
          timestamp: serverTimestamp()
        });

        // Update chat metadata
        await updateDoc(chatDocRef, {
          lastMessageText: fileToSend.type.startsWith('image/') ? "📷 Photo envoyée" : "📄 Document envoyé",
          lastMessageTime: serverTimestamp(),
          unreadByClient: true,
          unreadByAdmin: false
        });
      }

      // 2. Send text message if any
      if (messageText.trim()) {
        await addDoc(msgsRef, {
          sender: 'advisor',
          text: messageText,
          timestamp: serverTimestamp()
        });

        await updateDoc(chatDocRef, {
          lastMessageText: messageText,
          lastMessageTime: serverTimestamp(),
          unreadByClient: true,
          unreadByAdmin: false
        });
      }

      // Check if user is active, send email if offline
      try {
        const chatSnap = await getDoc(chatDocRef);
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          if (!chatData.clientActive) {
            const studentEmail = chatData.userEmail;
            const studentName = chatData.userName || 'Candidat';
            const advisorName = advisorSettings?.name || 'Votre conseiller';
            const displayMsg = messageText.trim() || (fileToSend ? (fileToSend.type.startsWith('image/') ? "📷 Photo envoyée" : "📄 Document envoyé") : "");
            if (studentEmail && displayMsg) {
              sendNewMessageNotification(studentEmail, studentName, advisorName, displayMsg, advisorSettings).catch(e => console.error(e));
            }
          }
        }
      } catch (presErr) {
        console.error("Failed to send offline email notification:", presErr);
      }
    } catch (err) {
      console.error("Error sending admin reply:", err);
      alert("Échec de l'envoi du message.");
    } finally {
      setChatUploading(false);
    }
  };

  const handleAdminChatFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Le fichier dépasse 20 Mo.");
      return;
    }

    setSelectedChatFile(file);
    setChatFilePreview({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    });
    e.target.value = "";
  };

  // ─── Synchronisation temps réel : deux listeners parallèles ───────────────
  const leadsDataRef  = useRef([]);
  const usersDataRef  = useRef([]);
  const adminsDataRef = useRef([]);

  const mergeAndSet = () => {
    const leadsData = leadsDataRef.current;
    const usersData = usersDataRef.current;
    const adminsData = adminsDataRef.current;
    const adminUids = new Set(adminsData.map(a => a.uid || a.id));

    // Map pour accès rapide par UID
    const usersMap = Object.fromEntries(usersData.map(u => [u.uid || u.id, u]));
    const combined = [];

    // 1. Tous les documents leads, enrichis avec la collection users
    for (const lead of leadsData) {
      const uid = lead.uid || lead.id;
      if (adminUids.has(uid)) continue;
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

    // 2. Utilisateurs sans document leads
    for (const user of usersData) {
      const uid = user.uid || user.id;
      if (adminUids.has(uid)) continue;
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

    // Listener 2 — collection users
    const unsubUsers = onSnapshot(
      query(collection(db, 'users')),
      (snap) => {
        usersDataRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      },
      (err) => console.error('users listener error:', err)
    );

    // Listener 3 — collection admins
    const unsubAdmins = onSnapshot(
      query(collection(db, 'admins')),
      (snap) => {
        adminsDataRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      },
      (err) => console.error('admins listener error:', err)
    );

    return () => {
      unsubLeads();
      unsubUsers();
      unsubAdmins();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    triggerConfirm(
      "Supprimer définitivement",
      "Êtes-vous sûr de vouloir supprimer définitivement ce dossier et toutes ses données ?",
      async () => {
        setUpdating(true);
        try {
          if (leadToDelete.rawLead && leadToDelete.rawLead.id) {
            await deleteDoc(doc(db, "leads", leadToDelete.rawLead.id));
          }
          if (leadToDelete.rawUser && leadToDelete.rawUser.uid) {
            await deleteDoc(doc(db, "users", leadToDelete.rawUser.uid));
          }
          if (selectedLeadUid === leadToDelete.uid) {
            setSelectedLeadUid(null);
            setActiveTab('demandes');
          }
        } catch (err) {
          console.error(err);
        }
        setUpdating(false);
      },
      'danger'
    );
  };

  const handleReset = async (e, leadToReset) => {
    e.stopPropagation();
    triggerConfirm(
      "Réinitialiser le dossier",
      "Voulez-vous vraiment réinitialiser ce dossier au statut 'Nouveau' ? Cela effacera l'historique des messages et remettra à zéro l'avancement.",
      async () => {
        setUpdating(true);
        try {
          const uid = leadToReset?.uid;
          if (uid) {
            const messagesRef = collection(db, "chats", uid, "messages");
            const msgsSnap = await getDocs(messagesRef);
            const deletePromises = msgsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
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
      },
      'warning'
    );
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

            <button
              onClick={() => setActiveTab('aibv')}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'aibv'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">📧</span>
              Service AIBV
            </button>

            {currentUserRole === 'super_admin' && (
              <button
                onClick={() => setActiveTab('manage_admins')}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === 'manage_admins'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">👥</span>
                Gestion Admins
              </button>
            )}
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
            {activeTab === 'aibv' && "📧 Service AIBV"}
            {activeTab === 'manage_admins' && "👥 Gestion des Admins"}
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
          
          {activeTab === 'overview' && (
            <AdminOverview
              leads={leads}
              chats={chats}
              setActiveTab={setActiveTab}
              openDetail={openDetail}
            />
          )}

          {activeTab === 'documents' && <DocumentsUtilisateurs />}

          {activeTab === 'demandes' && (
            <AdminDemandes
              leads={leads}
              loading={loading}
              openDetail={openDetail}
              handleReset={handleReset}
              handleDelete={handleDelete}
            />
          )}

          {activeTab === 'detail' && selectedLead && (
            <AdminLeadDetail
              selectedLead={selectedLead}
              closeDetail={closeDetail}
              handleReset={handleReset}
              handleDelete={handleDelete}
              setPreviewUrl={setPreviewUrl}
              setPreviewLabel={setPreviewLabel}
              updating={updating}
              setUpdating={setUpdating}
              isEditingPath={isEditingPath}
              setIsEditingPath={setIsEditingPath}
              advisorSettings={advisorSettings}
              handleSelectPath={handleSelectPath}
              handleUpdateStatus={handleUpdateStatus}
              getAdminSplitPaymentDetails={getAdminSplitPaymentDetails}
              db={db}
              doc={doc}
              updateDoc={updateDoc}
              addDoc={addDoc}
              setDoc={setDoc}
              collection={collection}
              serverTimestamp={serverTimestamp}
              attestationUrlInput={attestationUrlInput}
              setAttestationUrlInput={setAttestationUrlInput}
              attestationUploadStatus={attestationUploadStatus}
              setAttestationUploadStatus={setAttestationUploadStatus}
              attestationUploadProgress={attestationUploadProgress}
              setAttestationUploadProgress={setAttestationUploadProgress}
            />
          )}

          {activeTab === 'messages' && (
            <AdminMessages
              chats={chats}
              selectedChatId={selectedChatId}
              setSelectedChatId={setSelectedChatId}
              chatMessages={chatMessages}
              adminChatInput={adminChatInput}
              setAdminChatInput={setAdminChatInput}
              loadingMessages={loadingMessages}
              chatUploading={chatUploading}
              chatFilePreview={chatFilePreview}
              setSelectedChatFile={setSelectedChatFile}
              setChatFilePreview={setChatFilePreview}
              handleSendAdminReply={handleSendAdminReply}
              handleAdminChatFileUpload={handleAdminChatFileUpload}
              setMessageToDelete={setMessageToDelete}
              setPreviewUrl={setPreviewUrl}
              setPreviewLabel={setPreviewLabel}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              advisorSettings={advisorSettings}
              setAdvisorSettings={setAdvisorSettings}
              handleSaveSettings={handleSaveSettings}
              savingSettings={savingSettings}
              settingsSuccess={settingsSuccess}
              handlePerceptionTotalChange={handlePerceptionTotalChange}
              handleTheoriqueTotalChange={handleTheoriqueTotalChange}
              handlePratiqueTotalChange={handlePratiqueTotalChange}
              handleDirectTotalChange={handleDirectTotalChange}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsers
              leads={leads}
              openDetail={openDetail}
              handleDelete={handleDelete}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
            />
          )}

          {activeTab === 'aibv' && (
            <AdminAIBV leads={leads} />
          )}

          {activeTab === 'manage_admins' && currentUserRole === 'super_admin' && (
            <AdminManagement currentUserRole={currentUserRole} />
          )}

        </main>
      </div>

      {/* Lightbox globale */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-bold cursor-pointer"
            >✕ Fermer</button>
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
               <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                 <span className="text-white font-bold text-sm">{previewLabel}</span>
                 <button
                   onClick={() => handleDownloadFile(previewUrl, 'piece-jointe')}
                   className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                 >
                   ⬇️ Télécharger
                 </button>
               </div>
               {previewUrl.toLowerCase().includes('.pdf') ? (
                 <div className="w-full h-[75vh] bg-slate-950">
                   <iframe
                     src={previewUrl}
                     className="w-full h-full border-0"
                     title="Aperçu du document"
                   />
                 </div>
               ) : (
                 <img src={previewUrl} alt={previewLabel} className="w-full max-h-[70vh] object-contain bg-slate-950 p-4" />
               )}
            </div>
          </div>
        </div>
      )}

      {messageToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-[scaleIn_0.3s_ease-out] flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-xl mb-4 text-rose-400">
              🗑️
            </div>
            <h3 className="text-lg font-display font-extrabold text-white mb-2">
              Supprimer le message
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setMessageToDelete(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const id = messageToDelete;
                  setMessageToDelete(null);
                  await executeDeleteMessage(id);
                }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_24px_50px_rgba(0,0,0,0.5)] animate-[scaleIn_0.3s_ease-out] flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4 border ${
              confirmModal.variant === 'danger' 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {confirmModal.variant === 'danger' ? '🗑️' : '🔄'}
            </div>
            <h3 className="text-lg font-display font-extrabold text-white mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className={`flex-1 py-3 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-slate-950'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

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
