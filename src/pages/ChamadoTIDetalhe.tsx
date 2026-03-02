import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Paperclip, ExternalLink,
  MessageSquarePlus, Send, Loader2, RotateCcw, FileText, User, Building2,
  CalendarDays, Tag, AlertTriangle, Info, Monitor,
} from "lucide-react";
import {
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  getChamadosTI,
  updateChamadoTIStatus,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder, resolveExistingDateFolder } from "@/lib/sharepointAttachments";
import { AndamentoBubble } from "@/components/AndamentoBubble";
import octarteLogo from "@/assets/octarte-logo.png";

const URGENCIA_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  baixa: { label: "Baixa", icon: <Info className="h-3.5 w-3.5" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  media: { label: "Média", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200 text-amber-700" },
  alta: { label: "Alta", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-orange-700", bg: "bg-orange-50 border-orange-200 text-orange-700" },
  extrema: { label: "Extremamente Alta", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-700", bg: "bg-red-50 border-red-200 text-red-700" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pendente: { label: "Pendente", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-amber-50 border-amber-200 text-amber-700" },
  resolvido: { label: "Resolvido", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  cancelado: { label: "Cancelado", icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-red-50 border-red-200 text-red-700" },
};

export default function ChamadoTIDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [chamado, setChamado] = useState<ChamadoTI | null>(null);
  const [andamentoOpen, setAndamentoOpen] = useState(false);
  const [andamentoTexto, setAndamentoTexto] = useState("");
  const [andamentos, setAndamentos] = useState<any[]>([]);
  const [sendingAndamento, setSendingAndamento] = useState(false);
  const [anexoNomes, setAnexoNomes] = useState<string[]>([]);
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isTI = location.pathname.startsWith("/ti/");

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("usuarios").select("nome").eq("user_id", data.user.id).maybeSingle()
          .then(({ data: u }) => { if (u?.nome) setNomeUsuario(u.nome); });
      }
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    loadAndamentos();
  }, [id]);

  const loadAndamentos = async () => {
    const { data } = await supabase
      .from("andamentos_ti" as any)
      .select("*")
      .eq("chamado_id", id)
      .order("created_at", { ascending: true });
    if (data) setAndamentos(data);
  };

  const handleAddAndamento = async () => {
    if (!andamentoTexto.trim() || !id || !chamado || sendingAndamento) return;
    setSendingAndamento(true);
    try {
      const nome = nomeUsuario;
      const texto = `[${nome}] ${andamentoTexto.trim()}`;
      const storageUserName = chamado.solicitanteNome || nome;
      let dateFolder = resolveExistingDateFolder([
        chamado.anexos,
        ...andamentos.map((a) => a?.anexos || []),
      ]);
      if (!dateFolder && anexoFiles.length > 0) {
        dateFolder = await getNextSequentialFolder(chamado.departamento || "ti", "Chamados TI", storageUserName);
      }
      const storedNomes = anexoFiles.map((f) => buildStoredFileName(f.name, dateFolder));
      for (const file of anexoFiles) {
        await uploadAttachmentToSharePoint({
          file,
          unidade: chamado.departamento || "ti",
          servico: "Chamados TI",
          userName: storageUserName,
          datePasta: dateFolder,
        });
      }
      const { error } = await supabase.from("andamentos_ti" as any).insert({
        chamado_id: id,
        texto,
        anexos: storedNomes,
      });
      if (error) throw error;
      setAndamentoTexto("");
      setAnexoNomes([]);
      setAnexoFiles([]);
      setAndamentoOpen(false);
      toast.success("Andamento salvo com sucesso!");
      await loadAndamentos();
    } catch {
      toast.error("Erro ao salvar andamento");
    } finally {
      setSendingAndamento(false);
    }
  };

  const handleAndamentoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAnexoNomes((prev) => [...prev, ...files.map((f) => f.name)]);
      setAnexoFiles((prev) => [...prev, ...files]);
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
          <p className="text-sm text-muted-foreground mb-6">O chamado solicitado não existe ou foi removido.</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const urg = URGENCIA_CONFIG[chamado.urgencia] || URGENCIA_CONFIG.baixa;
  const st = STATUS_CONFIG[chamado.status] || STATUS_CONFIG.pendente;

  const handleAction = async (action: "resolvido" | "cancelado" | "pendente") => {
    const labels = { resolvido: "Resolvendo...", cancelado: "Cancelando...", pendente: "Reabrindo..." };
    const successMsg = { resolvido: "Chamado resolvido!", cancelado: "Chamado cancelado!", pendente: "Chamado reaberto!" };
    setActionLoading(action);
    try {
      await updateChamadoTIStatus(chamado.id, action);
      toast.success(successMsg[action]);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setActionLoading(null);
    }
  };

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
              <h1 className="text-lg font-bold text-foreground leading-tight">Chamado de TI</h1>
              <p className="text-xs text-muted-foreground font-mono tracking-wide">#{chamado.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${st.color} gap-1.5 px-3 py-1 text-xs font-semibold shrink-0`}>
            {st.icon} {st.label}
          </Badge>
        </div>

        {/* Main Info Card */}
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
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Detalhes">
                <div className="flex flex-wrap gap-1.5">
                  {chamado.subOpcoes.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
              </InfoRow>
            )}
            {chamado.siteEspecifico && (
              <InfoRow icon={<ExternalLink className="h-4 w-4" />} label="Site Específico">
                {chamado.siteEspecifico}
              </InfoRow>
            )}
            {chamado.siteSuspeito && (
              <InfoRow icon={<ExternalLink className="h-4 w-4" />} label="Site Suspeito">
                {chamado.siteSuspeito}
              </InfoRow>
            )}
            {chamado.aprovadoGestor && (
              <InfoRow icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovado pelo Gestor">
                {chamado.aprovadoGestor === "sim" ? "Sim" : "Não"}
              </InfoRow>
            )}
            {chamado.novoColaborador && (
              <InfoRow icon={<User className="h-4 w-4" />} label="Novo Colaborador">
                {chamado.novoColaborador === "sim" ? "Sim" : "Não"}
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
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors group"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="flex-1 truncate">Anexo {idx + 1}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Andamentos */}
        {andamentos.length > 0 && (
          <Card className="mb-5 shadow-sm">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Andamentos</h2>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">{andamentos.length}</Badge>
              </div>
              <div className="space-y-3">
                {andamentos.map((a) => (
                  <AndamentoBubble
                    key={a.id}
                    texto={a.texto}
                    data={new Date(a.created_at).toLocaleString("pt-BR")}
                    anexos={a.anexos}
                    unidade={chamado?.departamento || "ti"}
                    servico="Chamados TI"
                    userName={chamado?.solicitanteNome || nomeUsuario}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Novo Andamento */}
        {andamentoOpen && (
          <Card className="mb-5 shadow-sm border-primary/20">
            <div className="px-5 py-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Novo Andamento</h2>
              <Textarea
                placeholder="Descreva o andamento do chamado..."
                value={andamentoTexto}
                onChange={(e) => setAndamentoTexto(e.target.value)}
                className="mb-3 min-h-[100px] resize-none"
                disabled={sendingAndamento}
              />
              <div className="flex items-center gap-3 mb-4">
                <label className="flex items-center gap-1.5 text-sm text-primary cursor-pointer hover:underline font-medium">
                  <Paperclip className="h-4 w-4" /> Adicionar anexo
                  <Input type="file" multiple className="hidden" onChange={handleAndamentoFileChange} disabled={sendingAndamento} />
                </label>
              </div>
              {anexoNomes.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {anexoNomes.map((n, i) => (
                    <Badge key={i} variant="outline" className="text-xs gap-1">
                      <Paperclip className="h-3 w-3" /> {n}
                    </Badge>
                  ))}
                </div>
              )}
              <Separator className="mb-4" />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAndamentoOpen(false); setAndamentoTexto(""); setAnexoNomes([]); setAnexoFiles([]); }}
                  disabled={sendingAndamento}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleAddAndamento}
                  disabled={sendingAndamento || !andamentoTexto.trim()}
                >
                  {sendingAndamento ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando andamento...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Enviar</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2.5 flex-wrap pt-2">
          {chamado.status === "pendente" && (
            <>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setAndamentoOpen(!andamentoOpen)}
                disabled={!!actionLoading}
              >
                <MessageSquarePlus className="h-4 w-4" /> Andamento
              </Button>
              {isTI && (
                <Button
                  variant="outline"
                  className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => handleAction("resolvido")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "resolvido" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Resolver
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => handleAction("cancelado")}
                disabled={!!actionLoading}
              >
                {actionLoading === "cancelado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancelar
              </Button>
            </>
          )}
          {(chamado.status === "resolvido" || chamado.status === "cancelado") && isTI && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => handleAction("pendente")}
              disabled={!!actionLoading}
            >
              {actionLoading === "pendente" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reabrir
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
