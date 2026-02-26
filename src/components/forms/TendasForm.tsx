import { useState, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Paperclip, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface TendasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

interface TendaDetalhe {
  id: number;
  tipos: string[];
  detalhes: Record<string, { alturaPe: string; largura: string; comprimento: string; lateraisFechadas: string }>;
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

const TIPOS_TENDA = ["Tubolar", "Calhada", "Galpão", "Box"];

let nextTendaId = 1;

function criarTendaVazia(): TendaDetalhe {
  return { id: nextTendaId++, tipos: [], detalhes: {} };
}

const TendasForm = ({ open, onOpenChange, unidade }: TendasFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  const [tendas, setTendas] = useState<TendaDetalhe[]>([criarTendaVazia()]);

  const [dataEntrega, setDataEntrega] = useState("");
  const [entregaCalOpen, setEntregaCalOpen] = useState(false);
  const [entregaCalDate, setEntregaCalDate] = useState<Date | undefined>();

  const [dataRetirada, setDataRetirada] = useState("");
  const [retiradaCalOpen, setRetiradaCalOpen] = useState(false);
  const [retiradaCalDate, setRetiradaCalDate] = useState<Date | undefined>();

  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);

  const handleCalendarSelect = (
    date: Date | undefined,
    setDate: (d: Date | undefined) => void,
    setInput: (v: string) => void,
    setOpen: (v: boolean) => void
  ) => {
    if (!date) return;
    setDate(date);
    setInput(format(date, "dd/MM/yyyy"));
    setOpen(false);
  };

  const toggleTipoForTenda = (tendaIdx: number, tipo: string) => {
    setTendas((prev) => {
      const copy = [...prev];
      const t = { ...copy[tendaIdx] };
      if (t.tipos.includes(tipo)) {
        t.tipos = t.tipos.filter((x) => x !== tipo);
        const { [tipo]: _, ...rest } = t.detalhes;
        t.detalhes = rest;
      } else {
        t.tipos = [...t.tipos, tipo];
        t.detalhes = { ...t.detalhes, [tipo]: { alturaPe: "", largura: "", comprimento: "", lateraisFechadas: "" } };
      }
      copy[tendaIdx] = t;
      return copy;
    });
  };

  const updateDetalhe = (tendaIdx: number, tipo: string, field: string, value: string) => {
    setTendas((prev) => {
      const copy = [...prev];
      const t = { ...copy[tendaIdx] };
      t.detalhes = {
        ...t.detalhes,
        [tipo]: { ...t.detalhes[tipo], [field]: value },
      };
      copy[tendaIdx] = t;
      return copy;
    });
  };

  const adicionarTenda = () => {
    setTendas((prev) => [...prev, criarTendaVazia()]);
  };

  const removerTenda = (idx: number) => {
    if (tendas.length <= 1) return;
    setTendas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo 5 MB.", variant: "destructive" });
        return;
      }
      setAnexoNome(file.name);
    }
  };

  const resetForm = () => {
    setEvento("");
    setPrioridade("");
    setTendas([criarTendaVazia()]);
    setDataEntrega("");
    setEntregaCalDate(undefined);
    setDataRetirada("");
    setRetiradaCalDate(undefined);
    setObservacoes("");
    setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    const hasAnyTipo = tendas.some((t) => t.tipos.length > 0);
    if (!hasAnyTipo) { toast({ title: "Selecione ao menos um tipo de tenda", variant: "destructive" }); return false; }
    if (dataEntrega.length < 10) { toast({ title: "Data de entrega inválida", variant: "destructive" }); return false; }
    if (dataRetirada.length < 10) { toast({ title: "Data de retirada inválida", variant: "destructive" }); return false; }
    return true;
  };

  const buildTendasInfo = () => {
    return tendas.map((t, i) => {
      const tiposInfo = t.tipos.map((tipo) => {
        const d = t.detalhes[tipo];
        if (!d) return tipo;
        return `${tipo} (Pé: ${d.alturaPe || "—"}m, ${d.largura || "—"}x${d.comprimento || "—"}m, Laterais: ${d.lateraisFechadas || "0"})`;
      });
      return `Tenda ${i + 1}: ${tiposInfo.join("; ")}`;
    }).join(" | ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const allTipos = tendas.flatMap((t) => t.tipos);
    const tendasInfo = buildTendasInfo();

    try {
      await addSolicitacao({
        tipo: "Tendas",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: "",
        unidadeDestino: "",
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        justificativa: [
          tendasInfo,
          `Entrega: ${dataEntrega}`,
          `Retirada: ${dataRetirada}`,
          anexoNome ? `Anexo: ${anexoNome}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: allTipos.join(", "),
        horarioDe: dataEntrega,
        horarioAte: dataRetirada,
        caracteristicas: { tendas: tendas.map((t) => ({ tipos: t.tipos, detalhes: t.detalhes })) } as any,
        observacoes,
      });
      toast({ title: "Solicitação de Tenda enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  const DateField = ({
    label, value, onChange, calOpen, setCalOpen, calDate, onCalSelect,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    calOpen: boolean; setCalOpen: (v: boolean) => void;
    calDate: Date | undefined; onCalSelect: (d: Date | undefined) => void;
  }) => (
    <div>
      <Label className="text-xs font-bold">{label} *</Label>
      <div className="flex items-center gap-1 mt-1">
        <Input
          value={value}
          onChange={(e) => onChange(maskDate(e.target.value))}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          inputMode="numeric"
          className="flex-1"
        />
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={calDate} onSelect={onCalSelect} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Solicitação de Tenda · Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Dados do Solicitante ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Solicitante
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs font-bold">Evento *</Label>
                <Input value={evento} onChange={(e) => setEvento(e.target.value)} className="mt-1" placeholder="Nome do evento" />
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

          {/* ── Tendas ── */}
          {tendas.map((tenda, tendaIdx) => (
            <fieldset key={tenda.id} className="border border-primary/30 rounded-md p-4">
              <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5 flex items-center gap-2">
                Tenda {tendaIdx + 1}
                {tendas.length > 1 && (
                  <button type="button" onClick={() => removerTenda(tendaIdx)} className="ml-1 hover:text-destructive transition-colors" title="Remover tenda">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </legend>

              {/* Checkboxes dos tipos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {TIPOS_TENDA.map((tipo) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <Checkbox
                      id={`tenda-${tenda.id}-${tipo}`}
                      checked={tenda.tipos.includes(tipo)}
                      onCheckedChange={() => toggleTipoForTenda(tendaIdx, tipo)}
                    />
                    <Label htmlFor={`tenda-${tenda.id}-${tipo}`} className="text-sm cursor-pointer">{tipo}</Label>
                  </div>
                ))}
              </div>

              {/* Detalhes por tipo selecionado */}
              {tenda.tipos.map((tipo) => {
                const d = tenda.detalhes[tipo];
                if (!d) return null;
                return (
                  <div key={tipo} className="border border-muted rounded-md p-3 mt-3">
                    <p className="text-sm font-bold mb-2">{tipo}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-bold">Altura do pé (m)</Label>
                        <Input
                          value={d.alturaPe}
                          onChange={(e) => updateDetalhe(tendaIdx, tipo, "alturaPe", e.target.value.replace(/[^\d.,]/g, ""))}
                          className="mt-1"
                          placeholder="Ex: 3"
                          inputMode="decimal"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">Medida</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            value={d.largura}
                            onChange={(e) => updateDetalhe(tendaIdx, tipo, "largura", e.target.value.replace(/[^\d.,]/g, ""))}
                            placeholder="Largura (m)"
                            inputMode="decimal"
                          />
                          <span className="text-sm text-muted-foreground font-bold">x</span>
                          <Input
                            value={d.comprimento}
                            onChange={(e) => updateDetalhe(tendaIdx, tipo, "comprimento", e.target.value.replace(/[^\d.,]/g, ""))}
                            placeholder="Comprimento (m)"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold">Qtd. de laterais fechadas</Label>
                        <Input
                          value={d.lateraisFechadas}
                          onChange={(e) => updateDetalhe(tendaIdx, tipo, "lateraisFechadas", e.target.value.replace(/\D/g, ""))}
                          className="mt-1"
                          placeholder="Ex: 2"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ))}

          <Button type="button" variant="outline" className="w-full border-dashed" onClick={adicionarTenda}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar mais tendas
          </Button>

          {/* ── Datas ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Datas
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <DateField
                label="Data de entrega" value={dataEntrega} onChange={setDataEntrega}
                calOpen={entregaCalOpen} setCalOpen={setEntregaCalOpen} calDate={entregaCalDate}
                onCalSelect={(d) => handleCalendarSelect(d, setEntregaCalDate, setDataEntrega, setEntregaCalOpen)}
              />
              <DateField
                label="Data de retirada" value={dataRetirada} onChange={setDataRetirada}
                calOpen={retiradaCalOpen} setCalOpen={setRetiradaCalOpen} calDate={retiradaCalDate}
                onCalSelect={(d) => handleCalendarSelect(d, setRetiradaCalDate, setDataRetirada, setRetiradaCalOpen)}
              />
            </div>
          </fieldset>

          {/* ── Anexos e Observações ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Anexos e Observações
            </legend>
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
                    <button type="button" className="ml-auto text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); setAnexoNome(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo em PDF.</p>
              </div>
              <div>
                <Label className="text-xs font-bold">Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="mt-1" placeholder="Informações adicionais..." />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit">Enviar Solicitação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TendasForm;
