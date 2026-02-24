import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseConnection,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConfigSupabase() {
  const saved = getSupabaseConfig();
  const [url, setUrl] = useState(saved.url || "");
  const [anonKey, setAnonKey] = useState(saved.anonKey || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTest = async () => {
    if (!url || !anonKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL e a ANON KEY.",
        variant: "destructive",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    if (!url || !anonKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL e a ANON KEY.",
        variant: "destructive",
      });
      return;
    }
    setSupabaseConfig(url, anonKey);
    toast({
      title: "Configuração salva!",
      description: "Redirecionando para o login...",
    });
    // Force page reload so the new client is picked up everywhere
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurar Supabase
          </CardTitle>
          <CardDescription>
            Informe os dados do seu Supabase self-hosted para conectar o
            sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">URL do Supabase</Label>
            <Input
              id="supabase-url"
              type="url"
              placeholder="https://0ctart3gynb1d34e26oct98xlmtz.octarte.com.br"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Ex: https://seudominio.com.br (com HTTPS)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabase-anon">ANON KEY</Label>
            <Input
              id="supabase-anon"
              type="password"
              placeholder="Cole aqui sua ANON_KEY"
              value={anonKey}
              onChange={(e) => {
                setAnonKey(e.target.value);
                setTestResult(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Chave pública (anon) do seu projeto Supabase. Nunca use a
              service_role key aqui.
            </p>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                testResult.ok
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Salvar e Continuar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
