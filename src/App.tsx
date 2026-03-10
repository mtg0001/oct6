import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CursorFollower from "@/components/CursorFollower";
import Index from "./pages/Index";
import NovaSolicitacao from "./pages/NovaSolicitacao";
import DiretoriaAprovacao from "./pages/DiretoriaAprovacao";
import DiretoriaSolicitacaoWrapper from "./pages/DiretoriaSolicitacaoWrapper";
import RecursosHumanos from "./pages/RecursosHumanos";
import RHSolicitacaoWrapper from "./pages/RHSolicitacaoWrapper";
import LogisticaCompras from "./pages/LogisticaCompras";
import Expedicao from "./pages/Expedicao";
import CustomerSuccess from "./pages/CustomerSuccess";
import CAD from "./pages/CAD";
import MinhasSolicitacoes from "./pages/MinhasSolicitacoes";
import SolicitacaoServico from "./pages/SolicitacaoServico";
import SolicitacoesUnidade from "./pages/SolicitacoesUnidade";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/Usuarios";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Lixeira from "./pages/Lixeira";
import ChamadoTINovo from "./pages/ChamadoTINovo";
import ChamadosTILista from "./pages/ChamadosTILista";
import ChamadoTIDetalhe from "./pages/ChamadoTIDetalhe";
import DiretoriaChamadoTIDetalhe from "./pages/DiretoriaChamadoTIDetalhe";
import ColaboradoresPJ from "./pages/ColaboradoresPJ";
import ColaboradoresCLT from "./pages/ColaboradoresCLT";
import HistoricoChats from "./pages/HistoricoChats";
import GlpiPage from "./pages/GlpiPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MusicPlayerProvider>
          <CursorFollower />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/nova-solicitacao/:unidade" element={<ProtectedRoute><NovaSolicitacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor" element={<ProtectedRoute><DiretoriaAprovacao /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor/solicitacao/:id" element={<ProtectedRoute><DiretoriaSolicitacaoWrapper /></ProtectedRoute>} />
            <Route path="/diretoria/:diretor/chamado-ti/:id" element={<ProtectedRoute><DiretoriaChamadoTIDetalhe /></ProtectedRoute>} />
            <Route path="/rh/colaboradores-pj" element={<ProtectedRoute><ColaboradoresPJ /></ProtectedRoute>} />
            <Route path="/rh/colaboradores-clt" element={<ProtectedRoute><ColaboradoresCLT /></ProtectedRoute>} />
            <Route path="/rh/:filtro" element={<ProtectedRoute><RecursosHumanos /></ProtectedRoute>} />
            <Route path="/rh/:filtro/solicitacao/:id" element={<ProtectedRoute><RHSolicitacaoWrapper /></ProtectedRoute>} />
            <Route path="/logistica/:filtro" element={<ProtectedRoute><LogisticaCompras /></ProtectedRoute>} />
            <Route path="/logistica/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/expedicao/:filtro" element={<ProtectedRoute><Expedicao /></ProtectedRoute>} />
            <Route path="/expedicao/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/cs/:filtro" element={<ProtectedRoute><CustomerSuccess /></ProtectedRoute>} />
            <Route path="/cs/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/cad/:filtro" element={<ProtectedRoute><CAD /></ProtectedRoute>} />
            <Route path="/cad/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes/:filtro" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/minhas-solicitacoes" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/solicitacoes-go/:filtro" element={<ProtectedRoute><SolicitacoesUnidade unidadeFilter="goiania" title="Solicitações GO" /></ProtectedRoute>} />
            <Route path="/solicitacoes-go/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/solicitacoes-mairipora/:filtro" element={<ProtectedRoute><SolicitacoesUnidade unidadeFilter="mairipora" title="Solicitações Mairiporã" /></ProtectedRoute>} />
            <Route path="/solicitacoes-mairipora/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/solicitacoes-pinheiros/:filtro" element={<ProtectedRoute><SolicitacoesUnidade unidadeFilter="pinheiros" title="Solicitações Pinheiros" /></ProtectedRoute>} />
            <Route path="/solicitacoes-pinheiros/:filtro/solicitacao/:id" element={<ProtectedRoute><SolicitacaoServico /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/lixeira" element={<ProtectedRoute><Lixeira /></ProtectedRoute>} />
            <Route path="/chamado-ti/novo" element={<ProtectedRoute><ChamadoTINovo /></ProtectedRoute>} />
            <Route path="/chamado-ti/:filtro" element={<ProtectedRoute><ChamadosTILista contexto="chamado-ti" /></ProtectedRoute>} />
            <Route path="/chamado-ti/:filtro/chamado/:id" element={<ProtectedRoute><ChamadoTIDetalhe /></ProtectedRoute>} />
            <Route path="/ti/chamados/:filtro" element={<ProtectedRoute><ChamadosTILista contexto="ti" /></ProtectedRoute>} />
            <Route path="/ti/chamados/:filtro/chamado/:id" element={<ProtectedRoute><ChamadoTIDetalhe /></ProtectedRoute>} />
            <Route path="/ti/historico-chats" element={<ProtectedRoute><HistoricoChats /></ProtectedRoute>} />
            <Route path="/ti/glpi" element={<ProtectedRoute><GlpiPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MusicPlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
