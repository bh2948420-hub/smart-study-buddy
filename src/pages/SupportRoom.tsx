import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Heart, Loader2, Trash2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

const COUNSELOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-counselor`;

interface CounselorMessage {
  id: number;
  message: string;
  is_ai: boolean;
  created_at: string;
}

const moodOptions = [
  { emoji: '😰', label_ar: 'قلقان', label_en: 'Anxious' },
  { emoji: '😢', label_ar: 'حزين', label_en: 'Sad' },
  { emoji: '😤', label_ar: 'متضايق', label_en: 'Frustrated' },
  { emoji: '😫', label_ar: 'مضغوط', label_en: 'Stressed' },
  { emoji: '😕', label_ar: 'محتار', label_en: 'Confused' },
  { emoji: '💔', label_ar: 'محبط', label_en: 'Disappointed' },
];

const SupportRoom = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === 'ar';

  const [messages, setMessages] = useState<CounselorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/auth');
      else setUser(user);
    };
    checkAuth();
  }, [navigate]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const streamResponse = async (userMessage: string, signal: AbortSignal) => {
    const recentMessages = messages.slice(-20);
    const apiMessages = recentMessages.map(m => ({
      role: m.is_ai ? 'assistant' : 'user',
      content: m.message,
    }));
    apiMessages.push({ role: 'user', content: userMessage });

    const response = await fetch(COUNSELOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages, language }),
      signal,
    });

    if (!response.ok) throw new Error('Failed to get response');
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              content += delta;
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs.length - 1;
                if (last >= 0 && msgs[last]?.is_ai && msgs[last].id === -1) {
                  msgs[last] = { ...msgs[last], message: content };
                }
                return msgs;
              });
            }
          } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
    return content;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setInput('');
    setIsLoading(true);
    setShowMoodPicker(false);

    const ts = Date.now();
    const userMsg: CounselorMessage = { id: ts, message: trimmed, is_ai: false, created_at: new Date().toISOString() };
    const placeholder: CounselorMessage = { id: -1, message: '', is_ai: true, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg, placeholder]);

    try {
      const aiContent = await streamResponse(trimmed, abortControllerRef.current.signal);
      setMessages(prev => prev.map(m => m.id === -1 ? { ...m, id: ts + 1, message: aiContent } : m));
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setMessages(prev => prev.filter(m => m.id !== -1));
      toast({ title: isAr ? 'خطأ' : 'Error', description: 'Failed to get response', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleMoodSelect = (mood: typeof moodOptions[0]) => {
    const prompt = isAr
      ? `أنا حاسس إني ${mood.label_ar} ${mood.emoji}`
      : `I'm feeling ${mood.label_en} ${mood.emoji}`;
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const text = {
    title: isAr ? 'غرفة الدعم النفسي' : 'Support Room',
    subtitle: isAr ? 'مكان آمن تتكلم فيه عن أي حاجة بتضايقك 💚' : 'A safe space to talk about anything bothering you 💚',
    welcome: isAr
      ? 'أهلاً بيك! أنا سند، مستشارك النفسي والدراسي 💚\n\nده مكان آمن تقدر تتكلم فيه عن أي حاجة بتضايقك أو بتقلقك، سواء في الدراسة أو في حياتك.\n\nإيه اللي حاسس بيه النهارده؟'
      : "Hi! I'm Sanad, your psychological and academic counselor 💚\n\nThis is a safe space where you can talk about anything bothering or worrying you, whether in school or life.\n\nHow are you feeling today?",
    placeholder: isAr ? 'اكتب اللي في بالك... كل كلامك في أمان 🔒' : 'Write what\'s on your mind... everything is confidential 🔒',
    howFeeling: isAr ? 'إيه اللي حاسس بيه؟' : 'How are you feeling?',
    privacy: isAr ? 'محادثتك خاصة وآمنة تماماً' : 'Your conversation is completely private and safe',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <Navbar />
      <main className="flex-1 container py-4 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-destructive" />
              {text.title}
            </h1>
            <p className="text-sm text-muted-foreground">{text.subtitle}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" />
              {text.privacy}
            </Badge>
            <Button variant="outline" size="icon" onClick={() => { setMessages([]); setShowMoodPicker(true); }} disabled={isLoading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-destructive/20">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', minHeight: 0 }}>
            <div className="space-y-4 pb-4">
              {/* Welcome */}
              {messages.length === 0 && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 text-lg">💚</div>
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{text.welcome}</p>
                  </div>
                </div>
              )}

              {/* Mood Picker */}
              {showMoodPicker && messages.length === 0 && (
                <div className="animate-fade-in">
                  <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{text.howFeeling}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {moodOptions.map(mood => (
                      <button
                        key={mood.label_en}
                        onClick={() => handleMoodSelect(mood)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all"
                      >
                        <span className="text-xl">{mood.emoji}</span>
                        <span className="text-sm font-medium">{isAr ? mood.label_ar : mood.label_en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map(msg => (
                <div key={`${msg.id}-${msg.created_at}`} className={cn('flex gap-3 animate-fade-in', !msg.is_ai ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm', !msg.is_ai ? 'bg-primary text-primary-foreground' : 'bg-destructive/10')}>
                    {!msg.is_ai ? '🙋' : '💚'}
                  </div>
                  <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl', !msg.is_ai ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm')}>
                    {msg.is_ai && msg.id === -1 && !msg.message ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{isAr ? 'بيفكر...' : 'Thinking...'}</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border shrink-0 bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={text.placeholder}
                className="flex-1"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SupportRoom;
