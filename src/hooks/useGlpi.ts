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

// Search config per item type: { searchOptionIds, fieldMap }
const SEARCH_CONFIG: Record<string, { options: number[]; fieldMap: Record<number, string> }> = {
  Computer: {
    options: [2, 1, 70, 31, 23, 4, 40, 45, 3, 19, 17],
    fieldMap: {
      2: "id", 1: "name", 70: "users_id", 31: "states_id",
      23: "manufacturers_id", 4: "computertypes_id", 40: "computermodels_id",
      45: "operatingsystems_id", 3: "locations_id", 19: "date_mod", 17: "processor",
    },
  },
  Monitor: {
    options: [2, 1, 31, 23, 3, 4, 40, 19, 70],
    fieldMap: {
      2: "id", 1: "name", 31: "states_id", 23: "manufacturers_id",
      3: "locations_id", 4: "monitortypes_id", 40: "monitormodels_id",
      19: "date_mod", 70: "users_id",
    },
  },
};

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

        if (SEARCH_BASED_TYPES.has(itemtype)) {
          // Use search API for richer columns
          const criteria = searchText
            ? [{ field: "1", searchtype: "contains", value: searchText }]
            : undefined;

          const { data, error } = await supabase.functions.invoke("glpi-proxy", {
            body: {
              action: "search",
              itemtype,
              params: {
                range: `${start}-${end}`,
                forcedisplay: COMPUTER_SEARCH_OPTIONS,
                ...(criteria ? { criteria } : {}),
              },
            },
          });

          if (error) {
            console.error("GLPI search error:", error);
            toast.error("Erro ao buscar dados do GLPI");
            setItems([]);
            setTotalCount(0);
            return;
          }

          if (data?.data && Array.isArray(data.data)) {
            const fieldMap = COMPUTER_FIELD_MAP;
            const mapped: GlpiItem[] = data.data.map((row: any) => {
              const item: any = {};
              for (const [optId, fieldName] of Object.entries(fieldMap)) {
                item[fieldName] = row[optId] ?? null;
              }
              // Ensure id is a number
              if (item.id && typeof item.id === "string") {
                item.id = parseInt(item.id, 10);
              }
              return item as GlpiItem;
            });
            setItems(mapped);
            setTotalCount(data.totalcount || mapped.length);
          } else {
            setItems([]);
            setTotalCount(0);
          }
        } else {
          // Standard list API
          const { data, error } = await supabase.functions.invoke("glpi-proxy", {
            body: {
              action: "list",
              itemtype,
              params: {
                range: `${start}-${end}`,
                ...(searchText ? { searchText } : {}),
              },
            },
          });

          if (error) {
            console.error("GLPI fetch error:", error);
            toast.error("Erro ao buscar dados do GLPI");
            setItems([]);
            setTotalCount(0);
            return;
          }

          if (Array.isArray(data)) {
            setItems(data);
            setTotalCount(data.length < pageSize ? start + data.length : start + pageSize + 1);
          } else {
            setItems([]);
            setTotalCount(0);
            if (data?.error) {
              console.warn("GLPI API error:", data.error);
            }
          }
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
