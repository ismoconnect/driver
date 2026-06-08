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
        <div className="grid grid-cols-5 gap-1 w-full sm:flex sm:w-auto sm:gap-2">
          {[
            { key: 'all', label: 'Tous', mobile: 'Tous' },
            { key: 'submitted', label: '📋 Soumis', mobile: 'Soumis' },
            { key: 'new', label: '🟢 Nouveaux', mobile: 'Nouveau' },
            { key: 'processing', label: '🟡 En cours', mobile: 'En cours' },
            { key: 'completed', label: '🟣 Terminés', mobile: 'Terminé' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setUserFilter(f.key)}
              className={`px-1 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[9px] sm:text-xs font-bold transition-all whitespace-nowrap text-center flex items-center justify-center ${
                userFilter === f.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span className="hidden sm:inline">{f.label}</span>
              <span className="inline sm:hidden">{f.mobile}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      <div className="text-xs text-slate-500 font-semibold -mb-4">
        {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
      </div>

      {/* Tableau pour Desktop & Cartes pour Mobile */}
      <div className="bg-slate-900/80 rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Vue Desktop : Tableau */}
        <div className="hidden md:block overflow-x-auto">
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

        {/* Vue Mobile : Cartes */}
        <div className="block md:hidden divide-y divide-white/5">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500 font-medium text-sm">
              Aucun utilisateur trouvé pour cette recherche.
            </div>
          ) : filteredUsers.map(lead => {
            const uploads = lead.rawLead?.uploads || {};
            const docsCount = Object.values(uploads).filter(Boolean).length;
            const hasLead = !!lead.rawLead;

            return (
              <div
                key={lead.uid}
                onClick={() => openDetail(lead)}
                className="p-5 hover:bg-white/5 active:bg-white/10 transition-all duration-200 space-y-4 cursor-pointer"
              >
                {/* Ligne du haut : Avatar + Nom et Statut */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-400 flex-shrink-0">
                      {(lead.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.uid?.slice(0, 10)}...</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">✓ Soumis</span>
                    )}
                  </div>
                </div>

                {/* Section intermédiaire : Coordonnées */}
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-4">📧</span>
                    <span className="truncate select-all font-medium">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 w-4">📞</span>
                      <span className="select-all font-medium">{lead.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-500 w-4">📅</span>
                    <span>{lead.date} <span className="text-slate-600">|</span> {hasLead ? '📋 Dossier créé' : '👤 Inscription seule'}</span>
                  </div>
                </div>

                {/* Pied de carte : Documents & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Docs:</span>
                    <div className="flex gap-1">
                      {['idFront','idBack','photo','signature'].map(k => (
                        <div
                          key={k}
                          className={`w-2 h-2 rounded-full ${uploads[k] ? 'bg-emerald-500' : 'bg-white/10'}`}
                          title={k}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold ${docsCount >= 4 ? 'text-emerald-400' : docsCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                      {docsCount}/4
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openDetail(lead)}
                      className="text-[11px] font-bold text-slate-300 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all"
                    >
                      ⚙️ Dossier
                    </button>
                    <button
                      onClick={e => handleDelete(e, lead)}
                      className="text-[11px] font-bold text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AdminUsers;
