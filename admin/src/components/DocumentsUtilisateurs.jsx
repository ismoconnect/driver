import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const DOC_LABELS = {
  idFront:   { label: 'Carte d\'Identité Recto', emoji: '🪪' },
  idBack:    { label: 'Carte d\'Identité Verso',  emoji: '🪪' },
  photo:     { label: 'Photo d\'Identité',        emoji: '📸' },
  signature: { label: 'Signature Numérisée',      emoji: '✍️' },
};

export default function DocumentsUtilisateurs() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState(null); // { url, label }
  const [filterStatus, setFilterStatus] = useState('all'); // all | complete | incomplete

  useEffect(() => {
    const leadsRef = collection(db, 'leads');
    const unsubLeads = onSnapshot(leadsRef, (leadsSnap) => {
      const usersRef = collection(db, 'users');
      const unsubUsers = onSnapshot(usersRef, (usersSnap) => {
        const usersMap = {};
        usersSnap.forEach(d => { usersMap[d.id] = d.data(); });

        const combined = leadsSnap.docs.map(d => {
          const lead = d.data();
          const user = usersMap[d.id] || {};
          const name = `${lead.firstName || user.firstName || ''} ${lead.lastName || user.lastName || ''}`.trim() || lead.email;
          const uploads = lead.uploads || {};
          const docsCount = Object.values(uploads).filter(Boolean).length;
          return {
            uid: d.id,
            name,
            email: lead.email || user.email || '',
            uploads,
            docsCount,
            isComplete: docsCount >= 4,
            submittedAt: lead.submittedAt || lead.createdAt || null,
          };
        });

        // Aussi ajouter les users sans lead
        usersSnap.forEach(d => {
          if (!combined.find(c => c.uid === d.id)) {
            const user = d.data();
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            combined.push({
              uid: d.id,
              name,
              email: user.email || '',
              uploads: {},
              docsCount: 0,
              isComplete: false,
              submittedAt: user.createdAt || null,
            });
          }
        });

        setLeads(combined);
        setLoading(false);
      });
      return () => unsubUsers();
    });
    return () => unsubLeads();
  }, []);

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                        l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' ||
                        (filterStatus === 'complete' && l.isComplete) ||
                        (filterStatus === 'incomplete' && !l.isComplete);
    return matchSearch && matchStatus;
  });

  const totalDocs = leads.reduce((acc, l) => acc + l.docsCount, 0);
  const completeUsers = leads.filter(l => l.isComplete).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-bold flex items-center gap-2"
            >
              ✕ Fermer
            </button>
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-bold text-sm">{lightbox.label}</span>
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  ⬇️ Télécharger
                </a>
              </div>
              {lightbox.url.match(/\.(jpg|jpeg|png|gif|webp)/i) || lightbox.url.includes('cloudinary') ? (
                <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[70vh] object-contain bg-slate-950 p-4" />
              ) : (
                <div className="p-10 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-white font-semibold mb-4">Fichier PDF</p>
                  <a
                    href={lightbox.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Ouvrir le PDF ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Utilisateurs</p>
          <p className="text-4xl font-black text-white">{leads.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Dossiers Complets</p>
          <p className="text-4xl font-black text-emerald-400">{completeUsers}</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Documents Reçus</p>
          <p className="text-4xl font-black text-brand-orange">{totalDocs}</p>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
        />
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'complete', label: '✅ Complets' },
            { key: 'incomplete', label: '⏳ Incomplets' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === f.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des utilisateurs */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-medium">
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(lead => (
            <div key={lead.uid} className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
              {/* Header utilisateur */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl font-black text-emerald-400">
                    {(lead.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{lead.name || 'Inconnu'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{lead.email}</p>
                    {lead.submittedAt && (
                      <p className="text-slate-600 text-[10px] mt-0.5">
                        {new Date(lead.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Documents</span>
                    <p className={`text-2xl font-black ${lead.docsCount >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {lead.docsCount}/4
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                    lead.isComplete
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {lead.isComplete ? '✅ Complet' : '⏳ Incomplet'}
                  </span>
                </div>
              </div>

              {/* Grille des 4 documents */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(DOC_LABELS).map(([key, { label, emoji }]) => {
                  const url = lead.uploads[key];
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                      {url ? (
                        <button
                          onClick={() => setLightbox({ url, label: `${lead.name} — ${label}` })}
                          className="relative group rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-800 hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
                        >
                          {url.match(/\.(jpg|jpeg|png|gif|webp)/i) || url.includes('cloudinary') ? (
                            <img src={url} alt={label} className="w-full h-20 object-cover" />
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center bg-emerald-500/5">
                              <span className="text-2xl">📄</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">🔍 Voir</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/80 py-0.5 text-center">
                            <span className="text-[8px] text-white font-bold">✓ Reçu</span>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-20 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 bg-slate-900/40">
                          <span className="text-xl opacity-20">{emoji}</span>
                          <span className="text-[9px] text-slate-600 font-medium">Non reçu</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
