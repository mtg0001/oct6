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
import { Plus, X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSolicitacao } from "@/stores/solicitacoesStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useUsuarios";

interface MateriaisFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: string;
  tipo: "Materiais (Compras)" | "Materiais (Expedição)" | "Materiais de Escritório" | "Uniformes e EPI" | "CAD";
}

interface ItemMaterial {
  id: number;
  quantidade: string;
  unidadeMedida: string;
  descricao: string;
  tamanho: string;
}

let itemIdCounter = 1;

const MateriaisForm = ({ open, onOpenChange, unidade, tipo }: MateriaisFormProps) => {
  const currentUser = useCurrentUser();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade] || unidade;
  const tituloMap: Record<string, string> = {
    "Materiais (Compras)": "Solicitação de Compras",
    "Materiais (Expedição)": "Solicitação de Materiais (Expedição)",
    "Materiais de Escritório": "Solicitação de Materiais de Escritório",
    "Uniformes e EPI": "Solicitação de Uniformes e EPI",
  };
  const tituloForm = tituloMap[tipo] || `Solicitação de ${tipo}`;
  const isUniformes = tipo === "Uniformes e EPI";

  const [evento, setEvento] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [itens, setItens] = useState<ItemMaterial[]>([
    { id: itemIdCounter++, quantidade: "", unidadeMedida: "", descricao: "", tamanho: "" },
  ]);
  const [observacoes, setObservacoes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anexoNome, setAnexoNome] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItens((prev) => [...prev, { id: itemIdCounter++, quantidade: "", unidadeMedida: "", descricao: "", tamanho: "" }]);
  };

  const removeItem = (id: number) => {
    if (itens.length <= 1) {
      toast({ title: "É necessário ao menos um item", variant: "destructive" });
      return;
    }
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof Omit<ItemMaterial, "id">, value: string) => {
    setItens((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
    setItens([{ id: itemIdCounter++, quantidade: "", unidadeMedida: "", descricao: "", tamanho: "" }]);
    setObservacoes("");
    setAnexoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    if (!evento.trim()) { toast({ title: "Informe o Evento", variant: "destructive" }); return false; }
    if (!prioridade) { toast({ title: "Selecione a Prioridade", variant: "destructive" }); return false; }

    if (isUniformes) {
      for (let i = 0; i < itens.length; i++) {
        if (!itens[i].tamanho.trim()) { toast({ title: `Item ${i + 1}: informe o tamanho`, variant: "destructive" }); return false; }
      }
    }

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      if (!item.quantidade.trim()) { toast({ title: `Item ${i + 1}: informe a quantidade`, variant: "destructive" }); return false; }
      if (!item.unidadeMedida.trim()) { toast({ title: `Item ${i + 1}: informe a unidade de medida`, variant: "destructive" }); return false; }
      if (!item.descricao.trim()) { toast({ title: `Item ${i + 1}: informe a descrição`, variant: "destructive" }); return false; }
    }
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
        dateFolder = await getNextSequentialFolder(unidade, tipo, currentUser?.nome || "Desconhecido");
        storedAnexo = buildStoredFileName(anexoNome, dateFolder);
      }
      const itensTexto = itens.map((item, i) => {
        const base = `${i + 1}) ${item.quantidade} ${item.unidadeMedida} - ${item.descricao}`;
        return isUniformes && item.tamanho ? `${base} (Tam: ${item.tamanho})` : base;
      }).join("; ");

      const caracteristicas: Record<string, any> = { itens: itensTexto };

      await addSolicitacao({
        tipo,
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
          `Itens: ${itensTexto}`,
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
        caracteristicas,
        observacoes,
      });
      if (file && storedAnexo && dateFolder) {
        uploadAttachmentToSharePoint({ file, unidade, servico: tipo, userName: currentUser?.nome || "Desconhecido", datePasta: dateFolder }).catch(() => {});
      }
      toast({ title: `${tituloForm} enviada com sucesso!` });
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
            {tituloForm} · Unidade: {nomeUnidade}
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

          {/* ── Itens ── */}
          <fieldset className="border border-primary/30 rounded-md p-4">
            <legend className="text-sm font-bold bg-primary text-primary-foreground rounded px-3 py-0.5">
              Itens
            </legend>
            <div className="mt-3 space-y-3">
              {itens.map((item) => (
                <div key={item.id} className="border border-border rounded-md p-3">
                  <div className={cn("grid gap-3", isUniformes ? "grid-cols-[1fr_1fr_2fr_1fr]" : "grid-cols-[1fr_1fr_2fr]")}>
                    <div>
                      <Label className="text-xs font-bold">Quantidade</Label>
                      <Input
                        value={item.quantidade}
                        onChange={(e) => updateItem(item.id, "quantidade", e.target.value)}
                        className="mt-1"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Unidade de medida</Label>
                      <Select value={item.unidadeMedida} onValueChange={(v) => updateItem(item.id, "unidadeMedida", v)}>
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
                      <Label className="text-xs font-bold">Descrição do item</Label>
                      <Input
                        value={item.descricao}
                        onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {isUniformes && (
                      <div>
                        <Label className="text-xs font-bold">Tamanho *</Label>
                        <Input
                          value={item.tamanho}
                          onChange={(e) => updateItem(item.id, "tamanho", e.target.value)}
                          className="mt-1"
                          placeholder="Ex: M, 42..."
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  </div>
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
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar" className="hidden" onChange={handleFileChange} />
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

export default MateriaisForm;
