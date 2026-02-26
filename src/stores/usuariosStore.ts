// Supabase-backed store for users and permissions
import { supabase } from "@/integrations/supabase/client";

export const DEPARTAMENTOS = [
  "ADMINISTRATIVO",
  "COMERCIAL",
  "DIRETORIA",
  "FINANCEIRO",
  "LICITAÇÕES",
  "LOGÍSTICA & COMPRAS",
  "OPERACIONAL",
  "PROJETOS",
  "RECURSOS HUMANOS",
  "DEPARTAMENTO PESSOAL",
  "SERVIÇOS GERAIS",
  "TECNOLOGIA DA INFORMAÇÃO",
] as const;

export const UNIDADES = ["SÃO PAULO", "GOIÂNIA"] as const;

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
] as const;

export const DIRETORES = ["Osorio", "Jessica", "Soraya", "Danielle"] as const;

export interface Usuario {
  id: string;
  userId: string | null; // auth.users id
  nome: string;
  email: string;
  departamento: string;
  unidadePadrao: string;
  ativo: boolean;
  administrador: boolean;
  novaSolicitacaoUnidades: string[];
  resolveExpedicao: boolean;
  resolveLogisticaCompras: boolean;
  resolveRecursosHumanos: boolean;
  diretoria: string[];
  servicosPermitidos: string[];
  visualizaSolicitacoesUnidades: string[];
  avatarUrl: string | null;
}

// Map DB row (snake_case) → app model (camelCase)
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
    resolveExpedicao: row.resolve_expedicao,
    resolveLogisticaCompras: row.resolve_logistica_compras,
    resolveRecursosHumanos: row.resolve_recursos_humanos,
    diretoria: row.diretoria || [],
    servicosPermitidos: row.servicos_permitidos || [],
    visualizaSolicitacoesUnidades: row.visualiza_solicitacoes_unidades || [],
    avatarUrl: row.avatar_url || null,
  };
}

// Map app model → DB insert/update
function toDbRow(u: Partial<Usuario>): Record<string, any> {
  const m: Record<string, any> = {};
  if (u.nome !== undefined) m.nome = u.nome;
  if (u.email !== undefined) m.email = u.email;
  if (u.departamento !== undefined) m.departamento = u.departamento;
  if (u.unidadePadrao !== undefined) m.unidade_padrao = u.unidadePadrao;
  if (u.ativo !== undefined) m.ativo = u.ativo;
  if (u.administrador !== undefined) m.administrador = u.administrador;
  if (u.novaSolicitacaoUnidades !== undefined) m.nova_solicitacao_unidades = u.novaSolicitacaoUnidades;
  if (u.resolveExpedicao !== undefined) m.resolve_expedicao = u.resolveExpedicao;
  if (u.resolveLogisticaCompras !== undefined) m.resolve_logistica_compras = u.resolveLogisticaCompras;
  if (u.resolveRecursosHumanos !== undefined) m.resolve_recursos_humanos = u.resolveRecursosHumanos;
  if (u.diretoria !== undefined) m.diretoria = u.diretoria;
  if (u.servicosPermitidos !== undefined) m.servicos_permitidos = u.servicosPermitidos;
  if (u.visualizaSolicitacoesUnidades !== undefined) m.visualiza_solicitacoes_unidades = u.visualizaSolicitacoesUnidades;
  if (u.userId !== undefined) m.user_id = u.userId;
  return m;
}

// Simple event emitter for reactivity
let listeners: (() => void)[] = [];
function notify() { listeners.forEach((l) => l()); }
export function subscribeUsuarios(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

// In-memory cache, loaded from Supabase
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

// Current logged user - resolved from Supabase Auth session
export async function getCurrentAuthUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export function getCurrentUser(): Usuario | undefined {
  // Find the usuario linked to the current Supabase Auth user
  // This requires the auth uid to be passed or cached
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
