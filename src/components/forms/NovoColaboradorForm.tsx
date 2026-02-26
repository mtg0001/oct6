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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface NovoColaboradorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

const diretores = ["Osorio", "Jessica", "Soraya", "Danielle"];

const caracteristicaOptions = ["Aplica", "Não se aplica"];

const caracteristicasGrid = [
  ["Pro atividade", "Foco", "Relacionamento"],
  ["Decisão", "Asseio", "Iniciativa"],
  ["Competitividade", "Ousadia", "Estratégia"],
  ["Agilidade", "Liderança", "Oratória"],
  ["Negociação", "Criatividade", "Serenidade"],
  ["Comunicação", "Organização", "Versatilidade"],
  ["Habilidade", "Simpatia"],
];

function maskCurrency(value: string) {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  const n = parseInt(num, 10) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// Date field component
function DateField({ label, value, onChange, calOpen, setCalOpen, calDate, onCalSelect }: {
  label: string; value: string; onChange: (v: string) => void;
  calOpen: boolean; setCalOpen: (v: boolean) => void;
  calDate: Date | undefined; onCalSelect: (d: Date | undefined) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-bold">{label}</Label>
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
}

const NovoColaboradorForm = ({ open, onOpenChange, unidade }: NovoColaboradorFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  // Dados do Solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Informações da Vaga
  const [cargo, setCargo] = useState("");
  const [unidadeDestino, setUnidadeDestino] = useState("");
  const [departamentoDestino, setDepartamentoDestino] = useState("");
  const [diretorArea, setDiretorArea] = useState("");
  const [tipoVaga, setTipoVaga] = useState("nova");
  const [nomeSubstituido, setNomeSubstituido] = useState("");
  const [justificativa, setJustificativa] = useState("");

  // Requisitos & Condições
  const [formacao, setFormacao] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [conhecimentos, setConhecimentos] = useState("");
  const [faixaDe, setFaixaDe] = useState("");
  const [faixaAte, setFaixaAte] = useState("");
  const [tipoContrato, setTipoContrato] = useState("");
  const [horarioDe, setHorarioDe] = useState("");
  const [horarioAte, setHorarioAte] = useState("");

  // Prazo para contratação
  const [prazoContratacao, setPrazoContratacao] = useState("");
  const [prazoCalOpen, setPrazoCalOpen] = useState(false);
  const [prazoCalDate, setPrazoCalDate] = useState<Date | undefined>();

  // Temporário - datas
  const [tempDe, setTempDe] = useState("");
  const [tempDeCalOpen, setTempDeCalOpen] = useState(false);
  const [tempDeCalDate, setTempDeCalDate] = useState<Date | undefined>();
  const [tempAte, setTempAte] = useState("");
  const [tempAteCalOpen, setTempAteCalOpen] = useState(false);
  const [tempAteCalDate, setTempAteCalDate] = useState<Date | undefined>();

  // Características
  const [caracteristicas, setCaracteristicas] = useState<Record<string, string>>({});

  // Anexos e Observações
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);

  const handleCalSelect = (setDate: (d: Date | undefined) => void, setInput: (v: string) => void, setOpen: (v: boolean) => void) =>
    (date: Date | undefined) => {
      if (!date) return;
      setDate(date);
      setInput(format(date, "dd/MM/yyyy"));
      setOpen(false);
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
        return;
      }
      setAnexoNome(file.name);
    }
  };

  const setCarac = (name: string, value: string) => {
    setCaracteristicas((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEvento(""); setPrioridade(""); setCargo(""); setUnidadeDestino("");
    setDepartamentoDestino(""); setDiretorArea(""); setTipoVaga("nova");
    setNomeSubstituido(""); setJustificativa(""); setFormacao("");
    setExperiencia(""); setConhecimentos(""); setFaixaDe(""); setFaixaAte("");
    setTipoContrato(""); setHorarioDe(""); setHorarioAte("");
    setPrazoContratacao(""); setPrazoCalDate(undefined);
    setTempDe(""); setTempDeCalDate(undefined);
    setTempAte(""); setTempAteCalDate(undefined);
    setCaracteristicas({}); setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!cargo.trim()) { toast({ title: "Informe o Cargo/Posição", variant: "destructive" }); return false; }
    if (!unidadeDestino) { toast({ title: "Selecione a Unidade", variant: "destructive" }); return false; }
    if (!departamentoDestino) { toast({ title: "Selecione o Departamento", variant: "destructive" }); return false; }
    if (!diretorArea) { toast({ title: "Selecione o Diretor da Área", variant: "destructive" }); return false; }
    if (tipoVaga === "substituicao" && !nomeSubstituido.trim()) { toast({ title: "Informe o nome do colaborador substituído", variant: "destructive" }); return false; }
    if (!justificativa.trim()) { toast({ title: "Informe a Justificativa", variant: "destructive" }); return false; }
    if (!formacao) { toast({ title: "Selecione a Formação", variant: "destructive" }); return false; }
    if (!experiencia.trim()) { toast({ title: "Informe a Experiência", variant: "destructive" }); return false; }
    if (!conhecimentos.trim()) { toast({ title: "Informe os Conhecimentos", variant: "destructive" }); return false; }
    if (!faixaDe) { toast({ title: "Informe a Faixa Salarial (De)", variant: "destructive" }); return false; }
    if (!faixaAte) { toast({ title: "Informe a Faixa Salarial (Até)", variant: "destructive" }); return false; }
    if (!tipoContrato) { toast({ title: "Selecione o Tipo de Contrato", variant: "destructive" }); return false; }
    if (!horarioDe) { toast({ title: "Informe o Horário De", variant: "destructive" }); return false; }
    if (!horarioAte) { toast({ title: "Informe o Horário Até", variant: "destructive" }); return false; }
    if (prazoContratacao.length < 10) { toast({ title: "Informe o Prazo para Contratação", variant: "destructive" }); return false; }
    if (tipoContrato === "temporario") {
      if (tempDe.length < 10) { toast({ title: "Informe a data início do contrato temporário", variant: "destructive" }); return false; }
      if (tempAte.length < 10) { toast({ title: "Informe a data fim do contrato temporário", variant: "destructive" }); return false; }
    }
    // Características - all must be filled
    const allCaracs = caracteristicasGrid.flat();
    for (const c of allCaracs) {
      if (!caracteristicas[c]) { toast({ title: `Selecione a característica: ${c}`, variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addSolicitacao({
        tipo: "Novo Colaborador",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo,
        unidadeDestino,
        departamentoDestino,
        diretorArea,
        tipoVaga,
        nomeSubstituido,
        justificativa,
        formacao,
        experiencia,
        conhecimentos,
        faixaSalarialDe: faixaDe,
        faixaSalarialAte: faixaAte,
        tipoContrato,
        horarioDe,
        horarioAte,
        caracteristicas: {
          ...caracteristicas,
          prazoContratacao,
          ...(tipoContrato === "temporario" ? { tempDe, tempAte } : {}),
          ...(anexoNome ? { anexo: anexoNome } : {}),
        },
        observacoes,
      });
      toast({ title: "Solicitação enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Solicitação de Novo Parceiro Comercial - Unidade: {nomeUnidade}
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

          {/* ── Informações da Vaga ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Informações da Vaga
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs font-bold">Nome do Cargo/Posição *</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Unidade *</Label>
                <Select value={unidadeDestino} onValueChange={setUnidadeDestino}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goiania">Goiânia</SelectItem>
                    <SelectItem value="saopaulo">São Paulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Para qual departamento? *</Label>
                <Select value={departamentoDestino} onValueChange={setDepartamentoDestino}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Diretor da Área *</Label>
                <Select value={diretorArea} onValueChange={setDiretorArea}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {diretores.map((d) => (
                      <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-xs font-bold">Tipo da Vaga *</Label>
              <RadioGroup value={tipoVaga} onValueChange={setTipoVaga} className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="nova" id="nova" />
                  <Label htmlFor="nova" className="text-xs cursor-pointer">Nova</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="substituicao" id="substituicao" />
                  <Label htmlFor="substituicao" className="text-xs cursor-pointer">Substituição (informar nome)</Label>
                </div>
              </RadioGroup>
              {tipoVaga === "substituicao" && (
                <Input
                  className="mt-2"
                  placeholder="Nome do colaborador a ser substituído"
                  value={nomeSubstituido}
                  onChange={(e) => setNomeSubstituido(e.target.value)}
                />
              )}
            </div>

            <div className="mt-4">
              <Label className="text-xs font-bold">Justificativa da Abertura *</Label>
              <Textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} className="mt-1" rows={3} />
            </div>
          </fieldset>

          {/* ── Requisitos & Condições ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Requisitos & Condições
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-xs font-bold">Formação *</Label>
                <Select value={formacao} onValueChange={setFormacao}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                    <SelectItem value="medio">Ensino Médio</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="superior">Ensino Superior</SelectItem>
                    <SelectItem value="pos">Pós-Graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Experiência *</Label>
                <Input value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className="mt-1" placeholder="Ex: 2 anos em função similar" />
              </div>
              <div>
                <Label className="text-xs font-bold">Conhecimentos Espec. Necessários *</Label>
                <Input value={conhecimentos} onChange={(e) => setConhecimentos(e.target.value)} className="mt-1" placeholder="Ex: Excel avançado, ERP, etc." />
              </div>
              <div>
                <Label className="text-xs font-bold">Faixa Salarial Proposta — De *</Label>
                <Input
                  value={faixaDe ? `R$ ${faixaDe}` : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setFaixaDe(maskCurrency(raw));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Faixa Salarial Proposta — Até *</Label>
                <Input
                  value={faixaAte ? `R$ ${faixaAte}` : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setFaixaAte(maskCurrency(raw));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Tipo de Contrato *</Label>
                <Select value={tipoContrato} onValueChange={(v) => { setTipoContrato(v); if (v !== "temporario") { setTempDe(""); setTempAte(""); setTempDeCalDate(undefined); setTempAteCalDate(undefined); } }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="temporario">Temporário</SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Horário de Trabalho — De *</Label>
                <Input type="time" value={horarioDe} onChange={(e) => setHorarioDe(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Horário de Trabalho — Até *</Label>
                <Input type="time" value={horarioAte} onChange={(e) => setHorarioAte(e.target.value)} className="mt-1" />
              </div>
              <DateField
                label="Prazo para Contratação *"
                value={prazoContratacao}
                onChange={setPrazoContratacao}
                calOpen={prazoCalOpen}
                setCalOpen={setPrazoCalOpen}
                calDate={prazoCalDate}
                onCalSelect={handleCalSelect(setPrazoCalDate, setPrazoContratacao, setPrazoCalOpen)}
              />
            </div>

            {/* Temporário - período */}
            {tipoContrato === "temporario" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <DateField
                  label="Contrato Temporário — De *"
                  value={tempDe}
                  onChange={setTempDe}
                  calOpen={tempDeCalOpen}
                  setCalOpen={setTempDeCalOpen}
                  calDate={tempDeCalDate}
                  onCalSelect={handleCalSelect(setTempDeCalDate, setTempDe, setTempDeCalOpen)}
                />
                <DateField
                  label="Contrato Temporário — Até *"
                  value={tempAte}
                  onChange={setTempAte}
                  calOpen={tempAteCalOpen}
                  setCalOpen={setTempAteCalOpen}
                  calDate={tempAteCalDate}
                  onCalSelect={handleCalSelect(setTempAteCalDate, setTempAte, setTempAteCalOpen)}
                />
              </div>
            )}
          </fieldset>

          {/* ── Características ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Características
            </legend>
            <div className="space-y-3 mt-2">
              {caracteristicasGrid.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {row.map((carac) => (
                    <div key={carac}>
                      <Label className="text-xs font-bold">{carac} *</Label>
                      <Select value={caracteristicas[carac] || ""} onValueChange={(v) => setCarac(carac, v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {caracteristicaOptions.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase()}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ))}
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

export default NovoColaboradorForm;
