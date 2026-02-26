import { useParams, useNavigate } from "react-router-dom";
import { getPrioridadeLabel } from "@/components/forms/PrioridadeSelect";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { addAndamento, concluirSolicitacao, cancelarSolicitacao, encaminharSolicitacao } from "@/stores/solicitacoesStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Paperclip, Forward } from "lucide-react";
import { uploadAttachmentToSharePoint, buildStoredFileName } from "@/lib/sharepointAttachments";
import { AndamentoBubble } from "@/components/AndamentoBubble";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const labelMap: Record<string, string> = {
  evento: "Evento", cargo: "Cargo", unidadeDestino: "Unidade de Destino",
  departamentoDestino: "Departamento de Destino", diretorArea: "Gestor Responsável",
  tipoVaga: "Tipo da Vaga", nomeSubstituido: "Nome do Substituído",
  justificativa: "Justificativa", formacao: "Formação", experiencia: "Experiência",
  conhecimentos: "Conhecimentos Espec.", faixaSalarialDe: "Faixa Salarial — De",
  faixaSalarialAte: "Faixa Salarial — Até", tipoContrato: "Tipo de Contrato",
  horarioDe: "Horário de Trabalho — De", horarioAte: "Horário de Trabalho — Até",
};

const RHSolicitacaoDetalhe = () => {
  const { filtro, id } = useParams<{ filtro: string; id: string }>();
  const navigate = useNavigate();
  const sol = useSolicitacao(id || "");
  const currentUser = useCurrentUser();
  const [showAndamento, setShowAndamento] = useState(false);
  const [textoAndamento, setTextoAndamento] = useState("");
  const [anexoNomes, setAnexoNomes] = useState<string[]>([]);
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);

  if (!sol) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Solicitação não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
      </AppLayout>
    );
  }

  const siglaUnidade = sol.unidade === "goiania" ? "GO" : "SP";
  const campos = Object.keys(labelMap).map((key) => ({
    label: labelMap[key], value: (sol as any)[key] || "—",
  }));
  const caracAplica = Object.entries(sol.caracteristicas)
    .filter(([_, v]) => v === "aplica").map(([k]) => k);

  const handleEnviarAndamento = async () => {
    if (!textoAndamento.trim()) return;
    const nome = currentUser?.nome || "RH";
    const textoComNome = `[${nome}] ${textoAndamento}`;
    for (const file of anexoFiles) {
      await uploadAttachmentToSharePoint({ file, unidade: sol.unidade, servico: sol.tipo, userName: nome });
    }
    await addAndamento(sol.id, textoComNome, anexoNomes);
    setTextoAndamento(""); setAnexoNomes([]); setAnexoFiles([]); setShowAndamento(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAnexoNomes((prev) => [...prev, ...files.map((f) => buildStoredFileName(f.name))]);
      setAnexoFiles((prev) => [...prev, ...files]);
    }
  };

  const isPendente = filtro === "pendentes";

  return (
    <AppLayout>
      <div className="bg-primary text-primary-foreground px-6 py-4 rounded-t-md mb-0">
        <h1 className="text-lg font-bold text-center uppercase">Novo Parceiro Comercial</h1>
        <p className="text-center text-xs mt-1">Modo RH · {filtro?.charAt(0).toUpperCase()}{filtro?.slice(1)}</p>
      </div>

      <div className="border border-border rounded-b-md p-6 space-y-6 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border rounded-md p-4 text-sm">
          <div className="space-y-1">
            <p><span className="text-muted-foreground text-xs">PROTOCOLO</span></p>
            <p className="font-bold">Nº {sol.id.slice(0, 4).toUpperCase()}</p>
            <p><span className="text-muted-foreground text-xs">STATUS</span></p>
            <Badge variant="outline" className="mt-1 capitalize">{sol.status.replace("_", " ")}</Badge>
            <p className="mt-2"><span className="text-muted-foreground text-xs">DATA DE ABERTURA</span></p>
            <p>{sol.dataCriacao}</p>
          </div>
          <div className="space-y-1">
            <p><span className="text-muted-foreground text-xs">UNIDADE</span></p>
            <p className="font-bold border border-border inline-block px-3 py-1 rounded">{siglaUnidade}</p>
            <p className="mt-2"><span className="text-muted-foreground text-xs">PRIORIDADE</span></p>
            <p className="font-bold capitalize">{getPrioridadeLabel(sol.prioridade)}</p>
          </div>
          <div className="space-y-1">
            <p><span className="text-muted-foreground text-xs">SOLICITANTE</span></p>
            <p className="font-bold">{sol.solicitante}</p>
            <p className="mt-2"><span className="text-muted-foreground text-xs">DEPARTAMENTO</span></p>
            <p>{sol.departamento}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Dados do Novo Colaborador</p>
          <Table>
            <TableHeader><TableRow><TableHead className="w-1/3">Campo</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {campos.map((c) => (
                <TableRow key={c.label}><TableCell className="font-medium text-sm">{c.label}</TableCell><TableCell className="text-sm capitalize">{c.value}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Características</p>
          <div className="border border-border rounded-md p-4">
            {caracAplica.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
              <div className="flex flex-wrap gap-2">
                {caracAplica.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full px-3 py-1 text-sm">{c}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Observações</p>
          <div className="border border-border rounded-md p-4 text-sm">{sol.observacoes || "—"}</div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Andamentos</p>
          <div className="border border-border rounded-md p-4 space-y-3">
            {sol.andamentos.length === 0 && !showAndamento && <p className="text-sm text-muted-foreground">—</p>}
            {sol.andamentos.map((a) => (
              <AndamentoBubble key={a.id} texto={a.texto} data={a.data} anexos={a.anexos} unidade={sol.unidade} servico={sol.tipo} userName={sol.solicitante} />
            ))}
            {showAndamento && (
              <div className="space-y-3 pt-2 border-t border-border">
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
                  <Button size="sm" variant="outline" onClick={() => { setShowAndamento(false); setTextoAndamento(""); setAnexoNomes([]); setAnexoFiles([]); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 items-center">
          <Button variant="outline" className="border-primary text-primary" onClick={() => setShowAndamento(true)}>Andamento</Button>
          {isPendente && (
            <>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await concluirSolicitacao(sol.id); navigate(-1); }}>Concluir</Button>
              <Button variant="destructive" onClick={async () => { await cancelarSolicitacao(sol.id); navigate(-1); }}>Cancelar</Button>
            </>
          )}
          {/* Forwarded from expedition: can send back */}
          {sol.setorAtual === 'rh_encaminhado' && isPendente && (
            <Button size="sm" variant="outline" className="border-blue-500 text-blue-600" onClick={async () => {
              const nome = currentUser?.nome || "RH";
              await addAndamento(sol.id, `[${nome}] 📦 Encaminhado de volta para Expedição`);
              await encaminharSolicitacao(sol.id, 'expedicao_devolvido');
              navigate(-1);
            }}>
              <Forward className="h-4 w-4 mr-1" />
              Encaminhar para Expedição
            </Button>
          )}
          <Button variant="outline" className="ml-auto" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default RHSolicitacaoDetalhe;
