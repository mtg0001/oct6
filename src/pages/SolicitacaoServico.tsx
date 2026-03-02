import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getPrioridadeLabel } from "@/components/forms/PrioridadeSelect";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacao } from "@/hooks/useSolicitacoes";
import { addAndamento, concluirSolicitacao, cancelarSolicitacao, encaminharSolicitacao } from "@/stores/solicitacoesStore";
import { DIRETORES } from "@/stores/usuariosStore";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Paperclip, ArrowLeft, Printer, Forward, Loader2, ExternalLink } from "lucide-react";
import { getSharePointDownloadLink, uploadAttachmentToSharePoint, buildStoredFileName, getDisplayFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AndamentoBubble } from "@/components/AndamentoBubble";
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
  const { filtro, id, diretor } = useParams<{ filtro: string; id: string; diretor: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const sol = useSolicitacao(id || "");
  const currentUser = useCurrentUser();
  const isMinhasSolicitacoes = location.pathname.includes("/minhas-solicitacoes/");
  const isExpedicao = location.pathname.includes("/expedicao/");
  const isLogistica = location.pathname.includes("/logistica/");
  const isDiretoria = location.pathname.includes("/diretoria/");
  const isAdmin = currentUser?.administrador === true;
  const [showAndamento, setShowAndamento] = useState(false);
  const [textoAndamento, setTextoAndamento] = useState("");
  const [anexoNomes, setAnexoNomes] = useState<string[]>([]);
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);
  const [downloadingAnexo, setDownloadingAnexo] = useState(false);

  if (!sol) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Solicitação não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
      </AppLayout>
    );
  }

  const siglaUnidade = sol.unidade === "goiania" ? "GO" : "SP";
  const isPendente = filtro === "pendentes" || isDiretoria;
  const showConcluirCancelar = isPendente && !(isMinhasSolicitacoes && !isAdmin) && !isDiretoria;
  // Expedition forwarding logic
  const isDevolvido = sol.setorAtual === 'expedicao_devolvido';
  const showEncaminharExpedicao = isExpedicao && isPendente && !isDevolvido;
  const showEncaminharLogistica = isLogistica && sol.setorAtual === 'logistica_encaminhado' && isPendente;
  const showDiretoriaButtons = isDiretoria && sol.setorAtual === 'diretoria';
  const isDiretoriaUniformes = showDiretoriaButtons && sol.tipo === 'Uniformes e EPI';
  const nomeDir = diretor ? diretor.charAt(0).toUpperCase() + diretor.slice(1) : "";
  const parsed = parseJustificativa(sol.justificativa);
  const hasAnexo = !!parsed["Anexo"];

  const handleEnviarAndamento = async () => {
    if (!textoAndamento.trim()) return;
    const nome = currentUser?.nome || "Usuário";
    const textoComNome = `[${nome}] ${textoAndamento}`;
    let dateFolder: string | undefined;
    if (anexoFiles.length > 0) {
      dateFolder = await getNextSequentialFolder(sol.unidade, sol.tipo, nome);
    }
    const storedNomes = anexoFiles.map((f) => buildStoredFileName(f.name, dateFolder));
    for (const file of anexoFiles) {
      await uploadAttachmentToSharePoint({ file, unidade: sol.unidade, servico: sol.tipo, userName: nome, datePasta: dateFolder });
    }
    await addAndamento(sol.id, textoComNome, storedNomes);
    setTextoAndamento(""); setAnexoNomes([]); setAnexoFiles([]); setShowAndamento(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAnexoNomes((prev) => [...prev, ...files.map((f) => f.name)]);
      setAnexoFiles((prev) => [...prev, ...files]);
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

  // ── Hospedagem table rows ──
  const getHospedagemRows = () => {
    const rows = [
      { campo: "Local", valor: parsed["Local"] || sol.unidadeDestino || "—" },
      { campo: "Data de Entrada", valor: sol.horarioDe || parsed["Entrada"] || "—" },
      { campo: "Data de Saída", valor: sol.horarioAte || parsed["Saída"] || "—" },
    ];
    const hospedesRaw = parsed["Hóspedes"] || "";
    if (hospedesRaw) {
      const lista = hospedesRaw.split(";").map((h) => h.trim()).filter(Boolean);
      lista.forEach((h, i) => {
        rows.push({ campo: lista.length === 1 ? "Hóspede" : `Hóspede ${i + 1}`, valor: h });
      });
    } else {
      rows.push({ campo: "Hóspedes", valor: "—" });
    }
    return rows;
  };

  // ── Passagens table rows ──
  const getPassagensRows = () => {
    const rows = [
      { campo: "Tipo de Transporte", valor: parsed["Transporte"] || sol.tipoVaga || "—" },
      { campo: "Data de Ida", valor: sol.horarioDe || parsed["Data ida"] || "—" },
      { campo: "Data de Volta", valor: sol.horarioAte || parsed["Data volta"] || "—" },
      { campo: "Dias", valor: parsed["Dias"] || "—" },
      { campo: "Origem", valor: parsed["Origem"] || "—" },
      { campo: "Destino", valor: parsed["Destino"] || sol.unidadeDestino || "—" },
    ];
    const passageirosRaw = parsed["Passageiros"] || "";
    if (passageirosRaw) {
      const lista = passageirosRaw.split(";").map((p) => p.trim()).filter(Boolean);
      lista.forEach((p, i) => {
        rows.push({ campo: lista.length === 1 ? "Passageiro" : `Passageiro ${i + 1}`, valor: p });
      });
    } else {
      rows.push({ campo: "Passageiros", valor: "—" });
    }
    return rows;
  };

  // ── Tendas table rows ──
  const getTendasRows = () => {
    const rows: { campo: string; valor: string }[] = [];
    // Parse tendas from caracteristicas or justificativa
    const caracTendas = (sol.caracteristicas as any)?.tendas;
    if (caracTendas && Array.isArray(caracTendas)) {
      caracTendas.forEach((t: any, i: number) => {
        rows.push({ campo: `Tenda ${i + 1}`, valor: `${t.tipo} × ${t.quantidade}` });
        if (t.itens && Array.isArray(t.itens)) {
          t.itens.forEach((item: any, j: number) => {
            const label = t.quantidade > 1 ? `  ${t.tipo} ${j + 1}` : `  Detalhes`;
            rows.push({ campo: label, valor: `Pé: ${item.alturaPe || "—"}m, Medida: ${item.largura || "—"}×${item.comprimento || "—"}m, Laterais: ${item.lateraisFechadas || "0"}` });
          });
        }
      });
    } else {
      // fallback from justificativa
      const tendasRaw = sol.justificativa.split(" | ").filter(s => s.startsWith("Tenda "));
      tendasRaw.forEach((t) => rows.push({ campo: "Tenda", valor: t }));
    }
    rows.push({ campo: "Data de Entrega", valor: sol.horarioDe || parsed["Entrega"] || "—" });
    rows.push({ campo: "Data de Retirada", valor: sol.horarioAte || parsed["Retirada"] || "—" });
    return rows;
  };

  // ── Plataforma Elevatória table rows ──
  const getPlataformaRows = () => {
    const rows: { campo: string; valor: string }[] = [];
    let plataformas: any[] = [];
    const raw = (sol.caracteristicas as any)?.plataformas;
    if (typeof raw === "string") {
      try { plataformas = JSON.parse(raw); } catch { /* ignore */ }
    } else if (Array.isArray(raw)) {
      plataformas = raw;
    }
    if (plataformas.length > 0) {
      plataformas.forEach((p: any, i: number) => {
        const prefix = plataformas.length > 1 ? `Plataforma ${i + 1} — ` : "";
        rows.push({ campo: `${prefix}Tipo`, valor: (p.tipos || []).join(", ") || "—" });
        rows.push({ campo: `${prefix}Data de Entrega`, valor: p.dataEntrega || "—" });
        rows.push({ campo: `${prefix}Data de Retirada`, valor: p.dataRetirada || "—" });
      });
    } else {
      rows.push({ campo: "Tipos de Plataforma", valor: sol.tipoContrato || parsed["Tipos"] || "—" });
      rows.push({ campo: "Data de Entrega", valor: sol.horarioDe || parsed["Entrega"] || "—" });
      rows.push({ campo: "Data de Retirada", valor: sol.horarioAte || parsed["Retirada"] || "—" });
    }
    return rows;
  };

  // ── Materiais table rows (shared for all material types) ──
  const getMateriaisRows = () => {
    const rows: { campo: string; valor: string }[] = [];
    const carac = sol.caracteristicas as any;

    // Uniform/shoe details for Uniformes e EPI
    if (sol.tipo === "Uniformes e EPI") {
      if (carac?.uniforme === "sim") {
        rows.push({ campo: "Uniforme", valor: `Sim — Tamanho: ${carac.tamanhoUniforme || "—"}` });
        rows.push({ campo: "Uniforme disponível na empresa?", valor: carac.uniformeDisponivel === "sim" ? "Sim" : "Não" });
      } else {
        rows.push({ campo: "Uniforme", valor: "Não" });
      }
      if (carac?.sapato === "sim") {
        rows.push({ campo: "Sapato", valor: `Sim — Tamanho: ${carac.tamanhoSapato || "—"}` });
        rows.push({ campo: "Sapato disponível na empresa?", valor: carac.sapatoDisponivel === "sim" ? "Sim" : "Não" });
      } else {
        rows.push({ campo: "Sapato", valor: "Não" });
      }
    }

    const itensRaw = carac?.itens || parsed["Itens"] || "";
    if (itensRaw) {
      const lista = itensRaw.split(";").map((s: string) => s.trim()).filter(Boolean);
      lista.forEach((item: string, i: number) => {
        rows.push({ campo: `Item ${i + 1}`, valor: item.replace(/^\d+\)\s*/, "") });
      });
    }
    if (rows.length === 0) rows.push({ campo: "Itens", valor: "—" });
    return rows;
  };

  // ── Equipamentos de TI table rows (same item pattern + URL) ──
  const getEquipamentosTIRows = () => {
    const rows: { campo: string; valor: string }[] = [];
    const itensRaw = (sol.caracteristicas as any)?.itens || parsed["Itens"] || "";
    if (itensRaw) {
      const lista = itensRaw.split(";").map((s: string) => s.trim()).filter(Boolean);
      lista.forEach((item: string, i: number) => {
        rows.push({ campo: `Item ${i + 1}`, valor: item.replace(/^\d+\)\s*/, "") });
      });
    }
    if (rows.length === 0) rows.push({ campo: "Itens", valor: "—" });
    return rows;
  };

  // ── Negociação de Mão de Obra table rows ──
  const getNegociacaoRows = () => {
    const carac = sol.caracteristicas as any;
    const rows: { campo: string; valor: string }[] = [
      { campo: "Empreiteiro", valor: sol.cargo || parsed["Empreiteiro"] || "—" },
      { campo: "Celular", valor: carac?.celular || parsed["Celular"] || "—" },
      { campo: "Seguimento", valor: carac?.seguimento || sol.tipoContrato || parsed["Seguimento"] || "—" },
      { campo: "É Montagem?", valor: carac?.montagem === "sim" ? "Sim" : carac?.montagem === "nao" ? "Não" : parsed["Montagem"] || "—" },
    ];
    if (carac?.montagem === "sim") {
      rows.push({ campo: "Montagem (de — até)", valor: `${carac.montagemDe || "—"} a ${carac.montagemAte || "—"}` });
      rows.push({ campo: "Realização (de — até)", valor: `${carac.realizacaoDe || "—"} a ${carac.realizacaoAte || "—"}` });
      rows.push({ campo: "Desmontagem (de — até)", valor: `${carac.desmontagemDe || "—"} a ${carac.desmontagemAte || "—"}` });
    }
    return rows;
  };

  // ── Manutenção Predial table rows ──
  const getManutencaoRows = () => {
    const rows: { campo: string; valor: string }[] = [];
    const lines = sol.justificativa.split("\n").filter(Boolean);
    if (lines.length > 0 && lines[0].startsWith("Serviço ")) {
      lines.forEach((line) => {
        const match = line.match(/^Serviço (\d+): (.+?) \| Melhor data: (.+)$/);
        if (match) {
          rows.push({ campo: `Serviço ${match[1]}`, valor: match[2] });
          rows.push({ campo: `  Data de Execução`, valor: match[3] });
        } else {
          rows.push({ campo: "Serviço", valor: line });
        }
      });
    } else {
      const entries = Object.entries(parsed);
      entries.forEach(([k, v]) => rows.push({ campo: k, valor: v }));
    }
    if (rows.length === 0) rows.push({ campo: "Detalhes", valor: sol.justificativa || "—" });
    return rows;
  };

  // ── Novo Colaborador table rows ──
  const getNovoColaboradorRows = () => {
    const carac = sol.caracteristicas as any;
    const formacaoMap: Record<string, string> = { fundamental: "Ensino Fundamental", medio: "Ensino Médio", tecnico: "Técnico", superior: "Ensino Superior", pos: "Pós-Graduação" };
    const contratoMap: Record<string, string> = { clt: "CLT", pj: "PJ", temporario: "Temporário", estagio: "Estágio" };
    const rows: { campo: string; valor: string }[] = [
      { campo: "Cargo/Posição", valor: sol.cargo || "—" },
      { campo: "Unidade Destino", valor: sol.unidadeDestino === "goiania" ? "Goiânia" : sol.unidadeDestino === "saopaulo" ? "São Paulo" : sol.unidadeDestino || "—" },
      { campo: "Departamento Destino", valor: sol.departamentoDestino || "—" },
      { campo: "Diretor da Área", valor: sol.diretorArea || "—" },
      { campo: "Tipo da Vaga", valor: sol.tipoVaga === "nova" ? "Nova" : sol.tipoVaga === "substituicao" ? "Substituição" : sol.tipoVaga || "—" },
    ];
    if (sol.tipoVaga === "substituicao") {
      rows.push({ campo: "Substituído", valor: sol.nomeSubstituido || "—" });
    }
    rows.push(
      { campo: "Justificativa", valor: sol.justificativa || "—" },
      { campo: "Formação", valor: formacaoMap[sol.formacao] || sol.formacao || "—" },
      { campo: "Experiência", valor: sol.experiencia || "—" },
      { campo: "Conhecimentos", valor: sol.conhecimentos || "—" },
      { campo: "Faixa Salarial", valor: sol.faixaSalarialDe && sol.faixaSalarialAte ? `R$ ${sol.faixaSalarialDe} — R$ ${sol.faixaSalarialAte}` : "—" },
      { campo: "Tipo de Contrato", valor: contratoMap[sol.tipoContrato] || sol.tipoContrato || "—" },
      { campo: "Horário de Trabalho", valor: sol.horarioDe && sol.horarioAte ? `${sol.horarioDe} às ${sol.horarioAte}` : "—" },
      { campo: "Prazo para Contratação", valor: carac?.prazoContratacao || "—" },
    );
    if (sol.tipoContrato === "temporario") {
      rows.push({ campo: "Contrato Temporário", valor: `${carac?.tempDe || "—"} a ${carac?.tempAte || "—"}` });
    }
    // Características comportamentais
    const caracKeys = ["Proatividade", "Foco", "Relacionamento", "Decisão", "Asseio", "Iniciativa", "Competitividade", "Ousadia", "Estratégia", "Agilidade", "Liderança", "Oratória", "Negociação", "Criatividade", "Serenidade", "Comunicação", "Organização", "Versatilidade", "Habilidade", "Simpatia"];
    const aplicaveis = caracKeys.filter((k) => carac?.[k] === "aplica");
    if (aplicaveis.length > 0) {
      rows.push({ campo: "Características (Aplica)", valor: aplicaveis.join(", ") });
    }
    const naoAplicaveis = caracKeys.filter((k) => carac?.[k] === "não se aplica");
    if (naoAplicaveis.length > 0) {
      rows.push({ campo: "Características (Não se aplica)", valor: naoAplicaveis.join(", ") });
    }
    return rows;
  };

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
  const isHospedagem = sol.tipo === "Hospedagem";
  const isPassagens = sol.tipo === "Passagens";
  const isTendas = sol.tipo === "Tendas";
  const isPlataforma = sol.tipo === "Plataforma Elevatória";
  const isMateriais = ["Materiais (Expedição)", "Materiais (Compras)", "Materiais de Escritório", "Uniformes e EPI"].includes(sol.tipo);
  const isEquipTI = sol.tipo === "Equipamentos de TI";
  const isNegociacao = sol.tipo === "Negociação de Mão de Obra";
  const isManutencao = sol.tipo === "Manutenção Predial";
  const isColaborador = sol.tipo === "Novo Colaborador";
  const tableRows = isDiarista ? getDiaristaRows() : isAluguelBanheiro ? getAluguelBanheiroRows() : isLocacaoVeiculos ? getLocacaoVeiculosRows() : isFrete ? getFreteRows() : isGerador ? getGeradorRows() : isHospedagem ? getHospedagemRows() : isPassagens ? getPassagensRows() : isTendas ? getTendasRows() : isPlataforma ? getPlataformaRows() : isMateriais ? getMateriaisRows() : isEquipTI ? getEquipamentosTIRows() : isNegociacao ? getNegociacaoRows() : isManutencao ? getManutencaoRows() : isColaborador ? getNovoColaboradorRows() : getGenericRows();
  const tableTitle = isDiarista ? "Dados do Serviço de Diarista" : isAluguelBanheiro ? "Dados do Aluguel de Banheiro" : isLocacaoVeiculos ? "Dados da Locação de Veículos" : isFrete ? "Dados do Frete" : isGerador ? "Dados do Gerador" : isHospedagem ? "Dados da Hospedagem" : isPassagens ? "Dados da Passagem" : isTendas ? "Dados das Tendas" : isPlataforma ? "Dados da Plataforma Elevatória" : isMateriais ? `Itens — ${sol.tipo}` : isEquipTI ? "Itens — Equipamentos de TI" : isNegociacao ? "Dados da Negociação" : isManutencao ? "Serviços de Manutenção" : isColaborador ? "Dados da Vaga" : "Dados da Solicitação";

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
                <p className="font-bold capitalize text-xs">{getPrioridadeLabel(sol.prioridade)}</p>
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
            {hasAnexo ? (
              <button
                type="button"
                disabled={downloadingAnexo}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-400 text-orange-600 bg-orange-50 px-3 py-1.5 text-xs font-semibold hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-50"
                onClick={async () => {
                  setDownloadingAnexo(true);
                  try {
                    const link = await getSharePointDownloadLink({
                      unidade: sol.unidade,
                      servico: sol.tipo,
                      userName: sol.solicitante,
                      fileName: parsed["Anexo"],
                    });
                    if (link) {
                      window.open(link, "_blank");
                    } else {
                      alert("Não foi possível obter o link de download do anexo.");
                    }
                  } catch {
                    alert("Erro ao buscar anexo no SharePoint.");
                  } finally {
                    setDownloadingAnexo(false);
                  }
                }}
              >
                {downloadingAnexo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                {getDisplayFileName(parsed["Anexo"])}
                <ExternalLink className="h-3 w-3" />
              </button>
            ) : (
              <Badge variant="outline" className="text-xs px-3 py-1.5 gap-1.5 border-border text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                Não possui anexos
              </Badge>
            )}
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
            {/* Expedition: if returned from diretoria, show Concluir + Cancelar + Encaminhar Logística */}
            {isExpedicao && isPendente && isDevolvido && (
              <>
                <Button size="sm" variant="destructive" onClick={async () => { await cancelarSolicitacao(sol.id); navigate(-1); }}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await concluirSolicitacao(sol.id); navigate(-1); }}>
                  Concluir
                </Button>
                <Button size="sm" variant="outline" className="border-blue-500 text-blue-600" onClick={async () => {
                  const nome = currentUser?.nome || "Expedição";
                  await addAndamento(sol.id, `[${nome}] 📦 Encaminhado para Logística & Compras`);
                  await encaminharSolicitacao(sol.id, 'logistica_encaminhado');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Encaminhar para Logística
                </Button>
              </>
            )}
            {/* Normal Concluir/Cancelar (not for returned expedition items) */}
            {showConcluirCancelar && !(isExpedicao && isDevolvido) && (
              <>
                <Button size="sm" variant="destructive" onClick={async () => { await cancelarSolicitacao(sol.id); navigate(-1); }}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await concluirSolicitacao(sol.id); navigate(-1); }}>
                  Concluir
                </Button>
              </>
            )}
            {/* Expedition: Encaminhar para dropdown */}
            {showEncaminharExpedicao && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-blue-500 text-blue-600">
                    <Forward className="h-4 w-4 mr-1" />
                    Encaminhar para
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={async () => {
                    const nome = currentUser?.nome || "Expedição";
                    await addAndamento(sol.id, `[${nome}] 📦 Encaminhado para Logística & Compras`);
                    await encaminharSolicitacao(sol.id, 'logistica_encaminhado');
                    navigate(-1);
                  }}>
                    Logística & Compras
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    const nome = currentUser?.nome || "Expedição";
                    await addAndamento(sol.id, `[${nome}] 📦 Encaminhado para Recursos Humanos`);
                    await encaminharSolicitacao(sol.id, 'rh_encaminhado');
                    navigate(-1);
                  }}>
                    Recursos Humanos
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Diretoria Aprovação</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {DIRETORES.filter((dir) => dir !== "Jessica").map((dir) => (
                        <DropdownMenuItem key={dir} onClick={async () => {
                          const nome = currentUser?.nome || "Expedição";
                          await addAndamento(sol.id, `[${nome}] 📦 Encaminhado para Diretoria — ${dir}`);
                          await encaminharSolicitacao(sol.id, 'diretoria', dir);
                          navigate(-1);
                        }}>
                          {dir}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Logística: item forwarded from expedition, can send back */}
            {showEncaminharLogistica && (
              <Button size="sm" variant="outline" className="border-blue-500 text-blue-600" onClick={async () => {
                const nome = currentUser?.nome || "Logística";
                await addAndamento(sol.id, `[${nome}] 📦 Encaminhado de volta para Expedição`);
                await encaminharSolicitacao(sol.id, 'expedicao_devolvido');
                navigate(-1);
              }}>
                <Forward className="h-4 w-4 mr-1" />
                Encaminhar para Expedição
              </Button>
            )}
            {/* Diretoria: Uniformes e EPI (Soraya) - special buttons */}
            {isDiretoriaUniformes && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ✅ Aprovado por ${nome} e encaminhado para Recursos Humanos`);
                  await encaminharSolicitacao(sol.id, '', undefined, 'pendente');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Aprovar e enviar para Recursos Humanos
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ✅ Aprovado por ${nome} e encaminhado para Logística & Compras`);
                  await encaminharSolicitacao(sol.id, 'logistica_encaminhado', undefined, 'aprovado');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Aprovar e enviar para Logística
                </Button>
                <Button size="sm" variant="destructive" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ❌ Reprovado por ${nome}`);
                  await encaminharSolicitacao(sol.id, '', undefined, 'reprovado');
                  navigate(-1);
                }}>
                  Reprovar
                </Button>
              </>
            )}
            {/* Diretoria: forwarded expedition item (non-Uniformes) */}
            {showDiretoriaButtons && !isDiretoriaUniformes && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ✅ Aprovado por ${nome} e encaminhado para Logística & Compras`);
                  await encaminharSolicitacao(sol.id, 'logistica_encaminhado', undefined, 'aprovado');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Aprovar e encaminhar para Logística
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ✅ Aprovado por ${nome} e devolvido para Expedição`);
                  await encaminharSolicitacao(sol.id, 'expedicao_devolvido', undefined, 'pendente');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Aprovar e devolver para Expedição
                </Button>
                <Button size="sm" variant="destructive" onClick={async () => {
                  const nome = currentUser?.nome || nomeDir;
                  await addAndamento(sol.id, `[${nome}] ❌ Reprovado por ${nome} e devolvido para Expedição`);
                  await encaminharSolicitacao(sol.id, 'expedicao_devolvido', undefined, 'pendente');
                  navigate(-1);
                }}>
                  <Forward className="h-4 w-4 mr-1" />
                  Reprovar e devolver para Expedição
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
