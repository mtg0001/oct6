import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import NovoColaboradorForm from "@/components/forms/NovoColaboradorForm";
import DiaristaForm from "@/components/forms/DiaristaForm";
import AluguelBanheiroForm from "@/components/forms/AluguelBanheiroForm";
import LocacaoVeiculosForm from "@/components/forms/LocacaoVeiculosForm";
import GeradorForm from "@/components/forms/GeradorForm";
import HospedagemForm from "@/components/forms/HospedagemForm";
import { useCurrentUser } from "@/hooks/useUsuarios";
import {
  Sparkles,
  ShowerHead,
  Car,
  Zap,
  Hotel,
  Plane,
  Tent,
  ArrowUpDown,
  Package,
  ShoppingCart,
  Handshake,
  UserPlus,
  Monitor,
  Wrench,
  Shirt,
  Truck,
  PenTool,
} from "lucide-react";

interface SolicitacaoCard {
  title: string;
  serviceKey: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const allSolicitacoes: SolicitacaoCard[] = [
  { title: "Serviço de Diarista", serviceKey: "Serviço de Diarista", description: "Solicitar diarista para a unidade.", icon: Sparkles, available: true },
  { title: "Solicitação de Aluguel de Banheiro", serviceKey: "Aluguel de Banheiro", description: "Abrir formulário para enviar.", icon: ShowerHead, available: true },
  { title: "Solicitação de Locação de Veículos", serviceKey: "Locação de Veículos", description: "Abrir formulário para enviar.", icon: Car, available: true },
  { title: "Solicitação de Frete", serviceKey: "Frete", description: "Abrir formulário para enviar.", icon: Truck, available: true },
  { title: "Solicitação de Gerador", serviceKey: "Gerador", description: "Abrir formulário para enviar.", icon: Zap, available: true },
  { title: "Solicitação de Hospedagem", serviceKey: "Hospedagem", description: "Abrir formulário para enviar.", icon: Hotel, available: true },
  { title: "Solicitação de Passagens", serviceKey: "Passagens", description: "Abrir formulário para enviar.", icon: Plane, available: true },
  { title: "Solicitação de Tendas", serviceKey: "Tendas", description: "Abrir formulário para enviar.", icon: Tent, available: true },
  { title: "Solicitação de Plataforma Elevatória", serviceKey: "Plataforma Elevatória", description: "Abrir formulário para enviar.", icon: ArrowUpDown, available: true },
  { title: "Solicitação de Materiais (Expedição)", serviceKey: "Materiais (Expedição)", description: "Abrir formulário para enviar.", icon: Package, available: true },
  { title: "Solicitação de Materiais (Compras)", serviceKey: "Materiais (Compras)", description: "Abrir formulário para enviar.", icon: ShoppingCart, available: true },
  { title: "Negociação de Mão de Obra", serviceKey: "Negociação de Mão de Obra", description: "Abrir formulário para enviar.", icon: Handshake, available: true },
  { title: "Solicitação de Novo Colaborador", serviceKey: "Novo Colaborador", description: "Abrir formulário para enviar.", icon: UserPlus, available: true },
  { title: "Solicitação de Equipamentos de TI", serviceKey: "Equipamentos de TI", description: "Notebooks, tablets e periféricos.", icon: Monitor, available: false },
  { title: "Solicitação de Manutenção Predial", serviceKey: "Manutenção Predial", description: "Reparos e serviços prediais.", icon: Wrench, available: false },
  { title: "Solicitação de Uniformes e EPI", serviceKey: "Uniformes e EPI", description: "Uniformes e equipamentos de proteção.", icon: Shirt, available: false },
  { title: "Solicitação de Materiais de Escritório", serviceKey: "Materiais de Escritório", description: "Materiais de escritório em geral.", icon: PenTool, available: false },
];

const NovaSolicitacao = () => {
  const { unidade } = useParams<{ unidade: string }>();
  const nomeUnidade = unidade === "goiania" ? "Goiânia" : "São Paulo";
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [diaristaOpen, setDiaristaOpen] = useState(false);
  const [aluguelBanheiroOpen, setAluguelBanheiroOpen] = useState(false);
  const [locacaoVeiculosOpen, setLocacaoVeiculosOpen] = useState(false);
  const [geradorOpen, setGeradorOpen] = useState(false);
  const [hospedagemOpen, setHospedagemOpen] = useState(false);
  const currentUser = useCurrentUser();

  // Filter cards by user permissions
  const solicitacoes = allSolicitacoes.filter((item) => {
    if (currentUser?.administrador) return true;
    return currentUser?.servicosPermitidos.includes(item.serviceKey);
  });

  const handleSelecionar = (title: string) => {
    if (title === "Solicitação de Novo Colaborador") {
      setColaboradorOpen(true);
    } else if (title === "Serviço de Diarista") {
      setDiaristaOpen(true);
    } else if (title === "Solicitação de Aluguel de Banheiro") {
      setAluguelBanheiroOpen(true);
    } else if (title === "Solicitação de Locação de Veículos") {
      setLocacaoVeiculosOpen(true);
    } else if (title === "Solicitação de Gerador") {
      setGeradorOpen(true);
    } else if (title === "Solicitação de Hospedagem") {
      setHospedagemOpen(true);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-1">
          {nomeUnidade}
        </h1>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR")} {new Date().toLocaleTimeString("pt-BR", { hour12: false })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {solicitacoes.map((item) => (
          <div
            key={item.title}
            className="bg-card rounded-lg p-4 shadow-sm border border-border flex flex-col gap-3"
          >
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <button
              disabled={!item.available}
              onClick={() => handleSelecionar(item.title)}
              className={`self-start px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                item.available
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {item.available ? "Selecionar" : "Em breve"}
            </button>
          </div>
        ))}
      </div>

      <NovoColaboradorForm
        open={colaboradorOpen}
        onOpenChange={setColaboradorOpen}
        unidade={unidade || "goiania"}
      />
      <DiaristaForm
        open={diaristaOpen}
        onOpenChange={setDiaristaOpen}
        unidade={unidade || "goiania"}
      />
      <AluguelBanheiroForm
        open={aluguelBanheiroOpen}
        onOpenChange={setAluguelBanheiroOpen}
        unidade={unidade || "goiania"}
      />
      <LocacaoVeiculosForm
        open={locacaoVeiculosOpen}
        onOpenChange={setLocacaoVeiculosOpen}
        unidade={unidade || "goiania"}
      />
      <GeradorForm
        open={geradorOpen}
        onOpenChange={setGeradorOpen}
        unidade={unidade || "goiania"}
      />
      <HospedagemForm
        open={hospedagemOpen}
        onOpenChange={setHospedagemOpen}
        unidade={unidade || "goiania"}
      />
    </AppLayout>
  );
};

export default NovaSolicitacao;
