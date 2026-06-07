import React, { useEffect, useRef } from 'react';

const AdminMessages = ({
  chats,
  selectedChatId,
  setSelectedChatId,
  chatMessages,
  adminChatInput,
  setAdminChatInput,
  loadingMessages,
  chatUploading,
  chatFilePreview,
  setSelectedChatFile,
  setChatFilePreview,
  handleSendAdminReply,
  handleAdminChatFileUpload,
  setMessageToDelete,
  setPreviewUrl,
  setPreviewLabel
}) => {
  const adminChatEndRef = useRef(null);

  const scrollAdminChatToBottom = () => {
    if (adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      scrollAdminChatToBottom();
    }
  }, [chatMessages, selectedChatId]);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)] animate-fade-in">
      {/* Left pane: Chats List */}
      <div className="w-1/3 bg-slate-900/60 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden backdrop-blur-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conversations Actives</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {chats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 relative flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white truncate max-w-[150px]">
                    {chat.userName || 'Candidat'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {chat.lastMessageTime ? new Date(chat.lastMessageTime.toDate()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate pr-4">
                  {chat.lastMessageText || 'Pas de message'}
                </p>
                {chat.unreadByAdmin && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            );
          })}
          {chats.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              Aucune conversation pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Right pane: Active Thread */}
      <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm relative">
        {selectedChatId ? (
          <>
            {/* Selected Chat Header */}
            {(() => {
              const activeChat = chats.find(c => c.id === selectedChatId);
              return (
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                  <div>
                    <h4 className="font-bold text-white text-sm">{activeChat?.userName || 'Candidat'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{activeChat?.userEmail}</p>
                  </div>
                </div>
              );
            })()}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loadingMessages && chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isAdvisor = m.sender === 'advisor';
                  return (
                    <div key={m.id} className={`flex ${isAdvisor ? 'justify-end' : 'justify-start'} group relative items-center gap-2`}>
                      {/* Delete message button for admin */}
                      <button
                        onClick={() => setMessageToDelete(m.id)}
                        className={`opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 p-1.5 transition-opacity cursor-pointer text-xs rounded-lg hover:bg-rose-500/10 ${
                          isAdvisor ? 'order-first' : 'order-last'
                        }`}
                        title="Supprimer le message"
                      >
                        🗑️
                      </button>
                      <div className={`max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isAdvisor
                          ? 'bg-emerald-500 text-slate-950 rounded-br-none font-medium'
                          : 'bg-white/10 border border-white/5 text-white/90 rounded-bl-none'
                      }`}>
                        <div>
                          {m.text && (m.text.startsWith('http://') || m.text.startsWith('https://')) ? (
                            m.text.match(/\.pdf($|\?)/i) ? (
                              <a href={m.text} onClick={(e) => { e.preventDefault(); setPreviewUrl(m.text); setPreviewLabel("Pièce jointe"); }} className="block max-w-[200px] w-full cursor-zoom-in mt-1">
                                <div className="bg-slate-900/60 hover:bg-slate-950/80 border border-white/10 rounded-xl p-2 transition-all">
                                  <div className="relative aspect-[3/4] h-36 rounded-lg overflow-hidden bg-slate-950 border border-white/10 mb-1.5 flex items-center justify-center">
                                    <img 
                                      src={m.text.replace(/\.pdf($|\?)/i, (match, p1) => `.jpg${p1 || ''}`)} 
                                      alt="Aperçu du PDF" 
                                      className="w-full h-full object-cover"
                                      onLoad={scrollAdminChatToBottom}
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors">
                                      <span className="text-2xl text-white drop-shadow">📄</span>
                                    </div>
                                  </div>
                                  <div className={`flex items-center gap-1.5 text-xs font-bold ${
                                    isAdvisor ? 'text-slate-950 hover:text-slate-900' : 'text-indigo-400 hover:text-indigo-300'
                                  }`}>
                                    <span className="underline truncate">Document PDF</span>
                                  </div>
                                </div>
                              </a>
                            ) : m.text.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || m.text.includes('/image/upload/') ? (
                              <a href={m.text} onClick={(e) => { e.preventDefault(); setPreviewUrl(m.text); setPreviewLabel("Pièce jointe"); }} className="block max-w-full cursor-zoom-in">
                                <img src={m.text} alt="Image jointe" onLoad={scrollAdminChatToBottom} className="max-w-full rounded-xl max-h-60 border border-white/10 hover:opacity-85 transition-opacity block mt-1" />
                              </a>
                            ) : (
                              <a href={m.text} onClick={(e) => { e.preventDefault(); setPreviewUrl(m.text); setPreviewLabel("Pièce jointe"); }} className={`flex items-center gap-2 px-3 py-2 border rounded-xl font-bold transition-all mt-1 cursor-zoom-in ${
                                isAdvisor
                                  ? 'bg-slate-950/20 hover:bg-slate-950/35 border-slate-950/15 text-slate-950 hover:text-slate-900'
                                  : 'bg-slate-950/60 hover:bg-slate-900 border-white/10 text-indigo-400 hover:text-indigo-300'
                              }`}>
                                <span>📎</span>
                                <span className="underline truncate">Fichier joint</span>
                              </a>
                            )
                          ) : (
                            <p>{m.text}</p>
                          )}
                        </div>
                        <span className={`block text-[9px] text-right mt-1.5 ${isAdvisor ? 'text-slate-950 opacity-60 font-semibold' : 'text-white/40'}`}>
                          {m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={adminChatEndRef} />
            </div>

            {/* Chat File Preview Area */}
            {chatFilePreview && (
              <div className="mx-4 p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl flex items-center justify-between gap-3 animate-fade-in relative z-20 mb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  {chatFilePreview.type.startsWith('image/') ? (
                    <img src={chatFilePreview.url} alt="Aperçu" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xl text-white">📄</div>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold text-white truncate">{chatFilePreview.name}</span>
                    <span className="text-[10px] text-slate-500">Prêt à envoyer</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChatFile(null);
                    if (chatFilePreview?.url) URL.revokeObjectURL(chatFilePreview.url);
                    setChatFilePreview(null);
                  }}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Chat Input form */}
            <form onSubmit={handleSendAdminReply} className="p-4 border-t border-white/5 bg-slate-900/20 flex gap-2 items-center">
              <label htmlFor="admin-chat-file-upload" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-lg text-white" title="Joindre un fichier">
                {chatUploading ? (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  "📎"
                )}
              </label>
              <input
                id="admin-chat-file-upload"
                type="file"
                className="hidden"
                disabled={chatUploading}
                onChange={handleAdminChatFileUpload}
              />
              <input
                type="text"
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                placeholder="Rédiger votre réponse..."
                className="flex-1 bg-slate-950/80 border border-white/15 focus:border-emerald-500 rounded-2xl px-5 py-3.5 text-xs sm:text-sm focus:outline-none transition-colors text-white"
              />
              <button
                type="submit"
                disabled={chatUploading || (!adminChatInput.trim() && !chatFilePreview)}
                className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center font-bold transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 cursor-pointer"
              >
                ➔
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm font-medium">Sélectionnez une conversation active dans le menu de gauche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
