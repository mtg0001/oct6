import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesExcluidas } from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { restaurarSolicitacao, loadSolicitacoesExcluidas, esvaziarLixeira } from "@/stores/solicitacoesStore";
import {
  getChamadosTIExcluidos, ensureChamadosTILoaded, subscribeChamadosTI,
  restaurarChamadoTI, esvaziarLixeiraTI, loadChamadosTI,
} from "@/stores/chamadosTIStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";
import { PrioridadeBadge, sortByPrioridade } from "@/components/forms/PrioridadeSelect";
import { RotateCcw, Trash2, Loader2, Monitor } from "lucide-react";
import { toast } from "sonner";
import { siglaUnidade } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Lixeira = () => {
  const currentUser = useCurrentUser();
  const solicitacoes = useSolicitacoesExcluidas();
  const [chamadosTI, setChamadosTI] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const canDelete = currentUser?.podeExcluirChamado || false;

  useEffect(() => {
    ensureChamadosTILoaded().then(() => setChamadosTI(getChamadosTIExcluidos()));
    return subscribeChamadosTI(() => setChamadosTI(getChamadosTIExcluidos()));
  }, []);

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await esvaziarLixeira();
      await esvaziarLixeiraTI();
      toast.success("Lixeira esvaziada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao esvaziar lixeira: " + err.message);
    } finally {
      setEmptying(false);
    }
  };

  const filteredSol = solicitacoes
    .filter(
      (s) =>
        !busca ||
        s.tipo.toLowerCase().includes(busca.toLowerCase()) ||
        s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
        s.unidade.toLowerCase().includes(busca.toLowerCase())
    )
    .sort(sortByPrioridade);

  const filteredTI = chamadosTI.filter(
    (c) =>
      !busca ||
      c.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      c.solicitanteNome.toLowerCase().includes(busca.toLowerCase()) ||
      c.departamento.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRestore = async (solId: string) => {
    if (!canDelete) { toast.error("Você não tem permissão"); return; }
    setRestoring(solId);
    try {
      await restaurarSolicitacao(solId);
      await loadSolicitacoesExcluidas();
      toast.success("Chamado restaurado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + err.message);
    } finally { setRestoring(null); }
  };

  const handleRestoreTI = async (id: string) => {
    if (!canDelete) { toast.error("Você não tem permissão"); return; }
    setRestoring(id);
    try {
      await restaurarChamadoTI(id);
      await loadChamadosTI();
      toast.success("Chamado TI restaurado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + err.message);
    } finally { setRestoring(null); }
  };

  const totalItems = solicitacoes.length + chamadosTI.length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Lixeira de Chamados</h1>
        <p className="text-sm text-muted-foreground">
          Chamados excluídos são mantidos por 30 dias antes de serem removidos permanentemente.
          {!canDelete && " Você pode apenas visualizar."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Tipo, solicitante, unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        {canDelete && totalItems > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1" disabled={emptying}>
                {emptying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {emptying ? "Esvaziando..." : "Esvaziar Lixeira"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Esvaziar lixeira?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação é irreversível. Todos os <strong>{totalItems}</strong> chamado(s) na lixeira serão removidos permanentemente do banco de dados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Esvaziar permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="solicitacoes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="solicitacoes">Solicitações ({filteredSol.length})</TabsTrigger>
          <TabsTrigger value="ti">Chamados TI ({filteredTI.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitacoes">
          <div className="space-y-3">
            {filteredSol.length === 0 && (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma solicitação na lixeira.</p>
            )}
            {filteredSol.map((sol) => {
              const Icon = getIconForTipo(sol.tipo);
              return (
                <div key={sol.id} className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm opacity-75">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <PrioridadeBadge value={sol.prioridade} />
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block">Data</span>
                      <span className="font-medium">{sol.dataCriacao}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Tipo</span>
                      <span className="font-medium text-xs">{sol.tipo === "CAD" ? "CS" : sol.tipo}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Unidade</span>
                      <Badge variant="outline">{siglaUnidade(sol.unidade)}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Solicitante</span>
                      <span className="font-medium text-xs">{sol.solicitante}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <Button size="sm" variant="outline" className="gap-1" disabled={restoring === sol.id} onClick={() => handleRestore(sol.id)}>
                      <RotateCcw className="h-4 w-4" />
                      {restoring === sol.id ? "Restaurando..." : "Restaurar"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ti">
          <div className="space-y-3">
            {filteredTI.length === 0 && (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhum chamado TI na lixeira.</p>
            )}
            {filteredTI.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm opacity-75">
                <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Data</span>
                    <span className="font-medium">{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Categoria</span>
                    <span className="font-medium text-xs">{c.categoria}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Departamento</span>
                    <Badge variant="outline">{c.departamento}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Solicitante</span>
                    <span className="font-medium text-xs">{c.solicitanteNome}</span>
                  </div>
                </div>
                {canDelete && (
                  <Button size="sm" variant="outline" className="gap-1" disabled={restoring === c.id} onClick={() => handleRestoreTI(c.id)}>
                    <RotateCcw className="h-4 w-4" />
                    {restoring === c.id ? "Restaurando..." : "Restaurar"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Lixeira;
