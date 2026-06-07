import React, { useState } from 'react';

const AdminDemandes = ({ leads, loading, openDetail, handleReset, handleDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'processing' | 'completed'
  const [sortField, setSortField] = useState('date'); // 'date' | 'name' | 'status'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone || '').includes(searchQuery);

    const matchesStatus = 
      statusFilter === 'all' || 
      lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') {
      // compare raw timestamps if possible
      const timeA = new Date(a.rawLead?.createdAt || a.rawUser?.createdAt || 0).getTime();
      const timeB = new Date(b.rawLead?.createdAt || b.rawUser?.createdAt || 0).getTime();
      comparison = timeA - timeB;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
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

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'new', label: '🟢 Nouveaux' },
            { key: 'processing', label: '🟡 En cours' },
            { key: 'completed', label: '🟣 Terminés' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === opt.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-slate-900/80 rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-slate-900">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                >
                  Client {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                 <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                  onClick={() => openDetail(lead)}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{lead.name}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">{lead.date}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-slate-300">{lead.email}</div>
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
               {sortedLeads.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" className="px-6 py-16 text-center text-slate-500 font-medium">
                    Aucune demande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDemandes;
