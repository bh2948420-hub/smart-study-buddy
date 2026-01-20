import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages, Message } from '@/hooks/useMessages';
import { CurriculumUploader } from '@/components/chat/CurriculumUploader';
import { useCurriculum } from '@/hooks/useCurriculum';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { messages, loading, clearMessages, setMessages, addMessage } = useMessages();
  const { getCurriculumContext } = useCurriculum();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      } else {
        setUser(user);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-scroll to bottom - improved
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const streamChat = async (userMessage: string, signal: AbortSignal) => {
    const curriculumContext = getCurriculumContext();
    
    // Build messages array for API - only use last 20 messages to avoid overload
    const recentMessages = messages.slice(-20);
    const apiMessages = recentMessages.map(m => ({
      role: m.is_ai ? 'assistant' : 'user',
      content: m.message
    }));
    apiMessages.push({ role: 'user', content: userMessage });

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        language,
        curriculumContext,
      }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(language === 'ar' ? 'تم تجاوز الحد الأقصى، حاول لاحقاً' : 'Rate limit exceeded');
      }
      if (response.status === 402) {
        throw new Error(language === 'ar' ? 'يرجى إضافة رصيد' : 'Payment required');
      }
      throw new Error('Failed to get AI response');
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let textBuffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // Update the last message in state (use functional update to avoid stale state)
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (lastIndex >= 0 && newMessages[lastIndex]?.is_ai && newMessages[lastIndex].id === -1) {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], message: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return assistantContent;
  };

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setInput('');
    setIsLoading(true);

    const messageTimestamp = Date.now();

    // Add user message immediately (optimistic)
    const userMsg: Message = {
      id: messageTimestamp,
      user_id: user?.id ?? 'local',
      message: trimmed,
      is_ai: false,
      created_at: new Date().toISOString(),
    };

    // Add placeholder for AI response
    const aiPlaceholder: Message = {
      id: -1, // Temporary ID
      user_id: user?.id ?? 'local',
      message: '',
      is_ai: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, aiPlaceholder]);

    try {
      // Save user message to DB (non-blocking)
      addMessage(trimmed, false).catch(console.error);

      // Stream AI response
      const aiContent = await streamChat(trimmed, abortControllerRef.current.signal);

      // Update placeholder with final content and real ID
      setMessages(prev => prev.map(m => 
        m.id === -1 ? { ...m, id: messageTimestamp + 1, message: aiContent } : m
      ));

      // Save AI message to DB (non-blocking)
      if (aiContent) {
        addMessage(aiContent, true).catch(console.error);
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Chat error:', error);
      // Remove the placeholder on error
      setMessages(prev => prev.filter(m => m.id !== -1));
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const chatText = {
    title: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
    subtitle: language === 'ar' ? 'اسأل أي سؤال عن منهجك' : 'Ask any question about your curriculum',
    clearChat: language === 'ar' ? 'مسح المحادثة' : 'Clear chat',
    typing: language === 'ar' ? 'جاري الكتابة...' : 'Typing...',
    placeholder: language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...',
    send: language === 'ar' ? 'إرسال' : 'Send',
    welcome: language === 'ar' 
      ? 'مرحباً! أنا لميس، مساعدك الدراسي الذكي. كيف يمكنني مساعدتك اليوم؟'
      : 'Hello! I am Lamees, your smart study assistant. How can I help you today?',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <Navbar />

      <main className="flex-1 container py-4 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{chatText.title}</h1>
            <p className="text-sm text-muted-foreground">{chatText.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearMessages} 
              title={chatText.clearChat}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CurriculumUploader />
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable messages area - improved for all devices */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 scroll-smooth"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              minHeight: 0,
            }}
          >
            <div className="space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm">
                    <p className="text-sm leading-relaxed">{chatText.welcome}</p>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={`${message.id}-${message.created_at}`}
                  className={cn(
                    'flex gap-3 animate-fade-in',
                    !message.is_ai ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      !message.is_ai
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {!message.is_ai ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl',
                      !message.is_ai
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}
                  >
                    {message.is_ai && message.id === -1 && !message.message ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{chatText.typing}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <p
                          className={cn(
                            'text-xs mt-1 opacity-70',
                            !message.is_ai
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {new Date(message.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Input area - always visible at bottom */}
          <div className="p-4 border-t border-border shrink-0 bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatText.placeholder}
                className="flex-1"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || isLoading} 
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{chatText.send}</span>
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
