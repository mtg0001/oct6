import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pencil, Plus, X, Check } from "lucide-react";

type RowStatus = "ativo" | "inativo" | "editando" | "pendente_ti";

interface Colaborador {
  id: number;
  nome: string;
  dados: string[];
  status: RowStatus;
  isNew?: boolean;
  previousStatus?: RowStatus;
  originalNome?: string;
  originalDados?: string[];
}

const columnDefs = [
  { key: "data_admissao", label: "DATA ADMISSÃO", type: "date" },
  { key: "cargo", label: "CARGO", type: "text" },
  { key: "departamento", label: "DEPARTAMENTO", type: "text" },
  { key: "contratacao", label: "CONTRATAÇÃO", type: "select", options: ["CLT", "PROLABORE"] },
  { key: "salario", label: "SALÁRIO", type: "currency" },
  { key: "periculosidade", label: "PERICULOSIDADE", type: "currency" },
  { key: "gratificacao", label: "GRATIFICAÇÃO", type: "currency" },
  { key: "fgts", label: "FGTS", type: "currency" },
  { key: "ferias", label: "1/3 FÉRIAS", type: "currency" },
  { key: "decimo", label: "13º", type: "currency" },
  { key: "alimentacao", label: "ALIMENTAÇÃO", type: "currency" },
  { key: "mobilidade", label: "MOBILIDADE", type: "currency" },
  { key: "custo_total", label: "CUSTO TOTAL", type: "computed" },
  { key: "perfil", label: "PERFIL COMPORTAMENTAL", type: "text" },
  { key: "alocado", label: "ALOCADO EM", type: "select", options: ["SÃO PAULO", "GOIÂNIA"] },
  { key: "lider", label: "LÍDER DIRETO", type: "text" },
  { key: "ddd", label: "DDD", type: "ddd" },
  { key: "celular", label: "CELULAR", type: "phone" },
  { key: "nascimento", label: "DATA NASCIMENTO", type: "date" },
  { key: "rg", label: "RG", type: "rg" },
  { key: "cpf", label: "CPF", type: "cpf" },
  { key: "office", label: "PACOTE OFFICE", type: "select", options: ["STANDARD", "BASIC", "NÃO SE APLICA", "PENDENTE"] },
  { key: "sistema", label: "SISTEMA DE SOLICITAÇÕES", type: "select_sistema", options: ["ACESSO CRIADO", "NÃO SE APLICA", "PENDENTE"] },
  { key: "broche", label: "BROCHE", type: "date" },
  { key: "moletom", label: "MOLETOM", type: "select", options: ["ENTREGUE", "NÃO SE APLICA"] },
  { key: "obs", label: "OBS", type: "text" },
];

// Indices for cost calculation: salario=4, periculosidade=5, gratificacao=6, fgts=7, ferias=8, decimo=9, alimentacao=10, mobilidade=11, custo_total=12
const COST_INDICES = { salario: 4, periculosidade: 5, gratificacao: 6, fgts: 7, ferias: 8, decimo: 9, alimentacao: 10, mobilidade: 11, custoTotal: 12 };

let nextId = 200;

