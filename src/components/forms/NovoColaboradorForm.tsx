import { useState } from "react";
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

const caracteristicasList = [
  "Pro atividade", "Foco", "Relacionamento",
  "Decisão", "Asseio", "Iniciativa",
  "Competitividade", "Ousadia", "Estratégia",
  "Agilidade", "Liderança", "Oratória",
  "Negociação", "Criatividade", "Serenidade",
  "Comunicação", "Organização", "Versatilidade",
  "Habilidade", "Simpatia",
];

const caracteristicasGrid = [
  ["Pro atividade", "Foco", "Relacionamento"],
  ["Decisão", "Asseio", "Iniciativa"],
  ["Competitividade", "Ousadia", "Estratégia"],
  ["Agilidade", "Liderança", "Oratória"],
  ["Negociação", "Criatividade", "Serenidade"],
  ["Comunicação", "Organização", "Versatilidade"],
  ["Habilidade", "Simpatia"],
];

const NovoColaboradorForm = ({ open, onOpenChange, unidade }: NovoColaboradorFormProps) => {
  const currentUser = useCurrentUser();
  const [tipoVaga, setTipoVaga] = useState("nova");
  const [nomeSubstituido, setNomeSubstituido] = useState("");
  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [cargo, setCargo] = useState("");
  const [unidadeDestino, setUnidadeDestino] = useState("");
  const [departamentoDestino, setDepartamentoDestino] = useState("");
  const [diretorArea, setDiretorArea] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [formacao, setFormacao] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [conhecimentos, setConhecimentos] = useState("");
  const [faixaDe, setFaixaDe] = useState("");
  const [faixaAte, setFaixaAte] = useState("");
  const [tipoContrato, setTipoContrato] = useState("");
  const [horarioDe, setHorarioDe] = useState("");
  const [horarioAte, setHorarioAte] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [caracteristicas, setCaracteristicas] = useState<Record<string, string>>({});

  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";

  const resetForm = () => {
    setTipoVaga("nova");
    setNomeSubstituido("");
    setEvento("");
    setPrioridade("");
    setCargo("");
    setUnidadeDestino("");
    setDepartamentoDestino("");
    setDiretorArea("");
    setJustificativa("");
    setFormacao("");
    setExperiencia("");
    setConhecimentos("");
    setFaixaDe("");
    setFaixaAte("");
    setTipoContrato("");
    setHorarioDe("");
    setHorarioAte("");
    setObservacoes("");
    setCaracteristicas({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diretorArea) {
      toast({ title: "Selecione o Diretor da Área", variant: "destructive" });
      return;
    }
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
        caracteristicas,
        observacoes,
      });
      toast({ title: "Solicitação enviada com sucesso!" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    }
  };

  const setCarac = (name: string, value: string) => {
    setCaracteristicas((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold bg-primary text-primary-foreground px-4 py-2 rounded-t-md -mx-6 -mt-6 mb-2">
            Solicitação de Novo Parceiro Comercial - Unidade: {nomeUnidade}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Solicitante */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2">Dados do Solicitante</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold">Evento</Label>
                <Input value={evento} onChange={(e) => setEvento(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Departamento</Label>
                <Input defaultValue="Tecnologia Da Informação" className="mt-1 bg-muted" readOnly />
              </div>
              <div>
                <Label className="text-xs font-bold">Solicitante</Label>
                <Input defaultValue="Admin Octarte" className="mt-1 bg-muted" readOnly />
              </div>
              <div>
                <Label className="text-xs font-bold">Prioridade</Label>
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

          {/* Informações da Vaga */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2">Informações da Vaga</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold">Nome do Cargo/Posição</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Unidade</Label>
                <Select value={unidadeDestino} onValueChange={setUnidadeDestino}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goiania">Goiânia</SelectItem>
                    <SelectItem value="saopaulo">São Paulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Para qual departamento?</Label>
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
                <Label className="text-xs font-bold">Diretor da Área</Label>
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
              <Label className="text-xs font-bold">Tipo da Vaga</Label>
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

          {/* Requisitos & Condições */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2">Requisitos & Condições</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold">Formação</Label>
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
                <Label className="text-xs font-bold">Experiência</Label>
                <Input value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className="mt-1" placeholder="Ex: 2 anos em função similar" />
              </div>
              <div>
                <Label className="text-xs font-bold">Conhecimentos Espec. Necessários</Label>
                <Input value={conhecimentos} onChange={(e) => setConhecimentos(e.target.value)} className="mt-1" placeholder="Ex: Excel avançado, ERP, etc." />
              </div>
              <div>
                <Label className="text-xs font-bold">Faixa Salarial Proposta — De</Label>
                <Input value={faixaDe} onChange={(e) => setFaixaDe(e.target.value)} className="mt-1" placeholder="R$ 0,00" />
              </div>
              <div>
                <Label className="text-xs font-bold">Faixa Salarial Proposta — Até</Label>
                <Input value={faixaAte} onChange={(e) => setFaixaAte(e.target.value)} className="mt-1" placeholder="R$ 0,00" />
              </div>
              <div>
                <Label className="text-xs font-bold">Tipo de Contrato</Label>
                <Select value={tipoContrato} onValueChange={setTipoContrato}>
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
                <Label className="text-xs font-bold">Horário de Trabalho — De</Label>
                <Input type="time" value={horarioDe} onChange={(e) => setHorarioDe(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold">Horário de Trabalho — Até</Label>
                <Input type="time" value={horarioAte} onChange={(e) => setHorarioAte(e.target.value)} className="mt-1" />
              </div>
            </div>
          </fieldset>

          {/* Características */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2">Características</legend>
            <div className="space-y-3">
              {caracteristicasGrid.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {row.map((carac) => (
                    <div key={carac}>
                      <Label className="text-xs font-bold">{carac}</Label>
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

          {/* Observações */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold text-primary px-2">Observações</legend>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} />
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
