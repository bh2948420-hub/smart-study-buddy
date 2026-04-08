import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StudyBuddy } from "@/components/buddy/StudyBuddy";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Materials from "./pages/Materials";
import Quizzes from "./pages/Quizzes";
import UploadSchedule from "./pages/UploadSchedule";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Leaderboard from "./pages/Leaderboard";
import Insights from "./pages/Insights";
import FocusMode from "./pages/FocusMode";
import Challenge from "./pages/Challenge";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <StudyBuddy />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/upload-schedule" element={<UploadSchedule />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/focus" element={<FocusMode />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
