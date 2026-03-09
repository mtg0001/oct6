import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useGlpi, GlpiItem } from "@/hooks/useGlpi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Monitor,
  Printer,
  Smartphone,
  HardDrive,
  Network,
  AppWindow,
  Users,
  Building2,
  ShieldCheck,
  FolderCog,
  RefreshCw,
  Server,
  FileText,
  DollarSign,
  Truck,
  Contact,
  ScrollText,
  FileCheck,
  Cable,
  Award,
  Warehouse,
  Boxes,
  Globe,
  Container,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

// GLPI item type definitions
const ATIVOS_TYPES = [
  { key: "Computer", label: "Computadores", icon: Monitor },
  { key: "Monitor", label: "Monitores", icon: Monitor },
  { key: "Printer", label: "Impressoras", icon: Printer },
  { key: "NetworkEquipment", label: "Equipamentos de Rede", icon: Network },
  { key: "Peripheral", label: "Periféricos", icon: HardDrive },
  { key: "Phone", label: "Telefones", icon: Smartphone },
  { key: "Software", label: "Softwares", icon: AppWindow },
  { key: "Rack", label: "Racks", icon: Server },
];

const ADMIN_TYPES = [
  { key: "User", label: "Usuários", icon: Users },
  { key: "Group", label: "Grupos", icon: Users },
  { key: "Entity", label: "Entidades", icon: Building2 },
  { key: "Profile", label: "Perfis", icon: ShieldCheck },
  { key: "Rule", label: "Regras", icon: FolderCog },
];

const GERENCIA_TYPES = [
  { key: "SoftwareLicense", label: "Licenças", icon: FileCheck },
  { key: "Budget", label: "Orçamentos", icon: DollarSign },
  { key: "Supplier", label: "Fornecedores", icon: Truck },
  { key: "Contact", label: "Contatos", icon: Contact },
  { key: "Contract", label: "Contratos", icon: ScrollText },
  { key: "Document", label: "Documentos", icon: FileText },
  { key: "Line", label: "Linhas", icon: Cable },
  { key: "Certificate", label: "Certificados", icon: Award },
  { key: "Datacenter", label: "Data centers", icon: Warehouse },
  { key: "Cluster", label: "Clusters", icon: Boxes },
  { key: "Domain", label: "Domínios", icon: Globe },
  { key: "Appliance", label: "Appliances", icon: Container },
  { key: "DatabaseInstance", label: "Bancos de dados", icon: Database },
];

// Columns to display for each type (key fields)
const TYPE_COLUMNS: Record<string, string[]> = {
  Computer: ["name", "users_id", "states_id", "manufacturers_id", "computertypes_id", "computermodels_id", "operatingsystems_id", "locations_id", "date_mod", "processor"],
  Monitor: ["name", "states_id", "manufacturers_id", "locations_id", "monitortypes_id", "monitormodels_id", "date_mod", "users_id"],
  Printer: ["name", "serial", "states_id", "locations_id"],
  NetworkEquipment: ["name", "serial", "states_id", "locations_id", "manufacturers_id"],
  Peripheral: ["name", "serial", "states_id", "manufacturers_id"],
  Phone: ["name", "states_id", "users_id", "locations_id", "manufacturers_id", "phonetypes_id", "phonemodels_id"],
  Software: ["name", "manufacturers_id", "is_helpdesk_visible"],
  Rack: ["name", "locations_id", "serial"],
  User: ["username", "realname", "is_active", "locations_id", "email", "comment", "usercategories_id"],
  Group: ["name", "completename", "is_requester", "is_assign"],
  Entity: ["name", "completename", "level"],
  Profile: ["name", "is_default"],
  Rule: ["name", "description", "is_active"],
};

const COLUMN_LABELS: Record<string, string> = {
  name: "Nome",
  serial: "Nº Série",
  otherserial: "Nº Inventário",
  states_id: "Status",
  locations_id: "Localização",
  manufacturers_id: "Fabricante",
  computertypes_id: "Tipo",
  computermodels_id: "Modelo",
  monitortypes_id: "Tipo",
  monitormodels_id: "Modelo",
  operatingsystems_id: "Sistema Operacional",
  processor: "Processador",
  date_mod: "Última Atualização",
  users_id: "Usuário",
  is_helpdesk_visible: "Visível Helpdesk",
  username: "Usuário",
  realname: "Nome",
  firstname: "Nome",
  phone: "Telefone",
  email: "E-mails",
  title: "Título",
  groups: "Grupos",
  responsible: "Responsável",
  comment: "Comentários",
  usercategories_id: "Categoria",
  is_active: "Ativo",
  completename: "Nome Completo",
  is_requester: "Requerente",
  is_assign: "Atribuído",
  level: "Nível",
  phonetypes_id: "Tipo",
  phonemodels_id: "Modelo",
  is_default: "Padrão",
  description: "Descrição",
};

