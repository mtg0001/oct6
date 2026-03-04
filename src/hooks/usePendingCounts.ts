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

export interface MenuCounts {
  [key: string]: number;
}

function computeCounts(): MenuCounts {
  return {
    // Parent totals (sum of all sub-statuses)
    "Logística & Compras": getSolicitacoesLogistica("pendente").length + getSolicitacoesLogistica("resolvido").length + getSolicitacoesLogistica("cancelado").length,
    "Expedição": getSolicitacoesExpedicao("pendente").length + getSolicitacoesExpedicao("resolvido").length + getSolicitacoesExpedicao("cancelado").length,
    "CS": getSolicitacoesCS("pendente").length + getSolicitacoesCS("resolvido").length + getSolicitacoesCS("cancelado").length,
    "Recursos Humanos": getSolicitacoesRH("aprovado").length + getSolicitacoesRH("resolvido").length + getSolicitacoesRH("cancelado").length + getSolicitacoesRH("reprovado").length,
    "Tecnologia da Informação": getChamadosTIByStatus("pendente").length + getChamadosTIByStatus("aguardando_diretoria").length + getChamadosTIByStatus("resolvido").length + getChamadosTIByStatus("cancelado").length,
    "Diretoria Aprovação": (
      getSolicitacoesByDiretor("jessica").length +
      getSolicitacoesByDiretor("soraya").length +
      getSolicitacoesByDiretor("danielle").length +
      getSolicitacoesByDiretor("osorio").length
    ),

    // Sub-menu counts - Logística
    "/logistica/pendentes": getSolicitacoesLogistica("pendente").length,
    "/logistica/resolvidos": getSolicitacoesLogistica("resolvido").length,
    "/logistica/cancelados": getSolicitacoesLogistica("cancelado").length,

    // Sub-menu counts - Expedição
    "/expedicao/pendentes": getSolicitacoesExpedicao("pendente").length,
    "/expedicao/resolvidos": getSolicitacoesExpedicao("resolvido").length,
    "/expedicao/cancelados": getSolicitacoesExpedicao("cancelado").length,

    // Sub-menu counts - CS
    "/cs/pendentes": getSolicitacoesCS("pendente").length,
    "/cs/resolvidos": getSolicitacoesCS("resolvido").length,
    "/cs/cancelados": getSolicitacoesCS("cancelado").length,

    // Sub-menu counts - RH
    "/rh/pendentes": getSolicitacoesRH("aprovado").length,
    "/rh/resolvidos": getSolicitacoesRH("resolvido").length,
    "/rh/cancelados": getSolicitacoesRH("cancelado").length,
    "/rh/reprovados": getSolicitacoesRH("reprovado").length,

    // Sub-menu counts - TI (admin)
    "/ti/chamados/pendentes": getChamadosTIByStatus("pendente").length + getChamadosTIByStatus("aguardando_diretoria").length,
    "/ti/chamados/resolvidos": getChamadosTIByStatus("resolvido").length,
    "/ti/chamados/cancelados": getChamadosTIByStatus("cancelado").length,

    // Diretoria sub-items
    "/diretoria/jessica": getSolicitacoesByDiretor("jessica").length,
    "/diretoria/soraya": getSolicitacoesByDiretor("soraya").length,
    "/diretoria/danielle": getSolicitacoesByDiretor("danielle").length,
    "/diretoria/osorio": getSolicitacoesByDiretor("osorio").length,
  };
}

export function usePendingCounts(): MenuCounts {
  const [counts, setCounts] = useState<MenuCounts>(computeCounts);

  useEffect(() => {
    ensureSolicitacoesLoaded().then(() => setCounts(computeCounts()));
    ensureChamadosTILoaded().then(() => setCounts(computeCounts()));

    const unsub1 = subscribe(() => setCounts(computeCounts()));
    const unsub2 = subscribeChamadosTI(() => setCounts(computeCounts()));
    return () => { unsub1(); unsub2(); };
  }, []);

  return counts;
}
