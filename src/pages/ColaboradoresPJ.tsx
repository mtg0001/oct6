import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Pencil, X, Circle } from "lucide-react";

type RowStatus = "ativo" | "inativo" | "editando";

interface Parceiro {
  nome: string;
  dados: string[];
  status: RowStatus;
}

const columnDefs = [
  { key: "data_contrato", label: "DATA INICIAL CONTRATO", type: "date" },
  { key: "cargo", label: "CARGO", type: "text" },
  { key: "departamento", label: "DEPARTAMENTO", type: "text" },
  { key: "contratacao", label: "CONTRATAÇÃO", type: "select", options: ["PJ", "PROLABORE"] },
  { key: "valor_nota", label: "VALOR NOTA", type: "currency" },
  { key: "perfil", label: "PERFIL COMPORTAMENTAL", type: "text" },
  { key: "alocado", label: "ALOCADO EM", type: "select", options: ["SÃO PAULO", "GOIÂNIA", "BELO HORIZONTE"] },
  { key: "lider", label: "LÍDER DIRETO", type: "text" },
  { key: "ddd", label: "DDD", type: "ddd" },
  { key: "celular", label: "CELULAR", type: "phone" },
  { key: "nascimento", label: "DATA NASCIMENTO", type: "date" },
  { key: "rg", label: "RG", type: "rg" },
  { key: "cpf", label: "CPF", type: "cpf" },
  { key: "office", label: "PACOTE OFFICE", type: "select", options: ["STANDARD", "BASIC", "NÃO SE APLICA"] },
  { key: "sistema", label: "SISTEMA DE SOLICITAÇÕES", type: "select_sistema", options: ["ACESSO CRIADO", "NÃO SE APLICA", "PENDENTE"] },
  { key: "broche", label: "ENTREGA DO BROCHE", type: "date" },
  { key: "moletom", label: "MOLETOM", type: "select", options: ["ENTREGUE", "NÃO SE APLICA"] },
  { key: "obs", label: "OBS", type: "text" },
];

