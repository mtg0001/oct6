import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const columns = [
  "DATA INICIAL CONTRATO","CARGO","DEPARTAMENTO","CONTRATAÇÃO","VALOR NOTA","PERFIL COMPORTAMENTAL","ALOCADO EM","LÍDER DIRETO","DDD","CELULAR","DATA NASCIMENTO","RG","CPF","PACOTE OFFICE","SISTEMA DE SOLICITAÇÕES","ENTREGA DO BROCHE","MOLETOM","OBS"
];

interface Parceiro {
  nome: string;
  dados: string[];
}

const parceiros: Parceiro[] = [
  { nome: "ÁGATHA OLIVEIRA", dados: ["","ANALISTA DE DP","RECURSOS HUMANOS","PJ","R$ 4.500,00","EXECUTOR PLANEJADOR ANALISTA","SÃO PAULO","FLÁVIA","11","95351-5760","16/01/96","367008634","445.608.398-08","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "ALINE CINTRA ANDRADE SANTOS", dados: ["","COORDENADORA COMERCIAL","COMERCIAL","PJ","R$ 9.000,00","COMUNICADOR EXECUTOR","SÃO PAULO","JÉSSICA","11","98588-7911","02/10/81","27.747.025.0","290.174.418-44","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "BRUNO MAGNO MAGALHÃES", dados: ["","COORDENADOR DE PROJETOS","PROJETOS","PJ","R$ 9.000,00","EXECUTOR COMUNICADOR","GOIÂNIA","JESSICA","62","99952-7475","04/07/83","4162225","003.183.751.41","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "CAMILLA PRADO RIGONATI SECCO", dados: ["","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 5.500,00","ANALISTA COMUNICADOR","SÃO PAULO","ALINE","11","98825-9359","14/02/85","442397379","322.510.858-82","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "CARLOS JOSÉ DE ARANTES CANDIDO", dados: ["02/12/26","ELETRICISTA","OPERACIONAL - SP","PJ","R$ 6.000,00","COMUNICADOR EXECUTOR","SÃO PAULO","INAYARA","11","998518959","12/10/68","175918592","078.385.158-82","xxx","ACESSO CRIADO","","","h"] },
  { nome: "DANIELA MARIA PREVITAL DE ANDRADE", dados: ["","BDR","COMERCIAL","PJ","R$ 3.000,00","","SÃO PAULO","ALINE","16","99235-6865","24/07/79","27.747.008-0","269.800.668-46","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "DANIELLE SANTOS", dados: ["","HEAD DE OPERAÇÕES","DIRETORIA","PJ","R$ 24.000,00","","GOIÂNIA","OSÓRIO","62","991978077","19/12/85","414780310","345.614.348-60","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "DENIS DE OLIVEIRA FERREIRA", dados: ["","COORDENADOR DE PRÉ PRODUÇÃO","OPS - PRÉ PRODUÇÃO","PJ","R$ 7.000,00","PLANEJADOR ANALISTA","SÃO PAULO","INAYARA","11","93145-4893","04/01/96","38195842","461.643.698-35","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "DOUGLAS MIZAEL DE MORAIS", dados: ["","ENCARREGADO DE MARCENARIA","OPERACIONAL - SP","PJ","R$ 8.000,00","EXECUTOR COMUNICADOR","SÃO PAULO","INAYARA","11","95884-5591","14/04/1992","586594498","104.399.566-84","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "ELIZANDRA RESENDE", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 7.000,00","PLANEJADOR EXECUTOR","GOIÂNIA","BRUNO","62","99337-4511","30/06/97","62186150","702.916.001-07","BASIC","ACESSO CRIADO","","","m"] },
  { nome: "ÊMILE GOMES DE AGUIAR MELO", dados: ["","LDR","COMERCIAL","PJ","R$ 3.000,00","","SÃO PAULO","ALINE","71","99285-5787","24/09/1992","1439739757","062.147.825-36","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "FERNANDA SILVA VIANA", dados: ["","BDR","COMERCIAL","PJ","R$ 4.000,00","","SÃO PAULO","ALINE","11","91218-0109","01/09/80","","283.520.648-51","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "FERNANDO RAFAEL DE OLIVEIRA", dados: ["","SUPERVISOR DE PRODUÇÃO PLENO","OPS - PRODUÇÃO","PJ","R$ 4.900,00","COMUNICADOR EXECUTOR","SÃO PAULO","ROMÁRIO","62","99833-4788","18/06/91","352403044","386.994.238-02","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "FILIPE ARAÚJO DE JESUS", dados: ["","ENCARREGADO DE GALPÃO","OPERACIONAL - SP","PJ","R$ 5.500,00","EXECUTOR","SÃO PAULO","GABRIELLI","11","96418-8646","16/11/98","68344931","711.531.084-02","xxx","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "FILIPE GOBETTI", dados: ["19/02/2026","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 4.200,00","","SÃO PAULO","ALINE","11","95762-3247","28/10/1988","","329.016.358-06","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "FLAVIA BARBOSA ROCHA", dados: ["","GERENTE DE RH","RECURSOS HUMANOS","PJ","R$ 8.500,00","","GOIÂNIA","DANIELLE","62","98201-1065","16/10/1975","3449897","819.099.001-25","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "GABRIELLI OLIVEIRA COELHO", dados: ["","ALMOXARIFE","OPERACIONAL - SP","PJ","R$ 4.200,00","EXECUTOR COMUNICADOR","SÃO PAULO","INAYARA","11","97505-8993","09/04/91","47886523","398.239.948-38","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "GILCIMAR RODRIGUES SILVA DUARTE", dados: ["","ENCARREGADO DE TI","TI","PJ","R$ 7.000,00","ANALISTA PLANEJADOR","GOIÂNIA","SORAYA","62","99932-5376","01/12/90","5351608","031.682.281-76","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "GIOVANNA FECHER MATARAZZO", dados: ["19/02/2026","ANALISTA COMERCIAL","COMERCIAL","PJ","R$ 4.800,00","","SÃO PAULO","JESSICA","11","99614-5232","28/10/99","","476.350.428-23","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "GLEIBE RIBEIRO ROCHA", dados: ["","GERENTE OPERACIONAL","OPERACIONAL - GO","PJ","R$ 15.000,00","EXECUTOR ANALISTA","GOIÂNIA","SORAYA","62","98454-1532","17/09/1981","4572473","000.312.381-22","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "INAYARA SOARES DAS NEVES", dados: ["","GERENTE OPERACIONAL","OPERACIONAL - SP","PJ","R$ 15.000,00","EXECUTOR ANALISTA","SÃO PAULO","SORAYA","11","99374-4725","12/09/93","354141569","412.865.218-07","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "JÉSSICA LIMA DUTRA", dados: ["","CMO","DIRETORIA","PROLABORE","R$ 24.000,00","","SÃO PAULO","OSÓRIO","11","98546-0888","15/02/1990","5267886","029.975.971-70","STANDARD","ACESSO CRIADO","","ENTREGUE","m"] },
  { nome: "KLEBER SOUZA DA SILVA", dados: ["","ORÇAMENTISTA","COMERCIAL","PJ","R$ 7.000,00","","SÃO PAULO","JESSICA","11","95425-6972","22/11/1991","494748254","053.588.395-18","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "LORAYNE PELEGRINO SPERANDIO", dados: ["","CUSTOMER SUCCESS","OPS - CS","PJ","R$ 3.500,00","COMUNICADOR EXECUTOR","SÃO PAULO","INAYARA","11","95520-7297","02/02/01","","538.675.498-00","STANDARD","ACESSO CRIADO","26/02/26","","m"] },
  { nome: "LUCAS VASCONCELOS DOS SANTOS", dados: ["","SUPERVISOR DE COMUNICAÇÃO VISUAL","OPS - COMUNICAÇÃO VISUAL","PJ","R$ 4.000,00","ANALISTA PLANEJADOR","SÃO PAULO","MARCOS","11","97457-0507","07/05/96","39623688","472.737.878-76","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "MARCOS KAIQUE DE OLIVEIRA", dados: ["","COORDENADOR DE COMUNICAÇÃO VISUAL","OPS - COMUNICAÇÃO VISUAL","PJ","R$ 5.500,00","EXECUTOR PLANEJADOR","GOIÂNIA","INAYARA","62","99365-6334","12/10/92","5656140","044.568.871-84","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "MATEUS FILIPE GONÇALVES", dados: ["","CONSULTOR","COMERCIAL","PJ","R$ 5.000,00","","BELO HORIZONTE","JESSICA","31","99394-4095","15/07/1991","12047850","101.050.836.90","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "MIRELLA AMURATTI", dados: ["23/02/2026","ACCOUNT EXECUTIVE","COMERCIAL","PJ","R$ 4.200,00","COMUNICADOR EXECUTOR","SÃO PAULO","ALINE","11","98508-7958","08/06/93","371337768","402.514.858-70","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "MOISES DE CAMARGO POLICARPO DA SILVA", dados: ["","PROJETISTA DE PRÉ PRODUÇÃO","OPS - PRÉ PRODUÇÃO","PJ","R$ 4.000,00","PLANEJADOR","SÃO PAULO","DENIS","11","95540-7890","20/09/1999","","440.369.888-32","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "NATHALIA PEREIRA DE ARAUJO", dados: ["","ANALISTA DE PROJETOS","PROJETOS","PJ","R$ 5.000,00","","GOIÂNIA","BRUNO","62","98630-0634","04/05/92","","037.402.511-82","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "OSÓRIO FERREIRA DUTRA NETO", dados: ["","CEO","DIRETORIA","PROLABORE","R$ 24.000,00","","SÃO PAULO","XXX","62","98171-5981","22/07/1991","4379277","716.050.611-15","STANDARD","ACESSO CRIADO","","ENTREGUE","h"] },
  { nome: "PATRICIA DOS SANTOS ANDRADE", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 3.200,00","EXECUTOR COMUNICADOR","GOIÂNIA","BRUNO","62","98157-8442","13/07/96","5991892","701.035.021-30","BASIC","ACESSO CRIADO","","","m"] },
  { nome: "RAFAEL EDILTO SANTOS DE SOUZA", dados: ["","ALMOXARIFE","OPERACIONAL - GO","PJ","R$ 4.200,00","EXECUTOR","GOIÂNIA","GLEIBE","62","99640-3855","13/09/00","6638084","080.570.731-01","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "ROMÁRIO RODRIGUES CORREIA", dados: ["","COORDENADOR DE PRODUÇÃO","OPS - PRODUÇÃO","PJ","R$ 10.000,00","PLANEJADOR EXECUTOR","SÃO PAULO","INAYARA","11","96597-1377","26/03/94","434321679","420.417.648-80","STANDARD","ACESSO CRIADO","","ENTREGUE","h"] },
  { nome: "SÉRGIO DE AZEVEDO", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 5.600,00","ANALISTA","SÃO PAULO","BRUNO","11","98494-8257","28/05/57","9686 9392","954.897.118-68","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "SORAYA P. VALENTE", dados: ["","DIRETORA OPERACIONAL","DIRETORIA","PJ","R$ 24.000,00","EXECUTOR ANALISTA","SÃO PAULO","OSÓRIO","11","97482-0981","12/10/92","5442704","039.504.491-08","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "YURI HENRIQUE DE OLIVEIRA COELHO", dados: ["","PROJETISTA DE PRÉ PRODUÇÃO JR","OPS - PRÉ PRODUÇÃO","PJ","R$ 4.000,00","","SÃO PAULO","DENIS","11","96410-8877","16/05/97","","474.176.588-14","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "ITAMAR SILVA LIMA", dados: ["","SUPERVISOR DE MONTAGEM","OPERACIONAL - GO","PJ","R$ 6.500,00","","GOIÂNIA","GLEIBE","77","99103-3969","07/02/94","16648670","067.788.775-29","BASIC","ACESSO CRIADO","","","h"] },
  { nome: "ZEULA PEREIRA DA SILVA MOURA", dados: ["03/10/26","ACCOUNT EXECUTIVE","COMERCIAL - GO","PJ","R$ 5.000,00","","GOIÂNIA","ALINE","62","99113-3035","26/06/1985","4587310","007.124.441-73","","ACESSO CRIADO","FALTA FAZER","","m"] },
  { nome: "DIOGO COSTA BATISTA", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 5.600,00","COMUNICADOR ANALISTA","SÃO PAULO","BRUNO","11","97865-7585","24/05/1989","669709207","033.430.585-30","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "SAMUEL CARDOSO DA ROCHA", dados: ["","PROJETISTA","PROJETOS","PJ","R$ 2.400,00","PLANEJADOR ANALISTA","GOIÂNIA","BRUNO","62","9250-5745","20/03/2000","6626591","706.820.511-95","BASIC","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "MAURO ALVES DA SILVA", dados: ["21/08/25","IMPRESSOR PLENO","OPS - COMUNICAÇÃO VISUAL","PJ","","ANALISTA PLANEJADOR","GOIÂNIA","MARCOS","62","98574-2510","01/08/78","31174522","770.600.831-20","STANDARD","ACESSO CRIADO","","","h"] },
];

const ColaboradoresPJ = () => {
  const [busca, setBusca] = useState("");

  const filtered = parceiros.filter((c) =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.dados.some((d) => d.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Colaboradores PJ</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} parceiro(s) comercial(is)</p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome, cargo, departamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-xs">
            <thead>
              <tr className="bg-muted/60">
                <th className="sticky left-0 z-20 bg-muted px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap border-r border-border min-w-[40px]">#</th>
                <th className="sticky left-[40px] z-20 bg-muted px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap border-r border-border min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">PARCEIRO COMERCIAL</th>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap border-r border-border last:border-r-0">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.nome} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground border-r border-border">{i + 1}</td>
                  <td className="sticky left-[40px] z-10 bg-card px-3 py-2 font-semibold text-foreground whitespace-nowrap border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{c.nome}</td>
                  {c.dados.map((d, j) => (
                    <td key={j} className="px-3 py-2 text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0">{d || "—"}</td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">Nenhum parceiro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresPJ;