// Dashboard card definitions
const DASHBOARD_CARDS = [
  { key: "Computer", label: "Computadores", icon: Monitor, bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", iconColor: "text-red-400 dark:text-red-500" },
  { key: "NetworkEquipment", label: "Dispositivo de rede", icon: Network, bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-300", iconColor: "text-slate-400 dark:text-slate-500" },
  { key: "Printer", label: "Impressoras", icon: Printer, bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", iconColor: "text-sky-400 dark:text-sky-500" },
  { key: "Monitor", label: "Monitores", icon: Monitor, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", iconColor: "text-green-400 dark:text-green-500" },
  { key: "Phone", label: "Celulares & Tablets", icon: Smartphone, bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", iconColor: "text-teal-400 dark:text-teal-500" },
];

const GlpiPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("cat") || "ativos";
  const activeType = searchParams.get("type") || (activeCategory === "ativos" ? "Computer" : activeCategory === "gerencia" ? "SoftwareLicense" : "User");

  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState<GlpiItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [createMode, setCreateMode] = useState(false);
  const [assetCounts, setAssetCounts] = useState<Record<string, number | null>>({});

  const { items, loading, page, fetchItems, getItem, createItem, updateItem, deleteItem } = useGlpi({
    itemtype: activeType,
  });

  const types = activeCategory === "ativos" ? ATIVOS_TYPES : activeCategory === "gerencia" ? GERENCIA_TYPES : ADMIN_TYPES;
  const columns = TYPE_COLUMNS[activeType] || ["name"];
  const ActiveIcon = types.find((t) => t.key === activeType)?.icon || Monitor;

  // Fetch asset counts for dashboard
  const fetchAssetCounts = useCallback(async () => {
    const counts: Record<string, number | null> = {};
    const promises = DASHBOARD_CARDS.map(async (card) => {
      try {
        const { data } = await supabase.functions.invoke("glpi-proxy", {
          body: {
            action: "search",
            itemtype: card.key,
            params: { range: "0-0", forcedisplay: [2] },
          },
        });
        counts[card.key] = data?.totalcount ?? null;
      } catch {
        counts[card.key] = null;
      }
    });
    await Promise.all(promises);
    setAssetCounts(counts);
  }, []);

  useEffect(() => {
    fetchAssetCounts();
  }, [fetchAssetCounts]);

  useEffect(() => {
    fetchItems(0);
  }, [activeType, fetchItems]);

  const handleSearch = () => {
    fetchItems(0, searchText || undefined);
  };

  const handleCategoryChange = (cat: string) => {
    const defaultType = cat === "ativos" ? "Computer" : cat === "gerencia" ? "SoftwareLicense" : "User";
    setSearchParams({ cat, type: defaultType });
    setSearchText("");
  };

  const handleTypeChange = (type: string) => {
    setSearchParams({ cat: activeCategory, type });
    setSearchText("");
  };

  const handleViewItem = async (item: GlpiItem) => {
    setDetailLoading(true);
    setEditMode(false);
    try {
      const full = await getItem(item.id);
      setSelectedItem(full);
    } catch {
      setSelectedItem(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditItem = () => {
    if (selectedItem) {
      setEditData({ ...selectedItem });
      setEditMode(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      await updateItem(selectedItem.id, editData);
      setSelectedItem(null);
      setEditMode(false);
      fetchItems(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNew = () => {
    setEditData({ name: "" });
    setCreateMode(true);
    setSelectedItem(null);
    setEditMode(false);
  };

  const handleSaveCreate = async () => {
    try {
      await createItem(editData);
      setCreateMode(false);
      setEditData({});
      fetchItems(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (item: GlpiItem) => {
    if (!confirm(`Deseja mover "${item.name}" para a lixeira do GLPI?`)) return;
    try {
      await deleteItem(item.id);
      fetchItems(page);
    } catch (err) {
      console.error(err);
    }
  };

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean" || value === 0 || value === 1) {
      return value ? "Sim" : "Não";
    }
    return String(value);
  };

  return (
    <AppLayout>
      <div className="space-y-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GLPI</h1>
              <p className="text-xs text-muted-foreground">
                Gestão de {activeCategory === "ativos" ? "Ativos" : activeCategory === "gerencia" ? "Gerência" : "Administração"}
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo {types.find((t) => t.key === activeType)?.label?.replace(/s$/, "") || "Item"}
          </Button>
        </div>

        {/* Dashboard summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {DASHBOARD_CARDS.map((card) => {
            const Icon = card.icon;
            const count = assetCounts[card.key];
            return (
              <button
                key={card.key}
                onClick={() => {
                  const cat = ["Computer", "Monitor", "Printer", "NetworkEquipment", "Peripheral", "Phone"].includes(card.key) ? "ativos" : "gerencia";
                  setSearchParams({ cat, type: card.key });
                  setSearchText("");
                }}
                className={cn(
                  "relative rounded-2xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                  card.bg,
                  activeType === card.key && "ring-2 ring-primary shadow-md"
                )}
              >
                <Icon className={cn("absolute top-3 right-3 h-5 w-5 opacity-60", card.iconColor)} />
                <p className={cn("text-3xl font-bold", card.text)}>
                  {count === null ? <Skeleton className="h-9 w-12 inline-block" /> : count}
                </p>
                <p className={cn("text-xs font-medium mt-1", card.text)}>{card.label}</p>
              </button>
            );
          })}
        </div>


        <div className="flex gap-2">
          <Button
            variant={activeCategory === "ativos" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("ativos")}
            className="gap-1.5"
          >
            <HardDrive className="h-4 w-4" />
            Ativos
          </Button>
          <Button
            variant={activeCategory === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("admin")}
            className="gap-1.5"
          >
            <Users className="h-4 w-4" />
            Administração
          </Button>
          <Button
            variant={activeCategory === "gerencia" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("gerencia")}
            className="gap-1.5"
          >
            <FolderCog className="h-4 w-4" />
            Gerência
          </Button>
        </div>

        {/* Sub-type chips */}
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const Icon = t.icon;
            return (
              <Button
                key={t.key}
                variant={activeType === t.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange(t.key)}
                className={cn(
                  "gap-1.5 text-xs h-8",
                  activeType === t.key && "bg-secondary font-semibold shadow-sm"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            );
          })}
        </div>

        {/* Search + refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} className="h-9">
            Buscar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => fetchItems(page)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">ID</TableHead>
                {columns.map((col) => (
                  <TableHead key={col}>{COLUMN_LABELS[col] || col}</TableHead>
                ))}
                <TableHead className="w-28 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    {columns.map((col) => (
                      <TableCell key={col}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleViewItem(item)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="text-sm max-w-[200px] truncate">
                        {col === "is_active" || col === "is_helpdesk_visible" || col === "is_requester" || col === "is_assign" || col === "is_default" ? (
                          <Badge variant={item[col] ? "default" : "secondary"} className="text-[10px]">
                            {item[col] ? "Sim" : "Não"}
                          </Badge>
                        ) : (
                          renderCellValue(item[col])
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewItem(item)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { handleViewItem(item).then(() => setEditMode(true)); setEditData({ ...item }); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page + 1} · {items.length} itens
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => fetchItems(page - 1)}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={items.length < 50}
              onClick={() => fetchItems(page + 1)}
              className="h-8 gap-1"
            >
              Próximo
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* View/Edit dialog */}
        <Dialog open={!!selectedItem} onOpenChange={(o) => { if (!o) { setSelectedItem(null); setEditMode(false); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ActiveIcon className="h-5 w-5 text-primary" />
                {editMode ? "Editar" : "Detalhes"} — {selectedItem?.name || `#${selectedItem?.id}`}
              </DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : selectedItem && !editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                {Object.entries(selectedItem)
                  .filter(([k]) => !k.startsWith("_") && k !== "links")
                  .map(([key, value]) => (
                    <div key={key} className="space-y-0.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">{COLUMN_LABELS[key] || key}</Label>
                      <p className="text-sm font-medium break-words">{renderCellValue(value)}</p>
                    </div>
                  ))}
              </div>
            ) : selectedItem && editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                {Object.entries(editData)
                  .filter(([k]) => !k.startsWith("_") && k !== "links" && k !== "id")
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">{COLUMN_LABELS[key] || key}</Label>
                      {typeof value === "string" && value.length > 100 ? (
                        <Textarea
                          value={editData[key] ?? ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="text-sm"
                        />
                      ) : (
                        <Input
                          value={editData[key] ?? ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="text-sm h-8"
                        />
                      )}
                    </div>
                  ))}
              </div>
            ) : null}
            <div className="flex gap-2 justify-end pt-2">
              {!editMode && selectedItem && (
                <Button size="sm" onClick={handleEditItem} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
              {editMode && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} className="gap-1.5">
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create dialog */}
        <Dialog open={createMode} onOpenChange={(o) => { if (!o) setCreateMode(false); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Novo {types.find((t) => t.key === activeType)?.label?.replace(/s$/, "")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {columns.map((col) => (
                <div key={col} className="space-y-1">
                  <Label className="text-xs">{COLUMN_LABELS[col] || col}</Label>
                  <Input
                    value={editData[col] ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, [col]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setCreateMode(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveCreate} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default GlpiPage;
