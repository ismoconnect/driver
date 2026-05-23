import React from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Bruxelles',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    stars: 5,
    tag: 'Dossier validé sans examen',
    text: "Après 3 échecs à l'examen pratique, j'étais complètement découragée et sur le point d'abandonner. Passer par cette procédure sans examen m'a changé la vie. J'ai obtenu mon permis officiel belge enregistré en moins d'un mois, en toute légalité !",
  },
  {
    id: 2,
    name: 'Thomas D.',
    location: 'Liège',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    stars: 5,
    tag: '100% Officiel & Légal',
    text: "J'avais beaucoup de doutes au début, mais la procédure est parfaitement encadrée par la réglementation belge. L'équipe a géré tout le dossier administratif et j'ai reçu mon permis physique directement à la commune, sans devoir repasser d'examen stressant.",
  },
  {
    id: 3,
    name: 'Léa A.',
    location: 'Namur',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    stars: 5,
    tag: 'Sauvée après 4 échecs',
    text: "L'examen pratique était devenu une source d'immense stress pour moi après 4 échecs. Grâce à leur accompagnement de A à Z, j'ai pu obtenir mon permis définitif officiel légalement et sans repasser devant un examinateur. Je recommande à 100% !",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="pt-10 pb-20 lg:pt-12 lg:pb-24 bg-white overflow-hidden relative">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.02]" style={{
        background: 'radial-gradient(circle, var(--color-brand-orange) 0%, transparent 70%)'
      }} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Section Header inside a dynamic card */}
        <div className="max-w-7xl mx-auto mb-10 lg:mb-12 p-8 sm:p-10 rounded-3xl bg-white/70 border border-slate-900 shadow-sm hover:shadow-xl hover:border-brand-orange hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group text-center">
          {/* Dynamic hover glow */}
          <div
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,152,0,0.06) 0%, transparent 60%)' }}
          />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative z-10">
            <span className="inline-block bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs sm:text-sm font-extrabold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 group-hover:scale-[1.02] transition-transform duration-300">
              ⭐ Avis & Témoignages
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-brand-dark tracking-tight leading-tight lg:whitespace-nowrap">
              Ils ont obtenu leur permis de conduire sans examen
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto font-light">
              Découvrez les retours d'expérience de nos candidats qui ont choisi la voie administrative légale et simplifiée.
            </p>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
          {testimonials.map((t, index) => {
            const isFeatured = index === 1; // Middle card is featured/highlighted
            return (
              <div
                key={t.id}
                className={`group relative rounded-[32px] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden ${
                  isFeatured
                    ? 'bg-slate-950 text-white shadow-[0_20px_50px_rgba(255,152,0,0.15)] border border-slate-900'
                    : 'bg-white text-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-900 hover:shadow-2xl hover:border-brand-orange'
                }`}
              >
                {/* Accent glow on hover for light cards */}
                {!isFeatured && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,152,0,0.05) 0%, transparent 70%)' }}
                  />
                )}

                {/* Ambient glow behind featured card */}
                {isFeatured && (
                  <div className="absolute -top-20 -right-20 w-44 h-44 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
                )}

                {/* Large Quotation Mark */}
                <span className={`absolute right-6 top-6 text-8xl font-serif leading-none select-none pointer-events-none font-bold transition-colors duration-500 ${
                  isFeatured 
                    ? 'text-white/5 group-hover:text-brand-orange/10' 
                    : 'text-slate-100 group-hover:text-brand-orange/5'
                }`}>
                  ”
                </span>

                <div className="relative z-10">
                  {/* Top Row: Stars + Verification badge */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {[...Array(t.stars)].map((_, i) => (
                        <span key={i} className="text-amber-500 text-sm">★</span>
                      ))}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isFeatured
                        ? 'bg-brand-orange/20 text-brand-orange-light border border-brand-orange/30'
                        : 'bg-green-500/10 text-green-600 border border-green-500/20'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${isFeatured ? 'bg-brand-orange-light' : 'bg-green-500'}`} />
                      Candidat vérifié
                    </span>
                  </div>

                  {/* Testimonial Text */}
                  <p className={`text-sm sm:text-base leading-relaxed italic font-light mb-8 relative ${
                    isFeatured ? 'text-slate-200' : 'text-slate-600'
                  }`}>
                    "{t.text}"
                  </p>
                </div>

                {/* User profile */}
                <div className={`border-t pt-6 mt-auto flex items-center gap-4 relative z-10 ${
                  isFeatured ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <img
                    src={t.image}
                    alt={t.name}
                    className={`w-12 h-12 rounded-full object-cover border-2 shadow-md ring-1 ${
                      isFeatured 
                        ? 'border-slate-800 ring-brand-orange/20' 
                        : 'border-white ring-slate-100'
                    }`}
                  />
                  <div>
                    <h4 className={`font-bold text-sm sm:text-base leading-none ${
                      isFeatured ? 'text-white' : 'text-brand-dark'
                    }`}>
                      {t.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs ${
                        isFeatured ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        {t.location}
                      </span>
                      <span className={`w-1 h-1 rounded-full ${
                        isFeatured ? 'bg-slate-700' : 'bg-slate-200'
                      }`} />
                      <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isFeatured 
                          ? 'text-brand-orange bg-brand-orange/10 border border-brand-orange/20' 
                          : 'text-brand-orange bg-brand-orange/8 border border-brand-orange/15'
                      }`}>
                        {t.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-50/80 border border-slate-100/70 px-6 py-3 rounded-2xl shadow-sm">
            <span className="text-brand-orange font-bold text-lg">★</span>
            <span className="text-sm text-slate-600 font-medium">
              Note moyenne globale de <strong>4.9/5</strong> basée sur plus de 1 240 candidats belges.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
