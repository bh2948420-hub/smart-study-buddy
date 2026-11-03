import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { FolderOpen, ChevronRight, FileText, Video, Image as ImageIcon, AudioLines, Files, BookOpen } from 'lucide-react';

export interface MaterialCounts {
  pdf: number;
  video: number;
  image: number;
  audio: number;
  document: number;
}

const tiles = [
  { key: 'pdf', icon: FileText, ar: 'PDF', en: 'PDF', cls: 'bg-destructive/10 text-destructive' },
  { key: 'video', icon: Video, ar: 'فيديوهات', en: 'Videos', cls: 'bg-primary/10 text-primary' },
  { key: 'more', icon: Files, ar: 'مستندات', en: 'Docs', cls: 'bg-warning/10 text-warning' },
  { key: 'image', icon: ImageIcon, ar: 'صور', en: 'Images', cls: 'bg-accent/15 text-accent' },
  { key: 'audio', icon: AudioLines, ar: 'صوتيات', en: 'Audio', cls: 'bg-success/10 text-success' },
  { key: 'book', icon: BookOpen, ar: 'اقرأ', en: 'Read', cls: 'bg-primary/10 text-primary' },
] as const;

// "My Materials" card from the reference design: a colorful grid of
// material-type tiles, each opening the real materials page filtered by type.
export const DashMaterialsCard = ({ counts }: { counts: MaterialCounts }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  const countFor = (key: string) =>
    key === 'more' ? counts.document : key === 'book' ? counts.pdf + counts.video + counts.image + counts.audio + counts.document : (counts as any)[key] ?? 0;

  const open = (key: string) => navigate(`/materials${key !== 'book' ? `?type=${key}` : ''}`);

  return (
    <div className="glass-card flex min-h-[240px] flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'موادي الدراسية' : 'My Materials'}</h3>
        </div>
        <button
          onClick={() => navigate('/materials')}
          className="flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary/80"
        >
          {ar ? 'الكل' : 'View All'} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-3 gap-2">
        {tiles.map((t) => {
          const n = countFor(t.key);
          return (
            <button
              key={t.key}
              onClick={() => open(t.key)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-background/60 p-2.5 transition-transform hover:scale-[1.04] hover:border-primary/40"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.cls}`}>
                <t.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-extrabold text-navy">{ar ? t.ar : t.en}</span>
              <span className="text-[10px] font-bold text-muted-foreground">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end text-3xl">📖</div>
    </div>
  );
};
