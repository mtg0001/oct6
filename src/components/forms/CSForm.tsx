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
import { CalendarIcon, Plus, X, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface CSFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

function maskCNPJ(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

interface ItemDescricao {
  id: number;
  quantidade: string;
  unidadeMedida: string;
  item: string;
  obs: string;
}

let itemIdCounter = 1;

const CSForm = ({ open, onOpenChange, unidade }: CSFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  // Dados do Solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Orçamento de Adicionais
  const [cliente, setCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [eventoOrcamento, setEventoOrcamento] = useState("");
  const [local, setLocal] = useState("");
  const [dataRealizacao, setDataRealizacao] = useState("");
  const [dataRealizacaoCalendarOpen, setDataRealizacaoCalendarOpen] = useState(false);
  const [dataRealizacaoCalendarDate, setDataRealizacaoCalendarDate] = useState<Date | undefined>();

  // Descrição (itens repetíveis)
  const [itens, setItens] = useState<ItemDescricao[]>([
    { id: itemIdCounter++, quantidade: "", unidadeMedida: "", item: "", obs: "" },
  ]);

  // Informações da Proposta
  const [csResponsavel, setCsResponsavel] = useState("");
  const [numeroProposta, setNumeroProposta] = useState("");
  const [dataProposta, setDataProposta] = useState("");
  const [dataPropostaCalendarOpen, setDataPropostaCalendarOpen] = useState(false);
  const [dataPropostaCalendarDate, setDataPropostaCalendarDate] = useState<Date | undefined>();

  // Anexo e Observações
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Helpers
  const addItem = () => {
    setItens((prev) => [...prev, { id: itemIdCounter++, quantidade: "", unidadeMedida: "", item: "", obs: "" }]);
  };

  const removeItem = (id: number) => {
    if (itens.length <= 1) {
      toast({ title: "É necessário ao menos um item", variant: "destructive" });
      return;
    }
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof Omit<ItemDescricao, "id">, value: string) => {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
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

  const handleCalendarSelect = (setter: (d: string) => void, setCalDate: (d: Date | undefined) => void, setOpen: (o: boolean) => void) => (date: Date | undefined) => {
    if (!date) return;
    setCalDate(date);
    setter(format(date, "dd/MM/yyyy"));
    setOpen(false);
  };

  const resetForm = () => {
    setEvento(""); setPrioridade("");
    setCliente(""); setCnpj(""); setRazaoSocial(""); setEventoOrcamento(""); setLocal("");
    setDataRealizacao(""); setDataRealizacaoCalendarDate(undefined);
    setItens([{ id: itemIdCounter++, quantidade: "", unidadeMedida: "", item: "", obs: "" }]);
    setCsResponsavel(""); setNumeroProposta(""); setDataProposta(""); setDataPropostaCalendarDate(undefined);
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento (solicitante)", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!cliente.trim()) { toast({ title: "Informe o Cliente", variant: "destructive" }); return false; }
    if (cnpj.replace(/\D/g, "").length < 14) { toast({ title: "CNPJ inválido", variant: "destructive" }); return false; }
    if (!razaoSocial.trim()) { toast({ title: "Informe a Razão Social", variant: "destructive" }); return false; }
    if (!eventoOrcamento.trim()) { toast({ title: "Informe o Evento do orçamento", variant: "destructive" }); return false; }
    if (!local.trim()) { toast({ title: "Informe o Local", variant: "destructive" }); return false; }
    if (dataRealizacao.length < 10) { toast({ title: "Data de realização inválida", variant: "destructive" }); return false; }
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];
      if (!it.quantidade.trim()) { toast({ title: `Item ${i + 1}: informe a quantidade`, variant: "destructive" }); return false; }
      if (!it.unidadeMedida) { toast({ title: `Item ${i + 1}: selecione a unidade de medida`, variant: "destructive" }); return false; }
      if (!it.item.trim()) { toast({ title: `Item ${i + 1}: informe o item`, variant: "destructive" }); return false; }
    }
    if (!csResponsavel.trim()) { toast({ title: "Informe o CS Responsável", variant: "destructive" }); return false; }
    if (!numeroProposta.trim()) { toast({ title: "Informe o Número da Proposta", variant: "destructive" }); return false; }
    if (dataProposta.length < 10) { toast({ title: "Data da Proposta inválida", variant: "destructive" }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "CAD", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }

      const itensTexto = itens.map((it, i) => {
        const obsStr = it.obs.trim() ? ` (Obs: ${it.obs})` : "";
        return `${i + 1}) ${it.quantidade} ${it.unidadeMedida} - ${it.item}${obsStr}`;
      }).join("; ");

      await addSolicitacao({
        tipo: "CAD",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: csResponsavel,
        unidadeDestino: local,
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        justificativa: [
          `Cliente: ${cliente}`,
          `CNPJ: ${cnpj}`,
          `Razão Social: ${razaoSocial}`,
          `Evento: ${eventoOrcamento}`,
          `Local: ${local}`,
          `Data Realização: ${dataRealizacao}`,
          `Itens: ${itensTexto}`,
          `CS Responsável: ${csResponsavel}`,
          `Nº Proposta: ${numeroProposta}`,
          `Data Proposta: ${dataProposta}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: "",
        horarioDe: "",
        horarioAte: "",
        caracteristicas: {
          cliente,
          cnpj,
          razaoSocial,
          eventoOrcamento,
          local,
          dataRealizacao,
          itens: itensTexto,
          csResponsavel,
          numeroProposta,
          dataProposta,
        },
        observacoes,
      });

      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "CAD", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }

      toast({ title: "Solicitação de CS enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const DateInput = ({
    label, value, onChange, calendarOpen, setCalendarOpen, calendarDate, onCalendarSelect,
  }: {
    label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    calendarOpen: boolean; setCalendarOpen: (o: boolean) => void; calendarDate: Date | undefined;
    onCalendarSelect: (d: Date | undefined) => void;
  }) => (
    <div>
      <Label className="text-xs font-bold">{label}</Label>
      <div className="relative mt-1">
        <Input value={value} onChange={onChange} placeholder="dd/mm/aaaa" maxLength={10} inputMode="numeric" className="pr-10" />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={calendarDate} onSelect={onCalendarSelect} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
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
            Solicitação de CS · Unidade: {nomeUnidade}
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

          {/* ── Solicitação de Orçamento de Adicionais ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Solicitação de Orçamento de Adicionais
            </legend>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Cliente *</Label>
                  <Input value={cliente} onChange={(e) => setCliente(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">CNPJ *</Label>
                  <Input value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} className="mt-1" inputMode="numeric" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Razão Social *</Label>
                <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Evento *</Label>
                  <Input value={eventoOrcamento} onChange={(e) => setEventoOrcamento(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Local *</Label>
                  <Input value={local} onChange={(e) => setLocal(e.target.value)} className="mt-1" />
                </div>
              </div>
              <DateInput
                label="Data de Realização *"
                value={dataRealizacao}
                onChange={(e) => setDataRealizacao(maskDate(e.target.value))}
                calendarOpen={dataRealizacaoCalendarOpen}
                setCalendarOpen={setDataRealizacaoCalendarOpen}
                calendarDate={dataRealizacaoCalendarDate}
                onCalendarSelect={handleCalendarSelect(setDataRealizacao, setDataRealizacaoCalendarDate, setDataRealizacaoCalendarOpen)}
              />
            </div>
          </fieldset>

          {/* ── Descrição (itens repetíveis) ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Descrição
            </legend>
            <div className="mt-3 space-y-3">
              {itens.map((it, idx) => (
                <div key={it.id} className="border border-border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr] gap-3">
                    <div>
                      <Label className="text-xs font-bold">Quantidade *</Label>
                      <Input
                        value={it.quantidade}
                        onChange={(e) => updateItem(it.id, "quantidade", e.target.value.replace(/\D/g, ""))}
                        className="mt-1"
                        inputMode="numeric"
                        placeholder="Somente números"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Unidade de Medida *</Label>
                      <Select value={it.unidadeMedida} onValueChange={(v) => updateItem(it.id, "unidadeMedida", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unidade">Unidade</SelectItem>
                          <SelectItem value="Metro">Metro</SelectItem>
                          <SelectItem value="Metro²">Metro²</SelectItem>
                          <SelectItem value="Metro³">Metro³</SelectItem>
                          <SelectItem value="Litro">Litro</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Caixa">Caixa</SelectItem>
                          <SelectItem value="Pacote">Pacote</SelectItem>
                          <SelectItem value="Rolo">Rolo</SelectItem>
                          <SelectItem value="Par">Par</SelectItem>
                          <SelectItem value="Jogo">Jogo</SelectItem>
                          <SelectItem value="Peça">Peça</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Item *</Label>
                      <Input value={it.item} onChange={(e) => updateItem(it.id, "item", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Observação do Item</Label>
                    <Input value={it.obs} onChange={(e) => updateItem(it.id, "obs", e.target.value)} className="mt-1" placeholder="Observação específica deste item" />
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeItem(it.id)} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <X className="h-3.5 w-3.5 mr-1" /> Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {/* ── Informações da Proposta ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Informações da Proposta
            </legend>
            <div className="mt-3 space-y-4">
              <div>
                <Label className="text-xs font-bold">CS Responsável *</Label>
                <Input value={csResponsavel} onChange={(e) => setCsResponsavel(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Número da Proposta *</Label>
                  <Input
                    value={numeroProposta}
                    onChange={(e) => setNumeroProposta(e.target.value.replace(/\D/g, ""))}
                    className="mt-1"
                    inputMode="numeric"
                    placeholder="Somente números"
                  />
                </div>
                <DateInput
                  label="Data da Proposta *"
                  value={dataProposta}
                  onChange={(e) => setDataProposta(maskDate(e.target.value))}
                  calendarOpen={dataPropostaCalendarOpen}
                  setCalendarOpen={setDataPropostaCalendarOpen}
                  calendarDate={dataPropostaCalendarDate}
                  onCalendarSelect={handleCalendarSelect(setDataProposta, setDataPropostaCalendarDate, setDataPropostaCalendarOpen)}
                />
              </div>
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

export default CSForm;
