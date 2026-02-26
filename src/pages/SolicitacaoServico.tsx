import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import { addAndamento, concluirSolicitacao, cancelarSolicitacao } from "@/stores/solicitacoesStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Paperclip, FileText, ArrowLeft, CheckCircle, XCircle, MessageSquarePlus } from "lucide-react";
import octarteLogo from "@/assets/octarte-logo.png";

/** Parse the "justificativa" pipe-separated string into key-value pairs */
function parseJustificativa(raw: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  raw.split(" | ").forEach((segment) => {
    const idx = segment.indexOf(": ");
    if (idx > -1) {
      pairs[segment.slice(0, idx).trim()] = segment.slice(idx + 2).trim();
    }
  });
  return pairs;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprovado_diretor: "bg-blue-100 text-blue-800 border-blue-300",
  aprovado: "bg-blue-200 text-blue-900 border-blue-400",
  resolvido: "bg-green-100 text-green-800 border-green-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
  reprovado: "bg-red-200 text-red-900 border-red-400",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  aprovado_diretor: "Aprovado Diretor",
  aprovado: "Aprovado",
  resolvido: "Resolvido",
  cancelado: "Cancelado",
  reprovado: "Reprovado",
};

const SolicitacaoServico = () => {
  const { filtro, id, context } = useParams<{ filtro: string; id: string; context: string }>();
  const navigate = useNavigate();
  const sol = useSolicitacao(id || "");
  const [showAndamento, setShowAndamento] = useState(false);
  const [textoAndamento, setTextoAndamento] = useState("");
  const [anexoNomes, setAnexoNomes] = useState<string[]>([]);

  if (!sol) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Solicitação não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
      </AppLayout>
    );
  }

  const siglaUnidade = sol.unidade === "goiania" ? "GO" : "SP";
  const isPendente = filtro === "pendentes";
  const parsed = parseJustificativa(sol.justificativa);
  const hasAnexo = !!parsed["Anexo"];

  const handleEnviarAndamento = async () => {
    if (!textoAndamento.trim()) return;
    await addAndamento(sol.id, textoAndamento, anexoNomes);
    setTextoAndamento(""); setAnexoNomes([]); setShowAndamento(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnexoNomes((prev) => [...prev, ...Array.from(e.target.files!).map((f) => f.name)]);
    }
  };

  // ── Diarista-specific renderer ──
  const renderDiarista = () => {
    return (
      <div className="space-y-4">
        {/* Prestador */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados do Prestador</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoCard label="Nome do(a) Diarista" value={sol.cargo || "—"} />
            <InfoCard label="CPF" value={parsed["CPF"] || "—"} />
            <InfoCard label="RG" value={parsed["RG"] || "—"} />
          </div>
        </div>

        {/* Datas trabalhadas */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Datas Trabalhadas</p>
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            {parsed["Datas"] ? (
              <div className="flex flex-wrap gap-2">
                {parsed["Datas"].split(", ").map((d, i) => (
                  <span key={i} className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-semibold">
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Financeiro */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados Financeiros</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <InfoCard label="Qtd. Diárias" value={parsed["Qtd Diárias"] || "—"} highlight />
            <InfoCard label="Valor da Diária" value={sol.faixaSalarialDe ? `R$ ${sol.faixaSalarialDe}` : "—"} />
            <InfoCard label="Valor Total" value={sol.faixaSalarialAte ? `R$ ${sol.faixaSalarialAte}` : "—"} highlight />
            <InfoCard label="Data do Pagamento" value={sol.horarioDe || parsed["Data Pgto"] || "—"} />
          </div>
        </div>

        {/* PIX */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados PIX</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCard label="Tipo de Chave" value={sol.tipoContrato || "—"} />
            <InfoCard label="Chave PIX" value={parsed[`Chave PIX (${sol.tipoContrato})`] || "—"} />
          </div>
        </div>

        {/* Anexo */}
        {hasAnexo && (
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Anexo</p>
            <div className="flex items-center gap-2 bg-accent/50 border border-border rounded-lg p-3">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{parsed["Anexo"]}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Generic fallback renderer ──
  const renderGeneric = () => {
    const entries = Object.entries(parsed);
    if (entries.length === 0 && sol.justificativa) {
      return (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm whitespace-pre-wrap">
          {sol.justificativa}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([k, v]) => (
          <InfoCard key={k} label={k} value={v} />
        ))}
      </div>
    );
  };

  const isDiarista = sol.tipo === "Serviço de Diarista";

  return (
    <AppLayout>
      {/* ── Header com logo ── */}
      <div className="bg-primary text-primary-foreground px-6 py-5 rounded-t-xl mb-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full opacity-10">
          <img src={octarteLogo} alt="" className="h-full object-contain" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <img src={octarteLogo} alt="Octarte" className="h-10 w-10 object-contain brightness-0 invert" />
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide">{sol.tipo}</h1>
            <p className="text-xs opacity-80">Relatório de Solicitação</p>
          </div>
        </div>
      </div>

      <div className="border border-border border-t-0 rounded-b-xl p-6 space-y-6 bg-card shadow-lg">
        {/* ── Resumo ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-3 border-r border-border pr-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Protocolo</p>
              <p className="text-lg font-black text-foreground">#{sol.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Status</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mt-1 ${statusColors[sol.status] || ""}`}>
                {statusLabel[sol.status] || sol.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Data de Abertura</p>
              <p className="text-sm font-medium">{sol.dataCriacao}</p>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoCard label="Solicitante" value={sol.solicitante} />
            <InfoCard label="Departamento" value={sol.departamento || "—"} />
            <InfoCard label="Unidade" value={siglaUnidade} highlight />
            <InfoCard label="Evento" value={sol.evento || "—"} />
            <InfoCard label="Prioridade" value={sol.prioridade ? sol.prioridade.charAt(0).toUpperCase() + sol.prioridade.slice(1) : "—"} />
          </div>
        </div>

        <hr className="border-border" />

        {/* ── Conteúdo específico do tipo ── */}
        {isDiarista ? renderDiarista() : renderGeneric()}

        {/* ── Observações ── */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Observações</p>
          <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm min-h-[48px]">
            {sol.observacoes || "Nenhuma observação."}
          </div>
        </div>

        {/* ── Andamentos ── */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Andamentos</p>
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/10">
            {sol.andamentos.length === 0 && !showAndamento && (
              <p className="text-sm text-muted-foreground italic">Nenhum andamento registrado.</p>
            )}
            {sol.andamentos.map((a) => (
              <div key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-[10px] text-muted-foreground font-semibold">{a.data}</p>
                <p className="text-sm mt-1">{a.texto}</p>
                {a.anexos && a.anexos.length > 0 && (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {a.anexos.map((anx, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        <Paperclip className="h-3 w-3" /> {anx}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {showAndamento && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Textarea value={textoAndamento} onChange={(e) => setTextoAndamento(e.target.value)} rows={3} placeholder="Descreva o andamento..." />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                    <Paperclip className="h-4 w-4" /> Adicionar anexo
                    <Input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  {anexoNomes.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {anexoNomes.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEnviarAndamento}>Salvar Andamento</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAndamento(false); setTextoAndamento(""); setAnexoNomes([]); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="flex flex-wrap gap-3 pt-3 items-center border-t border-border">
          <Button
            variant="outline"
            className="border-primary text-primary gap-2"
            onClick={() => setShowAndamento(true)}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Andamento
          </Button>
          {isPendente && (
            <>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={async () => { await concluirSolicitacao(sol.id); navigate(-1); }}>
                <CheckCircle className="h-4 w-4" />
                Resolver
              </Button>
              <Button variant="destructive" className="gap-2" onClick={async () => { await cancelarSolicitacao(sol.id); navigate(-1); }}>
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
          <Button variant="outline" className="ml-auto gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

/** Reusable info card */
function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${highlight ? "bg-primary/5" : "bg-card"}`}>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

export default SolicitacaoServico;
