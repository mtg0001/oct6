import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Paperclip, ExternalLink,
  MessageSquarePlus, Send, Loader2,
} from "lucide-react";
import {
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  getChamadosTI,
  updateChamadoTIStatus,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { AndamentoBubble } from "@/components/AndamentoBubble";
import octarteLogo from "@/assets/octarte-logo.png";

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
  const location = useLocation();
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [chamado, setChamado] = useState<ChamadoTI | null>(null);
  const [andamentoOpen, setAndamentoOpen] = useState(false);
  const [andamentoTexto, setAndamentoTexto] = useState("");
  const [andamentos, setAndamentos] = useState<any[]>([]);
  const [sendingAndamento, setSendingAndamento] = useState(false);
  const [anexoNomes, setAnexoNomes] = useState<string[]>([]);
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);

  // Detect if accessed from /ti/ (Tecnologia da Informação) or /chamado-ti/ (Abrir Chamados)
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

  // Load user name
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("usuarios").select("nome").eq("user_id", data.user.id).maybeSingle()
          .then(({ data: u }) => { if (u?.nome) setNomeUsuario(u.nome); });
      }
    });
  }, []);

  // Load andamentos for this chamado
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
    if (!andamentoTexto.trim() || !id || !chamado) return;
    setSendingAndamento(true);
    try {
      const nome = nomeUsuario;
      const texto = `[${nome}] ${andamentoTexto.trim()}`;
      let dateFolder: string | undefined;
      if (anexoFiles.length > 0) {
        dateFolder = await getNextSequentialFolder(chamado.departamento || "ti", "Chamados TI", nome);
      }
      const storedNomes = anexoFiles.map((f) => buildStoredFileName(f.name, dateFolder));
      for (const file of anexoFiles) {
        await uploadAttachmentToSharePoint({
          file,
          unidade: chamado.departamento || "ti",
          servico: "Chamados TI",
          userName: nome,
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
      toast.success("Andamento adicionado!");
      await loadAndamentos();
    } catch {
      toast.error("Erro ao adicionar andamento");
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
    {
      label: "Urgência",
      value: <Badge variant="outline" className={`${urg.bg} ${urg.color}`}>{urg.label}</Badge>,
    },
    {
      label: "Status",
      value: <Badge variant="outline" className={st.color}>{st.label}</Badge>,
    },
    { label: "Solicitante", value: chamado.solicitanteNome },
    { label: "Departamento", value: chamado.departamento },
    { label: "Data de Abertura", value: new Date(chamado.criadoEm).toLocaleString("pt-BR") },
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header with logo */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={octarteLogo} alt="Octarte" className="h-10 w-10 object-contain" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Chamado TI</h1>
            <p className="text-xs text-muted-foreground font-mono">#{chamado.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Data table */}
        <Card className="mb-6 overflow-hidden border-primary/10">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-primary/[0.03]" : ""}>
                  <td className="px-4 py-3 font-medium text-muted-foreground w-[180px] whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Observações */}
        {chamado.observacoes && (
          <Card className="p-5 mb-6 border-primary/10">
            <h3 className="text-sm font-semibold text-foreground mb-2">Observações</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chamado.observacoes}</p>
          </Card>
        )}

        {/* Anexos */}
        {chamado.anexos.length > 0 && (
          <Card className="p-5 mb-6 border-primary/10">
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

        {/* Andamentos */}
        {andamentos.length > 0 && (
          <Card className="p-5 mb-6 border-primary/10">
            <h3 className="text-sm font-semibold text-foreground mb-4">Andamentos</h3>
            <div className="space-y-4">
              {andamentos.map((a) => (
                <AndamentoBubble
                  key={a.id}
                  texto={a.texto}
                  data={new Date(a.created_at).toLocaleString("pt-BR")}
                  anexos={a.anexos}
                  unidade={chamado?.departamento || "ti"}
                  servico="Chamados TI"
                  userName={nomeUsuario}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Andamento input */}
        {andamentoOpen && (
          <Card className="p-5 mb-6 border-primary/10">
            <h3 className="text-sm font-semibold text-foreground mb-3">Novo Andamento</h3>
            <Textarea
              placeholder="Descreva o andamento..."
              value={andamentoTexto}
              onChange={(e) => setAndamentoTexto(e.target.value)}
              className="mb-3 min-h-[80px]"
            />
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                <Paperclip className="h-4 w-4" /> Adicionar anexo
                <Input type="file" multiple className="hidden" onChange={handleAndamentoFileChange} />
              </label>
              {anexoNomes.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {anexoNomes.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setAndamentoOpen(false); setAndamentoTexto(""); setAnexoNomes([]); setAnexoFiles([]); }}>
                Cancelar
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleAddAndamento} disabled={sendingAndamento || !andamentoTexto.trim()}>
                {sendingAndamento ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 flex-wrap">
          {/* Andamento button always visible */}
          {chamado.status === "pendente" && (
            <Button
              variant="outline"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setAndamentoOpen(!andamentoOpen)}
            >
              <MessageSquarePlus className="h-4 w-4" /> Andamento
            </Button>
          )}

          {chamado.status === "pendente" && (
            <>
              {/* Resolver only visible in TI context */}
              {isTI && (
                <Button variant="outline" className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50" onClick={handleResolver}>
                  <CheckCircle2 className="h-4 w-4" /> Resolver
                </Button>
              )}
              <Button variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleCancelar}>
                <XCircle className="h-4 w-4" /> Cancelar
              </Button>
            </>
          )}
          {(chamado.status === "resolvido" || chamado.status === "cancelado") && isTI && (
            <Button variant="outline" className="gap-1.5" onClick={handleReabrir}>
              <ArrowLeft className="h-4 w-4" /> Reabrir
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
