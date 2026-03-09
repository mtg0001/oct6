import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import NovoColaboradorForm from "@/components/forms/NovoColaboradorForm";
import DiaristaForm from "@/components/forms/DiaristaForm";
import AluguelBanheiroForm from "@/components/forms/AluguelBanheiroForm";
import LocacaoVeiculosForm from "@/components/forms/LocacaoVeiculosForm";
import FreteForm from "@/components/forms/FreteForm";
import GeradorForm from "@/components/forms/GeradorForm";
import HospedagemForm from "@/components/forms/HospedagemForm";
import PassagensForm from "@/components/forms/PassagensForm";
import TendasForm from "@/components/forms/TendasForm";
import PlataformaElevatoriaForm from "@/components/forms/PlataformaElevatoriaForm";
import MateriaisForm from "@/components/forms/MateriaisForm";
import EquipamentosTIForm from "@/components/forms/EquipamentosTIForm";
import NegociacaoMaoDeObraForm from "@/components/forms/NegociacaoMaoDeObraForm";
import ManutencaoPredialForm from "@/components/forms/ManutencaoPredialForm";
import CSForm from "@/components/forms/CSForm";
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
  UserCheck,
} from "lucide-react";

interface SolicitacaoCard {
  title: string;
  serviceKey: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
  variant?: 'pink';
}

const allSolicitacoes: SolicitacaoCard[] = [
  { title: "Solicitação de Serviço de Diarista", serviceKey: "Serviço de Diarista", description: "Solicitar diarista para a unidade.", icon: Sparkles, available: true },
  { title: "Solicitação de Aluguel de Banheiro", serviceKey: "Aluguel de Banheiro", description: "Abrir formulário para enviar.", icon: ShowerHead, available: true },
  { title: "Solicitação de Locação de Veículos", serviceKey: "Locação de Veículos", description: "Abrir formulário para enviar.", icon: Car, available: true },
  { title: "Solicitação de Frete", serviceKey: "Frete", description: "Abrir formulário para enviar.", icon: Truck, available: true },
  { title: "Solicitação de Gerador", serviceKey: "Gerador", description: "Abrir formulário para enviar.", icon: Zap, available: true },
  { title: "Solicitação de Hospedagem", serviceKey: "Hospedagem", description: "Abrir formulário para enviar.", icon: Hotel, available: true },
  { title: "Solicitação de Passagens", serviceKey: "Passagens", description: "Abrir formulário para enviar.", icon: Plane, available: true },
  { title: "Solicitação de Tendas", serviceKey: "Tendas", description: "Abrir formulário para enviar.", icon: Tent, available: true },
  { title: "Solicitação de Plataforma Elevatória", serviceKey: "Plataforma Elevatória", description: "Abrir formulário para enviar.", icon: ArrowUpDown, available: true },
  { title: "Solicitação de Materiais (Expedição)", serviceKey: "Materiais (Expedição)", description: "Abrir formulário para enviar.", icon: Package, available: true },
  { title: "Solicitação de Compras", serviceKey: "Materiais (Compras)", description: "Abrir formulário para enviar.", icon: ShoppingCart, available: true },
  { title: "Negociação de Mão de Obra", serviceKey: "Negociação de Mão de Obra", description: "Abrir formulário para enviar.", icon: Handshake, available: true },
  { title: "Solicitação de Novo Colaborador", serviceKey: "Novo Colaborador", description: "Abrir formulário para enviar.", icon: UserPlus, available: true },
  { title: "Solicitação de Equipamentos de TI", serviceKey: "Equipamentos de TI", description: "Notebooks, tablets e periféricos.", icon: Monitor, available: true },
  { title: "Solicitação de Manutenção Predial", serviceKey: "Manutenção Predial", description: "Reparos e serviços prediais.", icon: Wrench, available: true },
  { title: "Solicitação de Uniformes e EPI", serviceKey: "Uniformes e EPI", description: "Uniformes e equipamentos de proteção.", icon: Shirt, available: true },
  { title: "Solicitação de Materiais de Escritório", serviceKey: "Materiais de Escritório", description: "Materiais de escritório em geral.", icon: PenTool, available: true },
  { title: "CS", serviceKey: "CS", description: "Customer Success.", icon: UserCheck, available: true, variant: 'pink' },
];

