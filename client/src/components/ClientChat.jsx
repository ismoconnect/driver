import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [previewFile, setPreviewFile] = React.useState(null); // { url: string, type: 'image' | 'pdf' | 'raw' }
  const [selectedFileForPreview, setSelectedFileForPreview] = React.useState(null); // { file: File, localUrl: string, name: string, type: 'image' | 'pdf' | 'raw' }

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Le fichier dépasse 20 Mo.");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    const fileType = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'raw');
    setSelectedFileForPreview({
      file,
      localUrl,
      name: file.name,
      type: fileType
    });
    e.target.value = '';
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedFileForPreview) {
      const fileObj = selectedFileForPreview.file;
      URL.revokeObjectURL(selectedFileForPreview.localUrl);
      setSelectedFileForPreview(null);
      
      const mockEvent = {
        target: {
          files: [fileObj]
        }
      };
      await handleClientChatFileUpload(mockEvent);
    }
    if (chatInput.trim()) {
      await handleSendMessage(e);
    }
  };
  
  const getDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  const isPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().match(/\.pdf($|\?)/i);
  };

  const isImage = (url) => {
    if (!url) return false;
    if (isPdf(url)) return false;
    return url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || url.includes('/image/upload/');
  };

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome-1',
      sender: 'advisor',
      text: `Bonjour ! Je suis ${advisor.name || 'votre conseiller'}, votre conseiller dédié. Bienvenue dans votre Espace Permis sécurisé. 🇧🇪`,
      time: "Aujourd'hui, 10:15",
    },
    {
      id: 'welcome-2',
      sender: 'advisor',
      text: "Pour lancer officiellement votre dossier d'obtention sans examen, veuillez vous rendre dans l'onglet 'Faire ma demande' et compléter les étapes.",
      time: "Aujourd'hui, 10:16",
    }
  ] : messages;

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isTyping]);

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-6 relative z-10 h-[calc(100vh-144px)] md:h-full min-h-0 md:animate-[bubbleIn_0.5s_ease-out] animate-[fadeIn_0.3s_ease-out]">
      
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
      <div className={`md:col-span-2 flex flex-col h-full bg-slate-950/20 border rounded-2xl p-4 min-h-0 relative ${theme === 'dark' ? 'border-black' : 'border-slate-950'}`}>
        
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
          {displayMessages.map((m) => {
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
                      isPdf(m.text) ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <button 
                            type="button"
                            onClick={() => setPreviewFile({ url: m.text, type: 'pdf' })}
                            className="block w-28 cursor-zoom-in text-left focus:outline-none mt-1"
                          >
                            <div className="bg-slate-900/60 hover:bg-slate-950/80 border border-white/10 rounded-2xl p-2 transition-all hover:border-white/20">
                              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-white/10 mb-1.5">
                                <iframe 
                                  src={`${m.text}#toolbar=0&navpanes=0&scrollbar=0`}
                                  title="PDF Preview Mini" 
                                  className="absolute top-0 left-0 w-[200%] h-[200%] border-0 pointer-events-none transform scale-50 origin-top-left"
                                  scrolling="no"
                                />
                                <div className="absolute inset-0 bg-transparent" />
                              </div>
                              <div className="px-2 pb-1">
                                <p className="text-white font-bold text-xs truncate">Document PDF</p>
                                <p className="text-[10px] text-white/45 mt-0.5">Cliquez pour agrandir 🔍</p>
                              </div>
                            </div>
                          </button>
                          <a 
                            href={getDownloadUrl(m.text)} 
                            download 
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 rounded-lg text-white font-semibold text-[10px] transition-all w-fit cursor-pointer"
                          >
                            <span>📥</span> Télécharger le PDF
                          </a>
                        </div>
                      ) : isImage(m.text) ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <button 
                            type="button"
                            onClick={() => setPreviewFile({ url: m.text, type: 'image' })}
                            className="block max-w-full cursor-zoom-in focus:outline-none"
                          >
                            <img src={m.text} alt="Image jointe" onLoad={scrollToBottom} className="max-w-full rounded-xl max-h-60 border border-white/10 hover:opacity-85 transition-opacity block" />
                          </button>
                          <a 
                            href={getDownloadUrl(m.text)} 
                            download 
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 rounded-lg text-white font-semibold text-[10px] transition-all w-fit cursor-pointer"
                          >
                            <span>📥</span> Télécharger l'image
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 mt-1">
                          <button 
                            type="button"
                            onClick={() => setPreviewFile({ url: m.text, type: 'raw' })}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-950/80 border border-white/10 rounded-xl text-indigo-400 hover:text-indigo-300 font-bold transition-all text-left w-full cursor-pointer"
                          >
                            <span>📎</span>
                            <span className="underline truncate text-white">Fichier joint</span>
                          </button>
                          <a 
                            href={getDownloadUrl(m.text)} 
                            download 
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 rounded-lg text-white font-semibold text-[10px] transition-all w-fit cursor-pointer"
                          >
                            <span>📥</span> Télécharger le fichier
                          </a>
                        </div>
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
        <div className="flex-shrink-0 md:relative fixed bottom-16 md:bottom-auto left-0 md:left-auto right-0 md:right-auto p-4 md:p-0 bg-slate-900 md:bg-transparent border-t border-white/10 md:border-0 z-10 w-full md:w-auto">
          {selectedFileForPreview && (
            <div className="mb-2.5 p-2 bg-slate-900/95 border border-white/15 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedFileForPreview.type === 'image' ? (
                  <img 
                    src={selectedFileForPreview.localUrl} 
                    alt="Aperçu miniature" 
                    className="w-10 h-10 object-cover rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg text-red-400 flex-shrink-0">
                    {selectedFileForPreview.type === 'pdf' ? '📕' : '📎'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-bold truncate max-w-[120px] sm:max-w-[180px]">{selectedFileForPreview.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Fichier prêt à l'envoi</p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(selectedFileForPreview.localUrl);
                    setSelectedFileForPreview(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-white text-xs cursor-pointer transition-colors"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={onFormSubmit} className="flex gap-2 items-center w-full">
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
              onChange={onFileSelect}
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

      {previewFile && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/40">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                {previewFile.type === 'pdf' ? '📄 Aperçu du Document PDF' : previewFile.type === 'image' ? '📷 Aperçu de l\'Image' : '📎 Aperçu du Fichier'}
              </h3>
              <button 
                type="button"
                onClick={() => setPreviewFile(null)} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 flex items-center justify-center text-white text-xs cursor-pointer transition-colors"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/10">
              {previewFile.type === 'pdf' ? (
                <iframe 
                  src={previewFile.url} 
                  title="PDF Preview" 
                  className="w-full h-[60vh] rounded-xl border border-white/5 bg-slate-950" 
                />
              ) : previewFile.type === 'image' ? (
                <img 
                  src={previewFile.url} 
                  alt="Aperçu" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-white/5" 
                />
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-4">📎</span>
                  <p className="text-white text-sm font-semibold">Ce type de fichier ne supporte pas l'aperçu en ligne.</p>
                  <p className="text-white/40 text-xs mt-1">Vous pouvez le télécharger directement à l'aide du bouton ci-dessous.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/40 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setPreviewFile(null)} 
                className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
              <a 
                href={getDownloadUrl(previewFile.url)} 
                download
                onClick={() => {
                  setTimeout(() => setPreviewFile(null), 100);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-dark border border-brand-orange/20 rounded-xl text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-brand-orange/20 hover:scale-[1.02]"
              >
                <span>📥</span> Télécharger
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
