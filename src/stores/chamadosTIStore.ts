import { supabase } from "@/integrations/supabase/client";

export interface ChamadoTI {
  id: string;
  solicitanteId: string | null;
  solicitanteNome: string;
  departamento: string;
  categoria: string;
  subOpcoes: string[];
  siteEspecifico: string;
  siteSuspeito: string;
  aprovadoGestor: string;
  novoColaborador: string;
  anydesk: string;
  urgencia: string;
  observacoes: string;
  anexos: string[];
  status: "pendente" | "resolvido" | "cancelado";
  criadoEm: string;
  atualizadoEm: string;
}

function mapRow(row: any): ChamadoTI {
  return {
    id: row.id,
    solicitanteId: row.solicitante_id,
    solicitanteNome: row.solicitante_nome,
    departamento: row.departamento,
    categoria: row.categoria,
    subOpcoes: row.sub_opcoes || [],
    siteEspecifico: row.site_especifico || "",
    siteSuspeito: row.site_suspeito || "",
    aprovadoGestor: row.aprovado_gestor || "",
    novoColaborador: row.novo_colaborador || "",
    anydesk: row.anydesk || "",
    urgencia: row.urgencia || "baixa",
    observacoes: row.observacoes || "",
    anexos: row.anexos || [],
    status: row.status,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

let chamados: ChamadoTI[] = [];
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners: Array<() => void> = [];

function notify() { listeners.forEach(l => l()); }
export function subscribeChamadosTI(listener: () => void) {
  listeners.push(listener);
  return () => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1); };
}

export async function loadChamadosTI() {
  const { data, error } = await supabase.from("chamados_ti").select("*").order("created_at", { ascending: false });
  if (!error && data) {
    chamados = data.map(mapRow);
    loaded = true;
    notify();
  }
}

export function ensureChamadosTILoaded() {
  if (loaded) return Promise.resolve();
  if (!loadingPromise) loadingPromise = loadChamadosTI().then(() => { loadingPromise = null; });
  return loadingPromise;
}

export function getChamadosTI() { return chamados; }
export function getChamadosTIByStatus(status: string) { return chamados.filter(c => c.status === status); }

export async function addChamadoTI(data: {
  solicitanteId: string | null;
  solicitanteNome: string;
  departamento: string;
  categoria: string;
  subOpcoes: string[];
  siteEspecifico?: string;
  siteSuspeito?: string;
  aprovadoGestor?: string;
  novoColaborador?: string;
  anydesk?: string;
  urgencia: string;
  observacoes?: string;
  anexos?: string[];
}) {
  const { error } = await supabase.from("chamados_ti").insert({
    solicitante_id: data.solicitanteId,
    solicitante_nome: data.solicitanteNome,
    departamento: data.departamento,
    categoria: data.categoria,
    sub_opcoes: data.subOpcoes,
    site_especifico: data.siteEspecifico || "",
    site_suspeito: data.siteSuspeito || "",
    aprovado_gestor: data.aprovadoGestor || "",
    novo_colaborador: data.novoColaborador || "",
    anydesk: data.anydesk || "",
    urgencia: data.urgencia,
    observacoes: data.observacoes || "",
    anexos: data.anexos || [],
    status: "pendente",
  });
  if (error) throw error;
  await loadChamadosTI();
}

export async function updateChamadoTIStatus(id: string, status: "pendente" | "resolvido" | "cancelado") {
  const { error } = await supabase.from("chamados_ti").update({ status }).eq("id", id);
  if (error) throw error;
  await loadChamadosTI();
}
