// Supabase-backed store for solicitations
import { supabase } from "@/integrations/supabase/client";

export const LOGISTICA_SERVICES = [
  "Serviço de Diarista", "Aluguel de Banheiro", "Locação de Veículos", "Frete",
  "Gerador", "Hospedagem", "Passagens", "Tendas", "Plataforma Elevatória",
  "Equipamentos de TI", "Materiais de Escritório", "Materiais (Compras)",
] as const;

export const EXPEDICAO_SERVICES = ["Materiais (Expedição)"] as const;

export interface Andamento {
  id: string;
  texto: string;
  data: string;
  anexos?: string[];
}

export interface SolicitacaoColaborador {
  id: string;
  tipo: string;
  unidade: string;
  evento: string;
  departamento: string;
  solicitante: string;
  solicitanteId: string;
  prioridade: string;
  cargo: string;
  unidadeDestino: string;
  departamentoDestino: string;
  diretorArea: string;
  tipoVaga: string;
  nomeSubstituido: string;
  justificativa: string;
  formacao: string;
  experiencia: string;
  conhecimentos: string;
  faixaSalarialDe: string;
  faixaSalarialAte: string;
  tipoContrato: string;
  horarioDe: string;
  horarioAte: string;
  caracteristicas: Record<string, string>;
  observacoes: string;
  dataCriacao: string;
  status: "pendente" | "aprovado_diretor" | "aprovado" | "reprovado" | "resolvido" | "cancelado";
  andamentos: Andamento[];
  setorAtual: string;
}

function mapSolRow(row: any, andamentos: any[] = []): SolicitacaoColaborador {
  return {
    id: row.id,
    tipo: row.tipo,
    unidade: row.unidade,
    evento: row.evento || "",
    departamento: row.departamento || "",
    solicitante: row.solicitante || "",
    solicitanteId: row.solicitante_id || "",
    prioridade: row.prioridade || "",
    cargo: row.cargo || "",
    unidadeDestino: row.unidade_destino || "",
    departamentoDestino: row.departamento_destino || "",
    diretorArea: row.diretor_area || "",
    tipoVaga: row.tipo_vaga || "",
    nomeSubstituido: row.nome_substituido || "",
    justificativa: row.justificativa || "",
    formacao: row.formacao || "",
    experiencia: row.experiencia || "",
    conhecimentos: row.conhecimentos || "",
    faixaSalarialDe: row.faixa_salarial_de || "",
    faixaSalarialAte: row.faixa_salarial_ate || "",
    tipoContrato: row.tipo_contrato || "",
    horarioDe: row.horario_de || "",
    horarioAte: row.horario_ate || "",
    caracteristicas: (row.caracteristicas as Record<string, string>) || {},
    observacoes: row.observacoes || "",
    dataCriacao: new Date(row.created_at).toLocaleString("pt-BR"),
    status: row.status,
    setorAtual: row.setor_atual || "",
    andamentos: andamentos.map((a) => ({
      id: a.id,
      texto: a.texto,
      data: new Date(a.created_at).toLocaleString("pt-BR"),
      anexos: a.anexos || [],
    })),
  };
}

function toDbInsert(sol: any): Record<string, any> {
  return {
    tipo: sol.tipo,
    unidade: sol.unidade,
    evento: sol.evento || "",
    departamento: sol.departamento || "",
    solicitante: sol.solicitante || "",
    solicitante_id: sol.solicitanteId || null,
    prioridade: sol.prioridade || "",
    cargo: sol.cargo || "",
    unidade_destino: sol.unidadeDestino || "",
    departamento_destino: sol.departamentoDestino || "",
    diretor_area: sol.diretorArea || "",
    tipo_vaga: sol.tipoVaga || "",
    nome_substituido: sol.nomeSubstituido || "",
    justificativa: sol.justificativa || "",
    formacao: sol.formacao || "",
    experiencia: sol.experiencia || "",
    conhecimentos: sol.conhecimentos || "",
    faixa_salarial_de: sol.faixaSalarialDe || "",
    faixa_salarial_ate: sol.faixaSalarialAte || "",
    tipo_contrato: sol.tipoContrato || "",
    horario_de: sol.horarioDe || "",
    horario_ate: sol.horarioAte || "",
    caracteristicas: sol.caracteristicas || {},
    observacoes: sol.observacoes || "",
  };
}

// Simple event emitter
let listeners: (() => void)[] = [];
function notify() { listeners.forEach((l) => l()); }
export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