const initialData: Parceiro[] = [
  { nome: "ÁGATHA OLIVEIRA", status: "ativo", dados: ["","ANALISTA DE DP","RECURSOS HUMANOS","PJ","R$ 4.500,00","EXECUTOR PLANEJADOR ANALISTA","SÃO PAULO","FLÁVIA","11","95351-5760","16/01/96","367008634","445.608.398-08","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "ALINE CINTRA ANDRADE SANTOS", status: "ativo", dados: ["","COORDENADORA COMERCIAL","COMERCIAL","PJ","R$ 9.000,00","COMUNICADOR EXECUTOR","SÃO PAULO","JÉSSICA","11","98588-7911","02/10/81","27.747.025.0","290.174.418-44","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "BRUNO MAGNO MAGALHÃES", status: "ativo", dados: ["","COORDENADOR DE PROJETOS","PROJETOS","PJ","R$ 9.000,00","EXECUTOR COMUNICADOR","GOIÂNIA","JESSICA","62","99952-7475","04/07/83","4162225","003.183.751.41","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "CAMILLA PRADO RIGONATI SECCO", status: "ativo", dados: ["","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 5.500,00","ANALISTA COMUNICADOR","SÃO PAULO","ALINE","11","98825-9359","14/02/85","442397379","322.510.858-82","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "CARLOS JOSÉ DE ARANTES CANDIDO", status: "ativo", dados: ["02/12/26","ELETRICISTA","OPERACIONAL - SP","PJ","R$ 6.000,00","COMUNICADOR EXECUTOR","SÃO PAULO","INAYARA","11","998518959","12/10/68","175918592","078.385.158-82","xxx","ACESSO CRIADO","","","h"] },
  { nome: "DANIELA MARIA PREVITAL DE ANDRADE", status: "ativo", dados: ["","BDR","COMERCIAL","PJ","R$ 3.000,00","","SÃO PAULO","ALINE","16","99235-6865","24/07/79","27.747.008-0","269.800.668-46","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "DANIELLE SANTOS", status: "ativo", dados: ["","HEAD DE OPERAÇÕES","DIRETORIA","PJ","R$ 24.000,00","","GOIÂNIA","OSÓRIO","62","991978077","19/12/85","414780310","345.614.348-60","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "DENIS DE OLIVEIRA FERREIRA", status: "ativo", dados: ["","COORDENADOR DE PRÉ PRODUÇÃO","OPS - PRÉ PRODUÇÃO","PJ","R$ 7.000,00","PLANEJADOR ANALISTA","SÃO PAULO","INAYARA","11","93145-4893","04/01/96","38195842","461.643.698-35","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "DOUGLAS MIZAEL DE MORAIS", status: "ativo", dados: ["","ENCARREGADO DE MARCENARIA","OPERACIONAL - SP","PJ","R$ 8.000,00","EXECUTOR COMUNICADOR","SÃO PAULO","INAYARA","11","95884-5591","14/04/1992","586594498","104.399.566-84","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "ELIZANDRA RESENDE", status: "ativo", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 7.000,00","PLANEJADOR EXECUTOR","GOIÂNIA","BRUNO","62","99337-4511","30/06/97","62186150","702.916.001-07","BASIC","ACESSO CRIADO","","","m"] },
  { nome: "ÊMILE GOMES DE AGUIAR MELO", status: "ativo", dados: ["","LDR","COMERCIAL","PJ","R$ 3.000,00","","SÃO PAULO","ALINE","71","99285-5787","24/09/1992","1439739757","062.147.825-36","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "FERNANDA SILVA VIANA", status: "ativo", dados: ["","BDR","COMERCIAL","PJ","R$ 4.000,00","","SÃO PAULO","ALINE","11","91218-0109","01/09/80","","283.520.648-51","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "FERNANDO RAFAEL DE OLIVEIRA", status: "ativo", dados: ["","SUPERVISOR DE PRODUÇÃO PLENO","OPS - PRODUÇÃO","PJ","R$ 4.900,00","COMUNICADOR EXECUTOR","SÃO PAULO","ROMÁRIO","62","99833-4788","18/06/91","352403044","386.994.238-02","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "FILIPE ARAÚJO DE JESUS", status: "ativo", dados: ["","ENCARREGADO DE GALPÃO","OPERACIONAL - SP","PJ","R$ 5.500,00","EXECUTOR","SÃO PAULO","GABRIELLI","11","96418-8646","16/11/98","68344931","711.531.084-02","xxx","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "FILIPE GOBETTI", status: "ativo", dados: ["19/02/2026","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 4.200,00","","SÃO PAULO","ALINE","11","95762-3247","28/10/1988","","329.016.358-06","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "FLAVIA BARBOSA ROCHA", status: "ativo", dados: ["","GERENTE DE RH","RECURSOS HUMANOS","PJ","R$ 8.500,00","","GOIÂNIA","DANIELLE","62","98201-1065","16/10/1975","3449897","819.099.001-25","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "GABRIELLI OLIVEIRA COELHO", status: "ativo", dados: ["","ALMOXARIFE","OPERACIONAL - SP","PJ","R$ 4.200,00","EXECUTOR COMUNICADOR","SÃO PAULO","INAYARA","11","97505-8993","09/04/91","47886523","398.239.948-38","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "GILCIMAR RODRIGUES SILVA DUARTE", status: "ativo", dados: ["","ENCARREGADO DE TI","TI","PJ","R$ 7.000,00","ANALISTA PLANEJADOR","GOIÂNIA","SORAYA","62","99932-5376","01/12/90","5351608","031.682.281-76","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "GIOVANNA FECHER MATARAZZO", status: "ativo", dados: ["19/02/2026","ANALISTA COMERCIAL","COMERCIAL","PJ","R$ 4.800,00","","SÃO PAULO","JESSICA","11","99614-5232","28/10/99","","476.350.428-23","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "GLEIBE RIBEIRO ROCHA", status: "ativo", dados: ["","GERENTE OPERACIONAL","OPERACIONAL - GO","PJ","R$ 15.000,00","EXECUTOR ANALISTA","GOIÂNIA","SORAYA","62","98454-1532","17/09/1981","4572473","000.312.381-22","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "INAYARA SOARES DAS NEVES", status: "ativo", dados: ["","GERENTE OPERACIONAL","OPERACIONAL - SP","PJ","R$ 15.000,00","EXECUTOR ANALISTA","SÃO PAULO","SORAYA","11","99374-4725","12/09/93","354141569","412.865.218-07","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "JÉSSICA LIMA DUTRA", status: "ativo", dados: ["","CMO","DIRETORIA","PROLABORE","R$ 24.000,00","","SÃO PAULO","OSÓRIO","11","98546-0888","15/02/1990","5267886","029.975.971-70","STANDARD","ACESSO CRIADO","","ENTREGUE","m"] },
  { nome: "KLEBER SOUZA DA SILVA", status: "ativo", dados: ["","ORÇAMENTISTA","COMERCIAL","PJ","R$ 7.000,00","","SÃO PAULO","JESSICA","11","95425-6972","22/11/1991","494748254","053.588.395-18","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "LORAYNE PELEGRINO SPERANDIO", status: "ativo", dados: ["","CUSTOMER SUCCESS","OPS - CS","PJ","R$ 3.500,00","COMUNICADOR EXECUTOR","SÃO PAULO","INAYARA","11","95520-7297","02/02/01","","538.675.498-00","STANDARD","ACESSO CRIADO","26/02/26","","m"] },
  { nome: "LUCAS VASCONCELOS DOS SANTOS", status: "ativo", dados: ["","SUPERVISOR DE COMUNICAÇÃO VISUAL","OPS - COMUNICAÇÃO VISUAL","PJ","R$ 4.000,00","ANALISTA PLANEJADOR","SÃO PAULO","MARCOS","11","97457-0507","07/05/96","39623688","472.737.878-76","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "MARCOS KAIQUE DE OLIVEIRA", status: "ativo", dados: ["","COORDENADOR DE COMUNICAÇÃO VISUAL","OPS - COMUNICAÇÃO VISUAL","PJ","R$ 5.500,00","EXECUTOR PLANEJADOR","GOIÂNIA","INAYARA","62","99365-6334","12/10/92","5656140","044.568.871-84","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "MATEUS FILIPE GONÇALVES", status: "ativo", dados: ["","CONSULTOR","COMERCIAL","PJ","R$ 5.000,00","","BELO HORIZONTE","JESSICA","31","99394-4095","15/07/1991","12047850","101.050.836.90","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "MIRELLA AMURATTI", status: "ativo", dados: ["23/02/2026","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 4.200,00","COMUNICADOR EXECUTOR","SÃO PAULO","ALINE","11","98508-7958","08/06/93","371337768","402.514.858-70","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "MOISES DE CAMARGO POLICARPO DA SILVA", status: "ativo", dados: ["","PROJETISTA DE PRÉ PRODUÇÃO","OPS - PRÉ PRODUÇÃO","PJ","R$ 4.000,00","PLANEJADOR","SÃO PAULO","DENIS","11","95540-7890","20/09/1999","","440.369.888-32","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "NATHALIA PEREIRA DE ARAUJO", status: "ativo", dados: ["","ANALISTA DE PROJETOS","PROJETOS","PJ","R$ 5.000,00","","GOIÂNIA","BRUNO","62","98630-0634","04/05/92","","037.402.511-82","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "OSÓRIO FERREIRA DUTRA NETO", status: "ativo", dados: ["","CEO","DIRETORIA","PROLABORE","R$ 24.000,00","","SÃO PAULO","XXX","62","98171-5981","22/07/1991","4379277","716.050.611-15","STANDARD","ACESSO CRIADO","","ENTREGUE","h"] },
  { nome: "PATRICIA DOS SANTOS ANDRADE", status: "ativo", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 3.200,00","EXECUTOR COMUNICADOR","GOIÂNIA","BRUNO","62","98157-8442","13/07/96","5991892","701.035.021-30","BASIC","ACESSO CRIADO","","","m"] },
  { nome: "RAFAEL EDILTO SANTOS DE SOUZA", status: "ativo", dados: ["","ALMOXARIFE","OPERACIONAL - GO","PJ","R$ 4.200,00","EXECUTOR","GOIÂNIA","GLEIBE","62","99640-3855","13/09/00","6638084","080.570.731-01","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "ROMÁRIO RODRIGUES CORREIA", status: "ativo", dados: ["","COORDENADOR DE PRODUÇÃO","OPS - PRODUÇÃO","PJ","R$ 10.000,00","PLANEJADOR EXECUTOR","SÃO PAULO","INAYARA","11","96597-1377","26/03/94","434321679","420.417.648-80","STANDARD","ACESSO CRIADO","","ENTREGUE","h"] },
  { nome: "SÉRGIO DE AZEVEDO", status: "ativo", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 5.600,00","ANALISTA","SÃO PAULO","BRUNO","11","98494-8257","28/05/57","9686 9392","954.897.118-68","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "SORAYA P. VALENTE", status: "ativo", dados: ["","DIRETORA OPERACIONAL","DIRETORIA","PJ","R$ 24.000,00","EXECUTOR ANALISTA","SÃO PAULO","OSÓRIO","11","97482-0981","12/10/92","5442704","039.504.491-08","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "YURI HENRIQUE DE OLIVEIRA COELHO", status: "ativo", dados: ["","PROJETISTA DE PRÉ PRODUÇÃO JR","OPS - PRÉ PRODUÇÃO","PJ","R$ 4.000,00","","SÃO PAULO","DENIS","11","96410-8877","16/05/97","","474.176.588-14","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "ITAMAR SILVA LIMA", status: "ativo", dados: ["","SUPERVISOR DE MONTAGEM","OPERACIONAL - GO","PJ","R$ 6.500,00","","GOIÂNIA","GLEIBE","77","99103-3969","07/02/94","16648670","067.788.775-29","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "ZEULA PEREIRA DA SILVA MOURA", status: "ativo", dados: ["03/10/26","ACCOUNT EXECUTIVE","COMERCIAL - GO","PJ","R$ 5.000,00","","GOIÂNIA","ALINE","62","99113-3035","26/06/1985","4587310","007.124.441-73","","ACESSO CRIADO","FALTA FAZER","","m"] },
  { nome: "DIOGO COSTA BATISTA", status: "ativo", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 5.600,00","COMUNICADOR ANALISTA","SÃO PAULO","BRUNO","11","97865-7585","24/05/1989","669709207","033.430.585-30","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "SAMUEL CARDOSO DA ROCHA", status: "ativo", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 2.400,00","PLANEJADOR ANALISTA","GOIÂNIA","BRUNO","62","9250-5745","20/03/2000","6626591","706.820.511-95","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "MAURO ALVES DA SILVA", status: "ativo", dados: ["21/08/25","IMPRESSOR PLENO","OPS - COMUNICAÇÃO VISUAL","PJ","","ANALISTA PLANEJADOR","GOIÂNIA","MARCOS","62","98574-2510","01/08/78","31174522","770.600.831-20","STANDARD","ACESSO CRIADO","","","h"] },
];

// Masks
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

function maskDDD(v: string): string {
  return v.replace(/\D/g, "").slice(0, 2);
}

function maskRG(v: string): string {
  return v.replace(/[^0-9.-]/g, "");
}

function maskCurrency(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ColaboradoresPJ = () => {
  const [busca, setBusca] = useState("");
  const [parceiros, setParceiros] = useState<Parceiro[]>(initialData);

  const filtered = parceiros.filter((c) =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.dados.some((d) => d.toLowerCase().includes(busca.toLowerCase()))
  );

  const updateStatus = (nome: string, newStatus: RowStatus) => {
    setParceiros(prev => prev.map(p => p.nome === nome ? { ...p, status: newStatus } : p));
  };

  const updateField = (nome: string, colIndex: number, value: string) => {
    setParceiros(prev => prev.map(p => {
      if (p.nome !== nome) return p;
      const newDados = [...p.dados];
      newDados[colIndex] = value;
      return { ...p, dados: newDados };
    }));
  };

  const updateNome = (oldNome: string, newNome: string) => {
    setParceiros(prev => prev.map(p => p.nome === oldNome ? { ...p, nome: newNome } : p));
  };

  const isEditable = (status: RowStatus) => status === "editando";

  const getStatusColor = (status: RowStatus) => {
    if (status === "inativo") return "bg-destructive";
    return "bg-[hsl(var(--success))]"; // ativo or editando
  };

  const getRowBg = (status: RowStatus) => {
    if (status === "inativo") return "bg-destructive/5";
    if (status === "editando") return "bg-[hsl(var(--success))]/5";
    return "";
  };

  const renderCell = (parceiro: Parceiro, colIndex: number) => {
    const col = columnDefs[colIndex];
    const value = parceiro.dados[colIndex] || "";
    const editable = isEditable(parceiro.status);

    if (!editable) {
      // Display mode
      if (col.type === "select_sistema" && value === "PENDENTE") {
        return <span className="text-destructive font-semibold">{value}</span>;
      }
      return <span className="text-muted-foreground">{value || "—"}</span>;
    }

    // Edit mode
    if (col.type === "select" || col.type === "select_sistema") {
      return (
        <Select value={value} onValueChange={(v) => updateField(parceiro.nome, colIndex, v)}>
          <SelectTrigger className="h-7 text-xs min-w-[120px] border-primary/30">
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {col.options!.map(opt => (
              <SelectItem key={opt} value={opt}>
                <span className={opt === "PENDENTE" ? "text-destructive font-semibold" : ""}>
                  {opt}
                </span>
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
          updateField(parceiro.nome, colIndex, newVal);
        }}
        placeholder={col.type === "date" ? "dd/mm/aaaa" : col.type === "cpf" ? "000.000.000-00" : col.type === "phone" ? "00000-0000" : col.type === "ddd" ? "00" : ""}
      />
    );
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Colaboradores PJ</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} parceiro(s) comercial(is)</p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome, cargo, departamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-xs">
            <thead>
              <tr className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                <th className="sticky left-0 z-20 bg-[hsl(var(--success))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-[hsl(var(--success))]/80 min-w-[50px]">
                  STATUS
                </th>
                <th className="sticky left-[50px] z-20 bg-[hsl(var(--success))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-[hsl(var(--success))]/80 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  PARCEIRO COMERCIAL
                </th>
                {columnDefs.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-[hsl(var(--success))]/80 last:border-r-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const editable = isEditable(c.status);
                return (
                  <tr key={c.nome} className={`border-t border-border hover:bg-muted/30 transition-colors ${getRowBg(c.status)}`}>
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 border-r border-border">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center justify-center w-full focus:outline-none">
                            <div className={`w-5 h-5 rounded-full ${getStatusColor(c.status)} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}>
                              {c.status === "editando" && <Pencil className="w-3 h-3 text-[hsl(var(--success-foreground))]" />}
                              {c.status === "ativo" && <Check className="w-3 h-3 text-[hsl(var(--success-foreground))]" />}
                              {c.status === "inativo" && <X className="w-3 h-3 text-destructive-foreground" />}
                            </div>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[140px]">
                          <DropdownMenuItem onClick={() => updateStatus(c.nome, "editando")} className="gap-2">
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(c.nome, "ativo")} className="gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--success))]" />
                            Ativo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(c.nome, "inativo")} className="gap-2 text-destructive">
                            <div className="w-3.5 h-3.5 rounded-full bg-destructive" />
                            Inativo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="sticky left-[50px] z-10 bg-card px-3 py-2 whitespace-nowrap border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {editable ? (
                        <input
                          className="h-7 px-1.5 text-xs rounded border border-primary/30 bg-background text-foreground font-semibold w-full min-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                          value={c.nome}
                          onChange={(e) => updateNome(c.nome, e.target.value)}
                        />
                      ) : (
                        <span className={`font-semibold ${c.status === "inativo" ? "text-destructive line-through" : "text-foreground"}`}>
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
              {filtered.length === 0 && (
                <tr><td colSpan={columnDefs.length + 2} className="text-center py-8 text-muted-foreground">Nenhum parceiro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresPJ;
