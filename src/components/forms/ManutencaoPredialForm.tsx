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
import { CalendarIcon, Plus, Trash2, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface ManutencaoPredialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

interface ServicoItem {
  id: number;
  tipoServico: string;
  dataExecucao: string;
}

let nextId = 1;

const ManutencaoPredialForm = ({ open, onOpenChange, unidade }: ManutencaoPredialFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [servicos, setServicos] = useState<ServicoItem[]>([{ id: nextId++, tipoServico: "", dataExecucao: "" }]);
  const [observacoes, setObservacoes] = useState("");
  const [anexoNome, setAnexoNome] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calendar popover state per service
  const [calOpenMap, setCalOpenMap] = useState<Record<number, boolean>>({});
  const [calDateMap, setCalDateMap] = useState<Record<number, Date | undefined>>({});

  const addServico = () => {
    setServicos((prev) => [...prev, { id: nextId++, tipoServico: "", dataExecucao: "" }]);
  };

  const removeServico = (id: number) => {
    if (servicos.length <= 1) return;
    setServicos((prev) => prev.filter((s) => s.id !== id));
  };

  const updateServico = (id: number, field: keyof Omit<ServicoItem, "id">, value: string) => {
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleCalendarSelect = (id: number, date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "dd/MM/yyyy");
      updateServico(id, "dataExecucao", formatted);
    }
    setCalDateMap((p) => ({ ...p, [id]: date }));
    setCalOpenMap((p) => ({ ...p, [id]: false }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Apenas PDF é permitido", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo excede 5 MB", variant: "destructive" });
      return;
    }
    setAnexoNome(buildStoredFileName(file.name));
  };

  const resetForm = () => {
    setEvento("");
    setPrioridade("");
    setServicos([{ id: nextId++, tipoServico: "", dataExecucao: "" }]);
    setObservacoes("");
    setAnexoNome("");
    setCalOpenMap({});
    setCalDateMap({});
  };

  const validate = () => {
    if (!evento.trim()) { toast({ title: "Informe o evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a prioridade", variant: "destructive" }); return false; }
    for (const s of servicos) {
      if (!s.tipoServico.trim()) { toast({ title: "Informe o tipo de serviço", variant: "destructive" }); return false; }
      if (!s.dataExecucao.trim() || s.dataExecucao.length < 10) { toast({ title: "Informe a data de execução", variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const servicosInfo = servicos
      .map((s, i) => `Serviço ${i + 1}: ${s.tipoServico} | Melhor data: ${s.dataExecucao}`)
      .join("\n");

    try {
      await addSolicitacao({
        tipo: "Manutenção Predial",
        unidade,
        evento,
        prioridade,
        solicitante: currentUser?.nome || "",
        solicitanteId: currentUser?.id || "",
        departamento: currentUser?.departamento || "",
        justificativa: servicosInfo,
        observacoes,
        cargo: "",
        unidadeDestino: "",
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: "",
        horarioDe: "",
        horarioAte: "",
        caracteristicas: {},
      });
      const file = fileInputRef.current?.files?.[0];
      if (file && anexoNome) {
        await uploadAttachmentToSharePoint({ file, unidade, servico: "Manutenção Predial", userName: currentUser?.nome || "Desconhecido" });
      }
      toast({ title: "Solicitação enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao enviar solicitação", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Nova Solicitação de Manutenção Predial - Unidade: {nomeUnidade}
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

          {/* ── Serviços ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Serviços
            </legend>
            <div className="mt-3 space-y-4">
              {servicos.map((s, idx) => (
                <div key={s.id} className="border border-border rounded-md p-3 space-y-3 relative">
                  {servicos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServico(s.id)}
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <p className="text-xs font-bold text-muted-foreground">Serviço {idx + 1}</p>
                  <div>
                    <Label className="text-xs font-bold">Tipo de Serviço *</Label>
                    <Input
                      value={s.tipoServico}
                      onChange={(e) => updateServico(s.id, "tipoServico", e.target.value)}
                      className="mt-1"
                      placeholder="Ex: manutenção de ar, pintura, elétrica..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Melhor data para Execução *</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={s.dataExecucao}
                        onChange={(e) => updateServico(s.id, "dataExecucao", maskDate(e.target.value))}
                        className="flex-1"
                        placeholder="dd/mm/aaaa"
                        maxLength={10}
                      />
                      <Popover
                        open={calOpenMap[s.id] || false}
                        onOpenChange={(v) => setCalOpenMap((p) => ({ ...p, [s.id]: v }))}
                      >
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="icon" className="shrink-0">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={calDateMap[s.id]}
                            onSelect={(d) => handleCalendarSelect(s.id, d)}
                            locale={ptBR}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" className="w-full" onClick={addServico}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
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
                <Label className="text-xs font-bold">Anexo (PDF)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-1" /> Selecionar arquivo
                  </Button>
                  {anexoNome && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {anexoNome}
                      <button type="button" onClick={() => { setAnexoNome(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo em PDF.</p>
              </div>

              <div>
                <Label className="text-xs font-bold">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit">Enviar Solicitação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManutencaoPredialForm;
