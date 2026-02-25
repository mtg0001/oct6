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
      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Quick Access */}
        <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-shadow">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Acesso Rápido</p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FilePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Nova Solicitação</p>
              <div className="flex gap-1.5 mt-1">
                {showGO && (
                  <Link to="/nova-solicitacao/goiania" className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-medium">GO</Link>
                )}
                {showSP && (
                  <Link to="/nova-solicitacao/sao-paulo" className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-medium">SP</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Entradas Hoje */}
        <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-shadow">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Chamados Hoje</p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{entradasHoje}</p>
          </div>
        </div>

        {/* Saídas Hoje */}
        <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-shadow">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Resolv. / Canc. Hoje</p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">{saidasHoje}</p>
          </div>
        </div>

        {/* Clock */}
        <LiveClock />
      </div>

      {/* Charts + Calculator row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <DonutChart
          title="Geral"
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
        <Calculator />
      </div>
    </AppLayout>
  );
};

export default Index;
