import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Send } from 'lucide-react';
import aiBuddy from '@/assets/ai-buddy.png';

// "AI Assistant" hero card from the reference design.
// Typing a question and pressing Start Chat opens the real chat with it prefilled.
export const DashAssistantCard = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const [draft, setDraft] = useState('');

  const openChat = (msg?: string) => {
    navigate('/chat', { state: { initialMessage: (msg ?? draft).trim() || undefined } });
  };

  return (
    <div className="relative flex min-h-[220px] flex-col overflow-hidden rounded-3xl bg-gradient-sidebar p-5 shadow-glow">
      <Sparkles className="absolute end-4 top-4 h-5 w-5 text-white/70" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="font-display text-xl font-extrabold text-white">{ar ? 'المساعد الذكي' : 'AI Assistant'}</h3>
          <span className="mt-1">🤖</span>
        </div>
        <p className="mt-1 text-xs font-bold text-white/75">{ar ? 'اسألني أي حاجة عن دراستك...' : 'Ask anything about your study...'}</p>

        <div className="mt-4 flex flex-1 items-end gap-3">
          <img
            src={aiBuddy}
            alt="AI Buddy"
            width={96}
            height={96}
            loading="lazy"
            className="h-24 w-24 shrink-0 drop-shadow-lg"
          />
          <div className="flex flex-1 flex-col gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                openChat();
              }}
              className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-sm"
              dir={dir}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={ar ? 'اشرحلي الدرس ببساطة...' : 'Explain this lesson in simple words...'}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-navy outline-none placeholder:text-muted-foreground/70"
              />
              <button
                type="submit"
                aria-label={ar ? 'ابعت' : 'Send'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <Button
              onClick={() => openChat()}
              className="self-start rounded-full bg-white/15 px-5 font-extrabold text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              {ar ? 'ابدأ الشات' : 'Start Chat'} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