let solicitacoes: SolicitacaoColaborador[] = [];
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadSolicitacoes() {
  const { data: solRows, error: solErr } = await supabase
    .from("solicitacoes").select("*").order("created_at", { ascending: false });
  if (solErr) { if (import.meta.env.DEV) console.error("Erro ao carregar solicitações:", solErr); return; }

  const { data: andRows, error: andErr } = await supabase
    .from("andamentos").select("*").order("created_at");
  if (andErr) { if (import.meta.env.DEV) console.error("Erro ao carregar andamentos:", andErr); return; }

  const andamentosBySol: Record<string, any[]> = {};
  (andRows || []).forEach((a: any) => {
    if (!andamentosBySol[a.solicitacao_id]) andamentosBySol[a.solicitacao_id] = [];
    andamentosBySol[a.solicitacao_id].push(a);
  });

  solicitacoes = (solRows || []).map((row) => mapSolRow(row, andamentosBySol[row.id] || []));
  loaded = true;
  notify();
}

export function ensureSolicitacoesLoaded() {
  if (loaded) return Promise.resolve();
  if (!loadingPromise) loadingPromise = loadSolicitacoes().finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function getSolicitacoes() { return solicitacoes; }

export function getSolicitacoesByDiretor(diretor: string) {
  const validStatuses = diretor.toLowerCase() === "osorio"
    ? ["pendente", "aprovado_diretor"]
    : ["pendente"];
  return solicitacoes.filter(
    (s) => s.diretorArea.toLowerCase() === diretor.toLowerCase() && validStatuses.includes(s.status)
  );
}

export function getSolicitacaoById(id: string) { return solicitacoes.find((s) => s.id === id); }
export function getSolicitacoesByStatus(status: string) { return solicitacoes.filter((s) => s.status === status); }

export function getSolicitacoesLogistica(status?: string) {
  return solicitacoes.filter((s) => {
    const isLogisticaOriginal = (LOGISTICA_SERVICES as readonly string[]).includes(s.tipo) && (s.setorAtual === '' || s.setorAtual === 'logistica');
    const isEncaminhado = s.setorAtual === 'logistica_encaminhado';
    const inQueue = isLogisticaOriginal || isEncaminhado;
    return status ? inQueue && s.status === status : inQueue;
  });
}

export function getSolicitacoesExpedicao(status?: string) {
  return solicitacoes.filter((s) => {
    const isExpedicao = (EXPEDICAO_SERVICES as readonly string[]).includes(s.tipo);
    const inExpedicaoQueue = s.setorAtual === '' || s.setorAtual === 'expedicao_devolvido';
    return status ? isExpedicao && inExpedicaoQueue && s.status === status : isExpedicao && inExpedicaoQueue;
  });
}

export const RH_SERVICES = ["Novo Colaborador", "Uniformes e EPI"] as const;

export function getSolicitacoesRH(status?: string) {
  return solicitacoes.filter((s) => {
    const isRHOriginal = (RH_SERVICES as readonly string[]).includes(s.tipo);
    const isEncaminhado = s.setorAtual === 'rh_encaminhado';
    const inQueue = isRHOriginal || isEncaminhado;
    return status ? inQueue && s.status === status : inQueue;
  });
}

export function getSolicitacoesByUser(userId: string, status?: string) {
  return solicitacoes.filter((s) => {
    const isUser = s.solicitanteId === userId;
    return status ? isUser && s.status === status : isUser;
  });
}

export function getSolicitacoesHoje() {
  const today = new Date().toLocaleDateString("pt-BR");
  return solicitacoes.filter((s) => s.dataCriacao.startsWith(today));
}

export function getTotaisPorStatus() {
  const pendente = solicitacoes.filter((s) => ["pendente", "aprovado_diretor", "aprovado"].includes(s.status)).length;
  const resolvido = solicitacoes.filter((s) => s.status === "resolvido").length;
  const cancelado = solicitacoes.filter((s) => s.status === "cancelado").length;
  return { pendente, resolvido, cancelado };
}

export function getTotaisPorUnidadeEStatus(unidade: string) {
  const filtered = solicitacoes.filter((s) => s.unidade === unidade);
  const pendente = filtered.filter((s) => ["pendente", "aprovado_diretor", "aprovado"].includes(s.status)).length;
  const resolvido = filtered.filter((s) => s.status === "resolvido").length;
  const cancelado = filtered.filter((s) => s.status === "cancelado").length;
  return { pendente, resolvido, cancelado };
}

// Mutations
export async function addSolicitacao(sol: Omit<SolicitacaoColaborador, "id" | "dataCriacao" | "status" | "andamentos" | "setorAtual">) {
  const { data, error } = await supabase.from("solicitacoes").insert([toDbInsert(sol)] as any).select().single();
  if (error) throw error;
  const nova = mapSolRow(data, []);
  solicitacoes = [nova, ...solicitacoes];
  notify();
  return nova;
}

export async function addAndamento(solId: string, texto: string, anexos: string[] = []) {
  const { data, error } = await supabase.from("andamentos").insert({
    solicitacao_id: solId,
    texto,
    anexos,
  }).select().single();
  if (error) throw error;

  const andamento: Andamento = {
    id: data.id,
    texto: data.texto,
    data: new Date(data.created_at).toLocaleString("pt-BR"),
    anexos: data.anexos || [],
  };
  solicitacoes = solicitacoes.map((s) =>
    s.id === solId ? { ...s, andamentos: [...s.andamentos, andamento] } : s
  );
  notify();
}

async function updateStatus(solId: string, updates: Record<string, any>) {
  const { error } = await supabase.from("solicitacoes").update(updates).eq("id", solId);
  if (error) throw error;
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    const patched = { ...s };
    if (updates.status) patched.status = updates.status;
    if (updates.diretor_area !== undefined) patched.diretorArea = updates.diretor_area;
    if (updates.setor_atual !== undefined) patched.setorAtual = updates.setor_atual;
    return patched;
  });
  notify();
}

