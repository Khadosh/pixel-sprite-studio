import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { isAuthError } from "@/lib/authErrors";
import { toast } from "@/hooks/use-toast";

import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import Catalog from "./pages/Catalog.tsx";
import AssetDetail from "./pages/AssetDetail.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProjectWorkspace from "./pages/ProjectWorkspace.tsx";
import SpriteStudio from "./pages/SpriteStudio.tsx";

import IconPreview from "./pages/IconPreview.tsx";
import NotFound from "./pages/NotFound.tsx";

// Varias queries pueden fallar a la vez con el mismo JWT expirado: cerrar sesión una sola vez.
let handlingSessionExpiry = false;
async function handleSessionExpired() {
  if (handlingSessionExpiry) return;
  handlingSessionExpiry = true;
  toast({
    title: "Sesión expirada",
    description: "Volvé a iniciar sesión para seguir trabajando.",
    variant: "destructive",
  });
  try {
    await supabase.auth.signOut();
  } finally {
    handlingSessionExpiry = false;
  }
}

const onQueryError = (error: unknown) => {
  if (isAuthError(error)) void handleSessionExpired();
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onQueryError }),
  mutationCache: new MutationCache({ onError: onQueryError }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isAuthError(error) && failureCount < 2,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/project/:projectSlug" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
            <Route path="/project/:projectSlug/editor/:spriteSlug" element={<ProtectedRoute><SpriteStudio /></ProtectedRoute>} />

            {/* Public Catalog Routes */}
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/asset/:assetSlug" element={<AssetDetail />} />
            <Route path="/icon-preview" element={<IconPreview />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
