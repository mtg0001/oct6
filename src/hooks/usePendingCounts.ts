import { useState, useEffect } from "react";
import {
  getSolicitacoesLogistica,
  getSolicitacoesExpedicao,
  getSolicitacoesRH,
  getSolicitacoesCS,
  getSolicitacoesByDiretor,
  subscribe,
  ensureSolicitacoesLoaded,
} from "@/stores/solicitacoesStore";
import {
  getChamadosTIByStatus,
  ensureChamadosTILoaded,
  subscribeChamadosTI,
} from "@/stores/chamadosTIStore";

export interface PendingCounts {
  "Logística & Compras": number;
  "Expedição": number;
  "CS": number;
  "Recursos Humanos": number;
  "Tecnologia da Informação": number;
  "Diretoria Aprovação": number;
  [key: string]: number;
}

function computeCounts(): PendingCounts {
  return {
    "Logística & Compras": getSolicitacoesLogistica("pendente").length,
    "Expedição": getSolicitacoesExpedicao("pendente").length,
    "CS": getSolicitacoesCS("pendente").length,
    "Recursos Humanos": getSolicitacoesRH("aprovado").length,
    "Tecnologia da Informação": getChamadosTIByStatus("pendente").length + getChamadosTIByStatus("aguardando_diretoria").length,
    "Diretoria Aprovação": (
      getSolicitacoesByDiretor("jessica").length +
      getSolicitacoesByDiretor("soraya").length +
      getSolicitacoesByDiretor("danielle").length +
      getSolicitacoesByDiretor("osorio").length
    ),
  };
}

export function usePendingCounts(): PendingCounts {
  const [counts, setCounts] = useState<PendingCounts>(computeCounts);

  useEffect(() => {
    ensureSolicitacoesLoaded().then(() => setCounts(computeCounts()));
    ensureChamadosTILoaded().then(() => setCounts(computeCounts()));

    const unsub1 = subscribe(() => setCounts(computeCounts()));
    const unsub2 = subscribeChamadosTI(() => setCounts(computeCounts()));
    return () => { unsub1(); unsub2(); };
  }, []);

  return counts;
}
