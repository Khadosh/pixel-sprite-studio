import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import Catalog from "./pages/Catalog.tsx";
import AssetDetail from "./pages/AssetDetail.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProjectWorkspace from "./pages/ProjectWorkspace.tsx";
import SpriteStudio from "./pages/SpriteStudio.tsx";

import IconPreview from "./pages/IconPreview.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
            <Route path="/project/:id" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
            <Route path="/project/:projectId/editor/:spriteId" element={<ProtectedRoute><SpriteStudio /></ProtectedRoute>} />
            
            {/* Public Catalog Routes */}
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/asset/:assetId" element={<AssetDetail />} />
            <Route path="/icon-preview" element={<IconPreview />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
