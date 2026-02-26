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
import { useState } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";
import { PrioridadeBadge, sortByPrioridade } from "@/components/forms/PrioridadeSelect";
import { ExcluirChamadoButton } from "@/components/ExcluirChamadoButton";

const DiretoriaAprovacao = () => {
  const { diretor } = useParams<{ diretor: string }>();
  const navigate = useNavigate();
  const nomeCapitalizado = diretor ? diretor.charAt(0).toUpperCase() + diretor.slice(1) : "";
  const solicitacoes = useSolicitacoesDiretor(diretor || "");
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");

  const filtered = solicitacoes.filter((s) => {
    const matchBusca =
      !busca ||
      s.evento.toLowerCase().includes(busca.toLowerCase()) ||
      s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
      s.unidade.toLowerCase().includes(busca.toLowerCase());
    const matchPrioridade = filtroPrioridade === "todas" || s.prioridade === filtroPrioridade;
    return matchBusca && matchPrioridade;
  }).sort(sortByPrioridade);

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

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} registro(s)</p>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma solicitação pendente.</p>
        )}
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
      </div>
    </AppLayout>
  );
};

export default DiretoriaAprovacao;
