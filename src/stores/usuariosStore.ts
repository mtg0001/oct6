// Supabase-backed store for users and permissions
import { supabase } from "@/integrations/supabase/client";

export const DEPARTAMENTOS = [
  "COMERCIAL",
  "MARKETING",
  "PROJETOS",
  "LICITAÇÕES",
  "RECURSOS HUMANOS",
  "LOGÍSTICA E COMPRAS",
  "FINANCEIRO",
  "SERVIÇOS GERAIS",
  "OPERACIONAL",
  "TECNOLOGIA DA INFORMAÇÃO",
  "CS",
  "PRÉ PRODUÇÃO",
  "PRODUÇÃO",
  "COMUNICAÇÃO VISUAL",
] as const;

export const UNIDADES = ["GOIÂNIA", "MAIRIPORÃ", "PINHEIROS"] as const;

export const SERVICOS_SOLICITACAO = [
  "Serviço de Diarista",
  "Aluguel de Banheiro",
  "Locação de Veículos",
  "Frete",
  "Gerador",
  "Hospedagem",
  "Tendas",
  "Plataforma Elevatória",
  "Passagens",
  "Equipamentos de TI",
  "Manutenção Predial",
  "Uniformes e EPI",
  "Materiais de Escritório",
  "Materiais (Expedição)",
  "Materiais (Compras)",
  "Negociação de Mão de Obra",
  "Novo Colaborador",
  "CAD",
] as const;

export const DIRETORES = ["Jessica", "Soraya", "Danielle", "Osorio"] as const;

export interface Usuario {
  id: string;
  userId: string | null;
  nome: string;
  email: string;
  departamento: string;
  unidadePadrao: string;
  ativo: boolean;
  administrador: boolean;
  novaSolicitacaoUnidades: string[];
  resolveExpedicaoGo: boolean;
  resolveExpedicaoSp: boolean;
  resolveLogisticaComprasGo: boolean;
  resolveLogisticaComprasSp: boolean;
  resolveRecursosHumanosGo: boolean;
  resolveRecursosHumanosSp: boolean;
  diretoria: string[];
  servicosPermitidos: string[];
  visualizaSolicitacoesUnidades: string[];
  avatarUrl: string | null;
  podeExcluirChamado: boolean;
  podeVerLixeira: boolean;
  resolveCs: boolean;
  podeVerCad: boolean;
}

function mapRow(row: any): Usuario {
  return {
    id: row.id,
    userId: row.user_id || null,
    nome: row.nome,
    email: row.email,
    departamento: row.departamento,
    unidadePadrao: row.unidade_padrao,
    ativo: row.ativo,
    administrador: row.administrador,
    novaSolicitacaoUnidades: row.nova_solicitacao_unidades || [],
    resolveExpedicaoGo: row.resolve_expedicao_go || false,
    resolveExpedicaoSp: row.resolve_expedicao_sp || false,
    resolveLogisticaComprasGo: row.resolve_logistica_compras_go || false,
    resolveLogisticaComprasSp: row.resolve_logistica_compras_sp || false,
    resolveRecursosHumanosGo: row.resolve_recursos_humanos_go || false,
    resolveRecursosHumanosSp: row.resolve_recursos_humanos_sp || false,
    diretoria: row.diretoria || [],
    servicosPermitidos: row.servicos_permitidos || [],
    visualizaSolicitacoesUnidades: row.visualiza_solicitacoes_unidades || [],
    avatarUrl: row.avatar_url || null,
    podeExcluirChamado: row.pode_excluir_chamado || false,
    podeVerLixeira: row.pode_ver_lixeira || false,
    resolveCs: row.resolve_cs || false,
    podeVerCad: row.pode_ver_cad || false,
  };
}

