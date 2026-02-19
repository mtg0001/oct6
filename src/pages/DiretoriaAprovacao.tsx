import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesDiretor } from "@/hooks/useSolicitacoes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const prioridadeCores: Record<string, string> = {
  baixa: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
  urgente: "bg-red-200 text-red-900",
};

const unidadeSigla: Record<string, string> = {
  goiania: "GO",
  saopaulo: "SP",
  "sao-paulo": "SP",
};

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
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Diretoria Aprovação</h1>
        <p className="text-sm text-muted-foreground">
          Pendentes — Fila de <strong>{nomeCapitalizado}</strong>
        </p>
      </div>

      {/* Filters */}
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
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} registro(s)</p>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma solicitação pendente.</p>
        )}
        {filtered.map((sol) => (
          <div
            key={sol.id}
            className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm"
          >
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0">
              {unidadeSigla[sol.unidade] || sol.unidade.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Data</span>
                <span className="font-medium">{sol.dataCriacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Colaborador</span>
                <span className="font-medium">{sol.solicitante}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Evento</span>
                <span className="font-medium">{sol.evento || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Prioridade</span>
                <Badge className={prioridadeCores[sol.prioridade] || "bg-muted text-muted-foreground"}>
                  {sol.prioridade ? sol.prioridade.charAt(0).toUpperCase() + sol.prioridade.slice(1) : "—"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Tipo</span>
                <span className="font-medium">Solicitação de Colaborador</span>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/diretoria/${diretor}/solicitacao/${sol.id}`)}>
              Ver
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default DiretoriaAprovacao;
