import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useTrendingNotifications } from "@/hooks/useTrendingNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import InstallPrompt from "./components/InstallPrompt";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import MapPage from "./pages/MapPage";
import ChatPage from "./pages/ChatPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import SuggestSpotPage from "./pages/SuggestSpotPage";
import SavedPage from "./pages/SavedPage";
import AdminPage from "./pages/AdminPage";
import InsightsPage from "./pages/InsightsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import VibeHistoryPage from "./pages/VibeHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import CrewsPage from "./pages/CrewsPage";
import EventsPage from "./pages/EventsPage";
import VideosPage from "./pages/VideosPage";
import NightReplayPage from "./pages/NightReplayPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  useTrendingNotifications();
  usePushNotifications();

  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthGuard><AuthPage /></AuthGuard>} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/crews" element={<CrewsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/night-replay" element={<NightReplayPage />} />
        <Route path="/club/:id" element={<ClubDetailPage />} />
        <Route path="/suggest" element={<SuggestSpotPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/history" element={<VibeHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
