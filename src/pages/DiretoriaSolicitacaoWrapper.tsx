import { useParams } from "react-router-dom";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import SolicitacaoDetalhe from "./SolicitacaoDetalhe";
import SolicitacaoServico from "./SolicitacaoServico";
import { AppLayout } from "@/components/AppLayout";

/**
 * Wrapper that picks the right detail component for the director route:
 * - Forwarded expedition items → SolicitacaoServico (shows correct form by tipo)
 * - Normal "Novo Colaborador" items → SolicitacaoDetalhe (original director form)
 */
const DiretoriaSolicitacaoWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const sol = useSolicitacao(id || "");

  if (!sol) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Carregando...</p>
      </AppLayout>
    );
  }

  // If the item was forwarded from expedition or RH (uniforme), use the service form
  if (sol.setorAtual === "diretoria" || sol.setorAtual === "diretoria_uniforme") {
    return <SolicitacaoServico />;
  }

  // Otherwise, use the original director detail form
  return <SolicitacaoDetalhe />;
};

export default DiretoriaSolicitacaoWrapper;
