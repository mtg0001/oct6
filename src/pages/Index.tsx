import { AppLayout } from "@/components/AppLayout";
import { LiveClock } from "@/components/dashboard/LiveClock";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ServiceBreakdown } from "@/components/dashboard/ServiceBreakdown";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentChamadosTI } from "@/components/dashboard/RecentChamadosTI";
import { FilePlus, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Monitor, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  getChamadosTI,
  ensureChamadosTILoaded,
  subscribeChamadosTI,
} from "@/stores/chamadosTIStore";
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

  const [chamadosTI, setChamadosTI] = useState<any[]>([]);
  useEffect(() => {
    if (!currentUser?.administrador) return;
    ensureChamadosTILoaded().then(() => setChamadosTI(getChamadosTI()));
    return subscribeChamadosTI(() => setChamadosTI(getChamadosTI()));
  }, [currentUser?.administrador]);

  const isAdmin = currentUser?.administrador;

  const tiHoje = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return chamadosTI.filter(c => c.criadoEm?.slice(0, 10) === todayStr);
  }, [chamadosTI]);

  const tiSaidasHoje = useMemo(() => {
    return tiHoje.filter(c => c.status === "resolvido" || c.status === "cancelado").length;
  }, [tiHoje]);

  const tiTotais = useMemo(() => ({
    pendente: chamadosTI.filter(c => c.status === "pendente" || c.status === "aguardando_diretoria").length,
    resolvido: chamadosTI.filter(c => c.status === "resolvido").length,
    cancelado: chamadosTI.filter(c => c.status === "cancelado").length,
  }), [chamadosTI]);

  const entradasHoje = hoje.length;
  const saidasHoje = hoje.filter((s) => s.status === "resolvido" || s.status === "cancelado").length;
  const total = totaisGeral.pendente + totaisGeral.resolvido + totaisGeral.cancelado;

  const showGO = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("GOIÂNIA");
  const showMairipora = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("MAIRIPORÃ");
  const showPinheiros = currentUser?.administrador || currentUser?.novaSolicitacaoUnidades?.includes("PINHEIROS");

  return (
    <AppLayout>
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Olá, {currentUser?.nome?.split(" ")[0] || "Usuário"}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Aqui está o resumo do seu painel de controle</p>
        </div>
        <LiveClock />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Quick Access */}
        <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/30 transition-colors">
                <FilePlus className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acesso Rápido</p>
            </div>
            <p className="text-sm font-bold text-foreground leading-tight mb-2">Nova Solicitação</p>
            <div className="flex flex-wrap gap-1.5">
              {showGO && (
                <Link to="/nova-solicitacao/goiania" className="text-[10px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-sm hover:shadow-md whitespace-nowrap">Goiânia</Link>
              )}
              {showMairipora && (
                <Link to="/nova-solicitacao/mairipora" className="text-[10px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-sm hover:shadow-md whitespace-nowrap">Mairiporã</Link>
              )}
              {showPinheiros && (
                <Link to="/nova-solicitacao/pinheiros" className="text-[10px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-sm hover:shadow-md whitespace-nowrap">Pinheiros</Link>
              )}
            </div>
          </div>
        </div>

        {/* Entradas Hoje */}
        <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors duration-300">Serviços</span>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-success/5 rounded-full translate-y-6 -translate-x-6 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center shrink-0">
                <ArrowDownToLine className="h-4 w-4 text-success" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hoje</p>
            </div>
            <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{entradasHoje}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">aberturas registradas</p>
          </div>
        </div>

        {/* Saídas Hoje */}
        <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors duration-300">Serviços</span>
          <div className="absolute top-0 left-0 w-16 h-16 bg-destructive/5 rounded-full -translate-y-6 -translate-x-6 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center shrink-0">
                <ArrowUpFromLine className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resolv. / Canc.</p>
            </div>
            <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{saidasHoje}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">finalizados hoje</p>
          </div>
        </div>

        {/* Total */}
        <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors duration-300">Serviços</span>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-accent/5 rounded-full translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            </div>
            <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{total}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">solicitações no sistema</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
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

      {/* TI KPI Cards - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-destructive/20 hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/40 group-hover:text-destructive transition-colors duration-300">TI</span>
            <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center shrink-0">
                  <Monitor className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest">TI Hoje</p>
              </div>
              <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{tiHoje.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">aberturas registradas</p>
            </div>
          </div>

          <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-destructive/20 hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/40 group-hover:text-destructive transition-colors duration-300">TI</span>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-destructive/5 rounded-full translate-y-6 -translate-x-6 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center shrink-0">
                  <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest">TI Resolv./Canc.</p>
              </div>
              <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{tiSaidasHoje}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">finalizados hoje</p>
            </div>
          </div>

          <div className="relative bg-card rounded-2xl p-4 shadow-sm border border-destructive/20 hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/40 group-hover:text-destructive transition-colors duration-300">TI</span>
            <div className="absolute top-0 left-0 w-16 h-16 bg-destructive/5 rounded-full -translate-y-6 -translate-x-6 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest">TI Total</p>
              </div>
              <p className="text-3xl font-extrabold text-foreground leading-none tracking-tight">{tiTotais.pendente + tiTotais.resolvido + tiTotais.cancelado}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">chamados no sistema</p>
            </div>
          </div>

          <DonutChart
            title="Chamados TI"
            pendente={tiTotais.pendente}
            resolvido={tiTotais.resolvido}
            cancelado={tiTotais.cancelado}
            variant="ti"
          />
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="grid grid-cols-1 grid-rows-2 gap-3">
          <ActivityChart solicitacoes={todas} />
          <RecentChamadosTI />
        </div>
        <div className="grid grid-cols-1 grid-rows-2 gap-3">
          <ServiceBreakdown solicitacoes={todas} />
          <RecentActivity solicitacoes={todas} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
