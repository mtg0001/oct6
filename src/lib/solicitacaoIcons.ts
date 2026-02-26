import {
  Sparkles, ShowerHead, Car, Truck, Zap, Hotel, Plane, Tent,
  ArrowUpDown, Package, ShoppingCart, Handshake, UserPlus, Monitor,
  Wrench, Shirt, PenTool, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "Serviço de Diarista": Sparkles,
  "Aluguel de Banheiro": ShowerHead,
  "Locação de Veículos": Car,
  "Frete": Truck,
  "Gerador": Zap,
  "Hospedagem": Hotel,
  "Passagens": Plane,
  "Tendas": Tent,
  "Plataforma Elevatória": ArrowUpDown,
  "Materiais (Expedição)": Package,
  "Materiais (Compras)": ShoppingCart,
  "Negociação de Mão de Obra": Handshake,
  "Novo Colaborador": UserPlus,
  "Equipamentos de TI": Monitor,
  "Manutenção Predial": Wrench,
  "Uniformes e EPI": Shirt,
  "Materiais de Escritório": PenTool,
};

export function getIconForTipo(tipo: string): LucideIcon {
  // Try exact match first, then partial match
  if (iconMap[tipo]) return iconMap[tipo];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (tipo.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return FileText;
}
