import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesDiretor } from "@/hooks/useSolicitacoes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";
import { PrioridadeBadge, sortByPrioridade } from "@/components/forms/PrioridadeSelect";
import { ExcluirChamadoButton } from "@/components/ExcluirChamadoButton";
import { Badge } from "@/components/ui/badge";
import { Headset } from "lucide-react";
import { ensureChamadosTILoaded, subscribeChamadosTI, getChamadosTIByDiretor, type ChamadoTI } from "@/stores/chamadosTIStore";

const URGENCIA_LABEL: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  media: { label: "Média", color: "bg-amber-50 text-amber-700 border-amber-200" },
  alta: { label: "Alta", color: "bg-orange-50 text-orange-700 border-orange-200" },
  extrema: { label: "Extrema", color: "bg-red-50 text-red-700 border-red-200" },
};

const DiretoriaAprovacao = () => {
  const { diretor } = useParams<{ diretor: string }>();
  const navigate = useNavigate();
  const nomeCapitalizado = diretor ? diretor.charAt(0).toUpperCase() + diretor.slice(1) : "";
  const solicitacoes = useSolicitacoesDiretor(diretor || "");
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [chamadosTI, setChamadosTI] = useState<ChamadoTI[]>([]);

  useEffect(() => {
    ensureChamadosTILoaded().then(() => {
      setChamadosTI(getChamadosTIByDiretor(diretor || ""));
    });
    return subscribeChamadosTI(() => {
      setChamadosTI(getChamadosTIByDiretor(diretor || ""));
    });
  }, [diretor]);

  const filtered = solicitacoes.filter((s) => {
    const matchBusca =
      !busca ||
      s.evento.toLowerCase().includes(busca.toLowerCase()) ||
      s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
      s.unidade.toLowerCase().includes(busca.toLowerCase());
    const matchPrioridade = filtroPrioridade === "todas" || s.prioridade === filtroPrioridade;
    return matchBusca && matchPrioridade;
  }).sort(sortByPrioridade);

  const filteredChamadosTI = chamadosTI.filter((c) => {
    if (!busca) return true;
    return (
      c.solicitanteNome.toLowerCase().includes(busca.toLowerCase()) ||
      c.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      c.departamento.toLowerCase().includes(busca.toLowerCase())
    );
  });

  const totalCount = filtered.length + filteredChamadosTI.length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Diretoria Aprovação</h1>
        <p className="text-sm text-muted-foreground">
          Pendentes — Fila de <strong>{nomeCapitalizado}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Evento, solicitante, unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as prioridades</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="extremamente_alta">Extremamente Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{totalCount} registro(s)</p>

      <div className="space-y-3">
        {/* Chamados TI aguardando aprovação */}
        {filteredChamadosTI.map((c) => {
          const urg = URGENCIA_LABEL[c.urgencia] || URGENCIA_LABEL.baixa;
          return (
            <div
              key={`ti-${c.id}`}
              className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm"
            >
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Headset className="h-5 w-5" />
              </div>
              <Badge variant="outline" className={`${urg.color} text-xs font-semibold`}>{urg.label}</Badge>
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Data</span>
                  <span className="font-medium">{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Colaborador</span>
                  <span className="font-medium">{c.solicitanteNome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Departamento</span>
                  <span className="font-medium">{c.departamento}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Tipo</span>
                  <span className="font-medium text-xs">Chamado TI - Teams</span>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/diretoria/${diretor}/chamado-ti/${c.id}`)}>
                Ver
              </Button>
            </div>
          );
        })}

        {/* Solicitações normais */}
        {filtered.map((sol) => {
          const Icon = getIconForTipo(sol.tipo);
          return (
            <div
              key={sol.id}
              className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <PrioridadeBadge value={sol.prioridade} />
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Data</span>
                  <span className="font-medium">{sol.dataCriacao}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Colaborador</span>
                  <span className="font-medium">{sol.solicitante}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Unidade</span>
                  <span className="font-medium">{sol.unidade === "goiania" ? "GO" : "SP"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Tipo</span>
                  <span className="font-medium text-xs">{sol.tipo}</span>
                </div>
              </div>
              <ExcluirChamadoButton solicitacaoId={sol.id} />
              <Button size="sm" onClick={() => navigate(`/diretoria/${diretor}/solicitacao/${sol.id}`)}>
                Ver
              </Button>
            </div>
          );
        })}

        {totalCount === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma solicitação pendente.</p>
        )}
      </div>
    </AppLayout>
  );
};

export default DiretoriaAprovacao;
