import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SubjectStat {
  subject: string;
  avg: number;
  count: number;
}

const COLORS = {
  primary: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  good: '#16a34a',
  warn: '#d97706',
  bad: '#dc2626',
  bg: '#ffffff',
  soft: '#f3f4f6',
};

export const StudentReportExport = () => {
  const { language, dir } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isAr = language === 'ar';

  const buildReportHtml = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error(isAr ? 'يجب تسجيل الدخول' : 'Not authenticated');

    const [profileRes, resultsRes, sessionsRes, tasksRes] = await Promise.all([
      supabase.from('user_profiles').select('display_name, xp_points, level, streak_days').eq('user_id', user.id).maybeSingle(),
      supabase.from('quiz_results').select('percentage, score, total_questions, completed_at, quizzes(title, subject)').eq('user_id', user.id).order('completed_at', { ascending: false }),
      supabase.from('study_sessions').select('duration_minutes, subject, created_at').eq('user_id', user.id),
      supabase.from('tasks').select('completed, title, due_date').eq('user_id', user.id),
    ]);

    const profile = profileRes.data;
    const results = (resultsRes.data || []) as any[];
    const sessions = sessionsRes.data || [];
    const tasks = tasksRes.data || [];

    const totalMinutes = sessions.reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const completedTasks = tasks.filter((t: any) => t.completed).length;
    const avgScore = results.length
      ? Math.round(results.reduce((a, r) => a + Number(r.percentage), 0) / results.length)
      : 0;

    const map: Record<string, { total: number; count: number }> = {};
    results.forEach((r) => {
      const subj = r.quizzes?.subject || (isAr ? 'عام' : 'General');
      if (!map[subj]) map[subj] = { total: 0, count: 0 };
      map[subj].total += Number(r.percentage);
      map[subj].count += 1;
    });
    const subjects: SubjectStat[] = Object.entries(map)
      .map(([subject, v]) => ({ subject, avg: Math.round(v.total / v.count), count: v.count }))
      .sort((a, b) => b.avg - a.avg);

    const strong = subjects.filter((s) => s.avg >= 75);
    const weak = subjects.filter((s) => s.avg < 60);

    const t = (ar: string, en: string) => (isAr ? ar : en);
    const color = (v: number) => (v >= 75 ? COLORS.good : v >= 60 ? COLORS.warn : COLORS.bad);
    const label = (v: number) => (v >= 75 ? t('قوي', 'Strong') : v >= 60 ? t('متوسط', 'Average') : t('يحتاج دعم', 'Needs support'));

    const row = (s: SubjectStat) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.text}">${s.subject}</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.muted}">${s.count}</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${COLORS.border};font-size:13px;font-weight:700;color:${color(s.avg)}">${s.avg}%</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${color(s.avg)}">${label(s.avg)}</td>
      </tr>`;

    const stat = (value: string, caption: string) => `
      <div style="flex:1;background:${COLORS.soft};border-radius:10px;padding:12px 14px;">
        <div style="font-size:22px;font-weight:800;color:${COLORS.primary}">${value}</div>
        <div style="font-size:11px;color:${COLORS.muted};margin-top:2px">${caption}</div>
      </div>`;

    const lastResults = results.slice(0, 8).map((r) => `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.text}">${r.quizzes?.title || t('اختبار', 'Quiz')}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted}">${format(new Date(r.completed_at), 'yyyy-MM-dd')}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${COLORS.border};font-size:12px;font-weight:700;color:${color(Number(r.percentage))}">${r.score}/${r.total_questions} (${Math.round(Number(r.percentage))}%)</td>
      </tr>`).join('');

    const list = (items: SubjectStat[], empty: string) =>
      items.length
        ? items.map((s) => `<li style="margin-bottom:4px;font-size:13px;color:${COLORS.text}">${s.subject} — ${s.avg}%</li>`).join('')
        : `<li style="font-size:13px;color:${COLORS.muted}">${empty}</li>`;

    return `
      <div dir="${dir}" style="width:794px;padding:36px 40px;background:${COLORS.bg};font-family:'Segoe UI',Tahoma,Arial,sans-serif;box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ${COLORS.primary};padding-bottom:12px;margin-bottom:20px">
          <div>
            <div style="font-size:24px;font-weight:800;color:${COLORS.primary}">${t('تقرير أداء الطالب', 'Student Performance Report')}</div>
            <div style="font-size:13px;color:${COLORS.muted};margin-top:4px">${profile?.display_name || t('طالب', 'Student')} — ${t('المستوى', 'Level')} ${profile?.level ?? 1}</div>
          </div>
          <div style="font-size:11px;color:${COLORS.muted}">${format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:22px">
          ${stat(`${Math.round((totalMinutes / 60) * 10) / 10}h`, t('إجمالي المذاكرة', 'Total study'))}
          ${stat(`${results.length}`, t('اختبارات', 'Quizzes'))}
          ${stat(`${avgScore}%`, t('متوسط الدرجات', 'Average score'))}
          ${stat(`${completedTasks}`, t('مهام مكتملة', 'Tasks done'))}
          ${stat(`${profile?.streak_days ?? 0}`, t('أيام متتالية', 'Day streak'))}
        </div>

        <div style="font-size:16px;font-weight:700;color:${COLORS.text};margin-bottom:8px">${t('مستوى الإتقان لكل مادة', 'Mastery by subject')}</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:22px">
          <thead><tr style="background:${COLORS.soft}">
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('المادة', 'Subject')}</th>
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('عدد الاختبارات', 'Quizzes')}</th>
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('المتوسط', 'Average')}</th>
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('التقييم', 'Rating')}</th>
          </tr></thead>
          <tbody>${subjects.length ? subjects.map(row).join('') : `<tr><td colspan="4" style="padding:12px;font-size:13px;color:${COLORS.muted}">${t('لا توجد بيانات اختبارات بعد', 'No quiz data yet')}</td></tr>`}</tbody>
        </table>

        <div style="display:flex;gap:14px;margin-bottom:22px">
          <div style="flex:1;border:1px solid ${COLORS.border};border-left:4px solid ${COLORS.good};border-radius:8px;padding:12px 14px">
            <div style="font-size:14px;font-weight:700;color:${COLORS.good};margin-bottom:6px">${t('نقاط القوة', 'Strengths')}</div>
            <ul style="margin:0;padding-${isAr ? 'right' : 'left'}:18px">${list(strong, t('لسه محتاج اختبارات أكتر', 'Needs more quizzes'))}</ul>
          </div>
          <div style="flex:1;border:1px solid ${COLORS.border};border-left:4px solid ${COLORS.bad};border-radius:8px;padding:12px 14px">
            <div style="font-size:14px;font-weight:700;color:${COLORS.bad};margin-bottom:6px">${t('نقاط الضعف', 'Weaknesses')}</div>
            <ul style="margin:0;padding-${isAr ? 'right' : 'left'}:18px">${list(weak, t('لا توجد مواد ضعيفة 👏', 'No weak subjects 👏'))}</ul>
          </div>
        </div>

        <div style="font-size:16px;font-weight:700;color:${COLORS.text};margin-bottom:8px">${t('آخر الاختبارات', 'Recent quizzes')}</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:${COLORS.soft}">
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('الاختبار', 'Quiz')}</th>
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('التاريخ', 'Date')}</th>
            <th style="text-align:${isAr ? 'right' : 'left'};padding:8px 10px;font-size:12px;color:${COLORS.muted}">${t('النتيجة', 'Score')}</th>
          </tr></thead>
          <tbody>${lastResults || `<tr><td colspan="3" style="padding:12px;font-size:13px;color:${COLORS.muted}">${t('لا توجد نتائج', 'No results')}</td></tr>`}</tbody>
        </table>

        <div style="margin-top:26px;border-top:1px solid ${COLORS.border};padding-top:10px;font-size:11px;color:${COLORS.muted}">
          ${t('تقرير مُولّد تلقائياً من SmartEdu — جاهز للمعلم', 'Auto-generated by SmartEdu — ready for the teacher')}
        </div>
      </div>`;
  };

  const handleExport = async () => {
    setLoading(true);
    const container = document.createElement('div');
    try {
      const html = await buildReportHtml();
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.background = '#ffffff';
      container.innerHTML = html;
      document.body.appendChild(container);

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      let remaining = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      remaining -= pageHeight;
      while (remaining > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        remaining -= pageHeight;
      }

      pdf.save(`student-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({
        title: isAr ? 'تم تصدير التقرير' : 'Report exported',
        description: isAr ? 'التقرير جاهز للمعلم 📄' : 'The PDF is ready for your teacher 📄',
      });
    } catch (e: any) {
      console.error('PDF export failed:', e);
      toast({
        title: isAr ? 'فشل التصدير' : 'Export failed',
        description: e?.message || (isAr ? 'حاول مرة أخرى' : 'Please try again'),
        variant: 'destructive',
      });
    } finally {
      container.remove();
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {isAr ? 'تصدير تقرير PDF' : 'Export PDF report'}
    </Button>
  );
};
