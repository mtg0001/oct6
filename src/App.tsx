import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CursorFollower from "@/components/CursorFollower";
import Index from "./pages/Index";
import NovaSolicitacao from "./pages/NovaSolicitacao";
import DiretoriaAprovacao from "./pages/DiretoriaAprovacao";
import SolicitacaoDetalhe from "./pages/SolicitacaoDetalhe";
import RecursosHumanos from "./pages/RecursosHumanos";
import RHSolicitacaoDetalhe from "./pages/RHSolicitacaoDetalhe";
import LogisticaCompras from "./pages/LogisticaCompras";
import Expedicao from "./pages/Expedicao";
import MinhasSolicitacoes from "./pages/MinhasSolicitacoes";
import SolicitacaoServico from "./pages/SolicitacaoServico";
import SolicitacoesUnidade from "./pages/SolicitacoesUnidade";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/Usuarios";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Lixeira from "./pages/Lixeira";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CursorFollower />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/nova-solicitacao/:unidade" element={<ProtectedRoute><NovaSolicitacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor" element={<ProtectedRoute><DiretoriaAprovacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor/solicitacao/:id" element={<ProtectedRoute><SolicitacaoDetalhe /></ProtectedRoute>} />
            <Route path="/rh/:filtro" element={<ProtectedRoute><RecursosHumanos /></ProtectedRoute>} />
            <Route path="/rh/:filtro/solicitacao/:id" element={<ProtectedRoute><RHSolicitacaoDetalhe /></ProtectedRoute>} />
            <Route path="/logistica/:filtro" element={<ProtectedRoute><LogisticaCompras /></ProtectedRoute>} />
            <Route path="/logistica/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/expedicao/:filtro" element={<ProtectedRoute><Expedicao /></ProtectedRoute>} />
            <Route path="/expedicao/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes/:filtro" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/solicitacoes-go/:filtro" element={<ProtectedRoute><SolicitacoesUnidade unidadeFilter="goiania" title="Solicitações GO" /></ProtectedRoute>} />
            <Route path="/solicitacoes-go/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/solicitacoes-sp/:filtro" element={<ProtectedRoute><SolicitacoesUnidade unidadeFilter="saopaulo" title="Solicitações SP" /></ProtectedRoute>} />
            <Route path="/solicitacoes-sp/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/lixeira" element={<ProtectedRoute><Lixeira /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
