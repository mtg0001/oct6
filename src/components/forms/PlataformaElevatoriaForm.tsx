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
import { PrioridadeSelect } from "@/components/forms/PrioridadeSelect";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Paperclip, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface PlataformaElevatoriaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

const TIPOS_PLATAFORMA = ["Articulada", "Tesoura"];

interface PlataformaItem {
  id: number;
  tiposSelecionados: string[];
  dataEntrega: string;
  entregaCalDate: Date | undefined;
  dataRetirada: string;
  retiradaCalDate: Date | undefined;
}

let itemIdCounter = 1;

const createItem = (): PlataformaItem => ({
  id: itemIdCounter++,
  tiposSelecionados: [],
  dataEntrega: "",
  entregaCalDate: undefined,
  dataRetirada: "",
  retiradaCalDate: undefined,
});

const PlataformaElevatoriaForm = ({ open, onOpenChange, unidade }: PlataformaElevatoriaFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [itens, setItens] = useState<PlataformaItem[]>([createItem()]);

  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (id: number, updates: Partial<PlataformaItem>) => {
    setItens((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const toggleTipo = (id: number, tipo: string) => {
    setItens((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              tiposSelecionados: it.tiposSelecionados.includes(tipo)
                ? it.tiposSelecionados.filter((t) => t !== tipo)
                : [...it.tiposSelecionados, tipo],
            }
          : it
      )
    );
  };

  const addItem = () => setItens((prev) => [...prev, createItem()]);
  const removeItem = (id: number) => {
    if (itens.length <= 1) return;
    setItens((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCalendarSelect = (
    date: Date | undefined,
    itemId: number,
    field: "entrega" | "retirada"
  ) => {
    if (!date) return;
    const formatted = format(date, "dd/MM/yyyy");
    if (field === "entrega") {
      updateItem(itemId, { dataEntrega: formatted, entregaCalDate: date });
    } else {
      updateItem(itemId, { dataRetirada: formatted, retiradaCalDate: date });
    }
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
    setItens([createItem()]);
    setObservacoes("");
    setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];
      const label = itens.length > 1 ? ` (item ${i + 1})` : "";
      if (it.tiposSelecionados.length === 0) { toast({ title: `Selecione ao menos um tipo${label}`, variant: "destructive" }); return false; }
      if (it.dataEntrega.length < 10) { toast({ title: `Data de entrega inválida${label}`, variant: "destructive" }); return false; }
      if (it.dataRetirada.length < 10) { toast({ title: `Data de retirada inválida${label}`, variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const allTipos = itens.map((it) => it.tiposSelecionados.join(", ")).join("; ");
    const justParts = itens.map((it, i) => {
      const prefix = itens.length > 1 ? `Plataforma ${i + 1}: ` : "";
      return `${prefix}Tipos: ${it.tiposSelecionados.join(", ")} | Entrega: ${it.dataEntrega} | Retirada: ${it.dataRetirada}`;
    });

    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "Plataforma Elevatória", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      if (storedAnexo) justParts.push(`Anexo: ${storedAnexo}`);

      await addSolicitacao({
        tipo: "Plataforma Elevatória",
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
        justificativa: justParts.join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: allTipos,
        horarioDe: itens[0].dataEntrega,
        horarioAte: itens[0].dataRetirada,
        caracteristicas: {
          plataformas: JSON.stringify(itens.map((it) => ({
            tipos: it.tiposSelecionados,
            dataEntrega: it.dataEntrega,
            dataRetirada: it.dataRetirada,
          }))),
        },
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Plataforma Elevatória", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Plataforma Elevatória enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Solicitação de Plataforma Elevatória · Unidade: {nomeUnidade}
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
                <PrioridadeSelect value={prioridade} onValueChange={setPrioridade} className="mt-1" />
              </div>
            </div>
          </fieldset>

          {/* ── Plataformas (tipo + datas juntos) ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Plataformas
            </legend>
            <div className="mt-2 space-y-4">
              {itens.map((item, idx) => (
                <div key={item.id} className={cn("space-y-3", idx > 0 && "border-t border-border pt-4")}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">
                      {itens.length > 1 ? `Plataforma ${idx + 1}` : "Tipo e período"}
                    </span>
                    {itens.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                      </Button>
                    )}
                  </div>

                  {/* Tipos */}
                  <div className="flex flex-wrap gap-4">
                    {TIPOS_PLATAFORMA.map((tipo) => (
                      <div key={tipo} className="flex items-center gap-2">
                        <Checkbox id={`plat-${item.id}-${tipo}`} checked={item.tiposSelecionados.includes(tipo)} onCheckedChange={() => toggleTipo(item.id, tipo)} />
                        <Label htmlFor={`plat-${item.id}-${tipo}`} className="text-sm cursor-pointer">{tipo}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateField
                      label="Data de entrega"
                      value={item.dataEntrega}
                      onChange={(v) => updateItem(item.id, { dataEntrega: maskDate(v) })}
                      calDate={item.entregaCalDate}
                      onCalSelect={(d) => handleCalendarSelect(d, item.id, "entrega")}
                    />
                    <DateField
                      label="Data de retirada"
                      value={item.dataRetirada}
                      onChange={(v) => updateItem(item.id, { dataRetirada: maskDate(v) })}
                      calDate={item.retiradaCalDate}
                      onCalSelect={(d) => handleCalendarSelect(d, item.id, "retirada")}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5" onClick={addItem}>
                <Plus className="h-4 w-4" /> Adicionar Plataforma
              </Button>
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
                    <button type="button" className="ml-auto text-muted-foreground hover:text-destructive transition-colors shrink-0" onClick={(e) => { e.stopPropagation(); setAnexoNome(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Solicitação"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ── DateField helper ── */
function DateField({
  label, value, onChange, calDate, onCalSelect,
}: {
  label: string; value: string; onChange: (v: string) => void;
  calDate: Date | undefined; onCalSelect: (d: Date | undefined) => void;
}) {
  const [calOpen, setCalOpen] = useState(false);
  return (
    <div>
      <Label className="text-xs font-bold">{label} *</Label>
      <div className="relative mt-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          inputMode="numeric"
          className="pr-10"
        />
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button type="button" tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={calDate}
              onSelect={(d) => {
                if (!d) return;
                onCalSelect(d);
                setCalOpen(false);
              }}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default PlataformaElevatoriaForm;