const NovaSolicitacao = () => {
  const { unidade } = useParams<{ unidade: string }>();
  const nomeUnidadeMap: Record<string, string> = { goiania: "Goiânia", mairipora: "Mairiporã", pinheiros: "Pinheiros" };
  const nomeUnidade = nomeUnidadeMap[unidade || ""] || unidade || "Goiânia";
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [diaristaOpen, setDiaristaOpen] = useState(false);
  const [aluguelBanheiroOpen, setAluguelBanheiroOpen] = useState(false);
  const [locacaoVeiculosOpen, setLocacaoVeiculosOpen] = useState(false);
  const [geradorOpen, setGeradorOpen] = useState(false);
  const [hospedagemOpen, setHospedagemOpen] = useState(false);
  const [passagensOpen, setPassagensOpen] = useState(false);
  const [tendasOpen, setTendasOpen] = useState(false);
  const [plataformaOpen, setPlataformaOpen] = useState(false);
  const [materiaisComprasOpen, setMateriaisComprasOpen] = useState(false);
  const [materiaisExpedicaoOpen, setMateriaisExpedicaoOpen] = useState(false);
  const [equipamentosTIOpen, setEquipamentosTIOpen] = useState(false);
  const [materiaisEscritorioOpen, setMateriaisEscritorioOpen] = useState(false);
  const [uniformesEPIOpen, setUniformesEPIOpen] = useState(false);
  const [negociacaoOpen, setNegociacaoOpen] = useState(false);
  const [freteOpen, setFreteOpen] = useState(false);
  const [manutencaoOpen, setManutencaoOpen] = useState(false);
  const [cadOpen, setCadOpen] = useState(false);
  const currentUser = useCurrentUser();

  const solicitacoes = allSolicitacoes.filter((item) => {
    if (currentUser?.administrador) return true;
    return currentUser?.servicosPermitidos.includes(item.serviceKey);
  });

  const handleSelecionar = (title: string) => {
    if (title === "Solicitação de Novo Colaborador") setColaboradorOpen(true);
    else if (title === "Solicitação de Serviço de Diarista") setDiaristaOpen(true);
    else if (title === "Solicitação de Aluguel de Banheiro") setAluguelBanheiroOpen(true);
    else if (title === "Solicitação de Locação de Veículos") setLocacaoVeiculosOpen(true);
    else if (title === "Solicitação de Frete") setFreteOpen(true);
    else if (title === "Solicitação de Gerador") setGeradorOpen(true);
    else if (title === "Solicitação de Hospedagem") setHospedagemOpen(true);
    else if (title === "Solicitação de Passagens") setPassagensOpen(true);
    else if (title === "Solicitação de Tendas") setTendasOpen(true);
    else if (title === "Solicitação de Plataforma Elevatória") setPlataformaOpen(true);
    else if (title === "Solicitação de Compras") setMateriaisComprasOpen(true);
    else if (title === "Solicitação de Materiais (Expedição)") setMateriaisExpedicaoOpen(true);
    else if (title === "Solicitação de Equipamentos de TI") setEquipamentosTIOpen(true);
    else if (title === "Solicitação de Materiais de Escritório") setMateriaisEscritorioOpen(true);
    else if (title === "Solicitação de Uniformes e EPI") setUniformesEPIOpen(true);
    else if (title === "Negociação de Mão de Obra") setNegociacaoOpen(true);
    else if (title === "Solicitação de Manutenção Predial") setManutencaoOpen(true);
    else if (title === "CS") setCadOpen(true);
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {solicitacoes.map((item, index) => {
          const isPink = item.variant === 'pink';
          return (
            <button
              key={item.title}
              disabled={!item.available}
              onClick={() => handleSelecionar(item.title)}
              className={`relative bg-card rounded-2xl p-4 border text-left flex flex-col gap-3 group transition-all duration-300 overflow-hidden ${
                isPink
                  ? "border-[hsl(330,70%,80%)] hover:shadow-lg hover:shadow-[hsl(330,70%,80%)]/20 hover:border-[hsl(330,70%,60%)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                  : item.available
                    ? "border-border hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                    : "border-border opacity-50 cursor-not-allowed"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Background decorative elements */}
              <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150 ${
                isPink ? "bg-[hsl(330,70%,90%)]/30" : "bg-primary/5"
              }`} />
              <div className={`absolute -bottom-4 -left-4 w-14 h-14 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-700 ${
                isPink ? "bg-[hsl(330,70%,85%)]/20" : "bg-primary/5"
              }`} />

              {/* Icon */}
              <div className="relative">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isPink
                      ? "bg-gradient-to-br from-[hsl(330,70%,93%)] to-[hsl(330,70%,88%)] group-hover:from-[hsl(330,70%,88%)] group-hover:to-[hsl(330,70%,80%)] group-hover:shadow-md group-hover:shadow-[hsl(330,70%,80%)]/30"
                      : "bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-md group-hover:shadow-primary/20"
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${isPink ? "text-[hsl(330,70%,50%)]" : "text-primary"}`} />
                </div>
              </div>

              {/* Text */}
              <div className="min-w-0 relative flex-1">
                <p className={`font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-2 transition-colors duration-200 ${isPink ? "text-[hsl(330,70%,35%)] group-hover:text-[hsl(330,70%,25%)]" : "text-foreground"}`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 hidden sm:block">{item.description}</p>
              </div>

              {/* Button */}
              <div className="relative mt-auto">
                <span
                  className={`block w-full text-center py-2 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                    isPink
                      ? "bg-gradient-to-r from-[hsl(330,70%,55%)] to-[hsl(330,60%,50%)] text-white group-hover:shadow-md group-hover:shadow-[hsl(330,70%,50%)]/30"
                      : item.available
                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.available ? "Selecionar" : "Em breve"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <NovoColaboradorForm open={colaboradorOpen} onOpenChange={setColaboradorOpen} unidade={unidade || "goiania"} />
      <DiaristaForm open={diaristaOpen} onOpenChange={setDiaristaOpen} unidade={unidade || "goiania"} />
      <AluguelBanheiroForm open={aluguelBanheiroOpen} onOpenChange={setAluguelBanheiroOpen} unidade={unidade || "goiania"} />
      <LocacaoVeiculosForm open={locacaoVeiculosOpen} onOpenChange={setLocacaoVeiculosOpen} unidade={unidade || "goiania"} />
      <GeradorForm open={geradorOpen} onOpenChange={setGeradorOpen} unidade={unidade || "goiania"} />
      <HospedagemForm open={hospedagemOpen} onOpenChange={setHospedagemOpen} unidade={unidade || "goiania"} />
      <PassagensForm open={passagensOpen} onOpenChange={setPassagensOpen} unidade={unidade || "goiania"} />
      <TendasForm open={tendasOpen} onOpenChange={setTendasOpen} unidade={unidade || "goiania"} />
      <PlataformaElevatoriaForm open={plataformaOpen} onOpenChange={setPlataformaOpen} unidade={unidade || "goiania"} />
      <MateriaisForm open={materiaisComprasOpen} onOpenChange={setMateriaisComprasOpen} unidade={unidade || "goiania"} tipo="Materiais (Compras)" />
      <MateriaisForm open={materiaisExpedicaoOpen} onOpenChange={setMateriaisExpedicaoOpen} unidade={unidade || "goiania"} tipo="Materiais (Expedição)" />
      <EquipamentosTIForm open={equipamentosTIOpen} onOpenChange={setEquipamentosTIOpen} unidade={unidade || "goiania"} />
      <MateriaisForm open={materiaisEscritorioOpen} onOpenChange={setMateriaisEscritorioOpen} unidade={unidade || "goiania"} tipo="Materiais de Escritório" />
      <MateriaisForm open={uniformesEPIOpen} onOpenChange={setUniformesEPIOpen} unidade={unidade || "goiania"} tipo="Uniformes e EPI" />
      <NegociacaoMaoDeObraForm open={negociacaoOpen} onOpenChange={setNegociacaoOpen} unidade={unidade || "goiania"} />
      <FreteForm open={freteOpen} onOpenChange={setFreteOpen} unidade={unidade || "goiania"} />
      <ManutencaoPredialForm open={manutencaoOpen} onOpenChange={setManutencaoOpen} unidade={unidade || "goiania"} />
      <CSForm open={cadOpen} onOpenChange={setCadOpen} unidade={unidade || "goiania"} />
    </AppLayout>
  );
};

export default NovaSolicitacao;
