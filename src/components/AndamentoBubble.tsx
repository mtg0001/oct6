import { Badge } from "@/components/ui/badge";
import { Paperclip, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getSharePointDownloadLink } from "@/lib/sharepointAttachments";

function parseAndamento(texto: string) {
  const match = texto.match(/^\[(.+?)\]\s?(.*)/s);
  if (match) return { nome: match[1], texto: match[2] };
  return { nome: null, texto };
}

interface AndamentoBubbleProps {
  texto: string;
  data: string;
  anexos?: string[];
  unidade?: string;
  servico?: string;
  userName?: string;
}

export function AndamentoBubble({ texto, data, anexos, unidade, servico, userName }: AndamentoBubbleProps) {
  const { nome, texto: msg } = parseAndamento(texto);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  const handleDownload = async (fileName: string, idx: number) => {
    if (!unidade || !servico || !userName) return;
    setDownloadingIdx(idx);
    try {
      const link = await getSharePointDownloadLink({
        unidade,
        servico,
        userName,
        fileName,
      });
      if (link) {
        window.open(link, "_blank");
      } else {
        alert("Não foi possível obter o link de download do anexo.");
      }
    } catch {
      alert("Erro ao buscar anexo no SharePoint.");
    } finally {
      setDownloadingIdx(null);
    }
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
        {nome ? nome.charAt(0).toUpperCase() : "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            {nome && (
              <span className="text-sm font-semibold text-primary">{nome}</span>
            )}
            <span className="text-[10px] text-muted-foreground">{data}</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{msg}</p>
        </div>
        {anexos && anexos.length > 0 && (
          <div className="flex gap-2 mt-1.5 flex-wrap pl-1">
            {anexos.map((anx, i) => (
              <button
                key={i}
                type="button"
                disabled={downloadingIdx === i}
                className="inline-flex items-center gap-1 rounded-full border border-orange-400 text-orange-700 bg-orange-50 px-2.5 py-1 text-xs font-medium hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => handleDownload(anx, i)}
              >
                {downloadingIdx === i ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Paperclip className="h-3 w-3" />
                )}
                {anx}
                <ExternalLink className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
