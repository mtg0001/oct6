import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pencil, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  type Colaborador, type RowStatus,
  ensureCLTLoaded, getCLT, subscribeCLT, addCLT, updateCLT, deleteCLT,
} from "@/stores/colaboradoresStore";

interface UIRow extends Colaborador {
  isEditing: boolean;
  isNew: boolean;
  originalNome?: string;
  originalDados?: string[];
  originalStatus?: RowStatus;
}

const columnDefs = [
  { key: "data_admissao", label: "DATA ADMISSÃO", type: "date" },
  { key: "cargo", label: "CARGO", type: "text" },
  { key: "departamento", label: "DEPARTAMENTO", type: "text" },
  { key: "contratacao", label: "CONTRATAÇÃO", type: "select", options: ["CLT", "PROLABORE"] },
  { key: "salario", label: "SALÁRIO", type: "currency" },
  { key: "periculosidade", label: "PERICULOSIDADE", type: "currency" },
  { key: "gratificacao", label: "GRATIFICAÇÃO", type: "currency" },
  { key: "fgts", label: "FGTS", type: "currency" },
  { key: "ferias", label: "1/3 FÉRIAS", type: "currency" },
  { key: "decimo", label: "13º", type: "currency" },
  { key: "alimentacao", label: "ALIMENTAÇÃO", type: "currency" },
  { key: "mobilidade", label: "MOBILIDADE", type: "currency" },
  { key: "custo_total", label: "CUSTO TOTAL", type: "computed" },
  { key: "perfil", label: "PERFIL COMPORTAMENTAL", type: "text" },
  { key: "alocado", label: "ALOCADO EM", type: "select", options: ["SÃO PAULO", "GOIÂNIA"] },
  { key: "lider", label: "LÍDER DIRETO", type: "text" },
  { key: "ddd", label: "DDD", type: "ddd" },
  { key: "celular", label: "CELULAR", type: "phone" },
  { key: "nascimento", label: "DATA NASCIMENTO", type: "date" },
  { key: "rg", label: "RG", type: "rg" },
  { key: "cpf", label: "CPF", type: "cpf" },
  { key: "office", label: "PACOTE OFFICE", type: "select", options: ["STANDARD", "BASIC", "NÃO SE APLICA", "PENDENTE"] },
  { key: "sistema", label: "SISTEMA DE SOLICITAÇÕES", type: "select_sistema", options: ["ACESSO CRIADO", "NÃO SE APLICA", "PENDENTE"] },
  { key: "broche", label: "BROCHE", type: "date" },
  { key: "moletom", label: "MOLETOM", type: "select", options: ["ENTREGUE", "NÃO SE APLICA"] },
  { key: "obs", label: "OBS", type: "text" },
];

