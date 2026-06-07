import React from 'react';

const AdminOverview = ({ leads, chats, setActiveTab, openDetail }) => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const totalLeads = leads.length;
  const submitted = leads.filter(l => l.rawLead?.isSubmitted).length;
  const inProgress = leads.filter(l => l.status === 'processing').length;
  const completed = leads.filter(l => l.status === 'completed').length;
  const unreadChats = chats.filter(c => c.unreadByAdmin).length;
  const withDocs = leads.filter(l => l.rawLead?.uploads && Object.values(l.rawLead.uploads).some(Boolean)).length;
  const recentLeads = [...leads].slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Greeting Banner */}
      <div className="relative bg-gradient-to-r from-emerald-500/10 via-slate-900/60 to-slate-900/60 border border-emerald-500/20 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full transform translate-x-1/4 -translate-y-1/4" />
        <div className="relative z-10">
          <p className="text-slate-400 text-sm font-semibold mb-1">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h2 className="text-3xl font-black text-white mb-2">{greeting} 👋</h2>
          <p className="text-slate-400 text-sm">
            Vous avez <span className="text-emerald-400 font-bold">{submitted}</span> dossiers soumis
            {unreadChats > 0 && <> et <span className="text-amber-400 font-bold">{unreadChats} message{unreadChats > 1 ? 's' : ''}</span> non lu{unreadChats > 1 ? 's' : ''}</>}.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('demandes')}
          className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
        >
          Voir les demandes →
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total inscrits', value: totalLeads, icon: '👥', color: 'text-white', border: 'border-white/5', glow: '' },
          { label: 'Dossiers soumis', value: submitted, icon: '📋', color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500/5' },
          { label: 'En traitement', value: inProgress, icon: '⚡', color: 'text-amber-400', border: 'border-amber-500/20', glow: 'bg-amber-500/5' },
          { label: 'Terminés', value: completed, icon: '✅', color: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'bg-indigo-500/5' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.glow || 'bg-slate-900/60'} border ${kpi.border} p-6 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 text-6xl flex items-end justify-end pr-2 pb-1">{kpi.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{kpi.label}</p>
            <p className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Row : Activité + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activité récente */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dernières inscriptions</h3>
            <button onClick={() => setActiveTab('demandes')} className="text-xs text-emerald-400 font-bold hover:underline">Voir tout →</button>
          </div>
          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Aucune inscription pour le moment.</p>
            ) : recentLeads.map(lead => (
              <div
                key={lead.uid}
                onClick={() => openDetail(lead)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-black text-emerald-400">
                    {(lead.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold group-hover:text-emerald-400 transition-colors">{lead.name}</p>
                    <p className="text-slate-500 text-xs">{lead.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead.rawLead?.isSubmitted && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">✓ Soumis</span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    lead.status === 'new' ? 'text-emerald-400 bg-emerald-500/10' :
                    lead.status === 'processing' ? 'text-amber-400 bg-amber-500/10' :
                    'text-indigo-400 bg-indigo-500/10'
                  }`}>
                    {lead.status === 'new' ? 'Nouveau' : lead.status === 'processing' ? 'En cours' : 'Terminé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel droit */}
        <div className="flex flex-col gap-4">

          {/* Messages non lus */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 backdrop-blur-sm shadow-xl flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Messages</h3>
              <button onClick={() => setActiveTab('messages')} className="text-xs text-emerald-400 font-bold hover:underline">Ouvrir →</button>
            </div>
            {unreadChats === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✉️</div>
                <p className="text-slate-500 text-xs">Tout est lu !</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.filter(c => c.unreadByAdmin).slice(0, 4).map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => { setActiveTab('messages'); }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-black text-amber-400 flex-shrink-0">
                      {(chat.userName?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold truncate">{chat.userName || 'Candidat'}</p>
                      <p className="text-slate-400 text-[10px] truncate">{chat.lastMessageText}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5 animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Docs rapides */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 backdrop-blur-sm shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Documents</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Avec documents</span>
                <span className="text-sm font-bold text-emerald-400">{withDocs}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: totalLeads > 0 ? `${(withDocs/totalLeads)*100}%` : '0%' }} />
              </div>
              <button onClick={() => setActiveTab('documents')} className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white border border-white/5 transition-all">
                📁 Voir tous les dossiers
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
