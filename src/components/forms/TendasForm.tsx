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
import { CalendarIcon, Paperclip, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface TendasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

interface DetalheItem {
  alturaPe: string;
  largura: string;
  comprimento: string;
  lateraisFechadas: string;
}

interface TendaDetalhe {
  id: number;
  tipo: string; // single type selection
  quantidade: number;
  itens: DetalheItem[];
}

function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

const TIPOS_TENDA = ["Tubolar", "Calhada", "Galpão", "Box"];

let nextTendaId = 1;

function criarDetalheVazio(): DetalheItem {
  return { alturaPe: "", largura: "", comprimento: "", lateraisFechadas: "" };
}

function criarTendaVazia(): TendaDetalhe {
  return { id: nextTendaId++, tipo: "", quantidade: 1, itens: [criarDetalheVazio()] };
}

const TendasForm = ({ open, onOpenChange, unidade }: TendasFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

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
  const [submitting, setSubmitting] = useState(false);

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

  const setTipo = (tendaIdx: number, tipo: string) => {
    setTendas((prev) => {
      const copy = [...prev];
      const t = { ...copy[tendaIdx] };
      t.tipo = tipo;
      t.quantidade = 1;
      t.itens = [criarDetalheVazio()];
      copy[tendaIdx] = t;
      return copy;
    });
  };

  const setQuantidade = (tendaIdx: number, qtd: number) => {
    setTendas((prev) => {
      const copy = [...prev];
      const t = { ...copy[tendaIdx] };
      const oldItens = t.itens;
      t.quantidade = qtd;
      // Preserve existing, add new if needed
      const newItens: DetalheItem[] = [];
      for (let i = 0; i < qtd; i++) {
        newItens.push(oldItens[i] || criarDetalheVazio());
      }
      t.itens = newItens;
      copy[tendaIdx] = t;
      return copy;
    });
  };

  const updateItem = (tendaIdx: number, itemIdx: number, field: keyof DetalheItem, value: string) => {
    setTendas((prev) => {
      const copy = [...prev];
      const t = { ...copy[tendaIdx] };
      const itens = [...t.itens];
      itens[itemIdx] = { ...itens[itemIdx], [field]: value };
      t.itens = itens;
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
    const hasAnyTipo = tendas.some((t) => t.tipo !== "");
    if (!hasAnyTipo) { toast({ title: "Selecione ao menos um tipo de tenda", variant: "destructive" }); return false; }
    if (dataEntrega.length < 10) { toast({ title: "Data de entrega inválida", variant: "destructive" }); return false; }
    if (dataRetirada.length < 10) { toast({ title: "Data de retirada inválida", variant: "destructive" }); return false; }
    return true;
  };

  const buildTendasInfo = () => {
    return tendas.filter(t => t.tipo).map((t, i) => {
      const itensInfo = t.itens.map((item, j) =>
        `#${j + 1}: Pé ${item.alturaPe || "—"}m, ${item.largura || "—"}x${item.comprimento || "—"}m, Lat: ${item.lateraisFechadas || "0"}`
      ).join("; ");
      return `Tenda ${i + 1} [${t.tipo} x${t.quantidade}]: ${itensInfo}`;
    }).join(" | ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const allTipos = tendas.filter(t => t.tipo).map(t => t.tipo);
    const tendasInfo = buildTendasInfo();

    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "Tendas", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
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
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: allTipos.join(", "),
        horarioDe: dataEntrega,
        horarioAte: dataRetirada,
        caracteristicas: { tendas: tendas.filter(t => t.tipo).map(t => ({ tipo: t.tipo, quantidade: t.quantidade, itens: t.itens })) } as any,
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Tendas", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Tenda enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
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
            <button type="button" tabIndex={-1} className="shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors">
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

  const DetalheRow = ({ tendaIdx, itemIdx, item, showLabel }: { tendaIdx: number; itemIdx: number; item: DetalheItem; showLabel: boolean }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        {showLabel && <Label className="text-xs font-bold">Altura do pé (m)</Label>}
        <Input
          value={item.alturaPe}
          onChange={(e) => updateItem(tendaIdx, itemIdx, "alturaPe", e.target.value.replace(/[^\d.,]/g, ""))}
          className={showLabel ? "mt-1" : ""}
          placeholder="Ex: 3"
          inputMode="decimal"
        />
      </div>
      <div>
        {showLabel && <Label className="text-xs font-bold">Medida</Label>}
        <div className={cn("flex items-center gap-1", showLabel && "mt-1")}>
          <Input
            value={item.largura}
            onChange={(e) => updateItem(tendaIdx, itemIdx, "largura", e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="Largura (m)"
            inputMode="decimal"
          />
          <span className="text-sm text-muted-foreground font-bold">x</span>
          <Input
            value={item.comprimento}
            onChange={(e) => updateItem(tendaIdx, itemIdx, "comprimento", e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="Comprimento (m)"
            inputMode="decimal"
          />
        </div>
      </div>
      <div>
        {showLabel && <Label className="text-xs font-bold">Qtd. de laterais fechadas</Label>}
        <Input
          value={item.lateraisFechadas}
          onChange={(e) => updateItem(tendaIdx, itemIdx, "lateraisFechadas", e.target.value.replace(/\D/g, ""))}
          className={showLabel ? "mt-1" : ""}
          placeholder="Ex: 2"
          inputMode="numeric"
        />
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
                <PrioridadeSelect value={prioridade} onValueChange={setPrioridade} className="mt-1" />
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

              {/* Radio-style type selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {TIPOS_TENDA.map((tipo) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`tenda-tipo-${tenda.id}`}
                      id={`tenda-${tenda.id}-${tipo}`}
                      checked={tenda.tipo === tipo}
                      onChange={() => setTipo(tendaIdx, tipo)}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                    <Label htmlFor={`tenda-${tenda.id}-${tipo}`} className="text-sm cursor-pointer">{tipo}</Label>
                  </div>
                ))}
              </div>

              {/* Detalhes quando tipo selecionado */}
              {tenda.tipo && (
                <div className="border border-muted rounded-md p-3 mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{tenda.tipo}</p>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold">Quantidade *</Label>
                      <Select value={String(tenda.quantidade)} onValueChange={(v) => setQuantidade(tendaIdx, Number(v))}>
                        <SelectTrigger className="w-20 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {tenda.itens.map((item, itemIdx) => (
                    <div key={itemIdx}>
                      {tenda.quantidade > 1 && (
                        <p className="text-xs text-muted-foreground font-medium mb-1">{tenda.tipo} {itemIdx + 1}</p>
                      )}
                      <DetalheRow
                        tendaIdx={tendaIdx}
                        itemIdx={itemIdx}
                        item={item}
                        showLabel={itemIdx === 0}
                      />
                    </div>
                  ))}
                </div>
              )}
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
                    <button type="button" className="ml-auto text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); setAnexoNome(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground mt-1">Quando necessário, anexe um arquivo.</p>
              </div>
              <div>
                <Label className="text-xs font-bold">Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="mt-1" placeholder="Informações adicionais..." />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Solicitação"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TendasForm;
