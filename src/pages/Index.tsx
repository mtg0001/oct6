import { AppLayout } from "@/components/AppLayout";
import { LiveClock } from "@/components/dashboard/LiveClock";
import { Calculator } from "@/components/dashboard/Calculator";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { FilePlus, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSolicitacoesHoje,
  useTotaisPorStatus,
  useTotaisPorUnidade,
} from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";

const Index = () => {
  const currentUser = useCurrentUser();
  const hoje = useSolicitacoesHoje();
  const totaisGeral = useTotaisPorStatus();
  const totaisGO = useTotaisPorUnidade("goiania");
  const totaisSP = useTotaisPorUnidade("sao-paulo");

  const entradasHoje = hoje.length;
  const saidasHoje = hoje.filter((s) => s.status === "resolvido" || s.status === "cancelado").length;

  const showGO = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("GOIÂNIA");
  const showSP = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("SÃO PAULO");

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Quick Access */}
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Acesso Rápido</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FilePlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Nova Solicitação</p>
              <div className="flex gap-2 mt-1">
                {showGO && (
                  <Link to="/nova-solicitacao/goiania" className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">GO</Link>
                )}
                {showSP && (
                  <Link to="/nova-solicitacao/sao-paulo" className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">SP</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Entradas Hoje */}
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Chamados Hoje</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <ArrowDownToLine className="h-5 w-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{entradasHoje}</p>
          </div>
        </div>

        {/* Saídas Hoje */}
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Resolvidos / Cancelados Hoje</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <ArrowUpFromLine className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-foreground">{saidasHoje}</p>
          </div>
        </div>

        {/* Clock */}
        <LiveClock />

        {/* Donut Charts */}
        <DonutChart
          title="Minhas Solicitações (Geral)"
          pendente={totaisGeral.pendente}
          resolvido={totaisGeral.resolvido}
          cancelado={totaisGeral.cancelado}
        />
        {showGO && (
          <DonutChart
            title="Goiânia"
            pendente={totaisGO.pendente}
            resolvido={totaisGO.resolvido}
            cancelado={totaisGO.cancelado}
          />
        )}
        {showSP && (
          <DonutChart
            title="São Paulo"
            pendente={totaisSP.pendente}
            resolvido={totaisSP.resolvido}
            cancelado={totaisSP.cancelado}
          />
        )}

        {/* Calculator */}
        <Calculator />
      </div>
    </AppLayout>
  );
};

export default Index;
