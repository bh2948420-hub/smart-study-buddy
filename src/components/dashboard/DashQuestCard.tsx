import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPinned, ChevronRight } from 'lucide-react';
import questMap from '@/assets/quest-map.png';

// "Smart Quest" card from the reference design: treasure map artwork,
// a live progress badge and the golden "Reach the Treasure!" ribbon.
export const DashQuestCard = ({ percent }: { percent: number }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const pct = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="glass-card flex min-h-[220px] flex-col overflow-hidden rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MapPinned className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'رحلة Smart Quest' : 'Smart Quest'}</h3>
        </div>
        <button
          onClick={() => navigate('/quest')}
          className="flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary/80"
        >
          {ar ? 'افتح الخريطة' : 'View Map'} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="relative mt-3 flex-1 overflow-hidden rounded-2xl">
        <img src={questMap} alt="Quest treasure map" width={1024} height={704} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute end-3 top-3 rounded-full bg-primary px-3 py-1 font-display text-sm font-extrabold text-primary-foreground shadow-glow">
          {pct}%
        </span>
        <span className="absolute inset-x-6 bottom-3 rounded-full bg-gradient-gold py-1.5 text-center text-xs font-extrabold text-primary-foreground shadow-lg">
          {ar ? 'وصّل للكنز! 🏆' : 'Reach the Treasure! 🏆'}
        </span>
      </div>
    </div>
  );
};
