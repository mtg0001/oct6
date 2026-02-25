import { useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import octarteLogo from "@/assets/octarte-logo.png";

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

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const blockRedirectRef = useRef(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
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
    if (validationError) { setPasswordError(validationError); return; }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return; }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #111118 40%, #0d1117 100%)" }}>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: "hsl(var(--accent))" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
        style={{ background: "hsl(var(--primary))" }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              background: "hsl(var(--accent))",
              top: `${15 + i * 15}%`,
              left: `${10 + i * 14}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${2 + i * 0.5}s`,
              opacity: 0.3 + (i * 0.05),
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[400px] mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={octarteLogo} alt="Octarte" className="h-16 sm:h-20 object-contain drop-shadow-lg" 
            style={{ filter: "drop-shadow(0 0 20px hsl(var(--accent) / 0.15))" }} />
        </div>

        {/* Glass card */}
        <div className="backdrop-blur-xl rounded-2xl p-6 sm:p-8 border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
          
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white/90">Bem-vindo</h1>
            <p className="text-sm text-white/40 mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-white/50 uppercase tracking-wider font-medium">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="nome.sobrenome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-white/50 uppercase tracking-wider font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-medium text-sm mt-2" disabled={loading}
              style={{
                background: loading ? "hsl(var(--accent) / 0.5)" : "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))",
                color: "#0a0a0f",
                boxShadow: "0 4px 15px hsl(var(--accent) / 0.3)",
              }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-6">
          © {new Date().getFullYear()} Octarte · Central de Solicitações
        </p>
      </div>

      {/* Password change dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-[#13131a] border-white/10 text-white" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-white">Alterar Senha</DialogTitle>
            <DialogDescription className="text-white/50">
              Você precisa criar uma nova senha para continuar. A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs text-white/50">Nova Senha</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                  value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11 rounded-xl" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword" className="text-xs text-white/50">Confirmar Nova Senha</Label>
              <Input id="confirmNewPassword" type="password" placeholder="Repita a nova senha"
                value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11 rounded-xl" />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <div className="text-xs text-white/30 space-y-1">
              <p className={newPassword.length >= 8 ? "text-green-400" : ""}>• Mínimo 8 caracteres</p>
              <p className={/[a-z]/.test(newPassword) ? "text-green-400" : ""}>• Letras minúsculas</p>
              <p className={/[A-Z]/.test(newPassword) ? "text-green-400" : ""}>• Letras maiúsculas</p>
              <p className={/[0-9]/.test(newPassword) ? "text-green-400" : ""}>• Números</p>
              <p className={/[^a-zA-Z0-9]/.test(newPassword) ? "text-green-400" : ""}>• Caracteres especiais</p>
            </div>
            <Button className="w-full h-11 rounded-xl" disabled={changingPassword} onClick={handleChangePassword}
              style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))", color: "#0a0a0f" }}>
              {changingPassword ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
