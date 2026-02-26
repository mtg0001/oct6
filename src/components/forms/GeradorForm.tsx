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
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface GeradorFormProps {
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

function parseInputDate(str: string): Date | null {
  const parts = str.split("/");
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return isNaN(d.getTime()) ? null : d;
}

const GeradorForm = ({ open, onOpenChange, unidade }: GeradorFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  // Dados do solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Datas de uso
  const [dataDeStr, setDataDeStr] = useState("");
  const [dataDeDate, setDataDeDate] = useState<Date | undefined>();
  const [dataDeOpen, setDataDeOpen] = useState(false);

  const [dataAteStr, setDataAteStr] = useState("");
  const [dataAteDate, setDataAteDate] = useState<Date | undefined>();
  const [dataAteOpen, setDataAteOpen] = useState(false);

  // Data de retirada
  const [dataRetiradaStr, setDataRetiradaStr] = useState("");
  const [dataRetiradaDate, setDataRetiradaDate] = useState<Date | undefined>();
  const [dataRetiradaOpen, setDataRetiradaOpen] = useState(false);

  // Campos numéricos
  const [horasPorDia, setHorasPorDia] = useState("2");
  const [quantidadeKVA, setQuantidadeKVA] = useState("0");

  // Radios
  const [modoUso, setModoUso] = useState<"standby" | "continuo">("continuo");
  const [tensao, setTensao] = useState<"220" | "380">("220");

  // Observações
  const [observacoes, setObservacoes] = useState("");

  // Anexo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);

  // ── derived ──
  const dias = (() => {
    if (dataDeDate && dataAteDate) {
      const diff = differenceInCalendarDays(dataAteDate, dataDeDate);
      return diff >= 0 ? diff + 1 : 0;
    }
    return 0;
  })();

  const totalHoras = dias * (parseFloat(horasPorDia) || 0);

  // ── date pickers helpers ──
  const handleDataDe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value);
    setDataDeStr(masked);
    const parsed = parseInputDate(masked);
    if (parsed) setDataDeDate(parsed);
  };

  const handleDataAte = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value);
    setDataAteStr(masked);
    const parsed = parseInputDate(masked);
    if (parsed) setDataAteDate(parsed);
  };

  const handleDataRetirada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value);
    setDataRetiradaStr(masked);
    const parsed = parseInputDate(masked);
    if (parsed) setDataRetiradaDate(parsed);
  };

  // ── anexo ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAnexoNome(file.name);
  };

  // ── reset ──
  const resetForm = () => {
    setEvento(""); setPrioridade("");
    setDataDeStr(""); setDataDeDate(undefined);
    setDataAteStr(""); setDataAteDate(undefined);
    setDataRetiradaStr(""); setDataRetiradaDate(undefined);
    setHorasPorDia("2"); setQuantidadeKVA("0");
    setModoUso("continuo"); setTensao("220");
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── validation ──
  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!dataDeDate) { toast({ title: "Informe a Data de início", variant: "destructive" }); return false; }
    if (!dataAteDate) { toast({ title: "Informe a Data até", variant: "destructive" }); return false; }
    if (dias === 0) { toast({ title: "Data até deve ser igual ou posterior à Data de", variant: "destructive" }); return false; }
    if (!parseFloat(horasPorDia) || parseFloat(horasPorDia) <= 0) { toast({ title: "Informe a Quantidade de horas por dia", variant: "destructive" }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addSolicitacao({
        tipo: "Gerador",
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
          `Data de: ${dataDeStr}`,
          `Data até: ${dataAteStr}`,
          `Dias: ${dias}`,
          dataRetiradaStr ? `Data de retirada: ${dataRetiradaStr}` : "",
          `Horas/dia: ${horasPorDia}`,
          `Total de horas: ${totalHoras}`,
          `KVA: ${quantidadeKVA}`,
          `Modo de uso: ${modoUso === "continuo" ? "Uso contínuo" : "Standby"}`,
          `Tensão trifásica: ${tensao}V`,
          anexoNome ? `Anexo: ${anexoNome}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: modoUso,
        horarioDe: dataDeStr,
        horarioAte: dataAteStr,
        caracteristicas: {},
        observacoes,
      });
      const file = fileInputRef.current?.files?.[0];
      if (file && anexoNome) {
        await uploadAttachmentToSharePoint({ file, unidade, servico: "Gerador", userName: currentUser?.nome || "Desconhecido" });
      }
      toast({ title: "Solicitação de Gerador enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  // ── shared date field renderer ──
  const DateField = ({
    label,
    value,
    onChange,
    selected,
    onSelect,
    open,
    onOpenChange: setOpen,
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selected: Date | undefined;
    onSelect: (d: Date | undefined) => void;
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) => (
    <div>
      <Label className="text-xs font-bold">{label}</Label>
      <div className="relative mt-1">
        <Input
          value={value}
          onChange={onChange}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          inputMode="numeric"
          className="pr-10"
        />
        <Popover open={open} onOpenChange={setOpen}>
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
              selected={selected}
              onSelect={(d) => {
                if (!d) return;
                onSelect(d);
                setOpen(false);
              }}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
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
            Nova Solicitação de Gerador · Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Dados do Solicitante ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Solicitante ({nomeUnidade})
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

          {/* ── Dados da Solicitação ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados da Solicitação
            </legend>

            <div className="mt-3 space-y-4">
              {/* Row 1: Data de | Data até | Dias | Data de retirada */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DateField
                  label="Data de *"
                  value={dataDeStr}
                  onChange={handleDataDe}
                  selected={dataDeDate}
                  onSelect={(d) => {
                    setDataDeDate(d);
                    if (d) setDataDeStr(format(d, "dd/MM/yyyy"));
                  }}
                  open={dataDeOpen}
                  onOpenChange={setDataDeOpen}
                />
                <DateField
                  label="Data até *"
                  value={dataAteStr}
                  onChange={handleDataAte}
                  selected={dataAteDate}
                  onSelect={(d) => {
                    setDataAteDate(d);
                    if (d) setDataAteStr(format(d, "dd/MM/yyyy"));
                  }}
                  open={dataAteOpen}
                  onOpenChange={setDataAteOpen}
                />
                <div>
                  <Label className="text-xs font-bold">Dias</Label>
                  <Input value={dias} readOnly className="mt-1 bg-muted text-center" />
                </div>
                <DateField
                  label="Data de retirada"
                  value={dataRetiradaStr}
                  onChange={handleDataRetirada}
                  selected={dataRetiradaDate}
                  onSelect={(d) => {
                    setDataRetiradaDate(d);
                    if (d) setDataRetiradaStr(format(d, "dd/MM/yyyy"));
                  }}
                  open={dataRetiradaOpen}
                  onOpenChange={setDataRetiradaOpen}
                />
              </div>

              {/* Row 2: Horas/dia | Total horas | KVA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold">Quantidade de horas por dia *</Label>
                  <Input
                    value={horasPorDia}
                    onChange={(e) => setHorasPorDia(e.target.value.replace(/[^\d.]/g, ""))}
                    className="mt-1"
                    inputMode="decimal"
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Total de horas (dias × horas/dia)</Label>
                  <Input value={totalHoras} readOnly className="mt-1 bg-muted text-center" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Quantidade de KVA</Label>
                  <Input
                    value={quantidadeKVA}
                    onChange={(e) => setQuantidadeKVA(e.target.value.replace(/[^\d.]/g, ""))}
                    className="mt-1"
                    inputMode="decimal"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Row 3: Modo de uso | Tensão trifásica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-bold mb-2 block">Modo de uso</Label>
                  <div className="space-y-1.5">
                    {[
                      { value: "standby", label: "Standby" },
                      { value: "continuo", label: "Uso contínuo" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modoUso"
                          value={opt.value}
                          checked={modoUso === opt.value}
                          onChange={() => setModoUso(opt.value as "standby" | "continuo")}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold mb-2 block">Tensão trifásica</Label>
                  <div className="space-y-1.5">
                    {[
                      { value: "220", label: "220V" },
                      { value: "380", label: "380V" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tensao"
                          value={opt.value}
                          checked={tensao === opt.value}
                          onChange={() => setTensao(opt.value as "220" | "380")}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
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
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1 resize-y min-h-[100px]"
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
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GeradorForm;