function maskDate(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function maskCPF(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
function maskPhone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
function maskDDD(v: string): string { return v.replace(/\D/g, "").slice(0, 2); }
function maskRG(v: string): string { return v.replace(/[^0-9.-]/g, ""); }
function maskCurrency(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseCurrency(v: string): number {
  if (!v) return 0;
  const cleaned = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatCurrency(n: number): string {
  if (n === 0) return "";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function computeCustoTotal(dados: string[]): string {
  const salario = parseCurrency(dados[4]);
  const periculosidade = parseCurrency(dados[5]);
  const gratificacao = parseCurrency(dados[6]);
  const fgts = parseCurrency(dados[7]);
  const ferias = parseCurrency(dados[8]);
  const decimo = parseCurrency(dados[9]);
  const alimentacao = parseCurrency(dados[10]);
  const mobilidade = parseCurrency(dados[11]);
  const total = salario + periculosidade + gratificacao + fgts + ferias + decimo + alimentacao + mobilidade;
  return formatCurrency(total);
}

let tempIdCounter = 0;

const ColaboradoresCLT = () => {
  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<UIRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureCLTLoaded().then(() => {
      setRows(getCLT().map(c => ({ ...c, isEditing: false, isNew: false })));
      setLoading(false);
    });
    return subscribeCLT(() => {
      setRows(prev => {
        const dbRows = getCLT();
        const editingIds = new Set(prev.filter(r => r.isEditing).map(r => r.id));
        const merged: UIRow[] = [];
        prev.forEach(r => { if (r.isNew) merged.push(r); });
        dbRows.forEach(db => {
          if (editingIds.has(db.id)) {
            merged.push(prev.find(r => r.id === db.id)!);
          } else {
            merged.push({ ...db, isEditing: false, isNew: false });
          }
        });
        return merged;
      });
    });
  }, []);

  const sorted = useMemo(() => {
    const f = rows.filter((c) =>
      !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.dados.some((d) => d.toLowerCase().includes(busca.toLowerCase()))
    );
    return [...f].sort((a, b) => {
      const order = (r: UIRow) => r.isEditing || r.isNew ? -1 : r.status === "inativo" ? 2 : r.status === "pendente_ti" ? 0 : 1;
      return order(a) - order(b);
    });
  }, [rows, busca]);

  const startEdit = (id: string) => {
    setRows(prev => prev.map(r =>
      r.id === id ? { ...r, isEditing: true, originalNome: r.nome, originalDados: [...r.dados], originalStatus: r.status } : r
    ));
  };

  const saveRow = async (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    try {
      if (row.isNew) {
        const created = await addCLT(row.nome, row.dados);
        setRows(prev => prev.filter(r => r.id !== id).concat({ ...created, isEditing: false, isNew: false }));
      } else {
        await updateCLT(id, { nome: row.nome, dados: row.dados });
        setRows(prev => prev.map(r =>
          r.id === id ? { ...r, isEditing: false, isNew: false, originalNome: undefined, originalDados: undefined, originalStatus: undefined } : r
        ));
      }
      toast.success("Salvo com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    }
  };

  const cancelEdit = (id: string) => {
    setRows(prev => {
      const row = prev.find(r => r.id === id);
      if (!row) return prev;
      if (row.isNew) return prev.filter(r => r.id !== id);
      return prev.map(r =>
        r.id === id ? { ...r, isEditing: false, nome: r.originalNome || r.nome, dados: r.originalDados || r.dados, originalNome: undefined, originalDados: undefined, originalStatus: undefined } : r
      );
    });
  };

  const changeStatus = async (id: string, newStatus: RowStatus) => {
    const row = rows.find(r => r.id === id);
    if (!row || row.isNew) return;
    try {
      await updateCLT(id, { status: newStatus });
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (e: any) {
      toast.error("Erro ao atualizar status: " + e.message);
    }
  };

  const updateField = (id: string, colIndex: number, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newDados = [...r.dados];
      newDados[colIndex] = value;
      newDados[12] = computeCustoTotal(newDados);
      return { ...r, dados: newDados };
    }));
  };

  const updateNome = (id: string, newNome: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, nome: newNome } : r));
  };

  const addNew = () => {
    const tempId = `temp-${++tempIdCounter}`;
    const newR: UIRow = {
      id: tempId,
      nome: "",
      status: "ativo",
      dados: columnDefs.map(() => ""),
      isEditing: true,
      isNew: true,
    };
    setRows(prev => [newR, ...prev]);
  };

  // Synced scrollbars
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topDummyRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (tableRef.current && topDummyRef.current) {
      const ro = new ResizeObserver(() => {
        if (tableRef.current && topDummyRef.current) {
          topDummyRef.current.style.width = `${tableRef.current.scrollWidth}px`;
        }
      });
      ro.observe(tableRef.current);
      return () => ro.disconnect();
    }
  }, [sorted]);

  const handleTopScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const handleTableScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const renderCell = (row: UIRow, colIndex: number) => {
    const col = columnDefs[colIndex];
    const value = row.dados[colIndex] || "";
    const editable = row.isEditing;

    if (col.type === "computed") {
      const computed = computeCustoTotal(row.dados);
      return <span className="text-foreground font-semibold">{computed || "—"}</span>;
    }

    if (!editable) {
      if ((col.type === "select_sistema" || col.key === "office") && value === "PENDENTE") {
        return <span className="text-destructive font-semibold">{value}</span>;
      }
      return <span className="text-muted-foreground">{value || "—"}</span>;
    }

    if (col.type === "select" || col.type === "select_sistema") {
      return (
        <Select value={value} onValueChange={(v) => updateField(row.id, colIndex, v)}>
          <SelectTrigger className="h-7 text-xs min-w-[120px] border-primary/30">
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {col.options!.map(opt => (
              <SelectItem key={opt} value={opt}>
                <span className={opt === "PENDENTE" ? "text-destructive font-semibold" : ""}>{opt}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const getMask = () => {
      switch (col.type) {
        case "date": return maskDate;
        case "cpf": return maskCPF;
        case "phone": return maskPhone;
        case "ddd": return maskDDD;
        case "rg": return maskRG;
        case "currency": return maskCurrency;
        default: return null;
      }
    };
    const mask = getMask();

    return (
      <input
        className="h-7 px-1.5 text-xs rounded border border-primary/30 bg-background text-foreground w-full min-w-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
        value={value}
        onChange={(e) => {
          const newVal = mask ? mask(e.target.value) : e.target.value;
          updateField(row.id, colIndex, newVal);
        }}
        placeholder={col.type === "date" ? "dd/mm/aaaa" : col.type === "cpf" ? "000.000.000-00" : col.type === "phone" ? "00000-0000" : col.type === "ddd" ? "00" : ""}
      />
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <p className="text-muted-foreground py-8 text-center">Carregando...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Colaboradores CLT</h1>
        <p className="text-sm text-muted-foreground">{sorted.length} colaborador(es)</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Buscar por nome, cargo, departamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={addNew} className="gap-1.5 bg-[hsl(var(--sidebar-primary))] hover:bg-[hsl(var(--sidebar-primary))]/90 text-[hsl(var(--sidebar-primary-foreground))]">
          <Plus className="w-4 h-4" />
          Adicionar novo
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto" style={{ scrollbarWidth: "auto" }}>
          <div ref={topDummyRef} style={{ height: 1 }} />
        </div>

        <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto">
          <table ref={tableRef} className="w-max min-w-full text-xs">
            <thead>
              <tr className="bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
                <th className="sticky left-0 z-20 bg-[hsl(var(--sidebar-primary))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 min-w-[90px]">
                  STATUS
                </th>
                <th className="sticky left-[90px] z-20 bg-[hsl(var(--sidebar-primary))] px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  COLABORADOR
                </th>
                {columnDefs.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const editable = c.isEditing;
                const isInativo = c.status === "inativo";
                const isPendenteTI = c.status === "pendente_ti";
                return (
                  <tr key={c.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${isInativo ? "bg-destructive/5" : isPendenteTI ? "bg-orange-500/5" : editable ? "bg-[hsl(var(--sidebar-primary))]/5" : ""}`}>
                    <td className="sticky left-0 z-10 bg-card px-2 py-2 border-r border-border">
                      {editable ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => saveRow(c.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                          >
                            <Check className="w-3 h-3" />
                            Salvar
                          </button>
                          <button
                            onClick={() => cancelEdit(c.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity bg-destructive text-destructive-foreground"
                          >
                            <X className="w-3 h-3" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity ${
                              isInativo
                                ? "bg-destructive text-destructive-foreground"
                                : isPendenteTI
                                ? "bg-orange-500 text-white animate-pulse-orange"
                                : "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                            }`}>
                              {isInativo ? "Inativo" : isPendenteTI ? "Pendente TI" : "Ativo"}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[140px]">
                            <DropdownMenuItem onClick={() => startEdit(c.id)} className="gap-2">
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(c.id, "ativo")} className="gap-2">
                              <div className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--success))]" />
                              Ativo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(c.id, "inativo")} className="gap-2 text-destructive">
                              <div className="w-3.5 h-3.5 rounded-full bg-destructive" />
                              Inativo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(c.id, "pendente_ti")} className="gap-2 text-orange-500">
                              <div className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-pulse" />
                              Pendente TI
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                    <td className="sticky left-[90px] z-10 bg-card px-3 py-2 whitespace-nowrap border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {editable ? (
                        <input
                          className="h-7 px-1.5 text-xs rounded border border-primary/30 bg-background text-foreground font-semibold w-full min-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                          value={c.nome}
                          onChange={(e) => updateNome(c.id, e.target.value)}
                          placeholder="Nome do colaborador"
                        />
                      ) : (
                        <span className={`font-semibold ${isInativo ? "text-destructive line-through" : "text-foreground"}`}>
                          {c.nome}
                        </span>
                      )}
                    </td>
                    {columnDefs.map((col, j) => (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap border-r border-border last:border-r-0">
                        {renderCell(c, j)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={columnDefs.length + 2} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresCLT;