const initialData: Colaborador[] = [
  { id: 1, nome: "ADRIANO DOS SANTOS OLIVEIRA", status: "ativo", dados: ["02/12/25","MARCENEIRO","OPERACIONAL - SP","CLT","R$ 3.522,65","","","R$ 281,81","R$ 97,85","R$ 293,55","R$ 704,00","R$ 623,30","R$ 5.523,17","COMUNICADOR PLANEJADOR","SÃO PAULO","DOUGLAS","11","93218-7174","28/01/1984","","333.016.838-27","NÃO SE APLICA","NÃO SE APLICA","","NÃO SE APLICA","AFASTADO"] },
  { id: 2, nome: "ALISSON BIZERRA DE SOUZA", status: "ativo", dados: ["12/01/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - GO","CLT","R$ 2.347,90","","","R$ 187,83","R$ 65,22","R$ 195,66","R$ 704,00","R$ 300,00","R$ 3.800,61","","GOIÂNIA","DORISMAR","64","99951-5838","09/01/95","658190453","134.476.756-75","NÃO SE APLICA","ACESSO CRIADO","","","h"] },
  { id: 3, nome: "AMELIO MIRANDA DE MOREIRA NETO", status: "ativo", dados: ["19/12/22","ANALISTA DE LICITAÇÕES","LICITAÇÕES","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","PLANEJADOR COMUNICADOR","GOIÂNIA","OSÓRIO","62","99327-0076","29/09/75","1979854","659.599.571-91","STANDARD","ACESSO CRIADO","","","h"] },
  { id: 4, nome: "DANIEL SOARES DA SILVA", status: "ativo", dados: ["09/01/24","SERRALHEIRO PLENO","OPERACIONAL - GO","CLT","R$ 3.710,00","","","R$ 296,80","R$ 103,06","R$ 309,17","R$ 704,00","R$ 300,00","R$ 5.423,02","","GOIÂNIA","GLEIBE","62","9350-5655","16/08/76","3166407","807.765.901-20","NÃO SE APLICA","ACESSO CRIADO","","","h"] },
  { id: 5, nome: "DIEGO LEMOS PEREIRA", status: "ativo", dados: ["19/08/25","PINTOR","OPERACIONAL - SP","CLT","R$ 2.831,79","","","R$ 226,54","R$ 78,66","R$ 235,98","R$ 1.204,00","R$ 432,00","R$ 5.008,98","","SÃO PAULO","INAYARA","","","","","","NÃO SE APLICA","ACESSO CRIADO","26/02/26","","h"] },
  { id: 6, nome: "DJALMA GABRIEL CARVALHO SILVA", status: "ativo", dados: ["10/04/25","AUXILIAR DE IMPRESSÃO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 1.912,24","","","R$ 152,98","R$ 53,12","R$ 159,35","R$ 704,00","R$ 300,00","R$ 3.281,69","PLANEJADOR ANALISTA","GOIÂNIA","MARCOS","62","9180-5922","25/05/2007","2363805089","118.422.935-08","STANDARD","ACESSO CRIADO","","","h"] },
  { id: 7, nome: "DORISMAR PEREIRA DE SANTANA", status: "ativo", dados: ["14/12/22","ENCARREGADO DE GALPÃO","OPERACIONAL - GO","CLT","R$ 3.180,00","","R$ 1.272,00","R$ 356,16","R$ 123,67","R$ 371,00","R$ 1.204,00","R$ 300,00","R$ 6.806,83","COMUNICADOR PLANEJADOR","GOIÂNIA","RAFAEL","62","99133-4604","18/08/71","2281918","597.365.421-49","NÃO SE APLICA","ACESSO CRIADO","","","h"] },
  { id: 8, nome: "EDSON HENRIQUE BORGES DE SOUZA", status: "ativo", dados: ["26/11/25","ASSISTENTE DE LOGÍSTICA E COMPRAS","LOGÍSTICA E COMPRAS","CLT","R$ 2.120,00","","","R$ 169,60","R$ 58,89","R$ 176,67","R$ 704,00","R$ 300,00","R$ 3.529,16","","GOIÂNIA","THAÍS","62","98291-8821","27/09/96","6210330","008.252.301-01","STANDARD","ACESSO CRIADO","","","h"] },
  { id: 9, nome: "EDSON ROBERTO GONÇALVES DE LIMA", status: "ativo", dados: ["09/08/22","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - SP","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","EXECUTOR COMUNICADOR","SÃO PAULO","FILIPE","11","95272-4776","17/08/81","368325521","300.484.748-51","NÃO SE APLICA","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { id: 10, nome: "EDUARDO CONCEIÇÃO MARINHO", status: "ativo", dados: ["07/07/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - GO","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","","GOIÂNIA","DORISMAR","62","","27/05/1991","","035.000.351-32","NÃO SE APLICA","ACESSO CRIADO","","","h"] },
  { id: 11, nome: "EZAÚ DOS SANTOS DE ARAÚJO", status: "ativo", dados: ["24/11/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - SP","CLT","R$ 2.347,90","","","R$ 187,83","R$ 65,22","R$ 195,66","R$ 704,00","R$ 300,00","R$ 3.800,61","","SÃO PAULO","FILIPE","","","","","","NÃO SE APLICA","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { id: 12, nome: "FELIPE SANTOS NASCIMENTO", status: "ativo", dados: ["19/06/23","IMPRESSOR PLENO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 3.180,00","","","R$ 254,40","R$ 88,33","R$ 265,00","R$ 704,00","R$ 300,00","R$ 4.791,73","COMUNICADOR","SÃO PAULO","LUCAS","11","95268-5387","19/02/00","541069421","496.152.498-07","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { id: 13, nome: "GABRIELA ALVES PEREIRA PEIXOTO", status: "ativo", dados: ["01/01/24","CUSTOMER SUCCESS","OPS - CS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR","GOIÂNIA","INAYARA","62","99121-1375","26/01/99","5563147","039.492.741.97","STANDARD","ACESSO CRIADO","","","LICENÇA MATERNIDADE"] },
  { id: 14, nome: "GILIEL PIRES DA SILVA", status: "ativo", dados: ["12/06/25","SERRALHEIRO","OPERACIONAL - SP","CLT","R$ 3.297,02","","","R$ 263,76","R$ 91,58","R$ 274,75","R$ 704,00","R$ 300,00","R$ 4.931,12","","SÃO PAULO","GIULIAN","11","97402-9161","18/10/1999","659332450","102.277.885-40","NÃO SE APLICA","ACESSO CRIADO","26/02/26","","h"] },
  { id: 15, nome: "GIULIAN PIRES DA SILVA", status: "ativo", dados: ["28/05/24","SUPERVISOR DE SERRALHERIA","OPERACIONAL - SP","CLT","R$ 3.634,32","","R$ 1.453,72","R$ 407,04","R$ 141,33","R$ 424,00","R$ 704,00","R$ 300,00","R$ 7.064,42","PLANEJADOR EXECUTOR ANALISTA","SÃO PAULO","DENIS","11","91455-9604","28/10/2004","2208876407","866.981.485-47","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { id: 16, nome: "IZABELLY ISAAC BARBOSA CAVALCANTE", status: "ativo", dados: ["19/12/22","ORÇAMENTISTA","COMERCIAL","CLT","R$ 3.369,00","","","R$ 269,52","R$ 93,58","R$ 280,75","R$ 2.184,00","R$ 300,00","R$ 6.496,85","COMUNICADOR ANALISTA","GOIÂNIA","JESSICA","62","99187-4889","16/03/85","4707898","013.319.501-55","STANDARD","ACESSO CRIADO","","","m"] },
  { id: 17, nome: "JADSON MIRANDA DINIZ", status: "ativo", dados: ["09/05/24","MOTORISTA CARRETEIRO","OPERACIONAL - GO","CLT","R$ 4.415,32","","","R$ 353,23","R$ 122,65","R$ 367,94","R$ 704,00","R$ 300,00","R$ 6.263,14","ANALISTA EXECUTOR","GOIÂNIA","GLEIBE","62","99137-8808","23/01/1989","5428494","039.418.221-95","NÃO SE APLICA","ACESSO CRIADO","","","h"] },
  { id: 18, nome: "JESSICA SANTANA DE FREITAS", status: "ativo", dados: ["05/01/26","ANALISTA DE CONTAS A RECEBER","FINANCEIRO","CLT","R$ 2.650,00","","","R$ 212,00","R$ 73,61","R$ 220,83","R$ 704,00","R$ 300,00","R$ 4.160,44","","GOIÂNIA","NÚBIA","62","9353-8438","16/09/94","","043.276.181-01","STANDARD","ACESSO CRIADO","","","m"] },
  { id: 19, nome: "LEONARDO DA SILVA SOARES", status: "ativo", dados: ["26/02/24","IMPRESSOR JUNIOR","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 2.544,00","","","R$ 203,52","R$ 70,67","R$ 212,00","R$ 704,00","R$ 300,00","R$ 4.034,19","COMUNICADOR EXECUTOR","SÃO PAULO","LUCAS","11","93259-8827","21/08/2006","649452264","554.762.268-00","STANDARD","ACESSO CRIADO","","NÃO SE APLICA","h"] },
  { id: 20, nome: "LUCIA DO NASCIMENTO PEREIRA", status: "ativo", dados: ["27/02/24","AUXILIAR DE SERVIÇOS GERAIS SÊNIOR","SERVIÇOS GERAIS","CLT","R$ 2.188,26","","","R$ 175,06","R$ 60,79","R$ 182,36","R$ 704,00","R$ 300,00","R$ 3.610,46","","GOIÂNIA","DANIELLE","62","99638-4246","07/09/79","3539933","878.141.371-87","NÃO SE APLICA","ACESSO CRIADO","","","m"] },
  { id: 21, nome: "MARIA DE JESUS ALVES DOS REIS", status: "ativo", dados: ["20/03/25","AUXILIAR DE SERVIÇOS GERAIS PLENO","SERVIÇOS GERAIS","CLT","R$ 2.039,97","","","R$ 163,20","R$ 56,67","R$ 170,00","R$ 704,00","R$ 300,00","R$ 3.433,83","PLANEJADOR","SÃO PAULO","JESSICA","11","99742-9401","19/09/1972","281132528","179.802.228-14","NÃO SE APLICA","ACESSO CRIADO","","","m"] },
  { id: 22, nome: "NAJARA DOS SANTOS ALMEIDA", status: "ativo", dados: ["21/07/22","AUXILIAR DE SERVIÇOS GERAIS PLENO","SERVIÇOS GERAIS","CLT","R$ 2.039,97","","","R$ 163,20","R$ 56,67","R$ 170,00","R$ 704,00","R$ 300,00","R$ 3.433,83","COMUNICADOR","SÃO PAULO","NILVA","11","93006-6771","19/04/90","1447246420","416.602.368-35","NÃO SE APLICA","ACESSO CRIADO","26/02/26","","m"] },
  { id: 23, nome: "NAYARA COSTA DE OLIVEIRA VIANA", status: "ativo", dados: ["29/09/25","ANALISTA DE RECURSOS HUMANOS","RECURSOS HUMANOS","CLT","R$ 3.286,00","","","R$ 262,88","R$ 91,28","R$ 273,83","R$ 704,00","R$ 300,00","R$ 4.917,99","ANALISTA EXECUTOR","GOIÂNIA","FLÁVIA","62","99408-1350","01/07/91","5220244","023.112.861-45","STANDARD","ACESSO CRIADO","","","m"] },
  { id: 24, nome: "NILVA DUCA DE LIMA", status: "ativo", dados: ["01/12/19","SUPERVISORA DE LOGÍSTICA E COMPRAS","LOGÍSTICA E COMPRAS","PROLABORE","R$ 10.000,00","","","","R$ 277,78","R$ 833,33","R$ 704,00","R$ 300,00","R$ 12.115,11","","SÃO PAULO","DANIELLE","62","98111-0065","06/05/68","2249144","499.192.611-49","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { id: 25, nome: "NUBIA CRISTINA DA SILVA", status: "ativo", dados: ["25/01/24","COORDENADORA DO FINANCEIRO","FINANCEIRO","CLT","R$ 3.180,00","","R$ 1.272,00","R$ 356,16","R$ 123,67","R$ 371,00","R$ 704,00","R$ 300,00","R$ 6.306,83","EXECUTOR PLANEJADOR COMUNICADOR","GOIÂNIA","DANIELLE","62","98145-7014","26/09/83","42897152","003.560.021-79","STANDARD","ACESSO CRIADO","","","m"] },
  { id: 26, nome: "RAFAEL FERREIRA ESTEVES", status: "ativo", dados: ["25/03/25","AUXILIAR DE IMPRESSÃO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 1.912,24","","","R$ 152,98","R$ 53,12","R$ 159,35","R$ 704,00","R$ 300,00","R$ 3.281,69","PLANEJADOR EXECUTOR COMUNICADOR","SÃO PAULO","LUCAS","11","91188-0804","04/08/99","","472.904.588-26","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { id: 27, nome: "RANIELE PEREIRA SILVA SANTOS", status: "ativo", dados: ["13/11/24","ANALISTA DE LOGÍSTICA E COMPRAS JR","LOGÍSTICA E COMPRAS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR ANALISTA","SÃO PAULO","NILVA","11","97118-3544","01/12/94","452884482","427.167.288-28","STANDARD","ACESSO CRIADO","26/02/26","","m"] },
  { id: 28, nome: "SERGIO DIAS DA ROCHA", status: "ativo", dados: ["10/05/24","MOTORISTA","OPERACIONAL - SP","CLT","R$ 3.311,65","","","R$ 264,93","R$ 91,99","R$ 275,97","R$ 1.704,00","R$ 650,00","R$ 6.298,54","EXECUTOR PLANEJADOR","SÃO PAULO","INAYARA","11","96041-9938","07/04/93","40856359","403.438.258-99","NÃO SE APLICA","ACESSO CRIADO","26/02/26","","h"] },
  { id: 29, nome: "THAYS MORAES DOS SANTOS", status: "ativo", dados: ["29/05/23","ANALISTA DE LOGÍSTICA E COMPRAS JR","LOGÍSTICA E COMPRAS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR COMUNICADOR","GOIÂNIA","DANIELLE","62","98130-9155","23/07/93","5536843","756.864.061-20","STANDARD","NÃO SE APLICA","","NÃO SE APLICA","m"] },
];

function maskDate(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function maskCPF(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
function maskPhone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
function maskDDD(v: string): string { return v.replace(/\D/g, "").slice(0, 2); }
function maskRG(v: string): string { return v.replace(/[^0-9.-]/g, ""); }
function maskCurrency(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseCurrency(v: string): number {
  if (!v) return 0;
  const cleaned = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return "";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function computeCustoTotal(dados: string[]): string {
  const salario = parseCurrency(dados[4]);
  const periculosidade = parseCurrency(dados[5]);
  const gratificacao = parseCurrency(dados[6]);
  const fgts = parseCurrency(dados[7]);
  const ferias = parseCurrency(dados[8]);
  const decimo = parseCurrency(dados[9]);
  const alimentacao = parseCurrency(dados[10]);
  const mobilidade = parseCurrency(dados[11]);
  const total = salario + periculosidade + gratificacao + fgts + ferias + decimo + alimentacao + mobilidade;
  return formatCurrency(total);
}

const ColaboradoresCLT = () => {
  const [busca, setBusca] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initialData);

  const sorted = useMemo(() => {
    const f = colaboradores.filter((c) =>
      !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.dados.some((d) => d.toLowerCase().includes(busca.toLowerCase()))
    );
    return [...f].sort((a, b) => {
      const order = (s: RowStatus) => s === "inativo" ? 2 : s === "pendente_ti" ? 0 : 1;
      return order(a.status) - order(b.status);
    });
  }, [colaboradores, busca]);

  const updateStatus = (id: number, newStatus: RowStatus) => {
    setColaboradores(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (newStatus === "editando") {
        return { ...p, status: newStatus, previousStatus: p.status, originalNome: p.nome, originalDados: [...p.dados] };
      }
      return { ...p, status: newStatus, previousStatus: undefined, originalNome: undefined, originalDados: undefined };
    }));
  };

  const saveRow = (id: number) => {
    setColaboradores(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, status: "ativo", isNew: false, previousStatus: undefined, originalNome: undefined, originalDados: undefined };
    }));
  };

  const cancelEdit = (id: number) => {
    setColaboradores(prev => {
      const row = prev.find(p => p.id === id);
      if (!row) return prev;
      if (row.isNew) return prev.filter(p => p.id !== id);
      return prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, status: p.previousStatus || "ativo", nome: p.originalNome || p.nome, dados: p.originalDados || p.dados, previousStatus: undefined, originalNome: undefined, originalDados: undefined };
      });
    });
  };

  const updateField = (id: number, colIndex: number, value: string) => {
    setColaboradores(prev => prev.map(p => {
      if (p.id !== id) return p;
      const newDados = [...p.dados];
      newDados[colIndex] = value;
      // Auto-compute custo total
      newDados[12] = computeCustoTotal(newDados);
      return { ...p, dados: newDados };
    }));
  };

  const updateNome = (id: number, newNome: string) => {
    setColaboradores(prev => prev.map(p => p.id === id ? { ...p, nome: newNome } : p));
  };

  const addNew = () => {
    const newC: Colaborador = {
      id: nextId++,
      nome: "",
      status: "editando",
      isNew: true,
      dados: columnDefs.map(() => ""),
    };
    setColaboradores(prev => [newC, ...prev]);
  };

  const isEditable = (status: RowStatus) => status === "editando";

  // Synced scrollbars
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topDummyRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (tableRef.current && topDummyRef.current) {
      const ro = new ResizeObserver(() => {
        if (tableRef.current && topDummyRef.current) {
          topDummyRef.current.style.width = `${tableRef.current.scrollWidth}px`;
        }
      });
      ro.observe(tableRef.current);
      return () => ro.disconnect();
    }
  }, [sorted]);

  const handleTopScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const handleTableScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const renderCell = (colab: Colaborador, colIndex: number) => {
    const col = columnDefs[colIndex];
    const value = colab.dados[colIndex] || "";
    const editable = isEditable(colab.status);

    // Custo total is always computed, never directly editable
    if (col.type === "computed") {
      const computed = computeCustoTotal(colab.dados);
      return <span className="text-foreground font-semibold">{computed || "—"}</span>;
    }

    if (!editable) {
      if ((col.type === "select_sistema" || col.key === "office") && value === "PENDENTE") {
        return <span className="text-destructive font-semibold">{value}</span>;
      }
      return <span className="text-muted-foreground">{value || "—"}</span>;
    }

    if (col.type === "select" || col.type === "select_sistema") {
      return (
        <Select value={value} onValueChange={(v) => updateField(colab.id, colIndex, v)}>
          <SelectTrigger className="h-7 text-xs min-w-[120px] border-primary/30">
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {col.options!.map(opt => (
              <SelectItem key={opt} value={opt}>
                <span className={opt === "PENDENTE" ? "text-destructive font-semibold" : ""}>{opt}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const getMask = () => {
      switch (col.type) {
        case "date": return maskDate;
        case "cpf": return maskCPF;
        case "phone": return maskPhone;
        case "ddd": return maskDDD;
        case "rg": return maskRG;
        case "currency": return maskCurrency;
        default: return null;
      }
    };
    const mask = getMask();

    return (
      <input
        className="h-7 px-1.5 text-xs rounded border border-primary/30 bg-background text-foreground w-full min-w-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
        value={value}
        onChange={(e) => {
          const newVal = mask ? mask(e.target.value) : e.target.value;
          updateField(colab.id, colIndex, newVal);
        }}
        placeholder={col.type === "date" ? "dd/mm/aaaa" : col.type === "cpf" ? "000.000.000-00" : col.type === "phone" ? "00000-0000" : col.type === "ddd" ? "00" : ""}
      />
    );
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Colaboradores CLT</h1>
        <p className="text-sm text-muted-foreground">{sorted.length} colaborador(es)</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Buscar por nome, cargo, departamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={addNew} className="gap-1.5 bg-[hsl(var(--sidebar-primary))] hover:bg-[hsl(var(--sidebar-primary))]/90 text-[hsl(var(--sidebar-primary-foreground))]">
          <Plus className="w-4 h-4" />
          Adicionar novo
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Top scrollbar */}
        <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto" style={{ scrollbarWidth: "auto" }}>
          <div ref={topDummyRef} style={{ height: 1 }} />
        </div>

        {/* Table */}
        <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto">
          <table ref={tableRef} className="w-max min-w-full text-xs">
            <thead>
              <tr className="bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
                <th className="sticky left-0 z-20 bg-[hsl(var(--sidebar-primary))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 min-w-[90px]">
                  STATUS
                </th>
                <th className="sticky left-[90px] z-20 bg-[hsl(var(--sidebar-primary))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  COLABORADOR
                </th>
                {columnDefs.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const editable = isEditable(c.status);
                const isInativo = c.status === "inativo";
                const isPendenteTI = c.status === "pendente_ti";
                return (
                  <tr key={c.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${isInativo ? "bg-destructive/5" : isPendenteTI ? "bg-orange-500/5" : editable ? "bg-[hsl(var(--sidebar-primary))]/5" : ""}`}>
                    <td className="sticky left-0 z-10 bg-card px-2 py-2 border-r border-border">
                      {editable ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => saveRow(c.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                          >
                            <Check className="w-3 h-3" />
                            Salvar
                          </button>
                          <button
                            onClick={() => cancelEdit(c.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity bg-destructive text-destructive-foreground"
                          >
                            <X className="w-3 h-3" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity ${
                              isInativo
                                ? "bg-destructive text-destructive-foreground"
                                : isPendenteTI
                                ? "bg-orange-500 text-white animate-pulse-orange"
                                : "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                            }`}>
                              {isInativo ? "Inativo" : isPendenteTI ? "Pendente TI" : "Ativo"}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[140px]">
                            <DropdownMenuItem onClick={() => updateStatus(c.id, "editando")} className="gap-2">
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(c.id, "ativo")} className="gap-2">
                              <div className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--success))]" />
                              Ativo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(c.id, "inativo")} className="gap-2 text-destructive">
                              <div className="w-3.5 h-3.5 rounded-full bg-destructive" />
                              Inativo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(c.id, "pendente_ti")} className="gap-2 text-orange-500">
                              <div className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-pulse" />
                              Pendente TI
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                    <td className="sticky left-[90px] z-10 bg-card px-3 py-2 whitespace-nowrap border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {editable ? (
                        <input
                          className="h-7 px-1.5 text-xs rounded border border-primary/30 bg-background text-foreground font-semibold w-full min-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                          value={c.nome}
                          onChange={(e) => updateNome(c.id, e.target.value)}
                          placeholder="Nome do colaborador"
                        />
                      ) : (
                        <span className={`font-semibold ${isInativo ? "text-destructive line-through" : "text-foreground"}`}>
                          {c.nome}
                        </span>
                      )}
                    </td>
                    {columnDefs.map((col, j) => (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap border-r border-border last:border-r-0">
                        {renderCell(c, j)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={columnDefs.length + 2} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresCLT;