export async function aprovarSolicitacao(solId: string) {
  const sol = solicitacoes.find((s) => s.id === solId);
  if (!sol) return;
  const isOsorio = sol.diretorArea.toLowerCase() === "osorio";
  if (isOsorio) {
    await updateStatus(solId, { status: "aprovado" });
  } else {
    await updateStatus(solId, { status: "aprovado_diretor", diretor_area: "Osorio" });
  }
}

export async function reprovarSolicitacao(solId: string) {
  await updateStatus(solId, { status: "reprovado" });
}

export async function concluirSolicitacao(solId: string) {
  await updateStatus(solId, { status: "resolvido" });

  // Generate PDF and upload to SharePoint (non-blocking)
  try {
    const { error } = await supabase.functions.invoke("generate-solicitacao-pdf", {
      body: { solicitacaoId: solId },
    });
    if (error) console.error("Erro ao gerar PDF para SharePoint:", error);
  } catch (err) {
    console.error("Erro ao enviar PDF para SharePoint:", err);
  }
}

export async function cancelarSolicitacao(solId: string) {
  await updateStatus(solId, { status: "cancelado" });
}

export async function encaminharSolicitacao(solId: string, destino: string, diretorNome?: string) {
  const updates: Record<string, any> = { setor_atual: destino };
  if (destino === 'diretoria' && diretorNome) {
    updates.diretor_area = diretorNome;
  }
  const { error } = await supabase.from("solicitacoes").update(updates).eq("id", solId);
  if (error) throw error;
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    return { ...s, setorAtual: destino, ...(diretorNome ? { diretorArea: diretorNome } : {}) };
  });
  notify();
}

export async function excluirSolicitacao(solId: string, excluidoPor: string) {
  const { error } = await supabase.from("solicitacoes").update({
    excluido: true,
    excluido_em: new Date().toISOString(),
    excluido_por: excluidoPor,
  }).eq("id", solId);
  if (error) throw error;
  solicitacoes = solicitacoes.filter((s) => s.id !== solId);
  notify();
}

export async function restaurarSolicitacao(solId: string) {
  const { error } = await supabase.from("solicitacoes").update({
    excluido: false,
    excluido_em: null,
    excluido_por: "",
  }).eq("id", solId);
  if (error) throw error;
  // Reload to get restored item back
  await loadSolicitacoes();
}

// Load only deleted items (for trash page)
let solicitacoesExcluidas: SolicitacaoColaborador[] = [];
let trashLoaded = false;

export async function loadSolicitacoesExcluidas() {
  const { data: solRows, error: solErr } = await supabase
    .from("solicitacoes").select("*").eq("excluido", true).order("created_at", { ascending: false });
  if (solErr) { console.error("Erro ao carregar lixeira:", solErr); return; }

  const { data: andRows } = await supabase.from("andamentos").select("*").order("created_at");
  const andamentosBySol: Record<string, any[]> = {};
  (andRows || []).forEach((a: any) => {
    if (!andamentosBySol[a.solicitacao_id]) andamentosBySol[a.solicitacao_id] = [];
    andamentosBySol[a.solicitacao_id].push(a);
  });

  solicitacoesExcluidas = (solRows || []).map((row) => mapSolRow(row, andamentosBySol[row.id] || []));
  trashLoaded = true;
  notify();
}

export function getSolicitacoesExcluidas() { return solicitacoesExcluidas; }
export function ensureTrashLoaded() {
  if (trashLoaded) return Promise.resolve();
  return loadSolicitacoesExcluidas();
}
