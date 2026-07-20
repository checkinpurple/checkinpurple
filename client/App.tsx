import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";

import Index from "./pages/Index";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import POPIABanner from "./components/POPIABanner";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Broadcast from "./pages/Broadcast";
import Listen from "./pages/Listen";
import BuyCoins from "./pages/BuyCoins";
import Tiers from "./pages/Tiers";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import Influencer from "./pages/Influencer";
import Merchant from "./pages/Merchant";
import Store from "./pages/Store";
import Releases from "./pages/Releases";
import SubmitMusic from "./pages/SubmitMusic";
import ListeningParties from "./pages/ListeningParties";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistSettings from "./pages/ArtistSettings";
import Bookings from "./pages/Bookings";
import PostGig from "./pages/PostGig";
import Wall from "./pages/Wall";
import FanProfile from "./pages/FanProfile";
import InfluencerProfile from "./pages/InfluencerProfile";
import MerchantProfile from "./pages/MerchantProfile";
import PastStreams from "./pages/PastStreams";
import InfluencerSettings from "./pages/InfluencerSettings";
import NotFound from "./pages/NotFound";
import PlaylistsPage from "./pages/Playlists";
import Messages from "./pages/Messages";

const ADMIN_EMAIL = "checkinpurple@gmail.com";
const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  requiredRole,
  adminOnly,
}: {
  children: React.ReactNode;
  requiredRole?: "artist" | "fan" | "influencer" | "merchant";
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;

  const isAdmin = user.role === "admin" || user.email === ADMIN_EMAIL;
  if (isAdmin) return <>{children}</>;
  if (adminOnly) return <Navigate to="/dashboard" replace />;

  if (requiredRole === "artist") {
    if (user.role === "artist" || user.role === "artist_fan") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredRole === "fan") {
    if (user.role === "fan" || user.role === "artist_fan") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredRole === "influencer") {
    if (user.role === "influencer") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredRole === "merchant") {
    if (user.role === "merchant") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/store" element={<Store />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/parties" element={<ListeningParties />} />
              <Route path="/artist/:username" element={<ArtistProfile />} />
              <Route path="/fan/:username" element={<FanProfile />} />
              <Route path="/influencer/:username" element={<InfluencerProfile />} />
              <Route path="/merchant/:username" element={<MerchantProfile />} />
              <Route path="/influencer-settings" element={<ProtectedRoute requiredRole="influencer"><InfluencerSettings /></ProtectedRoute>} />
              <Route path="/past-streams" element={<ProtectedRoute><PastStreams /></ProtectedRoute>} />

              {/* Any logged-in user */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/buy-coins" element={<ProtectedRoute><BuyCoins /></ProtectedRoute>} />
              <Route path="/tiers" element={<ProtectedRoute><Tiers /></ProtectedRoute>} />
              <Route path="/fan" element={<ProtectedRoute><Dashboard viewAs="fan" /></ProtectedRoute>} />
              <Route path="/wall" element={<ProtectedRoute><Wall /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

              {/* Artist */}
              <Route path="/playlists" element={<ProtectedRoute requiredRole="artist"><PlaylistsPage /></ProtectedRoute>} />
              <Route path="/broadcast" element={<ProtectedRoute requiredRole="artist"><Broadcast /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute requiredRole="artist"><Wallet /></ProtectedRoute>} />
              <Route path="/releases" element={<ProtectedRoute requiredRole="artist"><Releases /></ProtectedRoute>} />
              <Route path="/submit-music" element={<ProtectedRoute requiredRole="artist"><SubmitMusic /></ProtectedRoute>} />
              <Route path="/artist-settings" element={<ProtectedRoute requiredRole="artist"><ArtistSettings /></ProtectedRoute>} />
              <Route path="/gigs/new" element={<ProtectedRoute requiredRole="artist"><PostGig /></ProtectedRoute>} />

              {/* Discovery - available to all logged-in users */}
              <Route path="/listen" element={<ProtectedRoute><Listen /></ProtectedRoute>} />

              {/* Influencer */}
              <Route path="/influencer" element={<ProtectedRoute requiredRole="influencer"><Influencer /></ProtectedRoute>} />

              {/* Merchant */}
              <Route path="/merchant" element={<ProtectedRoute requiredRole="merchant"><Merchant /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          <POPIABanner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
