import React, { useState } from 'react';

export default function ClientProfile({
  formData,
  setFormData,
  user = {},
  theme
}) {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim() || !formData.address?.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSuccessMsg('Votre profil a été mis à jour avec succès.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getInitials = () => {
    const f = formData.firstName?.charAt(0) || '';
    const l = formData.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  return (
    <div className="flex-1 flex flex-col justify-start gap-6 animate-[bubbleIn_0.4s_ease-out] pb-16">
      {/* Header */}
      <div className="border-b-2 border-white/30 pb-4">
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
          Mon Profil Candidat
        </h2>
        <p className="text-white/50 text-xs mt-1">
          Gérez vos informations personnelles et vérifiez les détails de votre compte Mon Permis.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar and Account Status */}
        <div className="bg-slate-950/60 border-2 border-white/35 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center text-3xl font-black text-slate-950 shadow-lg mb-4">
            {getInitials()}
          </div>
          <h3 className="text-white font-bold text-lg">{formData.firstName || 'Mike'} {formData.lastName || 'Durand'}</h3>
          <p className="text-white/40 text-xs mt-0.5">{user.email || 'candidat@sitedepermis.be'}</p>

          <div className="mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-orange/15 text-brand-orange border-2 border-brand-orange/40">
            Candidat Agréé
          </div>

          <div className="w-full border-t border-white/5 mt-6 pt-6 text-left space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Statut du dossier :</span>
              <span className="text-emerald-400 font-semibold">Dossier Transmis</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Date d'inscription :</span>
              <span className="text-white font-medium">14 Juin 2026</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">ID Candidat :</span>
              <span className="text-white font-mono text-[10px] font-medium">MP-48209</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form details */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-950/60 border-2 border-white/35 rounded-3xl p-6 shadow-xl space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-brand-orange border-b border-white/5 pb-2">
            Informations personnelles
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Prénom</label>
              <input 
                required
                type="text" 
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border-2 border-white/35 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de famille</label>
              <input 
                required
                type="text" 
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border-2 border-white/35 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date de naissance</label>
              <input 
                required
                type="date" 
                name="birthDate"
                value={formData.birthDate || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border-2 border-white/35 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white/80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Téléphone</label>
              <input 
                required
                type="tel" 
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border-2 border-white/35 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse de résidence en Belgique</label>
              <input 
                required
                type="text" 
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border-2 border-white/35 focus:border-brand-orange rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-start">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Enregistrer les modifications ➔
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
