import { useState, useEffect } from "react";
import {
  getSolicitacoes,
  getSolicitacoesByDiretor,
  getSolicitacaoById,
  getSolicitacoesByStatus,
  getSolicitacoesLogistica,
  getSolicitacoesExpedicao,
  getSolicitacoesByUser,
  getSolicitacoesHoje,
  getTotaisPorStatus,
  getTotaisPorUnidadeEStatus,
  subscribe,
  ensureSolicitacoesLoaded,
  type SolicitacaoColaborador,
} from "@/stores/solicitacoesStore";

function useSubscribe<T>(getter: () => T, deps: any[] = []) {
  const [data, setData] = useState<T>(getter());
  useEffect(() => {
    ensureSolicitacoesLoaded().then(() => setData(getter()));
    return subscribe(() => setData(getter()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}

export function useSolicitacoes() { return useSubscribe(() => getSolicitacoes()); }
export function useSolicitacoesDiretor(diretor: string) { return useSubscribe(() => getSolicitacoesByDiretor(diretor), [diretor]); }
export function useSolicitacao(id: string) { return useSubscribe(() => getSolicitacaoById(id), [id]); }
export function useSolicitacoesByStatus(status: string) { return useSubscribe(() => getSolicitacoesByStatus(status), [status]); }
export function useSolicitacoesLogistica(status?: string) { return useSubscribe(() => getSolicitacoesLogistica(status), [status]); }
export function useSolicitacoesExpedicao(status?: string) { return useSubscribe(() => getSolicitacoesExpedicao(status), [status]); }
export function useSolicitacoesByUser(userId: string, status?: string) { return useSubscribe(() => getSolicitacoesByUser(userId, status), [userId, status]); }
export function useSolicitacoesHoje() { return useSubscribe(() => getSolicitacoesHoje()); }
export function useTotaisPorStatus() { return useSubscribe(() => getTotaisPorStatus()); }
export function useTotaisPorUnidade(unidade: string) { return useSubscribe(() => getTotaisPorUnidadeEStatus(unidade), [unidade]); }
