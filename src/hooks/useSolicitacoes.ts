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
  type SolicitacaoColaborador,
} from "@/stores/solicitacoesStore";

export function useSolicitacoes() {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoes());
  useEffect(() => subscribe(() => setData(getSolicitacoes())), []);
  return data;
}

export function useSolicitacoesDiretor(diretor: string) {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesByDiretor(diretor));
  useEffect(() => subscribe(() => setData(getSolicitacoesByDiretor(diretor))), [diretor]);
  return data;
}

export function useSolicitacao(id: string) {
  const [data, setData] = useState(getSolicitacaoById(id));
  useEffect(() => subscribe(() => setData(getSolicitacaoById(id))), [id]);
  return data;
}

export function useSolicitacoesByStatus(status: string) {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesByStatus(status));
  useEffect(() => subscribe(() => setData(getSolicitacoesByStatus(status))), [status]);
  return data;
}

export function useSolicitacoesLogistica(status?: string) {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesLogistica(status));
  useEffect(() => subscribe(() => setData(getSolicitacoesLogistica(status))), [status]);
  return data;
}

export function useSolicitacoesExpedicao(status?: string) {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesExpedicao(status));
  useEffect(() => subscribe(() => setData(getSolicitacoesExpedicao(status))), [status]);
  return data;
}

export function useSolicitacoesByUser(userId: string, status?: string) {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesByUser(userId, status));
  useEffect(() => subscribe(() => setData(getSolicitacoesByUser(userId, status))), [userId, status]);
  return data;
}

export function useSolicitacoesHoje() {
  const [data, setData] = useState<SolicitacaoColaborador[]>(getSolicitacoesHoje());
  useEffect(() => subscribe(() => setData(getSolicitacoesHoje())), []);
  return data;
}

export function useTotaisPorStatus() {
  const [data, setData] = useState(getTotaisPorStatus());
  useEffect(() => subscribe(() => setData(getTotaisPorStatus())), []);
  return data;
}

export function useTotaisPorUnidade(unidade: string) {
  const [data, setData] = useState(getTotaisPorUnidadeEStatus(unidade));
  useEffect(() => subscribe(() => setData(getTotaisPorUnidadeEStatus(unidade))), [unidade]);
  return data;
}
