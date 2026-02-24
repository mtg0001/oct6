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
  updateUsuario,
  loadUsuarios,
} from "@/stores/usuariosStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

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

function validatePassword(pw: string) {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(pw)) errors.push("Uma letra maiúscula");
  if (!/[a-z]/.test(pw)) errors.push("Uma letra minúscula");
  if (!/[0-9]/.test(pw)) errors.push("Um número");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("Um caractere especial");
  return errors;
}

export default function UsuarioFormDialog({ open, onOpenChange, usuario }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!usuario;

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
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } else {
      setForm(emptyForm);
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [usuario, open]);

  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const passwordErrors = password ? validatePassword(password) : [];

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.departamento || !form.unidadePadrao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
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

        // If admin provided a new password, update it
        if (password) {
          if (passwordErrors.length > 0) {
            toast({ title: "Senha não atende aos requisitos", variant: "destructive" });
            setLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            toast({ title: "As senhas não coincidem", variant: "destructive" });
            setLoading(false);
            return;
          }
          if (!usuario.userId) {
            toast({ title: "Usuário sem conta de autenticação vinculada", variant: "destructive" });
            setLoading(false);
            return;
          }
          const res = await supabase.functions.invoke("update-user-password", {
            body: { userId: usuario.userId, password },
          });
          if (res.error || res.data?.error) {
            throw new Error(res.data?.error || res.error?.message || "Erro ao redefinir senha");
          }
        }

        toast({ title: "Usuário atualizado com sucesso!" });
      } else {
        // Creating new user - requires username and password
        if (!username) {
          toast({ title: "Informe o login (nome.sobrenome)", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (passwordErrors.length > 0) {
          toast({ title: "Senha não atende aos requisitos", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: "As senhas não coincidem", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("create-user", {
          body: {
            username,
            password,
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
          },
        });

        if (res.error || res.data?.error) {
          throw new Error(res.data?.error || res.error?.message || "Erro ao criar usuário");
        }

        await loadUsuarios();
        toast({ title: "Usuário criado com sucesso!" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar usuário", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
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

            {/* Auth fields */}
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground">
                {isEditing ? "Redefinir Senha (opcional)" : "Credenciais de Acesso"}
              </h3>
              {!isEditing && (
                <div className="space-y-1">
                  <Label>Login (nome.sobrenome) *</Label>
                  <Input
                    placeholder="nome.sobrenome"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""))}
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário fará login com: <strong>{username || "nome.sobrenome"}</strong>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{isEditing ? "Nova Senha" : "Senha *"}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEditing ? "Deixe vazio para manter" : ""}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>{isEditing ? "Confirmar Nova Senha" : "Confirmar Senha *"}</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isEditing ? "Deixe vazio para manter" : ""}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                </div>
              </div>
              {password && passwordErrors.length > 0 && (
                <div className="text-xs space-y-0.5">
                  <p className="text-muted-foreground font-medium">Requisitos da senha:</p>
                  {["Mínimo 8 caracteres", "Uma letra maiúscula", "Uma letra minúscula", "Um número", "Um caractere especial"].map((req) => (
                    <p key={req} className={passwordErrors.includes(req) ? "text-destructive" : "text-green-600"}>
                      {passwordErrors.includes(req) ? "✗" : "✓"} {req}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Se informar uma nova senha, o usuário será obrigado a alterá-la no próximo acesso."
                  : "O usuário será obrigado a alterar a senha no primeiro acesso."}
              </p>
            </div>

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
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Salvando..." : isEditing ? "Salvar" : "Criar Usuário"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
