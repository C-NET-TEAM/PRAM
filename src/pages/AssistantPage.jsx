import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, User, Send, Copy, RotateCcw, Download, Sparkles, Check, Square } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { useAI, AI_FUNCTIONS } from '../context/AIContext';

export default function AssistantPage() {
  const { t } = useTranslation();
  const { messages, isTyping, handleSend: sendAI, handleRegenerate, clearChat, stopAIRequest } = useAI();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    await sendAI(userText);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (text) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRAM-AI-Content-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFunctionClick = (func) => {
    setInput(`Please ${func.label.toLowerCase()} for my next post.`);
  };

  return (
    <div className="h-full flex flex-col max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)]">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {t('assistant.title', 'AI Assistant')}
          </h2>
          <p className="text-muted-foreground">{t('assistant.desc', 'Generate high-converting content using AI.')}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={clearChat} className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Clear Chat
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm border-border mt-2 sm:mt-0">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-blue-100 text-primary'}`}>
                {msg.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] sm:max-w-[70%] space-y-3 ${msg.type === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`p-4 rounded-2xl ${msg.type === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-card border border-border shadow-sm rounded-tl-none text-foreground whitespace-pre-wrap'
                  }`}>
                  {msg.text}
                </div>

                {/* AI Options */}
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map(opt => {
                      // Retrieve the original icon component from AI_FUNCTIONS if it was lost during JSON serialization
                      const originalFunc = AI_FUNCTIONS.find(f => f.id === opt.id);
                      const Icon = originalFunc ? originalFunc.icon : null;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleFunctionClick(opt)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-blue-50 hover:border-blue-200 hover:text-primary transition-colors shadow-sm"
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Action Cards (Copy, Regenerate, Export) */}
                {msg.hasActions && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-xs py-1"
                      onClick={() => handleCopy(msg.text, msg.id)}
                    >
                      {copiedId === msg.id ? (
                        <><Check className="w-3 h-3 mr-1.5 text-green-500" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1.5" /> Copy</>
                      )}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-xs py-1"
                      onClick={() => handleRegenerate(index)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" /> Regenerate
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-xs py-1"
                      onClick={() => handleExport(msg.text)}
                    >
                      <Download className="w-3 h-3 mr-1.5" /> Export
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border rounded-tl-none flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('assistant.placeholder', 'Ask the AI to generate a caption, hashtag, or image prompt...')}
              className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            {isTyping ? (
              <Button
                size="icon"
                variant="destructive"
                className="absolute right-2 bottom-2 rounded-lg"
                onClick={stopAIRequest}
                title="Stop generation"
              >
                <Square className="w-5 h-5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="absolute right-2 bottom-2 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
