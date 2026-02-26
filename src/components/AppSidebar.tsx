import React, { useState, useMemo, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Package,
  Truck,
  Users,
  ShieldCheck,
  UserCog,
  FileSearch,
  MessageCircle,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Plus,
  Trash2,
  Monitor,
  Headset,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import octarteLogo from "@/assets/octarte-logo.png";

interface MenuItem {
  title: string;
  icon?: React.ElementType;
  path?: string;
  children?: { title: string; path: string }[];
  variant?: 'red';
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useCurrentUser();
  const { user, signOut } = useAuth();
  const unreadCount = useUnreadMessages();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar
  React.useEffect(() => {
    if (currentUser?.id) {
      // Try to read avatar_url from the raw user data
      supabase.from("usuarios").select("avatar_url").eq("id", currentUser.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
    }
  }, [currentUser?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    const path = `${currentUser.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("usuarios").update({ avatar_url: urlData.publicUrl }).eq("id", currentUser.id);
    setAvatarUrl(urlData.publicUrl);
    toast.success("Foto atualizada!");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems: MenuItem[] = useMemo(() => {
    const u = currentUser;
    const isAdmin = u?.administrador;

    const items: MenuItem[] = [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "Chat", icon: MessageCircle, path: "/chat" },
    ];

    // Abrir Chamado TI (red variant)
    items.push({
      title: "Abrir Chamado TI",
      icon: Headset,
      variant: 'red',
      children: [
        { title: "Abrir novo chamado", path: "/chamado-ti/novo" },
        { title: "Pendentes", path: "/chamado-ti/pendentes" },
        { title: "Resolvidos", path: "/chamado-ti/resolvidos" },
        { title: "Cancelados", path: "/chamado-ti/cancelados" },
      ],
    });

    const solUnidades = isAdmin
      ? [
          { title: "Goiânia", path: "/nova-solicitacao/goiania" },
          { title: "São Paulo", path: "/nova-solicitacao/sao-paulo" },
        ]
      : [
          ...(u?.novaSolicitacaoUnidades.includes("GOIÂNIA") ? [{ title: "Goiânia", path: "/nova-solicitacao/goiania" }] : []),
          ...(u?.novaSolicitacaoUnidades.includes("SÃO PAULO") ? [{ title: "São Paulo", path: "/nova-solicitacao/sao-paulo" }] : []),
        ];
    if (solUnidades.length > 0) {
      items.push({ title: "Nova Solicitação", icon: FilePlus, children: solUnidades });
    }

    items.push({
      title: "Minhas Solicitações",
      icon: FileText,
      children: [
        { title: "Pendentes", path: "/minhas-solicitacoes/pendentes" },
        { title: "Resolvidos", path: "/minhas-solicitacoes/resolvidos" },
        { title: "Cancelados", path: "/minhas-solicitacoes/cancelados" },
      ],
    });

    if (isAdmin || u?.resolveLogisticaComprasGo || u?.resolveLogisticaComprasSp) {
      items.push({
        title: "Logística & Compras",
        icon: Package,
        children: [
          { title: "Pendentes", path: "/logistica/pendentes" },
          { title: "Resolvidos", path: "/logistica/resolvidos" },
          { title: "Cancelados", path: "/logistica/cancelados" },
        ],
      });
    }

    if (isAdmin || u?.resolveExpedicaoGo || u?.resolveExpedicaoSp) {
      items.push({
        title: "Expedição",
        icon: Truck,
        children: [
          { title: "Pendentes", path: "/expedicao/pendentes" },
          { title: "Resolvidos", path: "/expedicao/resolvidos" },
          { title: "Cancelados", path: "/expedicao/cancelados" },
        ],
      });
    }

    if (isAdmin || u?.resolveRecursosHumanosGo || u?.resolveRecursosHumanosSp) {
      items.push({
        title: "Recursos Humanos",
        icon: Users,
        children: [
          { title: "Pendentes", path: "/rh/pendentes" },
          { title: "Resolvidos", path: "/rh/resolvidos" },
          { title: "Cancelados", path: "/rh/cancelados" },
          { title: "Reprovados", path: "/rh/reprovados" },
        ],
      });
    }

    const diretoriaChildren = isAdmin
      ? [
          { title: "Osorio", path: "/diretoria/osorio" },
          { title: "Jessica", path: "/diretoria/jessica" },
          { title: "Soraya", path: "/diretoria/soraya" },
          { title: "Danielle", path: "/diretoria/danielle" },
        ]
      : (u?.diretoria || []).map((d) => ({
          title: d,
          path: `/diretoria/${d.toLowerCase()}`,
        }));
    if (diretoriaChildren.length > 0) {
      items.push({ title: "Diretoria Aprovação", icon: ShieldCheck, children: diretoriaChildren });
    }

    if (isAdmin) {
      items.push({ title: "Usuários", icon: UserCog, path: "/usuarios" });
    }

    if (isAdmin) {
      items.push({
        title: "Solicitações GO",
        icon: FileSearch,
        children: [
          { title: "Pendentes", path: "/solicitacoes-go/pendentes" },
          { title: "Resolvidos", path: "/solicitacoes-go/resolvidos" },
          { title: "Cancelados", path: "/solicitacoes-go/cancelados" },
        ],
      });
      items.push({
        title: "Solicitações SP",
        icon: FileSearch,
        children: [
          { title: "Pendentes", path: "/solicitacoes-sp/pendentes" },
          { title: "Resolvidos", path: "/solicitacoes-sp/resolvidos" },
          { title: "Cancelados", path: "/solicitacoes-sp/cancelados" },
        ],
      });
    }

    // Tecnologia da Informação
    items.push({
      title: "Tecnologia da Informação",
      icon: Monitor,
      variant: 'red',
      children: [
        { title: "Chamados Pendentes", path: "/ti/chamados/pendentes" },
        { title: "Chamados Resolvidos", path: "/ti/chamados/resolvidos" },
        { title: "Chamados Cancelados", path: "/ti/chamados/cancelados" },
        { title: "GLPI", path: "/ti/glpi" },
      ],
    });

    if (u?.podeVerLixeira || isAdmin) {
      items.push({ title: "Lixeira", icon: Trash2, path: "/lixeira" });
    }

    return items;
  }, [currentUser]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Close mobile on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Auto-open the parent menu that contains the active route (only on mount/route change)
  React.useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname === child.path)) {
        setOpenMenus((prev) => ({ ...prev, [item.title]: true }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const initials = currentUser?.nome
    ? currentUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card shadow-lg border border-border lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--sidebar-background))] flex flex-col transition-all duration-300 ease-in-out shadow-2xl",
          collapsed ? "lg:w-[68px]" : "lg:w-[260px]",
          mobileOpen ? "w-[280px] translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[hsl(var(--sidebar-border))]">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src={octarteLogo} alt="Octarte" className="h-9 object-contain" />
            </div>
          )}
          {collapsed && (
            <img src={octarteLogo} alt="Octarte" className="h-8 object-contain mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 text-[hsl(var(--sidebar-muted))] transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* User section */}
        {!collapsed && (
          <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover border-2 border-[hsl(var(--sidebar-primary))]"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(var(--sidebar-primary))] to-[hsl(80,30%,25%)] flex items-center justify-center text-[hsl(var(--sidebar-primary-foreground))] text-lg font-bold border-2 border-[hsl(var(--sidebar-primary))]">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-[hsl(var(--sidebar-primary-foreground))] shadow-md hover:scale-110 transition-transform cursor-pointer"
                  title="Alterar foto"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--sidebar-accent-foreground))] truncate">
                  {currentUser?.nome || "Usuário"}
                </p>
                <p className="text-[11px] text-[hsl(var(--sidebar-muted))] truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map((item) => {
            if (item.path) {
              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-md shadow-[hsl(var(--sidebar-primary)/0.3)]"
                        : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                    )
                  }
                >
                  {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" />}
                  {!collapsed && <span className="truncate">{item.title}</span>}
                  {item.title === "Chat" && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1 animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            }

            const isOpen = openMenus[item.title];
            const hasActiveChild = item.children?.some((child) => location.pathname === child.path) ?? false;
            const isRed = item.variant === 'red';
            const activeBg = isRed ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30" : "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-md shadow-[hsl(var(--sidebar-primary)/0.3)]";
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                    hasActiveChild && !isOpen
                      ? activeBg
                      : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                  )}
                >
                  {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" />}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 text-[hsl(var(--sidebar-muted))] transition-transform duration-200", isOpen && "rotate-180")}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && item.children && (
                  <div className={cn("ml-5 border-l-2 pl-3 mt-1 mb-1 space-y-0.5", isRed ? "border-destructive/40" : "border-[hsl(var(--sidebar-border))]")}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-1.5 rounded-md text-[12px] transition-all duration-200",
                            isActive
                              ? isRed
                                ? "bg-destructive text-destructive-foreground font-semibold shadow-sm"
                                : "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] font-semibold shadow-sm"
                              : "text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                          )
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))]">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
              "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(0,65%,55%,0.15)] hover:text-[hsl(0,80%,65%)]",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
