// Local in-memory store for solicitations (no backend yet)

// Categories for routing
export const LOGISTICA_SERVICES = [
  "Serviço de Diarista",
  "Aluguel de Banheiro",
  "Locação de Veículos",
  "Frete",
  "Gerador",
  "Hospedagem",
  "Passagens",
  "Tendas",
  "Plataforma Elevatória",
  "Equipamentos de TI",
  "Materiais de Escritório",
  "Materiais (Compras)",
] as const;

export const EXPEDICAO_SERVICES = ["Materiais (Expedição)"] as const;

export interface Andamento {
  id: string;
  texto: string;
  data: string;
  anexos?: string[]; // file names
}

export interface SolicitacaoColaborador {
  id: string;
  tipo: string; // service key
  unidade: string;
  evento: string;
  departamento: string;
  solicitante: string;
  solicitanteId: string; // user id
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
  caracteristicas: Record<string, string>; // key: carac name, value: "aplica" | "não se aplica"
  observacoes: string;
  dataCriacao: string;
  status: "pendente" | "aprovado_diretor" | "aprovado" | "reprovado" | "resolvido" | "cancelado";
  andamentos: Andamento[];
}

let solicitacoes: SolicitacaoColaborador[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getSolicitacoes() {
  return solicitacoes;
}

export function getSolicitacoesByDiretor(diretor: string) {
  const validStatuses = diretor.toLowerCase() === "osorio"
    ? ["pendente", "aprovado_diretor"]
    : ["pendente"];
  return solicitacoes.filter(
    (s) => s.diretorArea.toLowerCase() === diretor.toLowerCase() && validStatuses.includes(s.status)
  );
}

export function getSolicitacaoById(id: string) {
  return solicitacoes.find((s) => s.id === id);
}

export function getSolicitacoesByStatus(status: string) {
  return solicitacoes.filter((s) => s.status === status);
}

// Logística & Compras — all non-Expedição, non-RH services
export function getSolicitacoesLogistica(status?: string) {
  return solicitacoes.filter((s) => {
    const isLogistica = (LOGISTICA_SERVICES as readonly string[]).includes(s.tipo);
    if (status) {
      return isLogistica && s.status === status;
    }
    return isLogistica;
  });
}

// Expedição
export function getSolicitacoesExpedicao(status?: string) {
  return solicitacoes.filter((s) => {
    const isExpedicao = (EXPEDICAO_SERVICES as readonly string[]).includes(s.tipo);
    if (status) {
      return isExpedicao && s.status === status;
    }
    return isExpedicao;
  });
}

// Minhas Solicitações — by user id
export function getSolicitacoesByUser(userId: string, status?: string) {
  return solicitacoes.filter((s) => {
    const isUser = s.solicitanteId === userId;
    if (status) return isUser && s.status === status;
    return isUser;
  });
}

// Dashboard helpers
export function getSolicitacoesHoje() {
  const today = new Date().toLocaleDateString("pt-BR");
  return solicitacoes.filter((s) => s.dataCriacao.startsWith(today));
}

export function getSolicitacoesHojeResolvidas() {
  const today = new Date().toLocaleDateString("pt-BR");
  return solicitacoes.filter((s) => s.dataCriacao.startsWith(today) && s.status === "resolvido");
}

// Dashboard totals — all time
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

export function addSolicitacao(sol: Omit<SolicitacaoColaborador, "id" | "dataCriacao" | "status" | "andamentos">) {
  const nova: SolicitacaoColaborador = {
    ...sol,
    id: crypto.randomUUID(),
    dataCriacao: new Date().toLocaleString("pt-BR"),
    status: "pendente",
    andamentos: [],
  };
  solicitacoes = [...solicitacoes, nova];
  notify();
  return nova;
}

export function addAndamento(solId: string, texto: string, anexos: string[] = []) {
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    return {
      ...s,
      andamentos: [
        ...s.andamentos,
        {
          id: crypto.randomUUID(),
          texto,
          data: new Date().toLocaleString("pt-BR"),
          anexos,
        },
      ],
    };
  });
  notify();
}

export function aprovarSolicitacao(solId: string) {
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    const isOsorio = s.diretorArea.toLowerCase() === "osorio";
    if (isOsorio) {
      return { ...s, status: "aprovado" as const };
    } else {
      return { ...s, status: "aprovado_diretor" as const, diretorArea: "Osorio" };
    }
  });
  notify();
}

export function reprovarSolicitacao(solId: string) {
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    return { ...s, status: "reprovado" as const };
  });
  notify();
}

export function concluirSolicitacao(solId: string) {
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    return { ...s, status: "resolvido" as const };
  });
  notify();
}

export function cancelarSolicitacao(solId: string) {
  solicitacoes = solicitacoes.map((s) => {
    if (s.id !== solId) return s;
    return { ...s, status: "cancelado" as const };
  });
  notify();
}
