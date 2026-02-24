import React, { useState, useMemo } from "react";
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
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  icon?: React.ElementType;
  path?: string;
  children?: { title: string; path: string }[];
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useCurrentUser();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems: MenuItem[] = useMemo(() => {
    const u = currentUser;
    const isAdmin = u?.administrador;

    const items: MenuItem[] = [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    ];

    // Nova Solicitação - only show allowed units
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

    // Logística & Compras
    if (isAdmin || u?.resolveLogisticaCompras) {
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

    // Expedição
    if (isAdmin || u?.resolveExpedicao) {
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

    // Recursos Humanos
    if (isAdmin || u?.resolveRecursosHumanos) {
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

    // Diretoria - show only allowed submenus
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

    // Usuários - admin only
    if (isAdmin) {
      items.push({ title: "Usuários", icon: UserCog, path: "/usuarios" });
    }

    // Solicitações GO / SP - based on permission
    if (isAdmin || u?.visualizaSolicitacoesUnidades?.includes("GOIÂNIA")) {
      items.push({
        title: "Solicitações GO",
        icon: FileSearch,
        children: [
          { title: "Pendentes", path: "/solicitacoes-go/pendentes" },
          { title: "Resolvidos", path: "/solicitacoes-go/resolvidos" },
          { title: "Cancelados", path: "/solicitacoes-go/cancelados" },
        ],
      });
    }
    if (isAdmin || u?.visualizaSolicitacoesUnidades?.includes("SÃO PAULO")) {
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

    return items;
  }, [currentUser]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-md bg-card shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          collapsed ? "lg:w-16" : "lg:w-64",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center leading-none">
                <span className="text-xs text-muted-foreground">≡</span>
                <span className="text-lg font-bold tracking-wide text-foreground">OCTARTE</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:block p-1 rounded hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4 text-sidebar-foreground" />
          </button>
        </div>

        {!collapsed && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {currentUser?.nome?.charAt(0) || "A"}
            </div>
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.nome || "Admin"}
            </span>
            <button
              onClick={handleLogout}
              className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
              title="Sair"
            >
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </div>
        )}

        {!collapsed && user && (
          <div className="px-4 py-2 border-b border-sidebar-border">
            <p className="text-xs text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuItems.map((item) => {
            if (item.path) {
              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              );
            }

            const isOpen = openMenus[item.title];
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && item.children && (
                  <div className="ml-6 border-l border-sidebar-border pl-3 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-1.5 rounded-md text-sm transition-colors",
                            isActive
                              ? "text-sidebar-primary font-medium bg-sidebar-accent"
                              : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
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

        {!collapsed && (
          <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
