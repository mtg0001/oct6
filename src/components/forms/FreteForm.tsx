import { useState, useRef, useEffect } from "react";
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

interface FreteFormProps {
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

const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" }, { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" }, { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" }, { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" }, { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" }, { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" }, { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

function useCidadesIBGE(uf: string) {
  const [cidades, setCidades] = useState<string[]>([]);
  useEffect(() => {
    if (!uf) { setCidades([]); return; }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: any[]) => setCidades(data.map((c) => c.nome)))
      .catch(() => setCidades([]));
  }, [uf]);
  return cidades;
}

const FreteForm = ({ open, onOpenChange, unidade }: FreteFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;

  // Solicitante
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");

  // Veículo
  const [qtdVeiculos, setQtdVeiculos] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [tipoCarroceria, setTipoCarroceria] = useState("");
  const [tamanhoMinimo, setTamanhoMinimo] = useState("");
  const [estimativaPeso, setEstimativaPeso] = useState("");

  // Origem
  const [origemUF, setOrigemUF] = useState("");
  const [origemCidade, setOrigemCidade] = useState("");
  const cidadesOrigem = useCidadesIBGE(origemUF);

  // Destino
  const [destinoUF, setDestinoUF] = useState("");
  const [destinoCidade, setDestinoCidade] = useState("");
  const cidadesDestino = useCidadesIBGE(destinoUF);

  // Datas
  const [dataCarga, setDataCarga] = useState("");
  const [dataCargaCal, setDataCargaCal] = useState<Date | undefined>();
  const [dataCargaOpen, setDataCargaOpen] = useState(false);
  const [dataDescarga, setDataDescarga] = useState("");
  const [dataDescargaCal, setDataDescargaCal] = useState<Date | undefined>();
  const [dataDescargaOpen, setDataDescargaOpen] = useState(false);

  // Ponto Octarte
  const [pontoOctarte, setPontoOctarte] = useState(false);
  const [octarteColeta, setOctarteColeta] = useState(false);
  const [octarteEntrega, setOctarteEntrega] = useState(false);
  const [octarteColetaUnidade, setOctarteColetaUnidade] = useState("");
  const [octarteEntregaUnidade, setOctarteEntregaUnidade] = useState("");

  // Anexo / Obs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const handleCalendarSelect = (
    date: Date | undefined,
    setCal: (d: Date | undefined) => void,
    setInput: (v: string) => void,
    setOpen: (v: boolean) => void
  ) => {
    if (!date) return;
    setCal(date);
    setInput(format(date, "dd/MM/yyyy"));
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAnexoNome(file.name);
  };

  const resetForm = () => {
    setEvento(""); setPrioridade("");
    setQtdVeiculos(""); setTipoVeiculo(""); setTipoCarroceria("");
    setTamanhoMinimo(""); setEstimativaPeso("");
    setOrigemUF(""); setOrigemCidade(""); setDestinoUF(""); setDestinoCidade("");
    setDataCarga(""); setDataCargaCal(undefined);
    setDataDescarga(""); setDataDescargaCal(undefined);
    setPontoOctarte(false); setOctarteColeta(false); setOctarteEntrega(false);
    setOctarteColetaUnidade(""); setOctarteEntregaUnidade("");
    setAnexoNome(null); setObservacoes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }
    if (!qtdVeiculos) { toast({ title: "Informe a Quantidade de Veículos", variant: "destructive" }); return false; }
    if (!tipoVeiculo.trim()) { toast({ title: "Informe o Tipo de Veículo", variant: "destructive" }); return false; }
    if (!tipoCarroceria.trim()) { toast({ title: "Informe o Tipo de Carroceria", variant: "destructive" }); return false; }
    if (!tamanhoMinimo) { toast({ title: "Informe o Tamanho Mínimo", variant: "destructive" }); return false; }
    if (!estimativaPeso) { toast({ title: "Informe a Estimativa de Peso", variant: "destructive" }); return false; }
    if (!origemUF || !origemCidade) { toast({ title: "Selecione o Local de Origem (Estado e Cidade)", variant: "destructive" }); return false; }
    if (!destinoUF || !destinoCidade) { toast({ title: "Selecione o Local de Destino (Estado e Cidade)", variant: "destructive" }); return false; }
    if (dataCarga.length < 10) { toast({ title: "Data de Carga inválida", variant: "destructive" }); return false; }
    if (dataDescarga.length < 10) { toast({ title: "Data de Descarga inválida", variant: "destructive" }); return false; }
    if (pontoOctarte && !octarteColeta && !octarteEntrega) { toast({ title: "Selecione Coleta e/ou Entrega", variant: "destructive" }); return false; }
    if (pontoOctarte && octarteColeta && !octarteColetaUnidade) { toast({ title: "Selecione a unidade Octarte para Coleta", variant: "destructive" }); return false; }
    if (pontoOctarte && octarteEntrega && !octarteEntregaUnidade) { toast({ title: "Selecione a unidade Octarte para Entrega", variant: "destructive" }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const octarteInfo = pontoOctarte
      ? [
          octarteColeta && `Coleta: ${octarteColetaUnidade}`,
          octarteEntrega && `Entrega: ${octarteEntregaUnidade}`,
        ].filter(Boolean).join(" | ")
      : "Não";

    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      let storedAnexo = anexoNome;
      let dateFolder: string | undefined;
      if (file && anexoNome) {
        dateFolder = await getNextSequentialFolder(unidade, "Frete", currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      await addSolicitacao({
        tipo: "Frete",
        solicitanteId: currentUser?.id || "",
        unidade,
        evento,
        departamento: currentUser?.departamento || "—",
        solicitante: currentUser?.nome || "—",
        prioridade,
        cargo: "",
        unidadeDestino: `${destinoCidade} - ${destinoUF}`,
        departamentoDestino: "",
        diretorArea: "",
        tipoVaga: "",
        nomeSubstituido: "",
        justificativa: [
          `Qtd Veículos: ${qtdVeiculos}`,
          `Tipo: ${tipoVeiculo}`,
          `Carroceria: ${tipoCarroceria}`,
          `Tam. Mínimo: ${tamanhoMinimo} mt`,
          `Peso Est.: ${estimativaPeso} kg`,
          `Origem: ${origemCidade}/${origemUF}`,
          `Destino: ${destinoCidade}/${destinoUF}`,
          `Data Carga: ${dataCarga}`,
          `Data Descarga: ${dataDescarga}`,
          `Ponto Octarte: ${octarteInfo}`,
          storedAnexo ? `Anexo: ${storedAnexo}` : "",
        ].filter(Boolean).join(" | "),
        formacao: "",
        experiencia: "",
        conhecimentos: "",
        faixaSalarialDe: "",
        faixaSalarialAte: "",
        tipoContrato: "",
        horarioDe: dataCarga,
        horarioAte: dataDescarga,
        caracteristicas: {
          qtdVeiculos,
          tipoVeiculo,
          tipoCarroceria,
          tamanhoMinimo,
          estimativaPeso,
          origemUF,
          origemCidade,
          destinoUF,
          destinoCidade,
          pontoOctarte: octarteInfo,
        },
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: "Frete", userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: "Solicitação de Frete enviada com sucesso!" });
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
      <Label className="text-xs font-bold">{label}</Label>
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
            <button type="button" className="shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors">
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
            Nova Solicitação de Frete - Unidade: {nomeUnidade}
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

          {/* ── Dados do Frete ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Dados do Frete
            </legend>
            <div className="mt-3 space-y-4">
              {/* Veículo info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold">Quantidade de Veículos *</Label>
                  <Input
                    value={qtdVeiculos}
                    onChange={(e) => setQtdVeiculos(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 2"
                    className="mt-1"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Tipo *</Label>
                  <Input
                    value={tipoVeiculo}
                    onChange={(e) => setTipoVeiculo(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
                    placeholder="Ex: Truck"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Tipo de Carroceria *</Label>
                  <Input
                    value={tipoCarroceria}
                    onChange={(e) => setTipoCarroceria(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
                    placeholder="Ex: Baú"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Tamanho Mínimo *</Label>
                  <div className="relative mt-1">
                    <Input
                      value={tamanhoMinimo}
                      onChange={(e) => setTamanhoMinimo(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 12"
                      inputMode="numeric"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">mt</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold">Estimativa de Peso *</Label>
                  <div className="relative mt-1">
                    <Input
                      value={estimativaPeso}
                      onChange={(e) => setEstimativaPeso(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 5000"
                      inputMode="numeric"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">kg</span>
                  </div>
                </div>
              </div>

              {/* Origem */}
              <div>
                <p className="text-xs font-bold text-primary mb-2">Local de Origem *</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Estado</Label>
                    <Select value={origemUF} onValueChange={(v) => { setOrigemUF(v); setOrigemCidade(""); }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o estado..." /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((e) => (
                          <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Cidade</Label>
                    <Select value={origemCidade} onValueChange={setOrigemCidade} disabled={!origemUF}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={origemUF ? "Selecione a cidade..." : "Selecione o estado primeiro"} /></SelectTrigger>
                      <SelectContent>
                        {cidadesOrigem.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div>
                <p className="text-xs font-bold text-primary mb-2">Local de Destino *</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Estado</Label>
                    <Select value={destinoUF} onValueChange={(v) => { setDestinoUF(v); setDestinoCidade(""); }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o estado..." /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((e) => (
                          <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Cidade</Label>
                    <Select value={destinoCidade} onValueChange={setDestinoCidade} disabled={!destinoUF}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={destinoUF ? "Selecione a cidade..." : "Selecione o estado primeiro"} /></SelectTrigger>
                      <SelectContent>
                        {cidadesDestino.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateField
                  label="Data de Carga *"
                  value={dataCarga}
                  onChange={setDataCarga}
                  calOpen={dataCargaOpen}
                  setCalOpen={setDataCargaOpen}
                  calDate={dataCargaCal}
                  onCalSelect={(d) => handleCalendarSelect(d, setDataCargaCal, setDataCarga, setDataCargaOpen)}
                />
                <DateField
                  label="Data de Descarga *"
                  value={dataDescarga}
                  onChange={setDataDescarga}
                  calOpen={dataDescargaOpen}
                  setCalOpen={setDataDescargaOpen}
                  calDate={dataDescargaCal}
                  onCalSelect={(d) => handleCalendarSelect(d, setDataDescargaCal, setDataDescarga, setDataDescargaOpen)}
                />
              </div>

              {/* Ponto Octarte */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pontoOctarte"
                    checked={pontoOctarte}
                    onCheckedChange={(v) => {
                      const checked = v === true;
                      setPontoOctarte(checked);
                      if (!checked) { setOctarteColeta(false); setOctarteEntrega(false); setOctarteColetaUnidade(""); setOctarteEntregaUnidade(""); }
                    }}
                  />
                  <Label htmlFor="pontoOctarte" className="text-xs font-bold cursor-pointer">
                    Ponto de coleta/entrega é na Octarte?
                  </Label>
                </div>

                {pontoOctarte && (
                  <div className="ml-6 space-y-3">
                    {/* Coleta */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="octColeta" checked={octarteColeta} onCheckedChange={(v) => { setOctarteColeta(v === true); if (!v) setOctarteColetaUnidade(""); }} />
                        <Label htmlFor="octColeta" className="text-xs font-bold cursor-pointer">Coleta</Label>
                      </div>
                      {octarteColeta && (
                        <div className="flex items-center gap-4 ml-6 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Checkbox id="coletaGyn" checked={octarteColetaUnidade === "Octarte Goiânia"} onCheckedChange={() => setOctarteColetaUnidade("Octarte Goiânia")} />
                            <Label htmlFor="coletaGyn" className="text-xs cursor-pointer">Octarte Goiânia</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="coletaMairipora" checked={octarteColetaUnidade === "Octarte Mairiporã"} onCheckedChange={() => setOctarteColetaUnidade("Octarte Mairiporã")} />
                            <Label htmlFor="coletaMairipora" className="text-xs cursor-pointer">Octarte Mairiporã</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="coletaPinheiros" checked={octarteColetaUnidade === "Octarte Pinheiros"} onCheckedChange={() => setOctarteColetaUnidade("Octarte Pinheiros")} />
                            <Label htmlFor="coletaPinheiros" className="text-xs cursor-pointer">Octarte Pinheiros</Label>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Entrega */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="octEntrega" checked={octarteEntrega} onCheckedChange={(v) => { setOctarteEntrega(v === true); if (!v) setOctarteEntregaUnidade(""); }} />
                        <Label htmlFor="octEntrega" className="text-xs font-bold cursor-pointer">Entrega</Label>
                      </div>
                      {octarteEntrega && (
                        <div className="flex items-center gap-4 ml-6 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Checkbox id="entregaGyn" checked={octarteEntregaUnidade === "Octarte Goiânia"} onCheckedChange={() => setOctarteEntregaUnidade("Octarte Goiânia")} />
                            <Label htmlFor="entregaGyn" className="text-xs cursor-pointer">Octarte Goiânia</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="entregaMairipora" checked={octarteEntregaUnidade === "Octarte Mairiporã"} onCheckedChange={() => setOctarteEntregaUnidade("Octarte Mairiporã")} />
                            <Label htmlFor="entregaMairipora" className="text-xs cursor-pointer">Octarte Mairiporã</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="entregaPinheiros" checked={octarteEntregaUnidade === "Octarte Pinheiros"} onCheckedChange={() => setOctarteEntregaUnidade("Octarte Pinheiros")} />
                            <Label htmlFor="entregaPinheiros" className="text-xs cursor-pointer">Octarte Pinheiros</Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

export default FreteForm;
