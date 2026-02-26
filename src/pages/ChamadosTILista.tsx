import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Headset, Monitor, Clock, Eye } from "lucide-react";
import {
  getChamadosTIByStatus,
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";

const URGENCIA_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-green-500/15 text-green-700 border-green-500/30" },
  media: { label: "Média", color: "bg-orange-400/15 text-orange-600 border-orange-400/30" },
  alta: { label: "Alta", color: "bg-red-400/15 text-red-500 border-red-400/30" },
  extrema: { label: "Extremamente Alta", color: "bg-red-700/15 text-red-800 border-red-700/30" },
};

interface ChamadosTIListaProps {
  contexto?: "chamado-ti" | "ti";
}

export default function ChamadosTILista({ contexto = "chamado-ti" }: ChamadosTIListaProps) {
  const { filtro } = useParams<{ filtro: string }>();
  const navigate = useNavigate();
  const [chamados, setChamados] = useState<ChamadoTI[]>([]);

  const status = filtro === "resolvidos" ? "resolvido" : filtro === "cancelados" ? "cancelado" : "pendente";
  const titulo = filtro === "resolvidos" ? "Resolvidos" : filtro === "cancelados" ? "Cancelados" : "Pendentes";
  const isTI = contexto === "ti";
  const icon = isTI ? Monitor : Headset;

  useEffect(() => {
    ensureChamadosTILoaded().then(() => setChamados(getChamadosTIByStatus(status)));
    return subscribeChamadosTI(() => setChamados(getChamadosTIByStatus(status)));
  }, [status]);

  const basePath = isTI ? "/ti/chamados" : "/chamado-ti";

  const Icon = icon;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isTI ? "Chamados TI" : "Meus Chamados"} — {titulo}
            </h1>
            <p className="text-sm text-muted-foreground">{chamados.length} chamado(s)</p>
          </div>
        </div>

        {chamados.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum chamado {titulo.toLowerCase()}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {chamados.map(c => {
              const urg = URGENCIA_CONFIG[c.urgencia] || URGENCIA_CONFIG.baixa;
              return (
                <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{c.categoria}</span>
                        <Badge variant="outline" className={`text-[10px] ${urg.color}`}>{urg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.subOpcoes.join(", ")} {c.anydesk && `• AnyDesk: ${c.anydesk}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.solicitanteNome} • {c.departamento} • {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                      </p>
                      {c.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Obs: {c.observacoes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`${basePath}/${filtro}/chamado/${c.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
