import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Headset, Paperclip, X, Send, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addChamadoTI } from "@/stores/chamadosTIStore";
import { uploadAttachmentToSharePoint, buildStoredFileName, getNextSequentialFolder } from "@/lib/sharepointAttachments";
import { supabase } from "@/integrations/supabase/client";

const URGENCIAS = [
  { value: "baixa", label: "Baixa", color: "bg-green-500 border-green-600" },
  { value: "media", label: "Média", color: "bg-orange-400 border-orange-500" },
  { value: "alta", label: "Alta", color: "bg-red-400 border-red-500" },
  { value: "extrema", label: "Extremamente Alta", color: "bg-red-700 border-red-800" },
] as const;

const CATEGORIAS = [
  "Problema com Windows",
  "Problemas no pacote Office",
  "Permissões de equipes Teams (SharePoint)",
  "Lentidão na internet",
  "Solicitação de equipamentos",
  "Criação de Usuário",
  "Desativar Usuário",
  "Solicitação de Smartphone",
  "Outros",
] as const;

const SUB_WINDOWS = ["Lentidão", "Instalação de programas", "Defeito", "Upgrade", "Outros"];
const SUB_OFFICE = ["Excel", "Word", "PowerPoint", "Outros"];
const SUB_TEAMS = ["Comercial", "Financeiro", "Logística e Compras", "Marketing", "Operacional", "Projetos", "Recursos Humanos"];
const SUB_INTERNET = ["Sem internet", "Site específico", "Todos os sites", "Demorando fazer downloads", "Demorando fazer uploads", "Site Suspeito", "Outros"];
const SUB_EQUIPAMENTOS = ["Kit teclado e mouse", "Teclado", "Mouse", "Tela", "Notebook", "Desktop", "Cabo HDMI", "Cabo VGA", "Mousepad", "Headset", "Suporte p/ Notebook", "Mochila", "Outros"];
const SUB_CRIAR = ["Usuário Windows", "Email"];
const SUB_DESATIVAR = ["Usuário e Email", "Usuário", "Email"];
const SUB_SMARTPHONE = ["Novo", "Troca", "Perda ou Roubo"];

const NEEDS_ANYDESK = ["Problema com Windows", "Lentidão na internet"];

