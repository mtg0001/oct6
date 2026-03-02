import { AppLayout } from "@/components/AppLayout";
import { LiveClock } from "@/components/dashboard/LiveClock";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ServiceBreakdown } from "@/components/dashboard/ServiceBreakdown";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentChamadosTI } from "@/components/dashboard/RecentChamadosTI";
import { FilePlus, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSolicitacoesHoje,
  useSolicitacoes,
  useTotaisPorStatus,
  useTotaisPorUnidade,
} from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";

const Index = () => {
  const currentUser = useCurrentUser();
  const hoje = useSolicitacoesHoje();
  const todas = useSolicitacoes();
  const totaisGeral = useTotaisPorStatus();
  const totaisGO = useTotaisPorUnidade("goiania");
  const totaisMairipora = useTotaisPorUnidade("mairipora");
  const totaisPinheiros = useTotaisPorUnidade("pinheiros");

  const entradasHoje = hoje.length;
  const saidasHoje = hoje.filter((s) => s.status === "resolvido" || s.status === "cancelado").length;
  const total = totaisGeral.pendente + totaisGeral.resolvido + totaisGeral.cancelado;

  const showGO = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("GOIÂNIA");
  const showMairipora = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("MAIRIPORÃ");
  const showPinheiros = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("PINHEIROS");

  return (
    <AppLayout>
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            Olá, {currentUser?.nome?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-xs text-muted-foreground">Aqui está o resumo das suas solicitações</p>
        </div>
        <LiveClock />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {/* Quick Access */}
        <div className="bg-card rounded-xl p-3 shadow-sm border border-border hover:shadow-md transition-shadow group overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <FilePlus className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Acesso Rápido</p>
          </div>
          <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">Nova Solicitação</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {showGO && (
              <Link to="/nova-solicitacao/goiania" className="text-[10px] px-2 py-0.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold shadow-sm whitespace-nowrap">Goiânia</Link>
            )}
            {showMairipora && (
              <Link to="/nova-solicitacao/mairipora" className="text-[10px] px-2 py-0.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold shadow-sm whitespace-nowrap">Mairiporã</Link>
            )}
            {showPinheiros && (
              <Link to="/nova-solicitacao/pinheiros" className="text-[10px] px-2 py-0.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold shadow-sm whitespace-nowrap">Pinheiros</Link>
            )}
          </div>
        </div>

        {/* Entradas Hoje */}
        <div className="bg-card rounded-xl p-3 shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="h-3.5 w-3.5 text-success" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Chamados Hoje</p>
          </div>
          <p className="text-2xl font-extrabold text-foreground leading-none">{entradasHoje}</p>
          <p className="text-[10px] text-muted-foreground mt-1">aberturas registradas</p>
        </div>

        {/* Saídas Hoje */}
        <div className="bg-card rounded-xl p-3 shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="h-3.5 w-3.5 text-destructive" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Resolv. / Canc.</p>
          </div>
          <p className="text-2xl font-extrabold text-foreground leading-none">{saidasHoje}</p>
          <p className="text-[10px] text-muted-foreground mt-1">finalizados hoje</p>
        </div>

        {/* Total */}
        <div className="bg-card rounded-xl p-3 shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Total Geral</p>
          </div>
          <p className="text-2xl font-extrabold text-foreground leading-none">{total}</p>
          <p className="text-[10px] text-muted-foreground mt-1">solicitações no sistema</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 mb-4">
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
        {showMairipora && (
          <DonutChart
            title="Mairiporã"
            pendente={totaisMairipora.pendente}
            resolvido={totaisMairipora.resolvido}
            cancelado={totaisMairipora.cancelado}
          />
        )}
        {showPinheiros && (
          <DonutChart
            title="Pinheiros"
            pendente={totaisPinheiros.pendente}
            resolvido={totaisPinheiros.resolvido}
            cancelado={totaisPinheiros.cancelado}
          />
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <div className="grid grid-cols-1 grid-rows-2 gap-2.5">
          <ActivityChart solicitacoes={todas} />
          <RecentChamadosTI />
        </div>
        <div className="grid grid-cols-1 grid-rows-2 gap-2.5">
          <ServiceBreakdown solicitacoes={todas} />
          <RecentActivity solicitacoes={todas} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
