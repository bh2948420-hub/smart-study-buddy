import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSchedule, ScheduleItem } from '@/hooks/useSchedule';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const UploadSchedule = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const { schedule, loading, addScheduleItem, deleteScheduleItem, getDayName } = useSchedule();

  const [formData, setFormData] = useState({
    subject: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    classroom: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      toast.error(language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addScheduleItem({
        subject: formData.subject,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        classroom: formData.classroom || null,
        notes: null,
      });

      setFormData({
        subject: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        classroom: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const groupedSchedule = schedule.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, ScheduleItem[]>);

  const days = language === 'ar' ? DAYS_AR : DAYS_EN;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'الجدول الدراسي' : 'Study Schedule'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'أضف وإدر جدولك الدراسي' : 'Add and manage your study schedule'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Add Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === 'ar' ? 'إضافة حصة' : 'Add Class'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أضف حصة جديدة للجدول' : 'Add a new class to your schedule'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">
                    {language === 'ar' ? 'المادة *' : 'Subject *'}
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: الرياضيات' : 'e.g., Mathematics'}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="day">
                    {language === 'ar' ? 'اليوم *' : 'Day *'}
                  </Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={language === 'ar' ? 'اختر اليوم' : 'Select day'} />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start_time">
                      {language === 'ar' ? 'من *' : 'From *'}
                    </Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">
                      {language === 'ar' ? 'إلى *' : 'To *'}
                    </Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="classroom">
                    {language === 'ar' ? 'الفصل' : 'Classroom'}
                  </Label>
                  <Input
                    id="classroom"
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: قاعة 101' : 'e.g., Room 101'}
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Schedule Display */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === 'ar' ? 'جدولك الحالي' : 'Your Current Schedule'}
              </CardTitle>
              <CardDescription>
                {schedule.length} {language === 'ar' ? 'حصة' : 'classes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === 'ar' ? 'لا توجد حصص مضافة بعد' : 'No classes added yet'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const dayClasses = groupedSchedule[day];
                    if (!dayClasses || dayClasses.length === 0) return null;

                    return (
                      <div key={day}>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                          {getDayName(day, language)}
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{language === 'ar' ? 'المادة' : 'Subject'}</TableHead>
                              <TableHead>{language === 'ar' ? 'الوقت' : 'Time'}</TableHead>
                              <TableHead>{language === 'ar' ? 'الفصل' : 'Room'}</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayClasses.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.subject}</TableCell>
                                <TableCell>
                                  {item.start_time} - {item.end_time}
                                </TableCell>
                                <TableCell>{item.classroom || '-'}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteScheduleItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UploadSchedule;
