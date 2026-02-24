import { useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";

const EMAIL_DOMAIN = "@octarte.com.br";

function formatAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Usuário ou senha incorretos.";
  if (message.includes("Email not confirmed")) return "Conta ainda não confirmada. Contate o administrador.";
  if (message.includes("User not found")) return "Usuário não encontrado.";
  if (message.includes("Too many requests")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (message.includes("Network")) return "Erro de rede. Verifique sua conexão.";
  return message;
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Mínimo de 8 caracteres.";
  if (!/[a-z]/.test(pw)) return "Deve conter letras minúsculas.";
  if (!/[A-Z]/.test(pw)) return "Deve conter letras maiúsculas.";
  if (!/[0-9]/.test(pw)) return "Deve conter números.";
  if (!/[^a-zA-Z0-9]/.test(pw)) return "Deve conter caracteres especiais.";
  return null;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Password change dialog
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // Use a ref to block redirect while checking must_change_password
  const blockRedirectRef = useRef(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !changePasswordOpen && !blockRedirectRef.current) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    blockRedirectRef.current = true;
    try {
      const email = username.includes("@") ? username : username + EMAIL_DOMAIN;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        blockRedirectRef.current = false;
        toast({ title: "Erro ao entrar", description: formatAuthError(error.message), variant: "destructive" });
      } else if (data.user) {
        // Check if must change password
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("must_change_password")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (usuario?.must_change_password) {
          setChangePasswordOpen(true);
        } else {
          blockRedirectRef.current = false;
          navigate("/");
        }
      }
    } catch (err: any) {
      blockRedirectRef.current = false;
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // Clear the must_change_password flag
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("usuarios").update({ must_change_password: false }).eq("user_id", currentUser.id);
      }

      toast({ title: "Senha alterada!", description: "Sua nova senha foi salva com sucesso." });
      setChangePasswordOpen(false);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Entrar
          </CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="nome.sobrenome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Password change dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Você precisa criar uma nova senha para continuar. A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className={newPassword.length >= 8 ? "text-green-600" : ""}>• Mínimo 8 caracteres</p>
              <p className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>• Letras minúsculas</p>
              <p className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>• Letras maiúsculas</p>
              <p className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>• Números</p>
              <p className={/[^a-zA-Z0-9]/.test(newPassword) ? "text-green-600" : ""}>• Caracteres especiais</p>
            </div>
            <Button
              className="w-full"
              disabled={changingPassword}
              onClick={handleChangePassword}
            >
              {changingPassword ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
