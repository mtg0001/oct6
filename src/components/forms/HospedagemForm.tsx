import { useState, useRef, useEffect } from "react";
import { DEPARTAMENTOS } from "@/stores/usuariosStore";
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
import { PrioridadeSelect } from "@/components/forms/PrioridadeSelect";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface HospedagemFormProps {
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



interface Hospede {
  id: number;
  departamento: string;
  nome: string;
  cpf: string;
  rg: string;
}

const HospedagemForm = ({ open, onOpenChange, unidade }: HospedagemFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  // Solicitante
  const [evento, setEvento] = useState("");
  const [departamentoSolicitante, setDepartamentoSolicitante] = useState(currentUser?.departamento || "");
  const [prioridade, setPrioridade] = useState("");

  // Hospedagem
  const [estadoUF, setEstadoUF] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Datas
  const [dataEntradaStr, setDataEntradaStr] = useState("");
  const [dataEntradaDate, setDataEntradaDate] = useState<Date | undefined>();
  const [dataEntradaOpen, setDataEntradaOpen] = useState(false);

  const [dataSaidaStr, setDataSaidaStr] = useState("");
  const [dataSaidaDate, setDataSaidaDate] = useState<Date | undefined>();
  const [dataSaidaOpen, setDataSaidaOpen] = useState(false);

  // Hóspedes
  const [hospedes, setHospedes] = useState<Hospede[]>([
    { id: 1, departamento: "", nome: "", cpf: "", rg: "" },
  ]);
  const nextId = useRef(2);

  // Anexo / Obs
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch cities from IBGE API when UF changes
  useEffect(() => {
    if (!estadoUF) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    setCidade("");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoUF}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        setCidades(data.map((m) => m.nome));
      })
      .catch(() => {
        setCidades([]);
        toast({ title: "Erro ao carregar cidades", variant: "destructive" });
      })
      .finally(() => setLoadingCidades(false));
  }, [estadoUF]);

  // Date helpers
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

  const entradaHandlers = makeDateHandlers(setDataEntradaStr, setDataEntradaDate);
  const saidaHandlers = makeDateHandlers(setDataSaidaStr, setDataSaidaDate);

  // Hóspedes helpers
  const addHospede = () => {
    setHospedes((prev) => [
      ...prev,
      { id: nextId.current++, departamento: "", nome: "", cpf: "", rg: "" },
    ]);
  };

  const removeHospede = (id: number) => {
    setHospedes((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHospede = (id: number, field: keyof Omit<Hospede, "id">, value: string) => {
    setHospedes((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        if (field === "cpf") return { ...h, cpf: maskCPF(value) };
        if (field === "rg") return { ...h, rg: value.replace(/\D/g, "") };
        return { ...h, [field]: value };
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
    setEvento(""); setPrioridade("");
    setEstadoUF(""); setCidade(""); setCidades([]);
    setDataEntradaStr(""); setDataEntradaDate(undefined);
    setDataSaidaStr(""); setDataSaidaDate(undefined);
    setHospedes([{ id: 1, departamento: "", nome: "", cpf: "", rg: "" }]);
    nextId.current = 2;
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!estadoUF) { toast({ title: "Selecione o Estado (UF)", variant: "destructive" }); return false; }
    if (!cidade) { toast({ title: "Selecione a Cidade", variant: "destructive" }); return false; }
    if (!dataEntradaDate) { toast({ title: "Informe a Data de Entrada", variant: "destructive" }); return false; }
    if (!dataSaidaDate) { toast({ title: "Informe a Data de Saída", variant: "destructive" }); return false; }
    for (const h of hospedes) {
      if (!h.departamento) { toast({ title: "Selecione o departamento de todos os hóspedes", variant: "destructive" }); return false; }
      if (!h.nome.trim()) { toast({ title: "Informe o nome de todos os hóspedes", variant: "destructive" }); return false; }
      if (h.cpf.length < 14) { toast({ title: `CPF inválido para ${h.nome || "hóspede"}`, variant: "destructive" }); return false; }
      if (!h.rg.trim()) { toast({ title: `Informe o RG de ${h.nome || "hóspede"}`, variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const hospedesStr = hospedes
      .map((h) => `${h.nome} (CPF: ${h.cpf}, RG: ${h.rg}, Depto: ${h.departamento})`)
      .join("; ");

    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "Hospedagem", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      await addSolicitacao({
        tipo: "Hospedagem",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: "",
        unidadeDestino: `${cidade}/${estadoUF}`,
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        justificativa: [
          `Local: ${cidade}/${estadoUF}`,
          `Entrada: ${dataEntradaStr}`,
          `Saída: ${dataSaidaStr}`,
          `Hóspedes: ${hospedesStr}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: "",
        horarioDe: dataEntradaStr,
        horarioAte: dataSaidaStr,
        caracteristicas: {},
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Hospedagem", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Hospedagem enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Date field component
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
          <PopoverContent className="w-auto p-0 bg-popover z-50" align="end">
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
            Nova Solicitação de Hospedagem · Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados do Solicitante */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Dados do Solicitante</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs font-bold">Evento</Label>
                <Input value={evento} onChange={(e) => setEvento(e.target.value)} className="mt-1" placeholder="" />
              </div>
              <div>
                <Label className="text-xs font-bold">Departamento</Label>
                <Input value={currentUser?.departamento || "—"} className="mt-1 bg-muted" readOnly />
              </div>
              <div>
                <Label className="text-xs font-bold">Solicitante</Label>
                <Input value={currentUser?.nome || "—"} className="mt-1 bg-muted" readOnly />
              </div>
              <div>
                <Label className="text-xs font-bold">Prioridade</Label>
                <PrioridadeSelect value={prioridade} onValueChange={setPrioridade} className="mt-1" />
              </div>
            </div>
          </fieldset>

          {/* Dados da Hospedagem */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados da Hospedagem <span className="font-normal ml-1">({nomeUnidade})</span>
            </legend>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Estado (UF) <span className="text-destructive">*</span></Label>
                  <Select value={estadoUF} onValueChange={(v) => { setEstadoUF(v); setCidade(""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-[300px]">
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">Cidade <span className="text-destructive">*</span></Label>
                  <Select value={cidade} onValueChange={setCidade} disabled={!estadoUF || loadingCidades}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingCidades ? "Carregando..." : estadoUF ? "Selecione..." : "Selecione o estado..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-[300px]">
                      {cidades.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateField
                  label="Data de entrada *"
                  value={dataEntradaStr}
                  onChange={entradaHandlers.onChange}
                  selected={dataEntradaDate}
                  onSelect={entradaHandlers.onSelect}
                  popoverOpen={dataEntradaOpen}
                  setPopoverOpen={setDataEntradaOpen}
                />
                <DateField
                  label="Data de saída *"
                  value={dataSaidaStr}
                  onChange={saidaHandlers.onChange}
                  selected={dataSaidaDate}
                  onSelect={saidaHandlers.onSelect}
                  popoverOpen={dataSaidaOpen}
                  setPopoverOpen={setDataSaidaOpen}
                />
              </div>
            </div>
          </fieldset>

          {/* Colaboradores (hóspedes) */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Colaboradores (hóspedes)</legend>
            <div className="mt-3 space-y-3">
              {hospedes.map((h) => (
                <div key={h.id} className="border border-border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Departamento <span className="text-destructive">*</span></Label>
                      <Select value={h.departamento} onValueChange={(v) => updateHospede(h.id, "departamento", v)}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {DEPARTAMENTOS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Nome completo <span className="text-destructive">*</span></Label>
                      <Input value={h.nome} onChange={(e) => updateHospede(h.id, "nome", e.target.value)} className="mt-1 h-9 text-xs" placeholder="" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">CPF <span className="text-destructive">*</span></Label>
                      <Input value={h.cpf} onChange={(e) => updateHospede(h.id, "cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" className="mt-1 h-9 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">RG <span className="text-destructive">*</span></Label>
                      <Input value={h.rg} onChange={(e) => updateHospede(h.id, "rg", e.target.value)} placeholder="" inputMode="numeric" className="mt-1 h-9 text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Button type="button" variant="outline" size="sm" onClick={addHospede} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-7 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> + Adicionar
                    </Button>
                    {hospedes.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeHospede(h.id)} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground h-7 text-xs">
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">CPF e RG são obrigatórios. Formato do CPF: <strong>000.000.000-00</strong></p>
            </div>
          </fieldset>

          {/* Anexos e Observações */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">Anexos e Observações</legend>
            <div className="mt-3 space-y-4">
              <div>
                <Label className="text-xs font-bold">Anexar Documento (PDF)</Label>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-3 border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                    anexoNome && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={cn("text-sm truncate", anexoNome ? "text-foreground" : "text-muted-foreground")}>
                    {anexoNome || "Nenhum arquivo escolhido"}
                  </span>
                  {anexoNome && (
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); setAnexoNome(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo em PDF.</p>
              </div>
              <div>
                <Label className="text-xs font-bold">Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="mt-1 resize-y min-h-[100px]" placeholder="Informações adicionais..." />
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Solicitação"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HospedagemForm;