export default function ChamadoTINovo() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoria, setCategoria] = useState("");
  const [subOpcoes, setSubOpcoes] = useState<string[]>([]);
  const [urgencia, setUrgencia] = useState("baixa");
  const [siteEspecifico, setSiteEspecifico] = useState("");
  const [siteSuspeito, setSiteSuspeito] = useState("");
  const [nomeColaborador, setNomeColaborador] = useState("");
  const [cargoColaborador, setCargoColaborador] = useState("");
  const [aprovadoGestor, setAprovadoGestor] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [anydesk, setAnydesk] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);

  const resetSubFields = () => {
    setSubOpcoes([]);
    setSiteEspecifico("");
    setSiteSuspeito("");
    setNomeColaborador("");
    setCargoColaborador("");
    setDataInicio(undefined);
    setAprovadoGestor("");
    setAnydesk("");
  };

  const handleCategoriaChange = (val: string) => {
    setCategoria(val);
    resetSubFields();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo "${f.name}" excede 10MB`);
        return false;
      }
      return true;
    });
    setArquivos(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== idx));
  };

  const getSubOptions = () => {
    switch (categoria) {
      case "Problema com Windows": return SUB_WINDOWS;
      case "Problemas no pacote Office": return SUB_OFFICE;
      case "Permissões de equipes Teams (SharePoint)": return SUB_TEAMS;
      case "Lentidão na internet": return SUB_INTERNET;
      case "Solicitação de equipamentos": return SUB_EQUIPAMENTOS;
      case "Criação de Usuário": return SUB_CRIAR;
      case "Desativar Usuário": return SUB_DESATIVAR;
      case "Solicitação de Smartphone": return SUB_SMARTPHONE;
      default: return [];
    }
  };

  const showAnydesk = NEEDS_ANYDESK.includes(categoria);
  const showSiteField = categoria === "Lentidão na internet" && subOpcoes.includes("Site específico");
  const showSiteSuspeitoField = categoria === "Lentidão na internet" && subOpcoes.includes("Site Suspeito");
  const showAprovadoGestor = categoria === "Permissões de equipes Teams (SharePoint)" && subOpcoes.length > 0;
  const showNomeCargoColaborador = categoria === "Criação de Usuário";

  const toggleSubOpcao = (opt: string) => {
    setSubOpcoes(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria) { toast.error("Selecione uma categoria"); return; }
    if (getSubOptions().length > 0 && subOpcoes.length === 0) { toast.error("Selecione pelo menos uma opção"); return; }
    if (showSiteField && !siteEspecifico.trim()) { toast.error("Digite o site"); return; }
    if (showSiteSuspeitoField && !siteSuspeito.trim()) { toast.error("Digite a URL suspeita"); return; }
    if (showNomeCargoColaborador && !nomeColaborador.trim()) { toast.error("Informe o nome do colaborador"); return; }
    if (showNomeCargoColaborador && !cargoColaborador.trim()) { toast.error("Informe o cargo do colaborador"); return; }
    if (showNomeCargoColaborador && !dataInicio) { toast.error("Informe a data de início"); return; }
    if (showAprovadoGestor && !aprovadoGestor) { toast.error("Informe se foi aprovado pelo gestor"); return; }

    setEnviando(true);
    try {
      const userName = currentUser?.nome || "Desconhecido";

      // Get sequential folder for SharePoint
      let dateFolder: string | undefined;
      let storedFileNames: string[] = [];

      if (arquivos.length > 0) {
        dateFolder = await getNextSequentialFolder("Chamados TI", "Chamados TI", userName);
        storedFileNames = arquivos.map((f) => buildStoredFileName(f.name, dateFolder));

        // Upload to SharePoint (non-blocking per file, but sequential)
        for (const file of arquivos) {
          uploadAttachmentToSharePoint({
            file,
            unidade: "Chamados TI",
            servico: "Chamados TI",
            userName,
            datePasta: dateFolder,
          }).catch((err) => console.error("Erro upload SharePoint:", err));
        }
      }

      const isTeams = categoria === "Permissões de equipes Teams (SharePoint)";

      await addChamadoTI({
        solicitanteId: currentUser?.id || null,
        solicitanteNome: userName,
        departamento: currentUser?.departamento || "",
        categoria,
        subOpcoes,
        siteEspecifico,
        siteSuspeito,
        aprovadoGestor,
        novoColaborador: nomeColaborador ? `${nomeColaborador} | ${cargoColaborador} | Início: ${dataInicio ? format(dataInicio, "dd/MM/yyyy") : ""}` : "",
        anydesk,
        urgencia,
        observacoes,
        anexos: storedFileNames,
        sharepointPasta: dateFolder || "",
        ...(isTeams ? { status: "aguardando_diretoria", diretorAprovacao: "soraya" } : {}),
      });
      toast.success("Chamado aberto com sucesso!");
      navigate("/chamado-ti/pendentes");
    } catch {
      toast.error("Erro ao abrir chamado");
    } finally {
      setEnviando(false);
    }
  };

  const subOptions = getSubOptions();
  const subLabel = (() => {
    switch (categoria) {
      case "Problema com Windows": return "Qual o problema?";
      case "Problemas no pacote Office": return "Qual aplicativo?";
      case "Permissões de equipes Teams (SharePoint)": return "Qual equipe?";
      case "Lentidão na internet": return "Detalhe o problema";
      case "Solicitação de equipamentos": return "Qual equipamento?";
      case "Criação de Usuário": return "O que precisa?";
      case "Desativar Usuário": return "O que desativar?";
      case "Solicitação de Smartphone": return "Tipo de solicitação";
      default: return "Selecione";
    }
  })();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Headset className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Abrir Chamado TI</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo para abrir um novo chamado</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-4 border-b border-border pb-3">Dados do Solicitante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Nome</Label>
                <Input value={currentUser?.nome || ""} disabled className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Departamento</Label>
                <Input value={currentUser?.departamento || ""} disabled className="mt-1 bg-muted/50" />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-4 border-b border-border pb-3">Como podemos te ajudar?</h2>
            
            <div className="space-y-5">
              {/* Main Category */}
              <div>
                <Label className="text-sm font-medium">Categoria do chamado <span className="text-destructive">*</span></Label>
                <Select value={categoria} onValueChange={handleCategoriaChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nome e Cargo do Colaborador (Criação de Usuário) */}
              {showNomeCargoColaborador && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome do colaborador <span className="text-destructive">*</span></Label>
                      <Input
                        value={nomeColaborador}
                        onChange={e => setNomeColaborador(e.target.value)}
                        placeholder="Nome completo"
                        className="mt-1.5"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cargo <span className="text-destructive">*</span></Label>
                      <Input
                        value={cargoColaborador}
                        onChange={e => setCargoColaborador(e.target.value)}
                        placeholder="Cargo do colaborador"
                        className="mt-1.5"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data de início <span className="text-destructive">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full mt-1.5 justify-start text-left font-normal",
                              !dataInicio && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "dd/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dataInicio}
                            onSelect={setDataInicio}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-options */}
              {categoria && subOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">{subLabel} <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {subOptions.map(opt => {
                      const isSelected = subOpcoes.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleSubOpcao(opt)}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 text-left ${
                            isSelected
                              ? "bg-destructive text-destructive-foreground border-destructive shadow-md shadow-destructive/20"
                              : "bg-card border-border text-foreground hover:border-destructive/50 hover:bg-destructive/5"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Site específico field */}
              {showSiteField && (
                <div>
                  <Label className="text-sm font-medium">Digite o site <span className="text-destructive">*</span></Label>
                  <Input
                    value={siteEspecifico}
                    onChange={e => setSiteEspecifico(e.target.value)}
                    placeholder="https://exemplo.com"
                    className="mt-1.5"
                    maxLength={500}
                  />
                </div>
              )}

              {/* Site suspeito field */}
              {showSiteSuspeitoField && (
                <div>
                  <Label className="text-sm font-medium">Digite a URL suspeita <span className="text-destructive">*</span></Label>
                  <Input
                    value={siteSuspeito}
                    onChange={e => setSiteSuspeito(e.target.value)}
                    placeholder="https://site-suspeito.com"
                    className="mt-1.5"
                    maxLength={500}
                  />
                </div>
              )}

              {/* Aprovado pelo gestor (Teams) */}
              {showAprovadoGestor && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm font-medium mb-3 block">Foi aprovado pelo seu Gestor? <span className="text-destructive">*</span></Label>
                  <RadioGroup value={aprovadoGestor} onValueChange={setAprovadoGestor} className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="sim" id="gestor-sim" />
                      <Label htmlFor="gestor-sim" className="cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="nao" id="gestor-nao" />
                      <Label htmlFor="gestor-nao" className="cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Urgência */}
              <div>
                <Label className="text-sm font-medium">Urgência <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {URGENCIAS.map(u => {
                    const isSelected = urgencia === u.value;
                    return (
                      <button
                        key={u.value}
                        type="button"
                        onClick={() => setUrgencia(u.value)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 text-center ${
                          isSelected
                            ? `${u.color} text-white shadow-md`
                            : "bg-card border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AnyDesk */}
              {showAnydesk && (
                <div>
                  <Label className="text-sm font-medium">Número do AnyDesk</Label>
                  <Input
                    value={anydesk}
                    onChange={e => setAnydesk(e.target.value)}
                    placeholder="Ex: 123 456 789"
                    className="mt-1.5"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Necessário para acesso remoto</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-4 border-b border-border pb-3">Detalhes adicionais</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Descreva o problema com mais detalhes..."
                  className="mt-1.5 min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{observacoes.length}/2000</p>
              </div>

              {/* File attachments */}
              <div>
                <Label className="text-sm font-medium">Anexos</Label>
                <p className="text-xs text-muted-foreground mb-2">Fotos ou PDFs (máx. 10MB por arquivo)</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-colors"
                >
                  <Paperclip className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para anexar arquivos</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {arquivos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {arquivos.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-2 text-sm">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1 text-foreground">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviando}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md shadow-destructive/20 gap-2"
            >
              <Send className="h-4 w-4" />
              {enviando ? "Enviando..." : "Abrir Chamado"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
