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
import { CalendarIcon, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface AluguelBanheiroFormProps {
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

const AluguelBanheiroForm = ({ open, onOpenChange, unidade }: AluguelBanheiroFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  // Dados do Solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Dados do Aluguel
  const [qtdBanheiros, setQtdBanheiros] = useState("1");
  const [climatizado, setClimatizado] = useState<"sim" | "nao">("nao");
  const [insumos, setInsumos] = useState<"sim" | "nao">("nao");
  const [stand, setStand] = useState("");

  // Data de entrega
  const [dataEntrega, setDataEntrega] = useState("");
  const [entregaCalendarOpen, setEntregaCalendarOpen] = useState(false);
  const [entregaCalendarDate, setEntregaCalendarDate] = useState<Date | undefined>();

  // Data de retirada
  const [dataRetirada, setDataRetirada] = useState("");
  const [retiradaCalendarOpen, setRetiradaCalendarOpen] = useState(false);
  const [retiradaCalendarDate, setRetiradaCalendarDate] = useState<Date | undefined>();

  // Outros
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── handlers ──
  const handleEntregaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataEntrega(maskDate(e.target.value));
  };

  const handleEntregaCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    setEntregaCalendarDate(date);
    setDataEntrega(format(date, "dd/MM/yyyy"));
    setEntregaCalendarOpen(false);
  };

  const handleRetiradaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataRetirada(maskDate(e.target.value));
  };

  const handleRetiradaCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    setRetiradaCalendarDate(date);
    setDataRetirada(format(date, "dd/MM/yyyy"));
    setRetiradaCalendarOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAnexoNome(file.name);
  };

  const resetForm = () => {
    setEvento(""); setPrioridade("");
    setQtdBanheiros("1"); setClimatizado("nao"); setInsumos("nao"); setStand("");
    setDataEntrega(""); setEntregaCalendarDate(undefined);
    setDataRetirada(""); setRetiradaCalendarDate(undefined);
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    const qtd = parseInt(qtdBanheiros, 10);
    if (!qtdBanheiros || isNaN(qtd) || qtd < 1) { toast({ title: "Informe a Quantidade de Banheiros", variant: "destructive" }); return false; }
    if (!stand.trim()) { toast({ title: "Informe o Stand", variant: "destructive" }); return false; }
    if (dataEntrega.length < 10) { toast({ title: "Informe a Data de Entrega válida", variant: "destructive" }); return false; }
    if (dataRetirada.length < 10) { toast({ title: "Informe a Data de Retirada válida", variant: "destructive" }); return false; }
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
        dateFolder = await getNextSequentialFolder(unidade, "Aluguel de Banheiro", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      await addSolicitacao({
        tipo: "Aluguel de Banheiro",
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
          `Qtd. Banheiros: ${qtdBanheiros}`,
          `Climatizado: ${climatizado === "sim" ? "Sim" : "Não"}`,
          `Insumos Inclusos: ${insumos === "sim" ? "Sim" : "Não"}`,
          `Stand: ${stand}`,
          `Data de Entrega: ${dataEntrega}`,
          `Data de Retirada: ${dataRetirada}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: "",
        horarioDe: dataEntrega,
        horarioAte: dataRetirada,
        caracteristicas: {},
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Aluguel de Banheiro", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Aluguel de Banheiro enviada com sucesso!" });
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
            Solicitação de Aluguel de Banheiro • Unidade: {nomeUnidade}
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

          {/* ── Dados do Aluguel ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Aluguel
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {/* Quantidade */}
              <div>
                <Label className="text-xs font-bold">Quantidade de banheiros *</Label>
                <Input
                  value={qtdBanheiros}
                  onChange={(e) => setQtdBanheiros(e.target.value.replace(/\D/g, ""))}
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="1"
                />
              </div>

              {/* Climatizado */}
              <div>
                <Label className="text-xs font-bold">Tipo de banheiro (climatizado) *</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="climatizado"
                      value="sim"
                      checked={climatizado === "sim"}
                      onChange={() => setClimatizado("sim")}
                      className="accent-primary"
                    />
                    Sim
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="climatizado"
                      value="nao"
                      checked={climatizado === "nao"}
                      onChange={() => setClimatizado("nao")}
                      className="accent-primary"
                    />
                    Não
                  </label>
                </div>
              </div>

              {/* Insumos */}
              <div>
                <Label className="text-xs font-bold">Com insumos inclusos *</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="insumos"
                      value="sim"
                      checked={insumos === "sim"}
                      onChange={() => setInsumos("sim")}
                      className="accent-primary"
                    />
                    Sim
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="insumos"
                      value="nao"
                      checked={insumos === "nao"}
                      onChange={() => setInsumos("nao")}
                      className="accent-primary"
                    />
                    Não
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Stand */}
              <div>
                <Label className="text-xs font-bold">Stand *</Label>
                <Input value={stand} onChange={(e) => setStand(e.target.value)} className="mt-1" placeholder="Ex.: Stand A-12" />
              </div>

              {/* Data de entrega */}
              <div>
                <Label className="text-xs font-bold">Data de entrega *</Label>
                <div className="relative mt-1">
                  <Input
                    value={dataEntrega}
                    onChange={handleEntregaInput}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    inputMode="numeric"
                    className="pr-10"
                  />
                  <Popover open={entregaCalendarOpen} onOpenChange={setEntregaCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={entregaCalendarDate}
                        onSelect={handleEntregaCalendarSelect}
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Data de retirada */}
              <div>
                <Label className="text-xs font-bold">Data de retirada *</Label>
                <div className="relative mt-1">
                  <Input
                    value={dataRetirada}
                    onChange={handleRetiradaInput}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    inputMode="numeric"
                    className="pr-10"
                  />
                  <Popover open={retiradaCalendarOpen} onOpenChange={setRetiradaCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={retiradaCalendarDate}
                        onSelect={handleRetiradaCalendarSelect}
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
                <Label className="text-xs font-bold">Anexar Documento</Label>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnexoNome(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo.</p>
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

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Solicitação"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AluguelBanheiroForm;
