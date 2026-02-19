import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/nova-solicitacao/:unidade" element={<NovaSolicitacao />} />
          <Route path="/diretoria/:diretor" element={<DiretoriaAprovacao />} />
          <Route path="/diretoria/:diretor/solicitacao/:id" element={<SolicitacaoDetalhe />} />
          <Route path="/rh/:filtro" element={<RecursosHumanos />} />
          <Route path="/rh/:filtro/solicitacao/:id" element={<RHSolicitacaoDetalhe />} />
          <Route path="/logistica/:filtro" element={<LogisticaCompras />} />
          <Route path="/expedicao/:filtro" element={<Expedicao />} />
          <Route path="/minhas-solicitacoes/:filtro" element={<MinhasSolicitacoes />} />
          <Route path="/minhas-solicitacoes" element={<MinhasSolicitacoes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
