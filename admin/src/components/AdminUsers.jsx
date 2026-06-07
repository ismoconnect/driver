import React from 'react';

const AdminUsers = ({
  leads,
  openDetail,
  handleDelete,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter
}) => {
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
        <div className="relative flex-1 w-full">
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
        <div className="flex gap-2 flex-wrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
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
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
};

export default AdminUsers;
