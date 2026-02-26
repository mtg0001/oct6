import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Headset, ArrowLeft, CheckCircle2, XCircle, Clock, Paperclip, ExternalLink,
} from "lucide-react";
import {
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  getChamadosTI,
  updateChamadoTIStatus,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";

const URGENCIA_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  baixa: { label: "Baixa", color: "text-green-700", bg: "bg-green-500/15 border-green-500/30" },
  media: { label: "Média", color: "text-orange-600", bg: "bg-orange-400/15 border-orange-400/30" },
  alta: { label: "Alta", color: "text-red-500", bg: "bg-red-400/15 border-red-400/30" },
  extrema: { label: "Extremamente Alta", color: "text-red-800", bg: "bg-red-700/15 border-red-700/30" },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  resolvido: { label: "Resolvido", color: "bg-green-500/15 text-green-700 border-green-500/30" },
  cancelado: { label: "Cancelado", color: "bg-red-500/15 text-red-600 border-red-500/30" },
};

export default function ChamadoTIDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chamado, setChamado] = useState<ChamadoTI | null>(null);

  useEffect(() => {
    ensureChamadosTILoaded().then(() => {
      const found = getChamadosTI().find(c => c.id === id);
      setChamado(found || null);
    });
    return subscribeChamadosTI(() => {
      const found = getChamadosTI().find(c => c.id === id);
      setChamado(found || null);
    });
  }, [id]);

  if (!chamado) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Chamado não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const urg = URGENCIA_CONFIG[chamado.urgencia] || URGENCIA_CONFIG.baixa;
  const st = STATUS_LABEL[chamado.status] || STATUS_LABEL.pendente;

  const handleResolver = async () => {
    try { await updateChamadoTIStatus(chamado.id, "resolvido"); toast.success("Chamado resolvido!"); }
    catch { toast.error("Erro ao resolver"); }
  };
  const handleCancelar = async () => {
    try { await updateChamadoTIStatus(chamado.id, "cancelado"); toast.success("Chamado cancelado!"); }
    catch { toast.error("Erro ao cancelar"); }
  };
  const handleReabrir = async () => {
    try { await updateChamadoTIStatus(chamado.id, "pendente"); toast.success("Chamado reaberto!"); }
    catch { toast.error("Erro ao reabrir"); }
  };

  const rows: { label: string; value: string | React.ReactNode }[] = [
    { label: "Solicitante", value: chamado.solicitanteNome },
    { label: "Departamento", value: chamado.departamento },
    { label: "Categoria", value: chamado.categoria },
  ];

  if (chamado.subOpcoes.length > 0) {
    rows.push({ label: "Detalhes", value: chamado.subOpcoes.join(", ") });
  }
  if (chamado.siteEspecifico) rows.push({ label: "Site Específico", value: chamado.siteEspecifico });
  if (chamado.siteSuspeito) rows.push({ label: "Site Suspeito", value: chamado.siteSuspeito });
  if (chamado.aprovadoGestor) rows.push({ label: "Aprovado pelo Gestor", value: chamado.aprovadoGestor === "sim" ? "Sim" : "Não" });
  if (chamado.novoColaborador) rows.push({ label: "Novo Colaborador", value: chamado.novoColaborador === "sim" ? "Sim" : "Não" });
  if (chamado.anydesk) rows.push({ label: "AnyDesk", value: chamado.anydesk });

  rows.push({
    label: "Urgência",
    value: <Badge variant="outline" className={`${urg.bg} ${urg.color}`}>{urg.label}</Badge>,
  });
  rows.push({ label: "Data de Abertura", value: new Date(chamado.criadoEm).toLocaleString("pt-BR") });
  rows.push({
    label: "Status",
    value: <Badge variant="outline" className={st.color}>{st.label}</Badge>,
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Headset className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Chamado TI</h1>
            <p className="text-xs text-muted-foreground font-mono">#{chamado.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Data table */}
        <Card className="mb-6 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                  <td className="px-4 py-3 font-medium text-muted-foreground w-[180px] whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Observações */}
        {chamado.observacoes && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Observações</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chamado.observacoes}</p>
          </Card>
        )}

        {/* Anexos */}
        {chamado.anexos.length > 0 && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Anexos</h3>
            <div className="space-y-2">
              {chamado.anexos.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Anexo {idx + 1}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {chamado.status === "pendente" && (
            <>
              <Button variant="outline" className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50" onClick={handleResolver}>
                <CheckCircle2 className="h-4 w-4" /> Resolver
              </Button>
              <Button variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleCancelar}>
                <XCircle className="h-4 w-4" /> Cancelar
              </Button>
            </>
          )}
          {(chamado.status === "resolvido" || chamado.status === "cancelado") && (
            <Button variant="outline" className="gap-1.5" onClick={handleReabrir}>
              <ArrowLeft className="h-4 w-4" /> Reabrir
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
