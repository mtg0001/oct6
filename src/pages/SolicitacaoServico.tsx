import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import { addAndamento, concluirSolicitacao, cancelarSolicitacao } from "@/stores/solicitacoesStore";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Paperclip, ArrowLeft, Printer } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import octarteLogo from "@/assets/octarte-logo.png";

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

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  aprovado_diretor: "Aprovado Diretor",
  aprovado: "Aprovado",
  resolvido: "Resolvido",
  cancelado: "Cancelado",
  reprovado: "Reprovado",
};

const SolicitacaoServico = () => {
  const { filtro, id } = useParams<{ filtro: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const sol = useSolicitacao(id || "");
  const currentUser = useCurrentUser();
  const isMinhasSolicitacoes = location.pathname.includes("/minhas-solicitacoes/");
  const isAdmin = currentUser?.administrador === true;
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
  const showConcluirCancelar = isPendente && !(isMinhasSolicitacoes && !isAdmin);
  const parsed = parseJustificativa(sol.justificativa);
  const hasAnexo = !!parsed["Anexo"];

  const handleEnviarAndamento = async () => {
    if (!textoAndamento.trim()) return;
    const nome = currentUser?.nome || "Usuário";
    const textoComNome = `[${nome}] ${textoAndamento}`;
    await addAndamento(sol.id, textoComNome, anexoNomes);
    setTextoAndamento(""); setAnexoNomes([]); setShowAndamento(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnexoNomes((prev) => [...prev, ...Array.from(e.target.files!).map((f) => f.name)]);
    }
  };

  // Parse andamento text to extract user name
  const parseAndamento = (texto: string) => {
    const match = texto.match(/^\[(.+?)\]\s?(.*)/s);
    if (match) return { nome: match[1], texto: match[2] };
    return { nome: null, texto };
  };

  // ── Diarista table rows ──
  const getDiaristaRows = () => [
    { campo: "Nome do(a) Diarista", valor: sol.cargo || "—" },
    { campo: "CPF", valor: parsed["CPF"] || "—" },
    { campo: "RG", valor: parsed["RG"] || "—" },
    { campo: "Datas Trabalhadas", valor: parsed["Datas"] || "—" },
    { campo: "Quantidade de Diárias", valor: parsed["Qtd Diárias"] || "—" },
    { campo: "Valor da Diária (R$)", valor: sol.faixaSalarialDe ? `R$ ${sol.faixaSalarialDe}` : "—" },
    { campo: "Valor Total (R$)", valor: sol.faixaSalarialAte ? `R$ ${sol.faixaSalarialAte}` : "—" },
    { campo: "Data do Pagamento", valor: sol.horarioDe || parsed["Data Pgto"] || "—" },
    { campo: "Tipo de Chave PIX", valor: sol.tipoContrato || "—" },
    { campo: "Chave PIX", valor: parsed[`Chave PIX (${sol.tipoContrato})`] || "—" },
  ];

  // ── Aluguel de Banheiro table rows ──
  const getAluguelBanheiroRows = () => [
    { campo: "Qtd. Banheiros", valor: parsed["Qtd. Banheiros"] || "—" },
    { campo: "Climatizado", valor: parsed["Climatizado"] || "—" },
    { campo: "Insumos Inclusos", valor: parsed["Insumos Inclusos"] || "—" },
    { campo: "Stand", valor: parsed["Stand"] || "—" },
    { campo: "Data de Entrega", valor: sol.horarioDe || parsed["Data de Entrega"] || "—" },
    { campo: "Data de Retirada", valor: sol.horarioAte || parsed["Data de Retirada"] || "—" },
  ];

  // ── Locação de Veículos table rows ──
  const getLocacaoVeiculosRows = () => [
    { campo: "Tipo de Veículo", valor: sol.cargo || parsed["Tipo de Veículo"] || "—" },
    { campo: "Quantidade", valor: sol.tipoVaga || parsed["Quantidade"] || "—" },
    { campo: "Data de Retirada", valor: sol.horarioDe || parsed["Data de Retirada"] || "—" },
    { campo: "Data de Devolução", valor: sol.horarioAte || parsed["Data de Devolução"] || "—" },
    { campo: "CEP Origem", valor: parsed["CEP Origem"] || "—" },
    { campo: "CEP Destino", valor: parsed["CEP Destino"] || "—" },
    { campo: "KM Estimado", valor: sol.faixaSalarialAte ? `Total: ${sol.faixaSalarialAte}` : "—" },
    { campo: "Condutor", valor: sol.nomeSubstituido || parsed["Condutor"] || "—" },
    { campo: "CNH", valor: sol.formacao || parsed["CNH"] || "—" },
    { campo: "CPF", valor: sol.conhecimentos || parsed["CPF"] || "—" },
    { campo: "RG", valor: sol.experiencia || parsed["RG"] || "—" },
  ];

  // ── Frete table rows ──
  const getFreteRows = () => [
    { campo: "Qtd. Veículos", valor: parsed["Qtd Veículos"] || "—" },
    { campo: "Tipo de Veículo", valor: parsed["Tipo"] || "—" },
    { campo: "Tipo de Carroceria", valor: parsed["Carroceria"] || "—" },
    { campo: "Tamanho Mínimo", valor: parsed["Tam. Mínimo"] || "—" },
    { campo: "Estimativa de Peso", valor: parsed["Peso Est."] || "—" },
    { campo: "Origem", valor: parsed["Origem"] || "—" },
    { campo: "Destino", valor: parsed["Destino"] || "—" },
    { campo: "Data de Carga", valor: sol.horarioDe || parsed["Data Carga"] || "—" },
    { campo: "Data de Descarga", valor: sol.horarioAte || parsed["Data Descarga"] || "—" },
    { campo: "Ponto Octarte", valor: parsed["Ponto Octarte"] || "—" },
  ];

  // ── Gerador table rows ──
  const getGeradorRows = () => [
    { campo: "Data de", valor: sol.horarioDe || parsed["Data de"] || "—" },
    { campo: "Data até", valor: sol.horarioAte || parsed["Data até"] || "—" },
    { campo: "Dias", valor: parsed["Dias"] || "—" },
    { campo: "Data de Retirada", valor: parsed["Data de retirada"] || "—" },
    { campo: "Horas por Dia", valor: parsed["Horas/dia"] || "—" },
    { campo: "Total de Horas", valor: parsed["Total de horas"] || "—" },
    { campo: "Quantidade KVA", valor: parsed["KVA"] || "—" },
    { campo: "Modo de Uso", valor: parsed["Modo de uso"] || "—" },
    { campo: "Tensão Trifásica", valor: parsed["Tensão trifásica"] || "—" },
  ];

  // ── Generic table rows ──
  const getGenericRows = () => {
    const entries = Object.entries(parsed);
    if (entries.length === 0 && sol.justificativa) {
      return [{ campo: "Detalhes", valor: sol.justificativa }];
    }
    return entries.map(([k, v]) => ({ campo: k, valor: v }));
  };

  const isDiarista = sol.tipo === "Serviço de Diarista";
  const isAluguelBanheiro = sol.tipo === "Aluguel de Banheiro";
  const isLocacaoVeiculos = sol.tipo === "Locação de Veículos";
  const isFrete = sol.tipo === "Frete";
  const isGerador = sol.tipo === "Gerador";
  const tableRows = isDiarista ? getDiaristaRows() : isAluguelBanheiro ? getAluguelBanheiroRows() : isLocacaoVeiculos ? getLocacaoVeiculosRows() : isFrete ? getFreteRows() : isGerador ? getGeradorRows() : getGenericRows();
  const tableTitle = isDiarista ? "Dados do Serviço de Diarista" : isAluguelBanheiro ? "Dados do Aluguel de Banheiro" : isLocacaoVeiculos ? "Dados da Locação de Veículos" : isFrete ? "Dados do Frete" : isGerador ? "Dados do Gerador" : "Dados da Solicitação";

  return (
    <AppLayout>
      {/* ── Título ── */}
      <div className="bg-primary text-primary-foreground px-6 py-4 rounded-t-md">
        <h1 className="text-center text-lg font-bold uppercase tracking-wide">
          Solicitação — {sol.tipo}
        </h1>
      </div>

      <div className="border border-border border-t-0 rounded-b-md bg-card shadow-sm">
        {/* ── Cabeçalho 3 colunas ── */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr] border-b border-border">
          {/* Logo */}
          <div className="flex items-center justify-center p-4 border-r border-border bg-muted/20">
            <img src={octarteLogo} alt="Octarte" className="h-16 w-auto object-contain" />
          </div>

          {/* Protocolo / Status / etc */}
          <div className="p-4 border-r border-border text-sm space-y-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Protocolo</p>
                <p className="font-black">Nº {sol.id.slice(0, 4).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Unidade</p>
                <span className="inline-block border border-border rounded px-2 py-0.5 font-bold text-xs">{siglaUnidade}</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Status</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold">
                  <span className={`h-2 w-2 rounded-full ${sol.status === "pendente" ? "bg-yellow-500" : sol.status === "resolvido" ? "bg-green-500" : sol.status === "cancelado" ? "bg-red-500" : "bg-blue-500"}`} />
                  {statusLabel[sol.status] || sol.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Prioridade</p>
                <p className="font-bold capitalize text-xs">{sol.prioridade || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Data de Abertura</p>
                <p className="text-xs">{sol.dataCriacao}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Evento</p>
                <p className="text-xs">{sol.evento || "—"}</p>
              </div>
            </div>
          </div>

          {/* Solicitante */}
          <div className="p-4 text-sm space-y-1 bg-primary/5">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Solicitante</p>
              <p className="font-bold">{sol.solicitante}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Departamento</p>
              <p className="text-xs">{sol.departamento || "—"}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Tabela de dados ── */}
          <fieldset className="border border-border rounded-md overflow-hidden">
            <legend className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 ml-2">
              {tableTitle}
            </legend>
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10">
                  <TableHead className="w-[220px] text-xs font-bold uppercase py-3">Campo</TableHead>
                  <TableHead className="text-xs font-bold uppercase py-3">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.campo}>
                    <TableCell className="font-semibold text-sm py-3.5 bg-primary/[0.04]">{row.campo}</TableCell>
                    <TableCell className="text-sm py-3.5">{row.valor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </fieldset>

          {/* ── Anexos (compact) ── */}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1.5 gap-1.5 ${hasAnexo ? "border-orange-400 text-orange-600 bg-orange-50" : "border-border text-muted-foreground"}`}
            >
              <Paperclip className="h-3 w-3" />
              {hasAnexo ? parsed["Anexo"] : "Não possui anexos"}
            </Badge>
          </div>

          {/* ── Observações ── */}
          <fieldset className="border border-border rounded-md p-3">
            <legend className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              Observações (Solicitação)
            </legend>
            <p className="text-sm">{sol.observacoes || "—"}</p>
          </fieldset>

          {/* ── Andamentos ── */}
          <fieldset className="border border-border rounded-md p-3 print:hidden">
            <legend className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              Andamentos
            </legend>
            <div className="space-y-3">
              {sol.andamentos.length === 0 && !showAndamento && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              {sol.andamentos.map((a) => {
                const { nome, texto } = parseAndamento(a.texto);
                return (
                  <div key={a.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground font-semibold">{a.data}</p>
                      {nome && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">{nome}</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{texto}</p>
                    {a.anexos && a.anexos.length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {a.anexos.map((anx, i) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1">
                            <Paperclip className="h-3 w-3" /> {anx}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

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
                    <Button size="sm" variant="outline" onClick={() => { setShowAndamento(false); setTextoAndamento(""); setAnexoNomes([]); }}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* ── Ações ── */}
          <div className="flex flex-wrap gap-3 pt-2 items-center print:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-primary text-primary"
              onClick={() => setShowAndamento(true)}
            >
              Em andamento
            </Button>
            {showConcluirCancelar && (
              <>
                <Button size="sm" variant="destructive" onClick={async () => { await cancelarSolicitacao(sol.id); navigate(-1); }}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await concluirSolicitacao(sol.id); navigate(-1); }}>
                  Concluir
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SolicitacaoServico;