function toDbRow(u: Partial<Usuario>): Record<string, any> {
  const m: Record<string, any> = {};
  if (u.nome !== undefined) m.nome = u.nome;
  if (u.email !== undefined) m.email = u.email;
  if (u.departamento !== undefined) m.departamento = u.departamento;
  if (u.unidadePadrao !== undefined) m.unidade_padrao = u.unidadePadrao;
  if (u.ativo !== undefined) m.ativo = u.ativo;
  if (u.administrador !== undefined) m.administrador = u.administrador;
  if (u.novaSolicitacaoUnidades !== undefined) m.nova_solicitacao_unidades = u.novaSolicitacaoUnidades;
  if (u.resolveExpedicaoGo !== undefined) m.resolve_expedicao_go = u.resolveExpedicaoGo;
  if (u.resolveExpedicaoSp !== undefined) m.resolve_expedicao_sp = u.resolveExpedicaoSp;
  if (u.resolveLogisticaComprasGo !== undefined) m.resolve_logistica_compras_go = u.resolveLogisticaComprasGo;
  if (u.resolveLogisticaComprasSp !== undefined) m.resolve_logistica_compras_sp = u.resolveLogisticaComprasSp;
  if (u.resolveRecursosHumanosGo !== undefined) m.resolve_recursos_humanos_go = u.resolveRecursosHumanosGo;
  if (u.resolveRecursosHumanosSp !== undefined) m.resolve_recursos_humanos_sp = u.resolveRecursosHumanosSp;
  if (u.diretoria !== undefined) m.diretoria = u.diretoria;
  if (u.servicosPermitidos !== undefined) m.servicos_permitidos = u.servicosPermitidos;
  if (u.visualizaSolicitacoesUnidades !== undefined) m.visualiza_solicitacoes_unidades = u.visualizaSolicitacoesUnidades;
  if (u.userId !== undefined) m.user_id = u.userId;
  if (u.podeExcluirChamado !== undefined) m.pode_excluir_chamado = u.podeExcluirChamado;
  if (u.podeVerLixeira !== undefined) m.pode_ver_lixeira = u.podeVerLixeira;
  if (u.resolveCs !== undefined) m.resolve_cs = u.resolveCs;
  if (u.podeVerCad !== undefined) m.pode_ver_cad = u.podeVerCad;
  return m;
}

// Simple event emitter for reactivity
let listeners: (() => void)[] = [];
function notify() { listeners.forEach((l) => l()); }
export function subscribeUsuarios(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

let usuarios: Usuario[] = [];
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadUsuarios() {
  const { data, error } = await supabase.from("usuarios").select("*").order("created_at");
  if (error) { if (import.meta.env.DEV) console.error("Erro ao carregar usuários:", error); return; }
  usuarios = (data || []).map(mapRow);
  loaded = true;
  notify();
}

export function ensureUsuariosLoaded() {
  if (loaded) return Promise.resolve();
  if (!loadingPromise) loadingPromise = loadUsuarios().finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function getUsuarios() { return usuarios; }
export function getUsuarioById(id: string) { return usuarios.find((u) => u.id === id); }

export async function addUsuario(u: Omit<Usuario, "id">) {
  const { data, error } = await supabase.from("usuarios").insert([toDbRow(u as any)] as any).select().single();
  if (error) throw error;
  const novo = mapRow(data);
  usuarios = [...usuarios, novo];
  notify();
  return novo;
}

export async function updateUsuario(id: string, updates: Partial<Usuario>) {
  const { error } = await supabase.from("usuarios").update(toDbRow(updates)).eq("id", id);
  if (error) throw error;
  usuarios = usuarios.map((u) => (u.id === id ? { ...u, ...updates } : u));
  notify();
}

export async function toggleUsuarioAtivo(id: string) {
  const user = usuarios.find((u) => u.id === id);
  if (!user) return;
  const newAtivo = !user.ativo;
  const { error } = await supabase.from("usuarios").update({ ativo: newAtivo }).eq("id", id);
  if (error) throw error;
  usuarios = usuarios.map((u) => (u.id === id ? { ...u, ativo: newAtivo } : u));
  notify();
}

export async function getCurrentAuthUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export function getCurrentUser(): Usuario | undefined {
  return _currentUsuario;
}

let _currentUsuario: Usuario | undefined;

export async function resolveCurrentUser(): Promise<Usuario | undefined> {
  const authUid = await getCurrentAuthUserId();
  if (!authUid) {
    _currentUsuario = undefined;
    return undefined;
  }
  _currentUsuario = usuarios.find((u) => u.userId === authUid);
  return _currentUsuario;
}

export function setCurrentUsuarioFromAuth(authUid: string) {
  _currentUsuario = usuarios.find((u) => u.userId === authUid);
  notify();
}
