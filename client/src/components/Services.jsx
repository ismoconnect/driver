import React from 'react';

const services = [
  {
    title: 'Analyse de votre profil',
    description: 'Nous étudions votre situation personnelle pour confirmer votre éligibilité à notre filière 100% sans examen. Gratuit et sans engagement.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-orange-500 to-amber-400',
    glow: 'rgba(255,152,0,0.15)',
    badge: 'Étape 1',
  },
  {
    title: 'Constitution du dossier',
    description: 'Nos experts rassemblent et préparent l\'intégralité des documents administratifs requis par les autorités belges compétentes.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59,130,246,0.15)',
    badge: 'Étape 2',
  },
  {
    title: 'Suivi officiel',
    description: 'Nous gérons l\'intégralité des démarches auprès des organismes officiels belges jusqu\'à la validation complète de votre dossier.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-teal-500 to-emerald-400',
    glow: 'rgba(13,148,136,0.15)',
    badge: 'Étape 3',
  },
  {
    title: 'Permis Définitif',
    description: 'Vous recevez votre permis de conduire belge officiel — légalement, sans avoir repassé le moindre examen.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'from-brand-orange to-orange-600',
    glow: 'rgba(255,152,0,0.18)',
    badge: 'Résultat',
  },
];

const Services = ({ onOpenDashboard }) => {
  return (
    <section id="services" className="pt-24 pb-12 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,152,0,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Two-column layout (items-stretch ensures columns have equal height on desktop) */}
        <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16">
          
          {/* Left Column: Title Card + Steps (2x2 grid) */}
          <div className="w-full lg:w-7/12 flex flex-col justify-between order-2 lg:order-1">
            {/* Section header inside a premium card */}
            <div className="mb-8 p-8 sm:p-10 rounded-3xl bg-white/70 border border-slate-900 shadow-sm hover:shadow-xl hover:border-brand-orange hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
              {/* Dynamic glow overlay on hover */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,152,0,0.1) 0%, transparent 60%)' }}
              />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              
              <div className="relative z-10 text-left">
                <div className="inline-flex items-center gap-2 bg-brand-orange/8 border border-brand-orange/20 text-brand-orange text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 group-hover:scale-[1.02] transition-transform duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                  Notre Méthode
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight leading-[1.2]">
                  Votre permis belge,<br />
                  <span className="relative inline-block mt-1">
                    sans repasser l'examen
                    <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-[3px] rounded-full bg-gradient-to-r from-brand-orange to-amber-400 transition-all duration-700 ease-out" />
                    {/* fallback visible line that expands */}
                    <span className="absolute -bottom-1 left-0 w-1/3 h-[3px] rounded-full bg-brand-orange/30" />
                  </span>{' '}!
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-light">
                  Un processus simplifié, 100% légal et encadré par des professionnels — pour obtenir votre permis officiel belge sans le stress des centres d'examen.
                </p>
              </div>
            </div>

            {/* Steps (2x2 grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-6 border border-slate-900 shadow-sm hover:shadow-xl hover:border-brand-orange hover:-translate-y-1.5 transition-all duration-400 cursor-default overflow-hidden"
                >
                  {/* Hover glow bg */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${service.glow} 0%, transparent 70%)` }}
                  />

                  {/* Step badge */}
                  <div className="absolute top-4 right-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {service.badge}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} text-white shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>

                  {/* Step number (large decorative) */}
                  <div className="absolute -bottom-3 -right-2 text-[70px] font-black text-slate-50 leading-none select-none pointer-events-none group-hover:text-slate-100 transition-colors">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-bold text-brand-dark mb-2 relative z-10">{service.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed relative z-10">{service.description}</p>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 w-0 h-[3px] bg-gradient-to-r ${service.color} group-hover:w-full transition-all duration-500 rounded-b-2xl`} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Representative Image taking full height on desktop */}
          <div className="w-full lg:w-5/12 order-1 lg:order-2 relative min-h-[450px] lg:min-h-full flex">
            {/* Glow behind image */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-orange/20 to-amber-500/20 rounded-3xl blur-2xl opacity-75 -z-10" />
            
            {/* Image Container spanning full height of parent on desktop */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.15)] group w-full h-full">
              <img 
                src="/permis_success.png" 
                alt="Permis de conduire obtenu avec succès" 
                className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              
              {/* Subtle dark gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
              
              {/* Floating Stat Badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg flex items-center gap-4 z-10">
                <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-lg font-bold flex-shrink-0">
                  ✓
                </div>
                <div>
                  <div className="text-slate-900 text-xs font-bold">100% Officiel & Légal</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Procédure entièrement encadrée par la réglementation belge</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={() => onOpenDashboard('signup')}
            className="inline-flex items-center gap-3 bg-brand-dark text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md cursor-pointer"
          >
            <span>Commencer mon accompagnement</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
