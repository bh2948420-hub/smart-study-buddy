import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/useMessages';
import { CurriculumUploader } from '@/components/chat/CurriculumUploader';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const { messages, loading, clearMessages, setMessages } = useMessages();
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1) Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user_id: user?.id ?? 'local',
        message: trimmed,
        is_ai: false,
        created_at: new Date().toISOString(),
      },
    ]);

    // 2) Clear input
    setInput('');

    // 3) After 2 seconds, add a dummy AI reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          user_id: user?.id ?? 'local',
          message: 'أهلاً! هذه رسالة تجريبية من AI. أنا جاهز للإجابة على أسئلتك.',
          is_ai: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }, 2000);
  };

  const handleSend = () => {
    void handleSendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <Navbar />

      <main className="flex-1 container py-4 md:py-8 flex flex-col max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('chat')}</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar'
                ? 'اسأل أي سؤال عن منهجك'
                : 'Ask any question about your curriculum'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={clearMessages} title={language === 'ar' ? 'مسح المحادثة' : 'Clear chat'}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <CurriculumUploader />
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm">
                    <p className="text-sm leading-relaxed">{t('chatWelcome')}</p>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatPlaceholder')}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t('send')}</span>
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
