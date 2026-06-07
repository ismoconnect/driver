import React, { useState, useEffect } from 'react';

const messages = [
  {
    type: 'student',
    text: "J'ai raté mon permis 3 fois... je ne sais vraiment plus quoi faire 😔",
    delay: 3500,
  },
  {
    type: 'typing',
    delay: 9000,
  },
  {
    type: 'advisor',
    text: "Bonne nouvelle : vous pouvez obtenir votre permis belge sans repasser l'examen ! 🎉",
    delay: 13000,
  },
  {
    type: 'advisor',
    text: "Grâce à notre filière 100% légale, nous gérons toutes les démarches administratives pour vous 🛡️",
    delay: 20000,
  },
  {
    type: 'student',
    text: "Sans repasser l'examen ? C'est vraiment possible ? 🤔",
    delay: 29000,
  },
  {
    type: 'typing',
    delay: 34000,
  },
  {
    type: 'advisor',
    text: "✅ Absolument ! Démarche officielle, conforme et encadrée par des professionnels agréés en Belgique.",
    delay: 38000,
  },
  {
    type: 'advisor',
    text: "Plus de 1 240 Belges ont déjà obtenu leur permis grâce à nous — taux de réussite 98.6% 🎉",
    delay: 47000,
  },
  {
    type: 'student',
    text: "Comment ça fonctionne exactement ? Je veux en savoir plus 🚗",
    delay: 57000,
  },
  {
    type: 'typing',
    delay: 62000,
  },
  {
    type: 'advisor',
    text: "On analyse votre profil, on constitue votre dossier et on suit tout jusqu'à l'obtention. Contactez-nous, c'est gratuit ! 👇",
    delay: 67000,
  },
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center text-xs flex-shrink-0 shadow-md">
      💬
    </div>
    <div className="bg-slate-100 border border-slate-200/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const ChatBubble = ({ message }) => {
  const isStudent = message.type === 'student';

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        animation: 'bubbleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-sm ${
          isStudent
            ? 'bg-slate-200 text-slate-600'
            : 'bg-gradient-to-br from-brand-orange to-brand-orange-light text-white'
        }`}
      >
        {isStudent ? '👤' : '💬'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
          isStudent
            ? 'bg-slate-100 border border-slate-200/50 text-slate-800 rounded-2xl rounded-br-sm shadow-sm'
            : 'bg-brand-orange text-white rounded-2xl rounded-bl-sm shadow-md shadow-brand-orange/10'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [showTyping, setShowTyping] = useState(false);

  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    const timers = [];

    messages.forEach((msg) => {
      const timer = setTimeout(() => {
        if (msg.type === 'typing') {
          setShowTyping(true);
        } else {
          setShowTyping(false);
          setVisibleMessages(prev => [...prev, msg]);
        }
      }, msg.delay);
      timers.push(timer);
    });

    const resetTimer = setTimeout(() => {
      setVisibleMessages([]);
      setShowTyping(false);
      setLoopKey(k => k + 1);
    }, 76000);
    timers.push(resetTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [loopKey]);

  return (
    <div className="relative w-full max-w-sm ml-auto mr-0">
      {/* Phone / Chat frame — hauteur fixe pour ne jamais dépasser le Hero et garder la même forme */}
      <div className="relative rounded-3xl overflow-hidden border border-white/25 shadow-[0_30px_80px_rgba(0,0,0,0.45)] bg-white/90 backdrop-blur-2xl flex flex-col" style={{ height: '580px' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-950 bg-slate-950 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center text-sm shadow-md flex-shrink-0">
            🚗
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-none">Mon Permis Belgique</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-[10px] font-semibold">En ligne — répond rapidement</span>
            </div>
          </div>
        </div>

        {/* Messages area — hauteur fixe avec overflow caché, messages collés en bas */}
        <div className="flex-1 overflow-hidden px-4 pt-4 pb-2 flex flex-col justify-end min-h-0">
          <div className="flex flex-col justify-end">
            {visibleMessages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {showTyping && <TypingIndicator />}
          </div>
        </div>

        {/* Input bar (decorative) */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-950 bg-slate-950 flex-shrink-0">
          <div className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-[11px] text-white/40 italic">
            Écrire un message...
          </div>
          <div className="w-7 h-7 rounded-full bg-brand-orange flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow effect behind frame */}
      <div
        className="absolute -inset-6 -z-10 rounded-3xl blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(255,152,0,0.5) 0%, transparent 70%)' }}
      />
    </div>
  );
};

const Hero = ({ user, onOpenDashboard, advisor }) => {
  return (
    <section
      className="relative min-h-[90vh] lg:min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden pt-32 pb-16 lg:pt-36 lg:pb-24"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.96) 25%, rgba(15, 23, 42, 0.7) 55%, rgba(15, 23, 42, 0.35) 100%), url('${advisor?.heroImageUrl || "/smiling_driver.png"}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ---- AURORAS ---- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-slow" style={{
          background: 'radial-gradient(circle, rgba(255, 152, 0, 0.12) 0%, transparent 75%)'
        }} />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-slow" style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 75%)',
          animationDelay: '3s'
        }} />
      </div>

      {/* ---- CONTENT ---- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 flex flex-col lg:flex-row items-center lg:items-start gap-16 lg:gap-12">

        {/* ======= LEFT COLUMN: TEXT CONTENT ======= */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left p-8 sm:p-10 rounded-[32px] border border-white/25 hover:border-white/60 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-all duration-500 relative overflow-hidden group backdrop-blur-md bg-white/[0.02]">
          
          {/* Dynamic white glow overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)' }}
          />

          {/* Badge */}
          <div className="relative z-10 text-brand-orange text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-4 transition-transform duration-500 group-hover:translate-x-1">
            🚗 Accompagnement #1 Permis en Belgique
          </div>

          {/* Headline */}
          <h1 className="relative z-10 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-white">
            <span className="block text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-2">MON</span>
            <span className="block text-white uppercase tracking-wide">Permis de</span>
            <span className="block uppercase text-white tracking-wide">Conduire</span>
            <span className="inline-block mt-3 text-base sm:text-lg font-bold tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange/30 pb-2 uppercase">
              Belgique
            </span>
          </h1>

          {/* Description */}
          <p className="relative z-10 mt-6 text-sm sm:text-base text-white leading-relaxed max-w-xl font-light">
            Vous avez échoué plusieurs fois à vos examens et perdez espoir ?{' '}
            <span className="text-white font-medium underline decoration-brand-orange decoration-2 underline-offset-4">
              Ne baissez pas les bras.
            </span>{' '}
            Obtenez votre permis officiel belge{' '}
            <span className="inline-flex items-center gap-1.5 text-brand-orange font-bold">
              sans repasser l'examen
            </span>
            {' '}— nous vous accompagnons pas à pas, légalement et en toute sécurité.
          </p>

          {/* CTA Buttons */}
          <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full sm:w-auto">
            <a
              href="#services"
              className="group/btn relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(255,152,0,0.4)] overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
              Découvrir la méthode
            </a>

            <button
              onClick={() => onOpenDashboard('signup')}
              className="inline-flex items-center gap-3.5 text-sm font-bold text-white group/btn w-full sm:w-auto justify-center sm:justify-start cursor-pointer text-left"
            >
              <span className="w-12 h-12 rounded-full bg-brand-orange hover:bg-brand-orange-dark flex items-center justify-center shadow-lg shadow-brand-orange/20 transition-all duration-300 transform group-hover/btn:scale-110 group-hover/btn:shadow-brand-orange/45 flex-shrink-0">
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.5 3a.5.5 0 00-.5.5v13a.5.5 0 00.75.433l11-6.5a.5.5 0 000-.866l-11-6.5A.5.5 0 004.5 3z" />
                </svg>
              </span>
              <span className="border-b border-white/20 group-hover/btn:border-white transition-colors pb-0.5">
                Parler à un conseiller
              </span>
            </button>
          </div>

          {/* Quick link to follow demand */}
          <p className="relative z-10 text-xs text-white/60 mt-4 transition-all duration-300 hover:text-white/80">
            {user ? (
              <button
                onClick={() => onOpenDashboard('overview')}
                className="text-brand-orange hover:text-brand-orange-light font-bold underline cursor-pointer transition-colors focus:outline-none"
              >
                Accédez à votre espace de suivi en temps réel ➔
              </button>
            ) : (
              <>
                Déjà inscrit ?{' '}
                <button
                  onClick={() => onOpenDashboard('login')}
                  className="text-brand-orange hover:text-brand-orange-light font-bold underline cursor-pointer transition-colors focus:outline-none"
                >
                  Suivez l'avancement de votre dossier ici ➔
                </button>
              </>
            )}
          </p>

          {/* Social Proof */}
          <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <div className="flex -space-x-3">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
                'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=100',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Student avatar"
                  className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover ring-1 ring-white/10"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-500 text-sm">★</span>
                ))}
                <span className="ml-2 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded">
                  4.9/5
                </span>
              </div>
              <p className="text-xs text-white/75 mt-1.5">
                Plus de <span className="text-white font-semibold">1 240 Belges</span> accompagnés avec succès.
              </p>
            </div>
          </div>
        </div>

        {/* ======= RIGHT COLUMN: CHAT BUBBLES ======= */}
        <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-end">
          <ChatWindow />
        </div>

      </div>

      {/* Bubble animation keyframe injected via style tag */}
      <style>{`
        @keyframes bubbleIn {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
