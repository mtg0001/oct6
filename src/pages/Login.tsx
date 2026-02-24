import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { Navigate } from "react-router-dom";

function formatAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("Email not confirmed")) return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
  if (message.includes("User not found")) return "Usuário não encontrado.";
  if (message.includes("Too many requests")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (message.includes("Network")) return "Erro de rede. Verifique sua conexão.";
  return message;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!isSupabaseConfigured()) {
    return <Navigate to="/config" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: formatAuthError(error.message), variant: "destructive" });
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="flex justify-between w-full text-sm text-muted-foreground">
              <Link to="/cadastro" className="text-primary hover:underline font-medium">Cadastre-se</Link>
              <Link to="/config" className="hover:underline">⚙ Configurações</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
