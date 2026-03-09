import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GlpiItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface UseGlpiOptions {
  itemtype: string;
  pageSize?: number;
}

export function useGlpi({ itemtype, pageSize = 50 }: UseGlpiOptions) {
  const [items, setItems] = useState<GlpiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const fetchItems = useCallback(
    async (pageNum = 0, searchText?: string) => {
      setLoading(true);
      try {
        const start = pageNum * pageSize;
        const end = start + pageSize - 1;
        const { data, error } = await supabase.functions.invoke("glpi-proxy", {
          body: {
            action: "list",
            itemtype,
            params: {
              range: `${start}-${end}`,
              sort: "1",
              order: "DESC",
              ...(searchText ? { searchText } : {}),
            },
          },
        });

        if (error) throw error;

        if (Array.isArray(data)) {
          setItems(data);
          // Try to parse total from content-range (won't be available via invoke though)
          setTotalCount(data.length < pageSize ? start + data.length : start + pageSize + 1);
        } else {
          setItems([]);
          setTotalCount(0);
        }
        setPage(pageNum);
      } catch (err: any) {
        console.error("GLPI fetch error:", err);
        toast.error("Erro ao buscar dados do GLPI");
      } finally {
        setLoading(false);
      }
    },
    [itemtype, pageSize]
  );

  const getItem = useCallback(
    async (id: number) => {
      const { data, error } = await supabase.functions.invoke("glpi-proxy", {
        body: { action: "get", itemtype, id },
      });
      if (error) throw error;
      return data as GlpiItem;
    },
    [itemtype]
  );

  const createItem = useCallback(
    async (body: Record<string, any>) => {
      const { data, error } = await supabase.functions.invoke("glpi-proxy", {
        body: { action: "create", itemtype, body },
      });
      if (error) throw error;
      toast.success("Item criado com sucesso!");
      return data;
    },
    [itemtype]
  );

  const updateItem = useCallback(
    async (id: number, body: Record<string, any>) => {
      const { data, error } = await supabase.functions.invoke("glpi-proxy", {
        body: { action: "update", itemtype, id, body },
      });
      if (error) throw error;
      toast.success("Item atualizado com sucesso!");
      return data;
    },
    [itemtype]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      const { data, error } = await supabase.functions.invoke("glpi-proxy", {
        body: { action: "delete", itemtype, id },
      });
      if (error) throw error;
      toast.success("Item movido para lixeira!");
      return data;
    },
    [itemtype]
  );

  return {
    items,
    loading,
    totalCount,
    page,
    fetchItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
  };
}
