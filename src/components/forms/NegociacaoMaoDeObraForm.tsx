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
import { CalendarIcon, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface NegociacaoMaoDeObraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, "$1/$2").replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

const NegociacaoMaoDeObraForm = ({ open, onOpenChange, unidade }: NegociacaoMaoDeObraFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Dados da Negociação
  const [empreiteiro, setEmpreiteiro] = useState("");
  const [celular, setCelular] = useState("");
  const [seguimento, setSeguimento] = useState("");

  // Montagem
  const [isMontagem, setIsMontagem] = useState<boolean | null>(null);

  // Datas montagem
  const [montagemDe, setMontagemDe] = useState("");
  const [montagemDeCalOpen, setMontagemDeCalOpen] = useState(false);
  const [montagemDeCalDate, setMontagemDeCalDate] = useState<Date | undefined>();
  const [montagemAte, setMontagemAte] = useState("");
  const [montagemAteCalOpen, setMontagemAteCalOpen] = useState(false);
  const [montagemAteCalDate, setMontagemAteCalDate] = useState<Date | undefined>();

  // Datas realização
  const [realizacaoDe, setRealizacaoDe] = useState("");
  const [realizacaoDeCalOpen, setRealizacaoDeCalOpen] = useState(false);
  const [realizacaoDeCalDate, setRealizacaoDeCalDate] = useState<Date | undefined>();
  const [realizacaoAte, setRealizacaoAte] = useState("");
  const [realizacaoAteCalOpen, setRealizacaoAteCalOpen] = useState(false);
  const [realizacaoAteCalDate, setRealizacaoAteCalDate] = useState<Date | undefined>();

  // Datas desmontagem
  const [desmontagemDe, setDesmontagemDe] = useState("");
  const [desmontagemDeCalOpen, setDesmontagemDeCalOpen] = useState(false);
  const [desmontagemDeCalDate, setDesmontagemDeCalDate] = useState<Date | undefined>();
  const [desmontagemAte, setDesmontagemAte] = useState("");
  const [desmontagemAteCalOpen, setDesmontagemAteCalOpen] = useState(false);
  const [desmontagemAteCalDate, setDesmontagemAteCalDate] = useState<Date | undefined>();

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
    setEvento(""); setPrioridade("");
    setEmpreiteiro(""); setCelular(""); setSeguimento("");
    setIsMontagem(null);
    setMontagemDe(""); setMontagemDeCalDate(undefined);
    setMontagemAte(""); setMontagemAteCalDate(undefined);
    setRealizacaoDe(""); setRealizacaoDeCalDate(undefined);
    setRealizacaoAte(""); setRealizacaoAteCalDate(undefined);
    setDesmontagemDe(""); setDesmontagemDeCalDate(undefined);
    setDesmontagemAte(""); setDesmontagemAteCalDate(undefined);
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!empreiteiro.trim()) { toast({ title: "Informe o nome do Empreiteiro", variant: "destructive" }); return false; }
    if (celular.replace(/\D/g, "").length < 10) { toast({ title: "Celular inválido", variant: "destructive" }); return false; }
    if (!seguimento.trim()) { toast({ title: "Informe o Seguimento", variant: "destructive" }); return false; }
    if (isMontagem === null) { toast({ title: "Informe se é uma montagem", variant: "destructive" }); return false; }
    if (isMontagem) {
      if (montagemDe.length < 10 || montagemAte.length < 10) { toast({ title: "Datas da montagem inválidas", variant: "destructive" }); return false; }
      if (realizacaoDe.length < 10 || realizacaoAte.length < 10) { toast({ title: "Datas da realização inválidas", variant: "destructive" }); return false; }
      if (desmontagemDe.length < 10 || desmontagemAte.length < 10) { toast({ title: "Datas da desmontagem inválidas", variant: "destructive" }); return false; }
    }
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
        dateFolder = await getNextSequentialFolder(unidade, "Negociação de Mão de Obra", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      const justParts = [
        `Empreiteiro: ${empreiteiro}`,
        `Celular: ${celular}`,
        `Seguimento: ${seguimento}`,
        `Montagem: ${isMontagem ? "Sim" : "Não"}`,
      ];
      if (isMontagem) {
        justParts.push(`Montagem: ${montagemDe} a ${montagemAte}`);
        justParts.push(`Realização: ${realizacaoDe} a ${realizacaoAte}`);
        justParts.push(`Desmontagem: ${desmontagemDe} a ${desmontagemAte}`);
      }
      if (storedAnexo) justParts.push(`Anexo: ${storedAnexo}`);

      await addSolicitacao({
        tipo: "Negociação de Mão de Obra",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: empreiteiro,
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
        tipoContrato: seguimento,
        horarioDe: isMontagem ? montagemDe : "",
        horarioAte: isMontagem ? desmontagemAte : "",
        caracteristicas: {
          celular,
          seguimento,
          montagem: isMontagem ? "sim" : "nao",
          ...(isMontagem ? {
            montagemDe, montagemAte,
            realizacaoDe, realizacaoAte,
            desmontagemDe, desmontagemAte,
          } : {}),
        },
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        await uploadAttachmentToSharePoint({ file, unidade, servico: "Negociação de Mão de Obra", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder });
      }
      toast({ title: "Negociação de Mão de Obra enviada com sucesso!" });
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
      <div className="relative mt-1">
        <Input
          value={value}
          onChange={(e) => onChange(maskDate(e.target.value))}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          inputMode="numeric"
          className="pr-10"
        />
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
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
            Negociação de Mão de Obra · Unidade: {nomeUnidade}
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

          {/* ── Dados da Negociação ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados da Negociação
            </legend>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold">Empreiteiro (Nome) *</Label>
                  <Input value={empreiteiro} onChange={(e) => setEmpreiteiro(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Celular *</Label>
                  <Input value={celular} onChange={(e) => setCelular(maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="mt-1" inputMode="numeric" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Seguimento (tipo de serviço) *</Label>
                  <Input value={seguimento} onChange={(e) => setSeguimento(e.target.value)} className="mt-1" />
                </div>
              </div>

              {/* Montagem toggle */}
              <div>
                <Label className="text-xs font-bold mb-2 block">É uma montagem? *</Label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montagem-sim"
                      checked={isMontagem === true}
                      onCheckedChange={() => setIsMontagem(true)}
                    />
                    <Label htmlFor="montagem-sim" className="text-sm cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montagem-nao"
                      checked={isMontagem === false}
                      onCheckedChange={() => setIsMontagem(false)}
                    />
                    <Label htmlFor="montagem-nao" className="text-sm cursor-pointer">Não</Label>
                  </div>
                </div>
              </div>

              {/* Datas condicionais */}
              {isMontagem && (
                <div className="space-y-4 border-t border-primary/20 pt-4">
                  <div>
                    <Label className="text-xs font-bold text-primary mb-2 block">Data da Montagem</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DateField label="De" value={montagemDe} onChange={setMontagemDe} calOpen={montagemDeCalOpen} setCalOpen={setMontagemDeCalOpen} calDate={montagemDeCalDate} onCalSelect={(d) => handleCalendarSelect(d, setMontagemDeCalDate, setMontagemDe, setMontagemDeCalOpen)} />
                      <DateField label="Até" value={montagemAte} onChange={setMontagemAte} calOpen={montagemAteCalOpen} setCalOpen={setMontagemAteCalOpen} calDate={montagemAteCalDate} onCalSelect={(d) => handleCalendarSelect(d, setMontagemAteCalDate, setMontagemAte, setMontagemAteCalOpen)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-primary mb-2 block">Data da Realização</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DateField label="De" value={realizacaoDe} onChange={setRealizacaoDe} calOpen={realizacaoDeCalOpen} setCalOpen={setRealizacaoDeCalOpen} calDate={realizacaoDeCalDate} onCalSelect={(d) => handleCalendarSelect(d, setRealizacaoDeCalDate, setRealizacaoDe, setRealizacaoDeCalOpen)} />
                      <DateField label="Até" value={realizacaoAte} onChange={setRealizacaoAte} calOpen={realizacaoAteCalOpen} setCalOpen={setRealizacaoAteCalOpen} calDate={realizacaoAteCalDate} onCalSelect={(d) => handleCalendarSelect(d, setRealizacaoAteCalDate, setRealizacaoAte, setRealizacaoAteCalOpen)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-primary mb-2 block">Data da Desmontagem</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DateField label="De" value={desmontagemDe} onChange={setDesmontagemDe} calOpen={desmontagemDeCalOpen} setCalOpen={setDesmontagemDeCalOpen} calDate={desmontagemDeCalDate} onCalSelect={(d) => handleCalendarSelect(d, setDesmontagemDeCalDate, setDesmontagemDe, setDesmontagemDeCalOpen)} />
                      <DateField label="Até" value={desmontagemAte} onChange={setDesmontagemAte} calOpen={desmontagemAteCalOpen} setCalOpen={setDesmontagemAteCalOpen} calDate={desmontagemAteCalDate} onCalSelect={(d) => handleCalendarSelect(d, setDesmontagemAteCalDate, setDesmontagemAte, setDesmontagemAteCalOpen)} />
                    </div>
                  </div>
                </div>
              )}
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

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit">Enviar Solicitação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NegociacaoMaoDeObraForm;
