import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const columns = [
  "DATA ADMISSÃO","CARGO","DEPARTAMENTO","CONTRATAÇÃO","SALÁRIO","PERICULOSIDADE","GRATIFICAÇÃO","FGTS","1/3 FÉRIAS","13º","ALIMENTAÇÃO","MOBILIDADE","CUSTO TOTAL","PERFIL COMPORTAMENTAL","ALOCADO EM","LÍDER DIRETO","DDD","CELULAR","DATA NASCIMENTO","RG","CPF","PACOTE OFFICE","SISTEMA DE SOLICITAÇÕES","BROCHE","MOLETOM","OBS"
];

interface Colaborador {
  nome: string;
  dados: string[];
}

const colaboradores: Colaborador[] = [
  { nome: "ADRIANO DOS SANTOS OLIVEIRA", dados: ["02/12/25","MARCENEIRO","OPERACIONAL - SP","CLT","R$ 3.522,65","","","R$ 281,81","R$ 97,85","R$ 293,55","R$ 704,00","R$ 623,30","R$ 5.523,17","COMUNICADOR PLANEJADOR","SÃO PAULO","DOUGLAS","11","93218-7174","28/01/1984","","333.016.838-27","xxx","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","AFASTADO"] },
  { nome: "ALISSON BIZERRA DE SOUZA", dados: ["12/01/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - GO","CLT","R$ 2.347,90","","","R$ 187,83","R$ 65,22","R$ 195,66","R$ 704,00","R$ 300,00","R$ 3.800,61","","GOIÂNIA","DORISMAR","64","99951-5838","09/01/95","658190453","134.476.756-75","xxx","ACESSO CRIADO","","","h"] },
  { nome: "AMELIO MIRANDA DE MOREIRA NETO", dados: ["19/12/22","ANALISTA DE LICITAÇÕES","LICITAÇÕES","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","PLANEJADOR COMUNICADOR","GOIÂNIA","OSÓRIO","62","99327-0076","29/09/75","1979854","659.599.571-91","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "DANIEL SOARES DA SILVA", dados: ["09/01/24","SERRALHEIRO PLENO","OPERACIONAL - GO","CLT","R$ 3.710,00","","","R$ 296,80","R$ 103,06","R$ 309,17","R$ 704,00","R$ 300,00","R$ 5.423,02","","GOIÂNIA","GLEIBE","62","9350-5655","16/08/76","3166407","807.765.901-20","xxx","ACESSO CRIADO","","","h"] },
  { nome: "DIEGO LEMOS PEREIRA", dados: ["19/08/25","PINTOR","OPERACIONAL - SP","CLT","R$ 2.831,79","","","R$ 226,54","R$ 78,66","R$ 235,98","R$ 1.204,00","R$ 432,00","R$ 5.008,98","","SÃO PAULO","INAYARA","","","","","","xxx","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "DJALMA GABRIEL CARVALHO SILVA", dados: ["10/04/25","AUXILIAR DE IMPRESSÃO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 1.912,24","","","R$ 152,98","R$ 53,12","R$ 159,35","R$ 704,00","R$ 300,00","R$ 3.281,69","PLANEJADOR ANALISTA","GOIÂNIA","MARCOS","62","9180-5922","25/05/2007","2363805089","118.422.935-08","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "DORISMAR PEREIRA DE SANTANA", dados: ["14/12/22","ENCARREGADO DE GALPÃO","OPERACIONAL - GO","CLT - 62","R$ 3.180,00","","R$ 1.272,00","R$ 356,16","R$ 123,67","R$ 371,00","R$ 1.204,00","R$ 300,00","R$ 6.806,83","COMUNICADOR PLANEJADOR","GOIÂNIA","RAFAEL","62","99133-4604","18/08/71","2281918","597.365.421-49","xxx","ACESSO CRIADO","","","h"] },
  { nome: "EDSON HENRIQUE BORGES DE SOUZA", dados: ["26/11/25","ASSISTENTE DE LOGÍSTICA E COMPRAS","LOGÍSTICA E COMPRAS","CLT","R$ 2.120,00","","","R$ 169,60","R$ 58,89","R$ 176,67","R$ 704,00","R$ 300,00","R$ 3.529,16","","GOIÂNIA","THAÍS","62","98291-8821","27/09/96","6210330","008.252.301-01","STANDARD","ACESSO CRIADO","","","h"] },
  { nome: "EDSON ROBERTO GONÇALVES DE LIMA", dados: ["09/08/22","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - SP","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","EXECUTOR COMUNICADOR","SÃO PAULO","FILIPE","11","95272-4776","17/08/81","368325521","300.484.748-51","xxx","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "EDUARDO CONCEIÇÃO MARINHO", dados: ["07/07/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - GO","CLT","R$ 2.348,43","","","R$ 187,87","R$ 65,23","R$ 195,70","R$ 704,00","R$ 300,00","R$ 3.801,24","","GOIÂNIA","DORISMAR","62","","27/05/1991","","035.000.351-32","xxx","ACESSO CRIADO","","","h"] },
  { nome: "EZAÚ DOS SANTOS DE ARAÚJO", dados: ["24/11/25","AUXILIAR DE ALMOXARIFADO","OPERACIONAL - SP","CLT","R$ 2.347,90","","","R$ 187,83","R$ 65,22","R$ 195,66","R$ 704,00","R$ 300,00","R$ 3.800,61","","SÃO PAULO","FILIPE","","","","","","xxx","ACESSO CRIADO","26/02/26","ENTREGUE","h"] },
  { nome: "FELIPE SANTOS NASCIMENTO", dados: ["19/06/23","IMPRESSOR PLENO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 3.180,00","","","R$ 254,40","R$ 88,33","R$ 265,00","R$ 704,00","R$ 300,00","R$ 4.791,73","COMUNICADOR","SÃO PAULO","LUCAS","11","95268-5387","19/02/00","541069421","496.152.498-07","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "GABRIELA ALVES PEREIRA PEIXOTO", dados: ["01/01/24","CUSTOMER SUCCESS","OPS - CS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR","GOIÂNIA","INAYARA","62","99121-1375","26/01/99","5563147","039.492.741.97","STANDARD","ACESSO CRIADO","","","LICENÇA MATERNIDADE"] },
  { nome: "GILIEL PIRES DA SILVA", dados: ["12/06/25","SERRALHEIRO","OPERACIONAL - SP","CLT","R$ 3.297,02","","","R$ 263,76","R$ 91,58","R$ 274,75","R$ 704,00","R$ 300,00","R$ 4.931,12","","SÃO PAULO","GIULIAN","11","97402-9161","18/10/1999","659332450","102.277.885-40","xxx","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "GIULIAN PIRES DA SILVA", dados: ["28/05/24","SUPERVISOR DE SERRALHERIA","OPERACIONAL - SP","CLT","R$ 3.634,32","","R$ 1.453,72","R$ 407,04","R$ 141,33","R$ 424,00","R$ 704,00","R$ 300,00","R$ 7.064,42","PLANEJADOR EXECUTOR ANALISTA","SÃO PAULO","DENIS","11","91455-9604","28/10/2004","2208876407","866.981.485-47","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "IZABELLY ISAAC BARBOSA CAVALCANTE", dados: ["19/12/22","ORÇAMENTISTA","COMERCIAL","CLT","R$ 3.369,00","","","R$ 269,52","R$ 93,58","R$ 280,75","R$ 2.184,00","R$ 300,00","R$ 6.496,85","COMUNICADOR ANALISTA","GOIÂNIA","JESSICA","62","99187-4889","16/03/85","4707898","013.319.501-55","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "JADSON MIRANDA DINIZ", dados: ["09/05/24","MOTORISTA CARRETEIRO","OPERACIONAL - GO","CLT","R$ 4.415,32","","","R$ 353,23","R$ 122,65","R$ 367,94","R$ 704,00","R$ 300,00","R$ 6.263,14","ANALISTA EXECUTOR","GOIÂNIA","GLEIBE","62","99137-8808","23/01/1989","5428494","039.418.221-95","xxx","ACESSO CRIADO","","","h"] },
  { nome: "JESSICA SANTANA DE FREITAS", dados: ["05/01/26","ANALISTA DE CONTAS A RECEBER","FINANCEIRO","CLT","R$ 2.650,00","","","R$ 212,00","R$ 73,61","R$ 220,83","R$ 704,00","R$ 300,00","R$ 4.160,44","","GOIÂNIA","NÚBIA","62","9353-8438","16/09/94","","043.276.181-01","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "LEONARDO DA SILVA SOARES", dados: ["26/02/24","IMPRESSOR JUNIOR","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 2.544,00","","","R$ 203,52","R$ 70,67","R$ 212,00","R$ 704,00","R$ 300,00","R$ 4.034,19","COMUNICADOR EXECUTOR","SÃO PAULO","LUCAS","11","93259-8827","21/08/2006","649452264","554.762.268-00","STANDARD","ACESSO CRIADO","NÃO SE APLICA","NÃO SE APLICA","h"] },
  { nome: "LUCIA DO NASCIMENTO PEREIRA", dados: ["27/02/24","AUXILIAR DE SERVIÇOS GERAIS SÊNIOR","SERVIÇOS GERAIS","CLT","R$ 2.188,26","","","R$ 175,06","R$ 60,79","R$ 182,36","R$ 704,00","R$ 300,00","R$ 3.610,46","","GOIÂNIA","DANIELLE","62","99638-4246","07/09/79","3539933","878.141.371-87","xxx","ACESSO CRIADO","","","m"] },
  { nome: "MARIA DE JESUS ALVES DOS REIS", dados: ["20/03/25","AUXILIAR DE SERVIÇOS GERAIS PLENO","SERVIÇOS GERAIS","CLT","R$ 2.039,97","","","R$ 163,20","R$ 56,67","R$ 170,00","R$ 704,00","R$ 300,00","R$ 3.433,83","PLANEJADOR","SÃO PAULO","JESSICA","11","99742-9401","19/09/1972","281132528","179.802.228-14","xxx","ACESSO CRIADO","","","m"] },
  { nome: "NAJARA DOS SANTOS ALMEIDA", dados: ["21/07/22","AUXILIAR DE SERVIÇOS GERAIS PLENO","SERVIÇOS GERAIS","CLT","R$ 2.039,97","","","R$ 163,20","R$ 56,67","R$ 170,00","R$ 704,00","R$ 300,00","R$ 3.433,83","COMUNICADOR","SÃO PAULO","NILVA","11","93006-6771","19/04/90","1447246420","416.602.368-35","xxx","ACESSO CRIADO","26/02/26","","m"] },
  { nome: "NAYARA COSTA DE OLIVEIRA VIANA", dados: ["29/09/25","ANALISTA DE RECURSOS HUMANOS","RECURSOS HUMANOS","CLT","R$ 3.286,00","","","R$ 262,88","R$ 91,28","R$ 273,83","R$ 704,00","R$ 300,00","R$ 4.917,99","ANALISTA EXECUTOR","GOIÂNIA","FLÁVIA","62","99408-1350","01/07/91","5220244","023.112.861-45","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "NILVA DUCA DE LIMA", dados: ["01/12/19","SUPERVISORA DE LOGÍSTICA E COMPRAS","LOGÍSTICA E COMPRAS","PROLABORE","R$ 10.000,00","","","","R$ 277,78","R$ 833,33","R$ 704,00","R$ 300,00","R$ 12.115,11","","SÃO PAULO","DANIELLE","62","98111-0065","06/05/68","2249144","499.192.611-49","STANDARD","ACESSO CRIADO","26/02/26","ENTREGUE","m"] },
  { nome: "NUBIA CRISTINA DA SILVA", dados: ["25/01/24","COORDENADORA DO FINANCEIRO","FINANCEIRO","CLT","R$ 3.180,00","","R$ 1.272,00","R$ 356,16","R$ 123,67","R$ 371,00","R$ 704,00","R$ 300,00","R$ 6.306,83","EXECUTOR PLANEJADOR COMUNICADOR","GOIÂNIA","DANIELLE","62","98145-7014","26/09/83","42897152","003.560.021-79","STANDARD","ACESSO CRIADO","","","m"] },
  { nome: "RAFAEL FERREIRA ESTEVES", dados: ["25/03/25","AUXILIAR DE IMPRESSÃO","OPS - COMUNICAÇÃO VISUAL","CLT","R$ 1.912,24","","","R$ 152,98","R$ 53,12","R$ 159,35","R$ 704,00","R$ 300,00","R$ 3.281,69","PLANEJADOR EXECUTOR COMUNICADOR","SÃO PAULO","LUCAS","11","91188-0804","04/08/99","","472.904.588-26","STANDARD","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "RANIELE PEREIRA SILVA SANTOS", dados: ["13/11/24","ANALISTA DE LOGÍSTICA E COMPRAS JR","LOGÍSTICA E COMPRAS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR ANALISTA","SÃO PAULO","NILVA","11","97118-3544","01/12/94","452884482","427.167.288-28","STANDARD","ACESSO CRIADO","26/02/26","","m"] },
  { nome: "SERGIO DIAS DA ROCHA", dados: ["10/05/24","MOTORISTA","OPERACIONAL - SP","CLT","R$ 3.311,65","","","R$ 264,93","R$ 91,99","R$ 275,97","R$ 1.704,00","R$ 650,00","R$ 6.298,54","EXECUTOR PLANEJADOR","SÃO PAULO","INAYARA","11","96041-9938","07/04/93","40856359","403.438.258-99","xxx","ACESSO CRIADO","26/02/26","","h"] },
  { nome: "THAYS MORAES DOS SANTOS", dados: ["29/05/23","ANALISTA DE LOGÍSTICA E COMPRAS JR","LOGÍSTICA E COMPRAS","CLT","R$ 2.795,75","","","R$ 223,66","R$ 77,66","R$ 232,98","R$ 704,00","R$ 300,00","R$ 4.334,05","EXECUTOR COMUNICADOR","GOIÂNIA","DANIELLE","62","98130-9155","23/07/93","5536843","756.864.061-20","STANDARD","NÃO SE APLICA","NÃO SE APLICA","NÃO SE APLICA","m"] },
];

const ColaboradoresCLT = () => {
  const [busca, setBusca] = useState("");

  const filtered = colaboradores.filter((c) =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.dados.some((d) => d.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Colaboradores CLT</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} colaborador(es)</p>
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
                <th className="sticky left-[40px] z-20 bg-muted px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap border-r border-border min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">COLABORADOR</th>
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
                <tr><td colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresCLT;
