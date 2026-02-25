import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import NovoColaboradorForm from "@/components/forms/NovoColaboradorForm";
import DiaristaForm from "@/components/forms/DiaristaForm";
import AluguelBanheiroForm from "@/components/forms/AluguelBanheiroForm";
import LocacaoVeiculosForm from "@/components/forms/LocacaoVeiculosForm";
import GeradorForm from "@/components/forms/GeradorForm";
import HospedagemForm from "@/components/forms/HospedagemForm";
import PassagensForm from "@/components/forms/PassagensForm";
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
  const [passagensOpen, setPassagensOpen] = useState(false);
  const currentUser = useCurrentUser();

  const solicitacoes = allSolicitacoes.filter((item) => {
    if (currentUser?.administrador) return true;
    return currentUser?.servicosPermitidos.includes(item.serviceKey);
  });

  const handleSelecionar = (title: string) => {
    if (title === "Solicitação de Novo Colaborador") setColaboradorOpen(true);
    else if (title === "Serviço de Diarista") setDiaristaOpen(true);
    else if (title === "Solicitação de Aluguel de Banheiro") setAluguelBanheiroOpen(true);
    else if (title === "Solicitação de Locação de Veículos") setLocacaoVeiculosOpen(true);
    else if (title === "Solicitação de Gerador") setGeradorOpen(true);
    else if (title === "Solicitação de Hospedagem") setHospedagemOpen(true);
    else if (title === "Solicitação de Passagens") setPassagensOpen(true);
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{nomeUnidade[0]}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{nomeUnidade}</h1>
            <p className="text-[11px] text-muted-foreground">Selecione o tipo de solicitação</p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString("pt-BR")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {solicitacoes.map((item) => (
          <button
            key={item.title}
            disabled={!item.available}
            onClick={() => handleSelecionar(item.title)}
            className={`bg-card rounded-xl p-3 shadow-sm border border-border text-left flex flex-col gap-2 group transition-all duration-200 ${
              item.available
                ? "hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-[11px] sm:text-[12px] leading-tight line-clamp-2">{item.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 hidden sm:block">{item.description}</p>
            </div>
            <span
              className={`block w-full text-center py-1.5 rounded-md text-[11px] font-semibold mt-auto whitespace-nowrap overflow-hidden text-ellipsis ${
                item.available
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.available ? "Selecionar" : "Em breve"}
            </span>
          </button>
        ))}
      </div>

      <NovoColaboradorForm open={colaboradorOpen} onOpenChange={setColaboradorOpen} unidade={unidade || "goiania"} />
      <DiaristaForm open={diaristaOpen} onOpenChange={setDiaristaOpen} unidade={unidade || "goiania"} />
      <AluguelBanheiroForm open={aluguelBanheiroOpen} onOpenChange={setAluguelBanheiroOpen} unidade={unidade || "goiania"} />
      <LocacaoVeiculosForm open={locacaoVeiculosOpen} onOpenChange={setLocacaoVeiculosOpen} unidade={unidade || "goiania"} />
      <GeradorForm open={geradorOpen} onOpenChange={setGeradorOpen} unidade={unidade || "goiania"} />
      <HospedagemForm open={hospedagemOpen} onOpenChange={setHospedagemOpen} unidade={unidade || "goiania"} />
      <PassagensForm open={passagensOpen} onOpenChange={setPassagensOpen} unidade={unidade || "goiania"} />
    </AppLayout>
  );
};

export default NovaSolicitacao;
