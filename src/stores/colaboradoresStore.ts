import { supabase } from "@/integrations/supabase/client";

export type RowStatus = "ativo" | "inativo" | "pendente_ti";

export interface Colaborador {
  id: string;
  nome: string;
  status: RowStatus;
  dados: string[];
}

function mapRow(row: any): Colaborador {
  return {
    id: row.id,
    nome: row.nome,
    status: row.status as RowStatus,
    dados: row.dados || [],
  };
}

// ─── PJ Store ───────────────────────────────────────────
let pjList: Colaborador[] = [];
let pjLoaded = false;
let pjLoading: Promise<void> | null = null;
const pjListeners: (() => void)[] = [];
function notifyPJ() { pjListeners.forEach(l => l()); }

export function subscribePJ(listener: () => void) {
  pjListeners.push(listener);
  return () => { const i = pjListeners.indexOf(listener); if (i >= 0) pjListeners.splice(i, 1); };
}

export async function loadPJ() {
  const { data, error } = await supabase
    .from("colaboradores_pj" as any)
    .select("*")
    .order("created_at");
  if (!error && data) {
    pjList = (data as any[]).map(mapRow);
    pjLoaded = true;
    notifyPJ();
  }
}

export function ensurePJLoaded() {
  if (pjLoaded) return Promise.resolve();
  if (!pjLoading) pjLoading = loadPJ().finally(() => { pjLoading = null; });
  return pjLoading;
}

export function getPJ() { return pjList; }

export async function addPJ(nome: string, dados: string[]) {
  const { data, error } = await (supabase.from("colaboradores_pj" as any) as any)
    .insert({ nome, status: "ativo", dados })
    .select()
    .single();
  if (error) throw error;
  pjList = [...pjList, mapRow(data)];
  notifyPJ();
  return mapRow(data);
}

export async function updatePJ(id: string, updates: { nome?: string; status?: string; dados?: string[] }) {
  const { error } = await (supabase.from("colaboradores_pj" as any) as any)
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  pjList = pjList.map(c => c.id === id ? { ...c, ...updates } as Colaborador : c);
  notifyPJ();
}

export async function deletePJ(id: string) {
  const { error } = await (supabase.from("colaboradores_pj" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
  pjList = pjList.filter(c => c.id !== id);
  notifyPJ();
}

// ─── CLT Store ──────────────────────────────────────────
let cltList: Colaborador[] = [];
let cltLoaded = false;
let cltLoading: Promise<void> | null = null;
const cltListeners: (() => void)[] = [];
function notifyCLT() { cltListeners.forEach(l => l()); }

export function subscribeCLT(listener: () => void) {
  cltListeners.push(listener);
  return () => { const i = cltListeners.indexOf(listener); if (i >= 0) cltListeners.splice(i, 1); };
}

export async function loadCLT() {
  const { data, error } = await supabase
    .from("colaboradores_clt" as any)
    .select("*")
    .order("created_at");
  if (!error && data) {
    cltList = (data as any[]).map(mapRow);
    cltLoaded = true;
    notifyCLT();
  }
}

export function ensureCLTLoaded() {
  if (cltLoaded) return Promise.resolve();
  if (!cltLoading) cltLoading = loadCLT().finally(() => { cltLoading = null; });
  return cltLoading;
}

export function getCLT() { return cltList; }

export async function addCLT(nome: string, dados: string[]) {
  const { data, error } = await (supabase.from("colaboradores_clt" as any) as any)
    .insert({ nome, status: "ativo", dados })
    .select()
    .single();
  if (error) throw error;
  cltList = [...cltList, mapRow(data)];
  notifyCLT();
  return mapRow(data);
}

export async function updateCLT(id: string, updates: { nome?: string; status?: string; dados?: string[] }) {
  const { error } = await (supabase.from("colaboradores_clt" as any) as any)
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  cltList = cltList.map(c => c.id === id ? { ...c, ...updates } as Colaborador : c);
  notifyCLT();
}

export async function deleteCLT(id: string) {
  const { error } = await (supabase.from("colaboradores_clt" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
  cltList = cltList.filter(c => c.id !== id);
  notifyCLT();
}
