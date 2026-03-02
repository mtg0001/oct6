import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Paperclip, ExternalLink,
  FileText, User, Building2, CalendarDays, Tag, AlertTriangle, Info, Monitor, Loader2,
} from "lucide-react";
import {
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  getChamadosTI,
  aprovarChamadoTIDiretoria,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";
import { supabase } from "@/integrations/supabase/client";
import octarteLogo from "@/assets/octarte-logo.png";

const URGENCIA_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string }> = {
  baixa: { label: "Baixa", icon: <Info className="h-3.5 w-3.5" />, bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  media: { label: "Média", icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-amber-50 border-amber-200 text-amber-700" },
  alta: { label: "Alta", icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-orange-50 border-orange-200 text-orange-700" },
  extrema: { label: "Extremamente Alta", icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-red-50 border-red-200 text-red-700" },
};

export default function DiretoriaChamadoTIDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chamado, setChamado] = useState<ChamadoTI | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [andamentos, setAndamentos] = useState<any[]>([]);

  useEffect(() => {
    ensureChamadosTILoaded().then(() => {
      setChamado(getChamadosTI().find(c => c.id === id) || null);
    });
    return subscribeChamadosTI(() => {
      setChamado(getChamadosTI().find(c => c.id === id) || null);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase.from("andamentos_ti" as any).select("*").eq("chamado_id", id).order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setAndamentos(data); });
  }, [id]);

  const handleAprovacao = async (resultado: "aprovado" | "reprovado") => {
    if (!chamado) return;
    setActionLoading(resultado);
    try {
      // Add andamento with approval result
      const label = resultado === "aprovado" ? "APROVADO" : "REPROVADO";
      await supabase.from("andamentos_ti" as any).insert({
        chamado_id: chamado.id,
        texto: `[Diretoria] ${label} pela diretoria e enviado para TI`,
        anexos: [],
      });
      await aprovarChamadoTIDiretoria(chamado.id, resultado);
      toast.success(resultado === "aprovado" ? "Aprovado e enviado para TI!" : "Reprovado e enviado para TI!");
      navigate(-1);
    } catch {
      toast.error("Erro ao processar aprovação");
    } finally {
      setActionLoading(null);
    }
  };

  if (!chamado) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Chamado não encontrado</h2>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 mt-4">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const urg = URGENCIA_CONFIG[chamado.urgencia] || URGENCIA_CONFIG.baixa;

  const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img src={octarteLogo} alt="Octarte" className="h-9 w-9 object-contain" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">Chamado de TI — Aprovação Diretoria</h1>
              <p className="text-xs text-muted-foreground font-mono tracking-wide">#{chamado.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 gap-1.5 px-3 py-1 text-xs font-semibold shrink-0">
            <Clock className="h-3.5 w-3.5" /> Aguardando Aprovação
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="mb-5 overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Informações do Chamado</h2>
          </div>
          <div className="px-5 pb-2 divide-y divide-border">
            <InfoRow icon={<AlertTriangle className="h-4 w-4" />} label="Urgência">
              <Badge variant="outline" className={`${urg.bg} gap-1 text-xs font-semibold`}>
                {urg.icon} {urg.label}
              </Badge>
            </InfoRow>
            <InfoRow icon={<User className="h-4 w-4" />} label="Solicitante">
              {chamado.solicitanteNome}
            </InfoRow>
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Departamento">
              {chamado.departamento}
            </InfoRow>
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Data de Abertura">
              {new Date(chamado.criadoEm).toLocaleString("pt-BR")}
            </InfoRow>
            <InfoRow icon={<Tag className="h-4 w-4" />} label="Categoria">
              {chamado.categoria}
            </InfoRow>
            {chamado.subOpcoes.length > 0 && (
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Equipe(s)">
                <div className="flex flex-wrap gap-1.5">
                  {chamado.subOpcoes.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
              </InfoRow>
            )}
            {chamado.aprovadoGestor && (
              <InfoRow icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovado pelo Gestor">
                {chamado.aprovadoGestor === "sim" ? "Sim" : "Não"}
              </InfoRow>
            )}
            {chamado.anydesk && (
              <InfoRow icon={<Monitor className="h-4 w-4" />} label="AnyDesk">
                <span className="font-mono text-sm">{chamado.anydesk}</span>
              </InfoRow>
            )}
          </div>
        </Card>

        {/* Observações */}
        {chamado.observacoes && (
          <Card className="mb-5 shadow-sm">
            <div className="px-5 py-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observações</h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{chamado.observacoes}</p>
            </div>
          </Card>
        )}

        {/* Anexos */}
        {chamado.anexos.length > 0 && (
          <Card className="mb-5 shadow-sm">
            <div className="px-5 py-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Anexos</h2>
              <div className="space-y-1.5">
                {chamado.anexos.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors group">
                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="flex-1 truncate">Anexo {idx + 1}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        {chamado.status === "aguardando_diretoria" && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => handleAprovacao("reprovado")}
              disabled={!!actionLoading}
            >
              {actionLoading === "reprovado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reprovar e enviar para TI
            </Button>
            <Button
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAprovacao("aprovado")}
              disabled={!!actionLoading}
            >
              {actionLoading === "aprovado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aprovar e enviar para TI
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
