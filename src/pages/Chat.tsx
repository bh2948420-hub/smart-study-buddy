import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const { t, dir, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('chatWelcome'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Demo AI responses
  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Arabic responses
    if (language === 'ar') {
      if (lowerMessage.includes('رياضيات') || lowerMessage.includes('حساب')) {
        return 'الرياضيات موضوع رائع! يمكنني مساعدتك في الجبر، الهندسة، حساب التفاضل والتكامل، وأكثر. ما هو السؤال المحدد الذي تحتاج مساعدة فيه؟';
      }
      if (lowerMessage.includes('فيزياء')) {
        return 'الفيزياء تساعدنا على فهم كيف يعمل الكون! سواء كانت الميكانيكا، الديناميكا الحرارية، أو الكهرومغناطيسية، أنا هنا للمساعدة.';
      }
      if (lowerMessage.includes('امتحان') || lowerMessage.includes('اختبار')) {
        return 'للتحضير للامتحان، أنصحك بـ: 1) مراجعة ملاحظاتك بانتظام 2) حل أسئلة سنوات سابقة 3) الحصول على قسط كافٍ من النوم قبل الامتحان. هل تريد نصائح أكثر تحديداً؟';
      }
      return 'شكراً على سؤالك! أنا هنا لمساعدتك في دراستك. يمكنك أن تسألني عن أي موضوع في المنهج وسأبذل قصارى جهدي لشرحه لك.';
    }

    // English responses
    if (lowerMessage.includes('math') || lowerMessage.includes('calculate')) {
      return "Mathematics is a fascinating subject! I can help you with algebra, geometry, calculus, and more. What specific problem would you like help with?";
    }
    if (lowerMessage.includes('physics')) {
      return "Physics helps us understand how the universe works! Whether it's mechanics, thermodynamics, or electromagnetism, I'm here to help.";
    }
    if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
      return "For exam preparation, I recommend: 1) Review your notes regularly 2) Practice past papers 3) Get enough sleep before the exam. Would you like more specific tips?";
    }
    return "Thank you for your question! I'm here to help you with your studies. Feel free to ask me about any topic in your curriculum, and I'll do my best to explain it clearly.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpload = () => {
    toast.info(
      language === 'ar'
        ? 'قريباً! ميزة رفع المنهج'
        : 'Coming soon! Curriculum upload feature'
    );
  };

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
          <Button variant="outline" className="gap-2" onClick={handleUpload}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{t('uploadCurriculum')}</span>
          </Button>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-fade-in',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-1 opacity-70',
                        message.role === 'user'
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
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

          {/* Input Area */}
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
