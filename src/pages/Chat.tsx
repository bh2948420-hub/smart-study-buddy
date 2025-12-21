import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMessages } from '@/hooks/useMessages';
import { useCurriculum } from '@/hooks/useCurriculum';
import { CurriculumUploader } from '@/components/chat/CurriculumUploader';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const { messages, loading, addMessage, clearMessages, setMessages } = useMessages();
  const { getCurriculumContext } = useCurriculum();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // Save user message
      await addMessage(userMessageContent, false);

      // Build messages for AI with curriculum context
      const curriculumContext = getCurriculumContext();
      const aiMessages = messages.map(m => ({
        role: m.is_ai ? 'assistant' : 'user',
        content: m.message,
      }));
      
      // Add curriculum context to the first message if available
      let userContent = userMessageContent;
      if (curriculumContext && aiMessages.length === 0) {
        userContent = `[سياق المنهج المرفوع]:\n${curriculumContext}\n\n[سؤال الطالب]:\n${userMessageContent}`;
      }
      aiMessages.push({ role: 'user', content: userContent });

      // Call AI
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: aiMessages, language, curriculumContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });
          
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
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }

      // Save AI response
      if (assistantContent) {
        await addMessage(assistantContent, true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(language === 'ar' ? 'فشل في إرسال الرسالة' : 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
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

              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">{t('typing')}</span>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={isTyping}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="gap-2">
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
