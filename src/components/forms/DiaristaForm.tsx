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
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface DiaristaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

// ── mask helpers ──────────────────────────────────────────────
function maskCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCNPJ(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

function maskCurrency(value: string) {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  const n = parseInt(num, 10) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

// ── component ─────────────────────────────────────────────────
const DiaristaForm = ({ open, onOpenChange, unidade }: DiaristaFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  // Dados do solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Dados do prestador
  const [nomeDiarista, setNomeDiarista] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");

  // Datas trabalhadas – each entry is a Date
  const [datasAdicionadas, setDatasAdicionadas] = useState<Date[]>([]);
  // Calendar input for adding new date
  const [calendarDateInput, setCalendarDateInput] = useState("");
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);
  const [calendarPickerDate, setCalendarPickerDate] = useState<Date | undefined>();

  // Financeiro
  const [valorDiaria, setValorDiaria] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [pagCalendarOpen, setPagCalendarOpen] = useState(false);
  const [pagCalendarDate, setPagCalendarDate] = useState<Date | undefined>();

  // PIX
  const [tipoChavePix, setTipoChavePix] = useState("");
  const [chavePix, setChavePix] = useState("");

  // Observações
  const [observacoes, setObservacoes] = useState("");

  // Anexo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);

  // ── derived ──
  const qtdDiarias = datasAdicionadas.length;
  const totalValor = parseCurrency(valorDiaria) * qtdDiarias;
  const totalFormatado = totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── PIX key mask ──
  const getChavePixMasked = (raw: string, tipo: string) => {
    if (tipo === "CPF") return maskCPF(raw);
    if (tipo === "CNPJ") return maskCNPJ(raw);
    if (tipo === "Celular") return maskPhone(raw);
    return raw; // Email & Chave Aleatória – sem máscara
  };

  const handleChavePixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setChavePix(getChavePixMasked(raw, tipoChavePix));
  };

  const handleTipoPixChange = (v: string) => {
    setTipoChavePix(v);
    setChavePix(""); // reset when type changes
  };

  // ── date input helpers ──
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalendarDateInput(maskDate(e.target.value));
  };

  const parseInputDate = (str: string): Date | null => {
    const parts = str.split("/");
    if (parts.length !== 3 || parts[2].length !== 4) return null;
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    return isNaN(d.getTime()) ? null : d;
  };

  const addDate = () => {
    const date = parseInputDate(calendarDateInput);
    if (!date) {
      toast({ title: "Data inválida", description: "Use o formato DD/MM/AAAA.", variant: "destructive" });
      return;
    }
    const already = datasAdicionadas.some((d) => d.toDateString() === date.toDateString());
    if (already) {
      toast({ title: "Data já adicionada", variant: "destructive" });
      return;
    }
    setDatasAdicionadas((prev) => [...prev, date]);
    setCalendarDateInput("");
    setCalendarPickerDate(undefined);
  };

  const removeDate = (idx: number) => {
    setDatasAdicionadas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    setCalendarPickerDate(date);
    setCalendarDateInput(format(date, "dd/MM/yyyy"));
    setCalendarPickerOpen(false);
  };

  const handlePagCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    setPagCalendarDate(date);
    setDataPagamento(format(date, "dd/MM/yyyy"));
    setPagCalendarOpen(false);
  };

  const handlePagDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataPagamento(maskDate(e.target.value));
  };

  // ── anexo ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAnexoNome(file.name);
  };

  // ── reset ──
  const resetForm = () => {
    setEvento(""); setPrioridade(""); setNomeDiarista("");
    setCpf(""); setRg(""); setDatasAdicionadas([]);
    setCalendarDateInput(""); setCalendarPickerDate(undefined);
    setValorDiaria(""); setDataPagamento(""); setPagCalendarDate(undefined);
    setTipoChavePix(""); setChavePix(""); setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── validation ──
  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!nomeDiarista.trim()) { toast({ title: "Informe o Nome do(a) Diarista", variant: "destructive" }); return false; }
    if (cpf.length < 14) { toast({ title: "CPF inválido (000.000.000-00)", variant: "destructive" }); return false; }
    if (!rg.trim()) { toast({ title: "Informe o RG", variant: "destructive" }); return false; }
    if (datasAdicionadas.length === 0) { toast({ title: "Adicione ao menos uma data trabalhada", variant: "destructive" }); return false; }
    if (!valorDiaria) { toast({ title: "Informe o Valor da Diária", variant: "destructive" }); return false; }
    if (dataPagamento.length < 10) { toast({ title: "Data do Pagamento inválida", variant: "destructive" }); return false; }
    if (!tipoChavePix) { toast({ title: "Selecione o Tipo de Chave PIX", variant: "destructive" }); return false; }
    if (!chavePix.trim()) { toast({ title: "Informe a Chave PIX", variant: "destructive" }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "Serviço de Diarista", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      await addSolicitacao({
        tipo: "Serviço de Diarista",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: nomeDiarista,
        unidadeDestino: "",
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        justificativa: [
          `CPF: ${cpf}`,
          `RG: ${rg}`,
          `Datas: ${datasAdicionadas.map((d) => format(d, "dd/MM/yyyy")).join(", ")}`,
          `Qtd Diárias: ${qtdDiarias}`,
          `Valor Diária: R$ ${valorDiaria}`,
          `Total: R$ ${totalFormatado}`,
          `Data Pgto: ${dataPagamento}`,
          `Chave PIX (${tipoChavePix}): ${chavePix}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: valorDiaria,
        faixaSalarialAte: totalFormatado,
        tipoContrato: tipoChavePix,
        horarioDe: dataPagamento,
        horarioAte: "",
        caracteristicas: {},
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        await uploadAttachmentToSharePoint({ file, unidade, servico: "Serviço de Diarista", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder });
      }
      toast({ title: "Solicitação de Diarista enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  const pixPlaceholder: Record<string, string> = {
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    Celular: "(00) 00000-0000",
    "E-mail": "email@exemplo.com",
    "Chave Aleatória": "Chave aleatória",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Nova Solicitação de Diarista - Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Dados do Solicitante ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2 bg-primary text-primary-foreground rounded px-3 py-0.5">
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

          {/* ── Dados do Prestador e Pagamento ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Prestador e Pagamento
            </legend>

            <div className="mt-3 space-y-4">
              {/* Nome */}
              <div>
                <Label className="text-xs font-bold">Nome do(a) Diarista *</Label>
                <Input value={nomeDiarista} onChange={(e) => setNomeDiarista(e.target.value)} className="mt-1" />
              </div>

              {/* CPF / RG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">CPF *</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="mt-1"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">RG *</Label>
                  <Input
                    value={rg}
                    onChange={(e) => setRg(e.target.value.replace(/\D/g, ""))}
                    placeholder="Somente números"
                    className="mt-1"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Datas trabalhadas */}
              <div>
                <Label className="text-xs font-bold">Datas Trabalhadas *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      value={calendarDateInput}
                      onChange={handleDateInputChange}
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      inputMode="numeric"
                      className="pr-10"
                    />
                    <Popover open={calendarPickerOpen} onOpenChange={setCalendarPickerOpen}>
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
                          selected={calendarPickerDate}
                          onSelect={handleCalendarSelect}
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="shrink-0">
                    <Label className="text-xs font-bold">Qtd. Diárias</Label>
                    <Input value={qtdDiarias} readOnly className="mt-1 bg-muted w-20 text-center" />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDate}
                  className="mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Data
                </Button>

                {/* Lista de datas adicionadas */}
                {datasAdicionadas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {datasAdicionadas.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium"
                      >
                        {format(d, "dd/MM/yyyy")}
                        <button type="button" onClick={() => removeDate(i)} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Valor diária / Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Valor da Diária (R$) *</Label>
                  <Input
                    value={valorDiaria ? `R$ ${valorDiaria}` : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      setValorDiaria(maskCurrency(raw));
                    }}
                    placeholder="R$ 0,00"
                    className="mt-1"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Valor Total (R$)</Label>
                  <Input
                    value={totalFormatado ? `R$ ${totalFormatado}` : "R$ 0,00"}
                    readOnly
                    className="mt-1 bg-muted font-semibold text-primary"
                  />
                </div>
              </div>

              {/* Data pagamento / Tipo PIX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Data do Pagamento *</Label>
                  <div className="relative mt-1">
                    <Input
                      value={dataPagamento}
                      onChange={handlePagDateInput}
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      inputMode="numeric"
                      className="pr-10"
                    />
                    <Popover open={pagCalendarOpen} onOpenChange={setPagCalendarOpen}>
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
                          selected={pagCalendarDate}
                          onSelect={handlePagCalendarSelect}
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold">Tipo de Chave PIX *</Label>
                  <Select value={tipoChavePix} onValueChange={handleTipoPixChange}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                      <SelectItem value="Celular">Celular</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                      <SelectItem value="Chave Aleatória">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chave PIX */}
              <div>
                <Label className="text-xs font-bold">Chave PIX *</Label>
                <Input
                  value={chavePix}
                  onChange={handleChavePixChange}
                  placeholder={tipoChavePix ? pixPlaceholder[tipoChavePix] : "Selecione o tipo de chave"}
                  disabled={!tipoChavePix}
                  className="mt-1"
                  inputMode={["CPF", "CNPJ", "Celular"].includes(tipoChavePix) ? "numeric" : "text"}
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

export default DiaristaForm;
