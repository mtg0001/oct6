import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NovaSolicitacao from "./pages/NovaSolicitacao";
import DiretoriaAprovacao from "./pages/DiretoriaAprovacao";
import SolicitacaoDetalhe from "./pages/SolicitacaoDetalhe";
import RecursosHumanos from "./pages/RecursosHumanos";
import RHSolicitacaoDetalhe from "./pages/RHSolicitacaoDetalhe";
import LogisticaCompras from "./pages/LogisticaCompras";
import Expedicao from "./pages/Expedicao";
import MinhasSolicitacoes from "./pages/MinhasSolicitacoes";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ConfigSupabase from "./pages/ConfigSupabase";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/config" element={<ConfigSupabase />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/nova-solicitacao/:unidade" element={<ProtectedRoute><NovaSolicitacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor" element={<ProtectedRoute><DiretoriaAprovacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor/solicitacao/:id" element={<ProtectedRoute><SolicitacaoDetalhe /></ProtectedRoute>} />
            <Route path="/rh/:filtro" element={<ProtectedRoute><RecursosHumanos /></ProtectedRoute>} />
            <Route path="/rh/:filtro/solicitacao/:id" element={<ProtectedRoute><RHSolicitacaoDetalhe /></ProtectedRoute>} />
            <Route path="/logistica/:filtro" element={<ProtectedRoute><LogisticaCompras /></ProtectedRoute>} />
            <Route path="/expedicao/:filtro" element={<ProtectedRoute><Expedicao /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes/:filtro" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
