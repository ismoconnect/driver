import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Firebase Config for secondary app creation
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const adminsList = [];
      querySnapshot.forEach((doc) => {
        adminsList.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(adminsList);
    } catch (err) {
      console.error("Erreur chargement administrateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const targetEmail = form.email.trim().toLowerCase();

    try {
      // 1. Initialize secondary Firebase app to register the user in auth without logging out current user
      let secondaryApp;
      if (getApps().some(app => app.name === 'secondary-admin-reg')) {
        secondaryApp = getApp('secondary-admin-reg');
      } else {
        secondaryApp = initializeApp(firebaseConfig, 'secondary-admin-reg');
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      let newAdminUid = null;

      try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, targetEmail, form.password);
        newAdminUid = userCredential.user.uid;
        // Log out from secondary app session immediately to prevent conflicts
        await signOut(secondaryAuth);
      } catch (authErr) {
        const isEmailInUse = authErr.code === 'auth/email-already-in-use' || 
                             authErr.message?.includes('email-already-in-use') ||
                             String(authErr).includes('email-already-in-use');
        
        if (isEmailInUse) {
          const rawEmail = form.email.trim();
          const lowerEmail = rawEmail.toLowerCase();
          
          // Helper helper to query email in Firestore
          const findUidInCollection = async (collName) => {
            for (const emailVal of [lowerEmail, rawEmail]) {
              const q = query(collection(db, collName), where('email', '==', emailVal));
              const snap = await getDocs(q);
              if (!snap.empty) {
                return snap.docs[0].id;
              }
            }
            return null;
          };

          newAdminUid = await findUidInCollection('users');
          if (!newAdminUid) {
            newAdminUid = await findUidInCollection('leads');
          }
          if (!newAdminUid) {
            newAdminUid = await findUidInCollection('admins');
          }

          if (!newAdminUid) {
            throw new Error("Cet e-mail est déjà utilisé dans l'authentification Firebase, mais aucun profil correspondant n'a été trouvé dans la base de données (utilisateurs, dossiers ou admins) pour récupérer l'identifiant (UID).");
          }
        } else {
          throw authErr;
        }
      }

      // 2. Add admin profile in Firestore "admins" collection
      await setDoc(doc(db, 'admins', newAdminUid), {
        uid: newAdminUid,
        name: form.name,
        email: targetEmail,
        role: form.role || 'admin',
        createdAt: serverTimestamp(),
      });

      setSuccess("Administrateur configuré avec succès !");
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setShowAddModal(false);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (adminId === auth.currentUser?.uid) {
      alert("Vous ne pouvez pas retirer vos propres droits d'administration.");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir retirer les droits d'administration de ${adminName} ?`)) {
      try {
        await deleteDoc(doc(db, 'admins', adminId));
        setSuccess("Administrateur supprimé avec succès.");
        fetchAdmins();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression de l'administrateur.");
      }
    }
  };

  const handleRoleChange = async (adminId, newRole) => {
    if (adminId === auth.currentUser?.uid && newRole !== 'super_admin') {
      const otherSuperAdmins = admins.filter(a => a.role === 'super_admin' && a.id !== adminId);
      if (otherSuperAdmins.length === 0) {
        alert("Vous ne pouvez pas vous rétrograder en Admin car vous êtes le seul Super Admin actuellement.");
        return;
      }
    }
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        role: newRole
      });
      setSuccess("Rôle de l'administrateur mis à jour avec succès.");
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du rôle de l'administrateur.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h3 className="text-lg font-bold text-white">Gestion des Administrateurs</h3>
          <p className="text-xs text-slate-500 mt-1">Créez et supprimez les comptes des conseillers et administrateurs du portail.</p>
        </div>
        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setShowAddModal(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 text-xs flex items-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          <span>➕ Ajouter un Admin</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      {/* Admin List table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-4 animate-[fadeIn_0.2s_ease-out]">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Aucun administrateur trouvé.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="space-y-4 block sm:hidden">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold text-white text-xs">
                      {admin.name || 'Nom non défini'}
                    </div>
                    {admin.id === auth.currentUser?.uid && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Vous
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Adresse E-mail</span>
                      <div className="font-mono text-xs text-slate-300 break-all bg-slate-950/60 p-2 rounded-lg border border-white/5">
                        {admin.email}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Rôle</span>
                        <select
                          value={admin.role || 'admin'}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs focus:outline-none transition-colors text-white font-semibold cursor-pointer"
                        >
                          <option value="admin">Admin (Conseiller)</option>
                          <option value="super_admin">Super Admin (Gestionnaire)</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Créé le</span>
                        <div className="text-xs text-slate-300 bg-slate-950/30 p-2 rounded-lg border border-white/5 h-[34px] flex items-center justify-center font-medium">
                          {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">UID Firebase</span>
                      <div className="font-mono text-[10px] text-slate-500 break-all bg-slate-950/20 p-2 rounded-lg border border-white/5 select-all">
                        {admin.uid}
                      </div>
                    </div>
                  </div>

                  {admin.id !== auth.currentUser?.uid && (
                    <div className="pt-2 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center"
                      >
                        Retirer l'administrateur
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nom Complet</th>
                    <th className="py-3 px-4">Adresse E-mail</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">UID Firebase</th>
                    <th className="py-3 px-4">Date de création</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{admin.name || 'Nom non défini'}</td>
                      <td className="py-3 px-4 font-mono">{admin.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={admin.role || 'admin'}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                          className="bg-slate-950/80 border border-white/10 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs focus:outline-none transition-colors text-white font-semibold cursor-pointer"
                        >
                          <option value="admin">Admin (Conseiller)</option>
                          <option value="super_admin">Super Admin (Gestionnaire)</option>
                        </select>
                        {admin.id === auth.currentUser?.uid && (
                          <span className="ml-2 text-[10px] text-slate-500 font-medium">(Vous)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{admin.uid}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Créer un Compte Administrateur</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center font-bold text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom Complet</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Jean-Pierre Dumont"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: admin@permisdeconduirebe.com"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe (Min. 6 car.)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Saisir un mot de passe sécurisé"
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Rôle de l'administrateur</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
                >
                  <option value="admin">Admin (Conseiller)</option>
                  <option value="super_admin">Super Admin (Gestionnaire)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Création..." : "💾 Créer l'Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
