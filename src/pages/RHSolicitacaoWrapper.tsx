import { useParams } from "react-router-dom";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import { AppLayout } from "@/components/AppLayout";
import RHSolicitacaoDetalhe from "./RHSolicitacaoDetalhe";
import SolicitacaoServico from "./SolicitacaoServico";

/**
 * Wrapper that picks the right detail component for the RH route:
 * - "Novo Colaborador" → RHSolicitacaoDetalhe (original RH form)
 * - Other types (e.g. Uniformes e EPI) → SolicitacaoServico (service form)
 */
const RHSolicitacaoWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const sol = useSolicitacao(id || "");

  if (!sol) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Carregando...</p>
      </AppLayout>
    );
  }

  if (sol.tipo === "Novo Colaborador") {
    return <RHSolicitacaoDetalhe />;
  }

  return <SolicitacaoServico />;
};

export default RHSolicitacaoWrapper;
