import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEPARTAMENTOS,
  UNIDADES,
  SERVICOS_SOLICITACAO,
  DIRETORES,
  type Usuario,
  addUsuario,
  updateUsuario,
} from "@/stores/usuariosStore";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
}

const emptyForm = {
  nome: "",
  email: "",
  departamento: "",
  unidadePadrao: "",
  administrador: false,
  novaSolicitacaoUnidades: [] as string[],
  resolveExpedicao: false,
  resolveLogisticaCompras: false,
  resolveRecursosHumanos: false,
  diretoria: [] as string[],
  servicosPermitidos: [] as string[],
  visualizaSolicitacoesUnidades: [] as string[],
};

export default function UsuarioFormDialog({ open, onOpenChange, usuario }: Props) {
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        departamento: usuario.departamento,
        unidadePadrao: usuario.unidadePadrao,
        administrador: usuario.administrador,
        novaSolicitacaoUnidades: [...usuario.novaSolicitacaoUnidades],
        resolveExpedicao: usuario.resolveExpedicao,
        resolveLogisticaCompras: usuario.resolveLogisticaCompras,
        resolveRecursosHumanos: usuario.resolveRecursosHumanos,
        diretoria: [...usuario.diretoria],
        servicosPermitidos: [...usuario.servicosPermitidos],
        visualizaSolicitacoesUnidades: [...(usuario.visualizaSolicitacoesUnidades || [])],
      });
    } else {
      setForm(emptyForm);
    }
  }, [usuario, open]);

  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.departamento || !form.unidadePadrao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      if (usuario) {
        const data: Partial<Usuario> = {
          nome: form.nome,
          email: form.email,
          departamento: form.departamento,
          unidadePadrao: form.unidadePadrao,
          administrador: form.administrador,
          novaSolicitacaoUnidades: form.novaSolicitacaoUnidades,
          resolveExpedicao: form.resolveExpedicao,
          resolveLogisticaCompras: form.resolveLogisticaCompras,
          resolveRecursosHumanos: form.resolveRecursosHumanos,
          diretoria: form.diretoria,
          servicosPermitidos: form.servicosPermitidos,
          visualizaSolicitacoesUnidades: form.visualizaSolicitacoesUnidades,
        };
        await updateUsuario(usuario.id, data);
        toast({ title: "Usuário atualizado com sucesso!" });
      } else {
        await addUsuario({
          nome: form.nome,
          email: form.email,
          departamento: form.departamento,
          unidadePadrao: form.unidadePadrao,
          ativo: true,
          userId: null,
          administrador: form.administrador,
          novaSolicitacaoUnidades: form.novaSolicitacaoUnidades,
          resolveExpedicao: form.resolveExpedicao,
          resolveLogisticaCompras: form.resolveLogisticaCompras,
          resolveRecursosHumanos: form.resolveRecursosHumanos,
          diretoria: form.diretoria,
          servicosPermitidos: form.servicosPermitidos,
          visualizaSolicitacoesUnidades: form.visualizaSolicitacoesUnidades,
        });
        toast({ title: "Usuário criado com sucesso!" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar usuário", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{usuario ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Departamento *</Label>
                <Select value={form.departamento} onValueChange={(v) => setForm({ ...form, departamento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unidade Padrão *</Label>
                <Select value={form.unidadePadrao} onValueChange={(v) => setForm({ ...form, unidadePadrao: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              A autenticação é gerenciada pelo Supabase Auth. O usuário precisa se cadastrar com o mesmo email acima.
            </p>

            {/* Permissões */}
            <div className="border-t border-border pt-4 space-y-4">
              <h3 className="font-semibold text-foreground">Permissões</h3>

              {/* Admin */}
              <div className="flex items-center gap-4">
                <Label className="min-w-[140px]">Administrador?</Label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={form.administrador} onChange={() => setForm({ ...form, administrador: true })} /> Sim
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={!form.administrador} onChange={() => setForm({ ...form, administrador: false })} /> Não
                </label>
              </div>

              {/* Nova Solicitação */}
              <div>
                <Label>Pode criar Nova Solicitação:</Label>
                <div className="flex items-center gap-4 mt-1">
                  {UNIDADES.map((u) => (
                    <label key={u} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.novaSolicitacaoUnidades.includes(u)}
                        onCheckedChange={() => setForm({ ...form, novaSolicitacaoUnidades: toggleArray(form.novaSolicitacaoUnidades, u) })}
                      />
                      {u}
                    </label>
                  ))}
                </div>
              </div>

              {/* Resolve */}
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <span className="min-w-[280px]">Resolve Solicitações Expedição:</span>
                  <input type="radio" checked={form.resolveExpedicao} onChange={() => setForm({ ...form, resolveExpedicao: true })} /> <span>Sim</span>
                  <input type="radio" checked={!form.resolveExpedicao} onChange={() => setForm({ ...form, resolveExpedicao: false })} /> <span>Não</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="min-w-[280px]">Resolve Solicitações Logística e Compras:</span>
                  <input type="radio" checked={form.resolveLogisticaCompras} onChange={() => setForm({ ...form, resolveLogisticaCompras: true })} /> <span>Sim</span>
                  <input type="radio" checked={!form.resolveLogisticaCompras} onChange={() => setForm({ ...form, resolveLogisticaCompras: false })} /> <span>Não</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="min-w-[280px]">Resolve Solicitações Recursos Humanos:</span>
                  <input type="radio" checked={form.resolveRecursosHumanos} onChange={() => setForm({ ...form, resolveRecursosHumanos: true })} /> <span>Sim</span>
                  <input type="radio" checked={!form.resolveRecursosHumanos} onChange={() => setForm({ ...form, resolveRecursosHumanos: false })} /> <span>Não</span>
                </label>
              </div>

              {/* Visualiza Todas Solicitações */}
              <label className="flex items-center gap-2 text-sm">
                <span className="min-w-[280px]">Visualiza Todas Solicitações:</span>
                <input type="radio" checked={form.visualizaSolicitacoesUnidades.length > 0} onChange={() => setForm({ ...form, visualizaSolicitacoesUnidades: ["GOIÂNIA"] })} /> <span>Sim</span>
                <input type="radio" checked={form.visualizaSolicitacoesUnidades.length === 0} onChange={() => setForm({ ...form, visualizaSolicitacoesUnidades: [] })} /> <span>Não</span>
              </label>
              {form.visualizaSolicitacoesUnidades.length > 0 && (
                <div className="flex items-center gap-4 ml-4">
                  {UNIDADES.map((u) => (
                    <label key={u} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.visualizaSolicitacoesUnidades.includes(u)}
                        onCheckedChange={() => setForm({ ...form, visualizaSolicitacoesUnidades: toggleArray(form.visualizaSolicitacoesUnidades, u) })}
                      />
                      {u}
                    </label>
                  ))}
                </div>
              )}

              {/* Diretoria */}
              <div>
                <Label>Diretoria (submenus visíveis):</Label>
                <div className="flex items-center gap-4 mt-1">
                  {DIRETORES.map((d) => (
                    <label key={d} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.diretoria.includes(d)}
                        onCheckedChange={() => setForm({ ...form, diretoria: toggleArray(form.diretoria, d) })}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              {/* Serviços */}
              <div>
                <Label>Serviços que o usuário pode solicitar:</Label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {SERVICOS_SOLICITACAO.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.servicosPermitidos.includes(s)}
                        onCheckedChange={() => setForm({ ...form, servicosPermitidos: toggleArray(form.servicosPermitidos, s) })}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>{usuario ? "Salvar" : "Criar Usuário"}</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
