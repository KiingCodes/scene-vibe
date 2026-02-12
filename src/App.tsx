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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  // Enable trending notifications globally
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
        <Route path="/club/:id" element={<ClubDetailPage />} />
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
