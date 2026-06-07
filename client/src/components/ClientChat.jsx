import React, { useEffect } from 'react';

export default function ClientChat({
  user,
  messages,
  chatInput,
  setChatInput,
  chatUploading,
  isTyping,
  advisor,
  theme,
  handleSendMessage,
  handleClientChatFileUpload,
  chatEndRef
}) {
  
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-6 relative z-10 h-[calc(100vh-144px)] md:h-full min-h-0 animate-[bubbleIn_0.5s_ease-out]">
      
      {/* Desktop Left Sidebar: Advisor Info */}
      <div className={`hidden md:flex flex-col justify-between items-center text-center p-6 border rounded-2xl bg-slate-950/60 ${theme === 'dark' ? 'border-white' : 'border-slate-950'}`}>
        <div className="w-full flex flex-col items-center">
          <h4 className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-6">Votre Conseiller Agréé</h4>
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-brand-orange flex items-center justify-center text-3xl shadow-lg border-2 border-brand-orange/30">
              {advisor.avatarEmoji || '👨‍💼'}
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 border-2 border-slate-950 rounded-full ${advisor.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          </div>
          <h5 className="text-white font-bold text-lg mt-4">{advisor.name}</h5>
          <p className="text-brand-orange text-xs font-semibold uppercase mt-0.5">{advisor.title}</p>
          
          <div className="w-full border-t border-white/10 mt-6 pt-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Réponse moyenne</p>
                <p className="text-xs text-white/80 font-medium">Moins de 10 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Disponibilité</p>
                <p className="text-xs text-white/80 font-medium">Lundi au Samedi (9h - 19h)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-3 mt-6">
          <p className="text-[10px] text-brand-orange font-semibold leading-relaxed">
            Espace d'échange crypté SSL. Vos documents d'identité et de paiement sont cryptés de bout en bout.
          </p>
        </div>
      </div>

      {/* Chat Area (Right 2 cols on desktop) */}
      <div className={`md:col-span-2 flex flex-col h-full bg-slate-950/20 border rounded-2xl p-4 min-h-0 relative ${theme === 'dark' ? 'border-white' : 'border-slate-950'}`}>
        
        {/* Header Info */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4 flex-shrink-0 md:relative fixed top-[53px] md:top-auto left-0 md:left-auto right-0 md:right-auto px-4 py-3 md:p-0 bg-slate-900 md:bg-transparent z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-lg font-bold">
              {advisor.avatarEmoji || '👨‍💼'}
            </div>
            {advisor.isOnline ? (
              <>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-ping" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
              </>
            ) : (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-500 border-2 border-slate-900 rounded-full" />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{advisor.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${advisor.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                {advisor.isOnline ? 'Conseiller en Ligne — répond immédiatement' : 'Conseiller hors-ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* Message log */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2 border border-white/5 rounded-2xl bg-slate-950/30 mb-4 p-4 min-h-0 pt-20 md:pt-4 pb-20 md:pb-4">
          {messages.map((m) => {
            const isUser = m.sender === 'student';
            return (
              <div 
                key={m.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-brand-orange text-white rounded-br-sm shadow-md shadow-brand-orange/10' 
                    : 'bg-white/10 border border-white/5 text-white/90 rounded-bl-sm'
                }`}>
                  <div>
                    {m.text && (m.text.startsWith('http://') || m.text.startsWith('https://')) ? (
                      m.text.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || m.text.includes('/image/upload/') ? (
                        <a href={m.text} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                          <img src={m.text} alt="Image jointe" onLoad={scrollToBottom} className="max-w-full rounded-xl max-h-60 border border-white/10 hover:opacity-85 transition-opacity block mt-1" />
                        </a>
                      ) : m.text.match(/\.pdf($|\?)/i) ? (
                        <a href={m.text} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-950/80 border border-white/10 rounded-xl text-indigo-400 hover:text-indigo-300 font-bold transition-all mt-1">
                          <span>📄</span>
                          <span className="underline truncate text-white">Document PDF</span>
                        </a>
                      ) : (
                        <a href={m.text} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-950/80 border border-white/10 rounded-xl text-indigo-400 hover:text-indigo-300 font-bold transition-all mt-1">
                          <span>📎</span>
                          <span className="underline truncate text-white">Fichier joint</span>
                        </a>
                      )
                    ) : (
                      <p className="text-white">{m.text}</p>
                    )}
                  </div>
                  <span className="block text-[8px] sm:text-[9px] text-white/40 text-right mt-1.5">{m.time}</span>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input field Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0 md:relative fixed bottom-16 md:bottom-auto left-0 md:left-auto right-0 md:right-auto p-4 md:p-0 bg-slate-900 md:bg-transparent border-t border-white/10 md:border-0 z-10 items-center">
          <label htmlFor="client-chat-file-upload" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-lg" title="Joindre un fichier">
            {chatUploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "📎"
            )}
          </label>
          <input
            id="client-chat-file-upload"
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleClientChatFileUpload}
            disabled={chatUploading}
          />
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Posez votre question à ${(advisor.name || '').split(' ')[0]} (ex. Délai, Légalité...)`}
            className="flex-1 bg-slate-950/80 border border-white/15 focus:border-brand-orange rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors text-white"
            disabled={chatUploading}
          />
          <button 
            type="submit"
            disabled={chatUploading}
            className="w-12 h-12 rounded-2xl bg-brand-orange hover:bg-brand-orange-dark flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
