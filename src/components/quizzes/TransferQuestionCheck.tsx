import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, CheckCircle2, XCircle, Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  quizId: number;
  originalPercentage: number;
}

interface Attempt {
  id: string;
  question_text: string;
  options: string[];
  topic?: string;
}

interface Verdict {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
}

export function TransferQuestionCheck({ quizId, originalPercentage }: Props) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [choice, setChoice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const start = async () => {
    setLoading(true);
    setVerdict(null);
    setChoice("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-transfer-question", {
        body: { quizId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAttempt(data as Attempt);
    } catch (e: any) {
      toast.error(e.message || (ar ? "تعذر توليد السؤال" : "Failed to generate"));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!attempt || !choice) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("grade_transfer_question", {
        p_attempt_id: attempt.id,
        p_answer: choice,
      });
      if (error) throw error;
      setVerdict(data as unknown as Verdict);
    } catch (e: any) {
      toast.error(e.message || (ar ? "تعذر التصحيح" : "Grading failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-lg">
              {ar ? "🎯 كاشف الفهم الحقيقي" : "🎯 Real Understanding Check"}
            </CardTitle>
            <CardDescription>
              {ar
                ? "سؤال واحد بسيناريو جديد لنكتشف: هل فهمت فعلاً، أم مجرد حفظت الإجابات؟"
                : "One novel-scenario question to reveal: did you truly understand, or just memorize?"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!attempt && !verdict && (
          <Button onClick={start} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                {ar ? "الذكاء الاصطناعي يبني السؤال..." : "AI is crafting the question..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                {ar ? "اختبر فهمي الحقيقي" : "Test my real understanding"}
              </>
            )}
          </Button>
        )}

        {attempt && (
          <div className="space-y-4">
            {attempt.topic && (
              <Badge variant="secondary" className="text-xs">
                {ar ? "المفهوم: " : "Concept: "}
                {attempt.topic}
              </Badge>
            )}
            <p className="text-base font-medium">{attempt.question_text}</p>
            <RadioGroup value={choice} onValueChange={setChoice} disabled={!!verdict}>
              {attempt.options.map((opt, idx) => {
                const isCorrect = verdict && opt === verdict.correct_answer;
                const isWrongPick = verdict && opt === choice && !verdict.is_correct;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                      !verdict && choice === opt && "border-primary bg-primary/5",
                      isCorrect && "border-green-500 bg-green-500/10",
                      isWrongPick && "border-red-500 bg-red-500/10"
                    )}
                  >
                    <RadioGroupItem value={opt} id={`tq-${idx}`} />
                    <Label htmlFor={`tq-${idx}`} className="flex-1 cursor-pointer">
                      {opt}
                    </Label>
                    {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {isWrongPick && <XCircle className="h-4 w-4 text-red-600" />}
                  </div>
                );
              })}
            </RadioGroup>

            {!verdict && (
              <Button onClick={submit} disabled={!choice || submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : ar ? "تحقق من إجابتي" : "Check my answer"}
              </Button>
            )}

            {verdict && (
              <div
                className={cn(
                  "p-4 rounded-lg border-2 space-y-2",
                  verdict.is_correct
                    ? "border-green-500 bg-green-500/5"
                    : "border-amber-500 bg-amber-500/5"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-lg">
                  {verdict.is_correct ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <span className="text-green-700 dark:text-green-400">
                        {ar ? "فهم حقيقي! 🏆" : "Genuine understanding! 🏆"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-6 w-6 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-400">
                        {ar ? "ثقة زائفة — راجع المفهوم!" : "False confidence — revisit this concept!"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm">
                  {verdict.is_correct
                    ? ar
                      ? `حصلت على ${originalPercentage.toFixed(0)}% في الاختبار، وأثبتّ الآن أنك تفهم فعلاً وليس مجرد حفظ.`
                      : `You scored ${originalPercentage.toFixed(0)}% on the quiz — and just proved it wasn't rote memorization.`
                    : ar
                    ? "نجحت في الاختبار الأصلي لكنك أخطأت في السيناريو الجديد — ده مؤشر إنك حفظت من غير ما تفهم بعمق. راجع الموضوع مرة تانية."
                    : "You passed the original quiz but missed the novel scenario — a sign of memorization without deep understanding. Revisit this topic."}
                </p>
                <div className="text-sm border-t pt-2 mt-2">
                  <p className="font-semibold mb-1">{ar ? "الشرح:" : "Explanation:"}</p>
                  <p className="text-muted-foreground">{verdict.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
