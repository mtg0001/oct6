import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";

function parseAndamento(texto: string) {
  const match = texto.match(/^\[(.+?)\]\s?(.*)/s);
  if (match) return { nome: match[1], texto: match[2] };
  return { nome: null, texto };
}

interface AndamentoBubbleProps {
  texto: string;
  data: string;
  anexos?: string[];
}

export function AndamentoBubble({ texto, data, anexos }: AndamentoBubbleProps) {
  const { nome, texto: msg } = parseAndamento(texto);

  return (
    <div className="flex gap-3 items-start">
      {/* Avatar circle */}
      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
        {nome ? nome.charAt(0).toUpperCase() : "?"}
      </div>
      {/* Bubble */}
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
              <Badge key={i} variant="outline" className="text-xs border-orange-400 text-orange-700">
                <Paperclip className="h-3 w-3 mr-1" /> {anx}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
