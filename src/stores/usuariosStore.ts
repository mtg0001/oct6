// In-memory store for users and permissions

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
  nome: string;
  email: string;
  login: string;
  senha: string;
  departamento: string;
  unidadePadrao: string;
  ativo: boolean;
  // Permissions
  administrador: boolean;
  novaSolicitacaoUnidades: string[]; // ["SÃO PAULO", "GOIÂNIA"]
  resolveExpedicao: boolean;
  resolveLogisticaCompras: boolean;
  resolveRecursosHumanos: boolean;
  diretoria: string[]; // submenus visíveis: ["Osorio", "Jessica", ...]
  servicosPermitidos: string[]; // quais cards de solicitação pode ver
  visualizaSolicitacoesUnidades: string[]; // ["GOIÂNIA", "SÃO PAULO"] - quais menus Solicitações GO/SP aparecem
}

let usuarios: Usuario[] = [
  {
    id: "1",
    nome: "Admin Octarte",
    email: "admin@octarte.com",
    login: "admin.octarte",
    senha: "admin123",
    departamento: "TECNOLOGIA DA INFORMAÇÃO",
    unidadePadrao: "GOIÂNIA",
    ativo: true,
    administrador: true,
    novaSolicitacaoUnidades: ["SÃO PAULO", "GOIÂNIA"],
    resolveExpedicao: true,
    resolveLogisticaCompras: true,
    resolveRecursosHumanos: true,
    diretoria: ["Osorio", "Jessica", "Soraya", "Danielle"],
    servicosPermitidos: [...SERVICOS_SOLICITACAO],
    visualizaSolicitacoesUnidades: ["GOIÂNIA", "SÃO PAULO"],
  },
];

let listeners: (() => void)[] = [];
function notify() {
  listeners.forEach((l) => l());
}

export function subscribeUsuarios(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getUsuarios() {
  return usuarios;
}

export function getUsuarioById(id: string) {
  return usuarios.find((u) => u.id === id);
}

export function addUsuario(u: Omit<Usuario, "id">) {
  const novo: Usuario = { ...u, id: crypto.randomUUID() };
  usuarios = [...usuarios, novo];
  notify();
  return novo;
}

export function updateUsuario(id: string, data: Partial<Usuario>) {
  usuarios = usuarios.map((u) => (u.id === id ? { ...u, ...data } : u));
  notify();
}

export function toggleUsuarioAtivo(id: string) {
  usuarios = usuarios.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u));
  notify();
}

// Current logged user (simple simulation)
let currentUserId: string = "1"; // admin by default

export function getCurrentUser(): Usuario | undefined {
  return usuarios.find((u) => u.id === currentUserId);
}

export function setCurrentUser(id: string) {
  currentUserId = id;
  notify();
}
