import { useState, useRef, useCallback } from "react";
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

interface LocacaoVeiculosFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
}

// ── mask helpers ──────────────────────────────────────────────
function maskDate(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

function maskCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCEP(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

// ── CEP lookup via ViaCEP ──────────────────────────────────────
async function fetchCEP(cep: string): Promise<{ logradouro: string; bairro: string; localidade: string; uf: string } | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// ── haversine distance in km ──────────────────────────────────
// We use ViaCEP coordinates via a secondary lookup if available,
// otherwise estimate via lat/lon from ibge code (not available).
// Simple fallback: use straight-line distance between two coordinates.
// Since ViaCEP doesn't provide lat/lon, we'll use the IBGE geocode API.
async function fetchCoords(cep: string): Promise<{ lat: number; lon: number } | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    // Nominatim (OpenStreetMap) — free, no key needed
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=BR&format=json&limit=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.2); // ×1.2 road factor
}

// ── date-field helper ─────────────────────────────────────────
interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  calOpen: boolean;
  setCalOpen: (v: boolean) => void;
  calDate: Date | undefined;
  onCalSelect: (d: Date | undefined) => void;
  required?: boolean;
}

function DateField({ label, value, onChange, calOpen, setCalOpen, calDate, onCalSelect, required }: DateFieldProps) {
  return (
    <div>
      <Label className="text-xs font-bold">{label}{required ? " *" : ""}</Label>
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
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={calDate}
              onSelect={onCalSelect}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────
const LocacaoVeiculosForm = ({ open, onOpenChange, unidade }: LocacaoVeiculosFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  // Dados do Solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Dados da Locação
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  // Data retirada
  const [dataRetirada, setDataRetirada] = useState("");
  const [retiradaCalOpen, setRetiradaCalOpen] = useState(false);
  const [retiradaCalDate, setRetiradaCalDate] = useState<Date | undefined>();

  // Data devolução
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [devolucaoCalOpen, setDevolucaoCalOpen] = useState(false);
  const [devolucaoCalDate, setDevolucaoCalDate] = useState<Date | undefined>();

  // CEP origem
  const [cepOrigem, setCepOrigem] = useState("");
  const [enderecoOrigem, setEnderecoOrigem] = useState("");
  const [coordOrigem, setCoordOrigem] = useState<{ lat: number; lon: number } | null>(null);

  // CEP destino
  const [cepDestino, setCepDestino] = useState("");
  const [enderecoDestino, setEnderecoDestino] = useState("");
  const [coordDestino, setCoordDestino] = useState<{ lat: number; lon: number } | null>(null);

  // KM estimativa
  const [kmIda, setKmIda] = useState("");
  const [kmVolta, setKmVolta] = useState("");
  const [kmTotal, setKmTotal] = useState("");
  const [calculando, setCalculando] = useState(false);

  // Dados do Condutor
  const [nomeCondutor, setNomeCondutor] = useState("");
  const [cnh, setCnh] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");

  // Anexo e obs
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── CEP handlers ──
  const handleCepOrigem = useCallback(async (value: string) => {
    const masked = maskCEP(value);
    setCepOrigem(masked);
    setEnderecoOrigem("");
    setCoordOrigem(null);
    setKmIda(""); setKmVolta(""); setKmTotal("");

    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      const [addr, coords] = await Promise.all([fetchCEP(clean), fetchCoords(clean)]);
      if (addr) {
        setEnderecoOrigem(`${addr.logradouro} - ${addr.bairro} — ${addr.localidade}/${addr.uf}`);
      } else {
        setEnderecoOrigem("CEP não encontrado");
      }
      if (coords) setCoordOrigem(coords);
    }
  }, []);

  const handleCepDestino = useCallback(async (value: string) => {
    const masked = maskCEP(value);
    setCepDestino(masked);
    setEnderecoDestino("");
    setCoordDestino(null);
    setKmIda(""); setKmVolta(""); setKmTotal("");

    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      const [addr, coords] = await Promise.all([fetchCEP(clean), fetchCoords(clean)]);
      if (addr) {
        setEnderecoDestino(`${addr.logradouro} - ${addr.bairro} — ${addr.localidade}/${addr.uf}`);
      } else {
        setEnderecoDestino("CEP não encontrado");
      }
      if (coords) setCoordDestino(coords);
    }
  }, []);

  const handleCalcularKm = async () => {
    let c1 = coordOrigem;
    let c2 = coordDestino;

    // Try to fetch if not yet loaded
    if (!c1) c1 = await fetchCoords(cepOrigem);
    if (!c2) c2 = await fetchCoords(cepDestino);

    if (!c1 || !c2) {
      toast({ title: "Não foi possível calcular a distância. Verifique os CEPs.", variant: "destructive" });
      return;
    }

    setCalculando(true);
    const km = haversineKm(c1.lat, c1.lon, c2.lat, c2.lon);
    setKmIda(`${km} km`);
    setKmVolta(`${km} km`);
    setKmTotal(`${km * 2} km`);
    setCalculando(false);
  };

  // ── date helpers ──
  const makeCalSelect = (
    setVal: (v: string) => void,
    setDate: (d: Date | undefined) => void,
    setOpen: (v: boolean) => void
  ) => (date: Date | undefined) => {
    if (!date) return;
    setDate(date);
    setVal(format(date, "dd/MM/yyyy"));
    setOpen(false);
  };

  // ── file ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAnexoNome(file.name);
  };

  // ── reset ──
  const resetForm = () => {
    setEvento(""); setPrioridade(""); setTipoVeiculo(""); setQuantidade("1");
    setDataRetirada(""); setRetiradaCalDate(undefined);
    setDataDevolucao(""); setDevolucaoCalDate(undefined);
    setCepOrigem(""); setEnderecoOrigem(""); setCoordOrigem(null);
    setCepDestino(""); setEnderecoDestino(""); setCoordDestino(null);
    setKmIda(""); setKmVolta(""); setKmTotal("");
    setNomeCondutor(""); setCnh(""); setCpf(""); setRg("");
    setObservacoes(""); setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── validation ──
  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!tipoVeiculo) { toast({ title: "Selecione o Tipo de Veículo", variant: "destructive" }); return false; }
    const qtd = parseInt(quantidade, 10);
    if (!quantidade || isNaN(qtd) || qtd < 1) { toast({ title: "Informe a Quantidade", variant: "destructive" }); return false; }
    if (dataRetirada.length < 10) { toast({ title: "Informe a Data de Retirada válida", variant: "destructive" }); return false; }
    if (dataDevolucao.length < 10) { toast({ title: "Informe a Data de Devolução válida", variant: "destructive" }); return false; }
    if (cepOrigem.replace(/\D/g, "").length < 8) { toast({ title: "Informe o CEP de Origem válido", variant: "destructive" }); return false; }
    if (cepDestino.replace(/\D/g, "").length < 8) { toast({ title: "Informe o CEP de Destino válido", variant: "destructive" }); return false; }
    if (!nomeCondutor.trim()) { toast({ title: "Informe o Nome do Condutor", variant: "destructive" }); return false; }
    if (!cnh.trim()) { toast({ title: "Informe o Número da CNH", variant: "destructive" }); return false; }
    if (cpf.length < 14) { toast({ title: "CPF inválido (000.000.000-00)", variant: "destructive" }); return false; }
    if (!rg.trim()) { toast({ title: "Informe o RG", variant: "destructive" }); return false; }
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
        dateFolder = await getNextSequentialFolder(unidade, "Locação de Veículos", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      await addSolicitacao({
        tipo: "Locação de Veículos",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: tipoVeiculo,
        unidadeDestino: cepDestino,
        departamentoDestino: enderecoDestino,
        diretorArea: "",
        tipoVaga: quantidade,
        nomeSubstituido: nomeCondutor,
        justificativa: [
          `Tipo de Veículo: ${tipoVeiculo}`,
          `Quantidade: ${quantidade}`,
          `Data de Retirada: ${dataRetirada}`,
          `Data de Devolução: ${dataDevolucao}`,
          `CEP Origem: ${cepOrigem} — ${enderecoOrigem}`,
          `CEP Destino: ${cepDestino} — ${enderecoDestino}`,
          kmIda ? `KM Ida: ${kmIda} | Volta: ${kmVolta} | Total: ${kmTotal}` : "",
          `Condutor: ${nomeCondutor}`,
          `CNH: ${cnh}`,
          `CPF: ${cpf}`,
          `RG: ${rg}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: cnh,
        experiencia: rg,
        conhecimentos: cpf,
        faixaSalarialDe: kmIda,
        faixaSalarialAte: kmTotal,
        tipoContrato: tipoVeiculo,
        horarioDe: dataRetirada,
        horarioAte: dataDevolucao,
        caracteristicas: {},
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Locação de Veículos", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Locação de Veículos enviada com sucesso!" });
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
            Nova Solicitação de Locação de Veículos - Unidade: {nomeUnidade}
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

          {/* ── Dados da Locação ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados da Locação
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Tipo de veículo */}
              <div>
                <Label className="text-xs font-bold">Tipo de veículo *</Label>
                <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Categoria: Carro Sedan">Categoria: Carro Sedan</SelectItem>
                    <SelectItem value="Categoria: Carro Hatch">Categoria: Carro Hatch</SelectItem>
                    <SelectItem value="Categoria: Van">Categoria: Van</SelectItem>
                    <SelectItem value="Categoria: Ônibus">Categoria: Ônibus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div>
                <Label className="text-xs font-bold">Quantidade *</Label>
                <Input
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))}
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="1"
                />
              </div>

              {/* Data de retirada */}
              <DateField
                label="Data da retirada"
                value={dataRetirada}
                onChange={setDataRetirada}
                calOpen={retiradaCalOpen}
                setCalOpen={setRetiradaCalOpen}
                calDate={retiradaCalDate}
                onCalSelect={makeCalSelect(setDataRetirada, setRetiradaCalDate, setRetiradaCalOpen)}
                required
              />

              {/* Data de devolução */}
              <DateField
                label="Data da devolução"
                value={dataDevolucao}
                onChange={setDataDevolucao}
                calOpen={devolucaoCalOpen}
                setCalOpen={setDevolucaoCalOpen}
                calDate={devolucaoCalDate}
                onCalSelect={makeCalSelect(setDataDevolucao, setDevolucaoCalDate, setDevolucaoCalOpen)}
                required
              />
            </div>

            {/* CEPs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-xs font-bold">CEP de origem *</Label>
                <Input
                  value={cepOrigem}
                  onChange={(e) => handleCepOrigem(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  inputMode="numeric"
                  className="mt-1"
                />
                {enderecoOrigem && (
                  <p className={cn("text-xs mt-1", enderecoOrigem === "CEP não encontrado" ? "text-destructive" : "text-muted-foreground")}>
                    {enderecoOrigem}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-bold">CEP de destino *</Label>
                <Input
                  value={cepDestino}
                  onChange={(e) => handleCepDestino(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  inputMode="numeric"
                  className="mt-1"
                />
                {enderecoDestino && (
                  <p className={cn("text-xs mt-1", enderecoDestino === "CEP não encontrado" ? "text-destructive" : "text-muted-foreground")}>
                    {enderecoDestino}
                  </p>
                )}
              </div>
            </div>

            {/* KM estimativa */}
            <div className="mt-4">
              <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-end">
                <div>
                  <Label className="text-xs font-bold">Estimativa de KM (ida)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={kmIda || "—"} readOnly className="bg-muted" />
                    <Button
                      type="button"
                      onClick={handleCalcularKm}
                      disabled={calculando || cepOrigem.replace(/\D/g, "").length < 8 || cepDestino.replace(/\D/g, "").length < 8}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    >
                      {calculando ? "..." : "Calcular"}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold">Volta</Label>
                  <Input value={kmVolta || "—"} readOnly className="bg-muted mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Total</Label>
                  <Input value={kmTotal || "—"} readOnly className="bg-muted mt-1" />
                </div>
              </div>
              <p className="text-xs text-primary/70 mt-1">
                Distância aproximada entre os CEPs (linha reta × 1,2). Sem mapa.
              </p>
            </div>
          </fieldset>

          {/* ── Dados do Condutor ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Condutor
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <Label className="text-xs font-bold">Nome completo *</Label>
                <Input value={nomeCondutor} onChange={(e) => setNomeCondutor(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Número da CNH *</Label>
                <Input
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value.replace(/\D/g, ""))}
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="Somente números"
                />
              </div>
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocacaoVeiculosForm;
