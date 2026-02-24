import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Paperclip } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface PassagensFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

function maskCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

function parseInputDate(str: string): Date | null {
  const parts = str.split("/");
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return isNaN(d.getTime()) ? null : d;
}

const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" }, { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" }, { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" }, { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" }, { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" }, { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

function useCidadesIBGE(uf: string) {
  const [cidades, setCidades] = useState<string[]>([]);
  useEffect(() => {
    if (!uf) { setCidades([]); return; }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => setCidades(data.map((c) => c.nome)))
      .catch(() => setCidades([]));
  }, [uf]);
  return cidades;
}

const DEPARTAMENTOS = [
  "Administrativo", "Comercial", "Diretoria", "Financeiro", "Licitações",
  "Logística e Compras", "Operacional", "Projetos", "Recursos Humanos",
  "Serviços Gerais", "Tecnologia da Informação",
];

const TIPOS_TRANSPORTE = ["Avião", "Ônibus", "Carro", "Van", "Trem", "Barco"];

interface Passageiro {
  id: number;
  departamento: string;
  nome: string;
  cpf: string;
  rg: string;
}

const PassagensForm = ({ open, onOpenChange, unidade }: PassagensFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  const [evento, setEvento] = useState("");
  const [departamentoSolicitante, setDepartamentoSolicitante] = useState(currentUser?.departamento || "");
  const [prioridade, setPrioridade] = useState("");
  const [tipoTransporte, setTipoTransporte] = useState("");

  const [dataIdaStr, setDataIdaStr] = useState("");
  const [dataIdaDate, setDataIdaDate] = useState<Date | undefined>();
  const [dataIdaOpen, setDataIdaOpen] = useState(false);

  const [dataVoltaStr, setDataVoltaStr] = useState("");
  const [dataVoltaDate, setDataVoltaDate] = useState<Date | undefined>();
  const [dataVoltaOpen, setDataVoltaOpen] = useState(false);

  const [origemUF, setOrigemUF] = useState("");
  const [origemCidade, setOrigemCidade] = useState("");
  const [destinoUF, setDestinoUF] = useState("");
  const [destinoCidade, setDestinoCidade] = useState("");
  const origemCidades = useCidadesIBGE(origemUF);
  const destinoCidades = useCidadesIBGE(destinoUF);

  const [passageiros, setPassageiros] = useState<Passageiro[]>([
    { id: 1, departamento: "", nome: "", cpf: "", rg: "" },
  ]);
  const nextId = useRef(2);

  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);

  const dias = (() => {
    if (dataIdaDate && dataVoltaDate) {
      const diff = differenceInCalendarDays(dataVoltaDate, dataIdaDate);
      return diff >= 0 ? diff + 1 : 0;
    }
    return 0;
  })();

  const makeDateHandlers = (
    setStr: (v: string) => void,
    setDate: (d: Date | undefined) => void
  ) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskDate(e.target.value);
      setStr(masked);
      const parsed = parseInputDate(masked);
      if (parsed) setDate(parsed);
    },
    onSelect: (d: Date | undefined) => {
      if (!d) return;
      setDate(d);
      setStr(format(d, "dd/MM/yyyy"));
    },
  });

  const idaHandlers = makeDateHandlers(setDataIdaStr, setDataIdaDate);
  const voltaHandlers = makeDateHandlers(setDataVoltaStr, setDataVoltaDate);

  const addPassageiro = () => {
    setPassageiros((prev) => [
      ...prev,
      { id: nextId.current++, departamento: "", nome: "", cpf: "", rg: "" },
    ]);
  };

  const removePassageiro = (id: number) => {
    setPassageiros((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePassageiro = (id: number, field: keyof Omit<Passageiro, "id">, value: string) => {
    setPassageiros((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === "cpf") return { ...p, cpf: maskCPF(value) };
        return { ...p, [field]: value };
      })
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande. Máximo 5 MB.", variant: "destructive" });
        return;
      }
      setAnexoNome(file.name);
    }
  };

  const resetForm = () => {
    setEvento(""); setPrioridade(""); setTipoTransporte("");
    setDataIdaStr(""); setDataIdaDate(undefined);
    setDataVoltaStr(""); setDataVoltaDate(undefined);
    setOrigemUF(""); setOrigemCidade("");
    setDestinoUF(""); setDestinoCidade("");
    setPassageiros([{ id: 1, departamento: "", nome: "", cpf: "", rg: "" }]);
    nextId.current = 2;
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!tipoTransporte) { toast({ title: "Selecione o Tipo de Transporte", variant: "destructive" }); return false; }
    if (!dataIdaDate) { toast({ title: "Informe a Data de Ida", variant: "destructive" }); return false; }
    if (!origemUF) { toast({ title: "Selecione a UF de Origem", variant: "destructive" }); return false; }
    if (!origemCidade) { toast({ title: "Selecione a Cidade de Origem", variant: "destructive" }); return false; }
    if (!destinoUF) { toast({ title: "Selecione a UF de Destino", variant: "destructive" }); return false; }
    if (!destinoCidade) { toast({ title: "Selecione a Cidade de Destino", variant: "destructive" }); return false; }
    for (const p of passageiros) {
      if (!p.nome.trim()) { toast({ title: "Informe o nome de todos os passageiros", variant: "destructive" }); return false; }
      if (p.cpf.length < 14) { toast({ title: `CPF inválido para ${p.nome || "passageiro"}`, variant: "destructive" }); return false; }
      if (!p.rg.trim()) { toast({ title: `Informe o RG de ${p.nome || "passageiro"}`, variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const passageirosStr = passageiros
      .map((p) => `${p.nome} (CPF: ${p.cpf}, RG: ${p.rg}, Depto: ${p.departamento || "—"})`)
      .join("; ");

    try {
      await addSolicitacao({
        tipo: "Passagens",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: "",
        unidadeDestino: `${destinoCidade}/${destinoUF}`,
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: tipoTransporte,
        nomeSubstituido: "",
        justificativa: [
          `Transporte: ${tipoTransporte}`,
          `Data ida: ${dataIdaStr}`,
          dataVoltaStr ? `Data volta: ${dataVoltaStr}` : "",
          dias > 0 ? `Dias: ${dias}` : "",
          `Origem: ${origemCidade}/${origemUF}`,
          `Destino: ${destinoCidade}/${destinoUF}`,
          `Passageiros: ${passageirosStr}`,
          anexoNome ? `Anexo: ${anexoNome}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: tipoTransporte,
        horarioDe: dataIdaStr,
        horarioAte: dataVoltaStr,
        caracteristicas: {},
        observacoes,
      });
      toast({ title: "Solicitação de Passagens enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  const DateField = ({
    label, value, onChange, selected, onSelect, popoverOpen, setPopoverOpen,
  }: {
    label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selected: Date | undefined; onSelect: (d: Date | undefined) => void;
    popoverOpen: boolean; setPopoverOpen: (v: boolean) => void;
  }) => (
    <div>
      <Label className="text-xs font-bold">{label}</Label>
      <div className="relative mt-1">
        <Input value={value} onChange={onChange} placeholder="dd/mm/aaaa" maxLength={10} inputMode="numeric" className="pr-10" />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={selected} onSelect={(d) => { onSelect(d); setPopoverOpen(false); }} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Nova Solicitação de Passagens · Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados do Solicitante */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Dados do Solicitante</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs font-bold">Evento *</Label>
                <Input value={evento} onChange={(e) => setEvento(e.target.value)} className="mt-1" placeholder="Nome do evento" />
              </div>
              <div>
                <Label className="text-xs font-bold">Departamento</Label>
                <Select value={departamentoSolicitante} onValueChange={setDepartamentoSolicitante}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{DEPARTAMENTOS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Solicitante</Label>
                <Input value={currentUser?.nome || "—"} className="mt-1 bg-muted" readOnly />
              </div>
              <div>
                <Label className="text-xs font-bold">Prioridade *</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Dados da Viagem */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Dados da Viagem</legend>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Tipo de Transporte *</Label>
                  <Select value={tipoTransporte} onValueChange={setTipoTransporte}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{TIPOS_TRANSPORTE.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <DateField label="Data de Ida *" value={dataIdaStr} onChange={idaHandlers.onChange} selected={dataIdaDate} onSelect={idaHandlers.onSelect} popoverOpen={dataIdaOpen} setPopoverOpen={setDataIdaOpen} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DateField label="Data de Volta" value={dataVoltaStr} onChange={voltaHandlers.onChange} selected={dataVoltaDate} onSelect={voltaHandlers.onSelect} popoverOpen={dataVoltaOpen} setPopoverOpen={setDataVoltaOpen} />
                <div>
                  <Label className="text-xs font-bold">Dias</Label>
                  <Input value={dias > 0 ? dias : ""} readOnly className="mt-1 bg-muted text-center" placeholder="—" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-bold">Origem (UF) *</Label>
                  <Select value={origemUF} onValueChange={(v) => { setOrigemUF(v); setOrigemCidade(""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{ESTADOS.map((e) => (<SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">Origem (Cidade) *</Label>
                  <Select value={origemCidade} onValueChange={setOrigemCidade} disabled={!origemUF}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder={origemUF ? "Selecione..." : "Selecione o estado..."} /></SelectTrigger>
                    <SelectContent>{origemCidades.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">Destino (UF) *</Label>
                  <Select value={destinoUF} onValueChange={(v) => { setDestinoUF(v); setDestinoCidade(""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{ESTADOS.map((e) => (<SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">Destino (Cidade) *</Label>
                  <Select value={destinoCidade} onValueChange={setDestinoCidade} disabled={!destinoUF}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder={destinoUF ? "Selecione..." : "Selecione o estado..."} /></SelectTrigger>
                    <SelectContent>{destinoCidades.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Passageiros */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Passageiro(s)</legend>
            <div className="mt-3 space-y-3">
              {passageiros.map((p) => (
                <div key={p.id} className="border border-border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Departamento</Label>
                      <Select value={p.departamento} onValueChange={(v) => updatePassageiro(p.id, "departamento", v)}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{DEPARTAMENTOS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Nome completo *</Label>
                      <Input value={p.nome} onChange={(e) => updatePassageiro(p.id, "nome", e.target.value)} className="mt-1 h-9 text-xs" placeholder="Nome completo" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">CPF *</Label>
                      <Input value={p.cpf} onChange={(e) => updatePassageiro(p.id, "cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" className="mt-1 h-9 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">RG *</Label>
                      <Input value={p.rg} onChange={(e) => updatePassageiro(p.id, "rg", e.target.value.replace(/\D/g, ""))} placeholder="Somente números" inputMode="numeric" className="mt-1 h-9 text-xs" />
                    </div>
                  </div>
                  {passageiros.length > 1 && (
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={() => removePassageiro(p.id)} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground h-7 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">CPF e RG são obrigatórios. Formato do CPF: 000.000.000-00</p>
              <Button type="button" variant="outline" size="sm" onClick={addPassageiro} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Plus className="h-3.5 w-3.5 mr-1" /> + Adicionar Passageiro
              </Button>
            </div>
          </fieldset>

          {/* Anexos e Observações */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Anexos e Observações</legend>
            <div className="mt-3 space-y-4">
              <div>
                <Label className="text-xs font-bold">Anexar Documento (PDF)</Label>
                <div className="mt-1 flex items-center gap-2 border border-input rounded-md px-3 py-2 cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{anexoNome ?? "Nenhum arquivo escolhido"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo em PDF.</p>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              </div>
              <div>
                <Label className="text-xs font-bold">Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="mt-1 resize-y min-h-[100px]" placeholder="Informações adicionais..." />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Enviar Solicitação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PassagensForm;
