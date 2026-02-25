import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Azure AD token ──────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const tenantId = Deno.env.get("AZURE_TENANT_ID")!;
  const clientId = Deno.env.get("AZURE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("AZURE_CLIENT_SECRET")!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );

  if (!res.ok) throw new Error(`Azure token error: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ── SharePoint helpers ──────────────────────────────────────────
async function getSiteId(token: string): Promise<string> {
  const siteUrl = Deno.env.get("SHAREPOINT_SITE_URL")!;
  const parts = siteUrl.replace(/^https?:\/\//, "").split("/");
  const hostname = parts[0];
  const sitePath = parts.slice(1).join("/");

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${hostname}:/${sitePath}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get site ID: ${await res.text()}`);
  return (await res.json()).id;
}

async function getDriveId(token: string, siteId: string): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Failed to get drives: ${await res.text()}`);
  const data = await res.json();
  const drive = data.value.find((d: any) => d.name === "Documents") || data.value[0];
  return drive.id;
}

async function ensureFolderPath(token: string, driveId: string, fullPath: string): Promise<void> {
  const parts = fullPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    if (currentPath === "") {
      currentPath = part;
      await createFolderAtLocation(token, driveId, null, part);
    } else {
      await createFolderAtLocation(token, driveId, currentPath, part);
      currentPath = `${currentPath}/${part}`;
    }
  }
}

async function createFolderAtLocation(
  token: string, driveId: string, parentPath: string | null, folderName: string
): Promise<void> {
  const url = parentPath
    ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(parentPath).replace(/%2F/g, "/")}:/children`
    : `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
  });

  if (res.status === 409) return; // already exists
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create folder "${folderName}": ${err}`);
  }
  await res.json();
}

async function uploadFileToSharePoint(
  token: string, driveId: string, folderPath: string, fileName: string,
  fileContent: Uint8Array, contentType: string
): Promise<any> {
  const encodedPath = encodeURIComponent(`${folderPath}/${fileName}`).replace(/%2F/g, "/");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
    body: fileContent,
  });
  if (!res.ok) throw new Error(`Failed to upload "${fileName}": ${await res.text()}`);
  return await res.json();
}

// ── PDF Generation ──────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  tipo: "Tipo de Solicitação",
  unidade: "Unidade",
  evento: "Evento",
  departamento: "Departamento",
  solicitante: "Solicitante",
  prioridade: "Prioridade",
  cargo: "Cargo",
  unidade_destino: "Unidade Destino",
  departamento_destino: "Departamento Destino",
  diretor_area: "Diretor da Área",
  tipo_vaga: "Tipo de Vaga",
  nome_substituido: "Nome do Substituído",
  justificativa: "Justificativa / Detalhes",
  formacao: "Formação",
  experiencia: "Experiência",
  conhecimentos: "Conhecimentos",
  faixa_salarial_de: "Faixa Salarial (De)",
  faixa_salarial_ate: "Faixa Salarial (Até)",
  tipo_contrato: "Tipo de Contrato",
  horario_de: "Horário (De)",
  horario_ate: "Horário (Até)",
  observacoes: "Observações",
};

const SKIP_FIELDS = new Set([
  "id", "created_at", "updated_at", "status", "solicitante_id", "caracteristicas",
]);

function generatePDF(sol: any, andamentos: any[]): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function checkNewPage(needed: number) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  }

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(20, 40, 80);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setFillColor(30, 100, 200);
  doc.rect(0, 35, pageWidth, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("OCTARTEL", margin, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Solicitações", margin, 23);

  doc.setFontSize(9);
  const idShort = sol.id.substring(0, 8).toUpperCase();
  doc.text(`SOL-${idShort}`, pageWidth - margin, 16, { align: "right" });

  const dataCriacao = new Date(sol.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  doc.text(`Criada em: ${dataCriacao}`, pageWidth - margin, 23, { align: "right" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CONCLUÍDA", pageWidth - margin, 30, { align: "right" });

  y = 45;

  // ── Title bar ──────────────────────────────────────
  doc.setFillColor(240, 243, 248);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
  doc.setDrawColor(30, 100, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin, y + 14);

  doc.setTextColor(20, 40, 80);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(sol.tipo?.toUpperCase() || "SOLICITAÇÃO", margin + 5, y + 9);
  y += 20;

  // ── Info grid ──────────────────────────────────────
  function drawField(label: string, value: string, fullWidth = false) {
    if (!value || value.trim() === "") return;
    checkNewPage(16);

    const fieldWidth = fullWidth ? contentWidth : contentWidth / 2 - 2;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 110, 130);
    doc.text(label.toUpperCase(), gridX, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 35, 50);

    const lines = doc.splitTextToSize(value, fieldWidth - 4);
    doc.text(lines, gridX, y + 5);

    const lineHeight = lines.length * 4.5;
    return lineHeight + 8;
  }

  let gridX = margin;

  // Two-column grid for basic fields
  const basicFields = [
    ["Unidade", sol.unidade],
    ["Solicitante", sol.solicitante],
    ["Departamento", sol.departamento],
    ["Prioridade", sol.prioridade],
    ["Evento", sol.evento],
    ["Diretor da Área", sol.diretor_area],
  ].filter(([, v]) => v && v.trim() !== "");

  for (let i = 0; i < basicFields.length; i += 2) {
    checkNewPage(18);
    gridX = margin;
    const h1 = drawField(basicFields[i][0], basicFields[i][1]) || 0;

    let h2 = 0;
    if (i + 1 < basicFields.length) {
      gridX = margin + contentWidth / 2 + 2;
      h2 = drawField(basicFields[i + 1][0], basicFields[i + 1][1]) || 0;
    }

    y += Math.max(h1, h2);
  }

  // ── Section: Details ──────────────────────────────
  const detailFields = Object.entries(sol)
    .filter(([key, val]) => {
      if (SKIP_FIELDS.has(key)) return false;
      if (["tipo", "unidade", "solicitante", "departamento", "prioridade", "evento", "diretor_area"].includes(key)) return false;
      if (!val || (typeof val === "string" && val.trim() === "")) return false;
      return true;
    });

  if (detailFields.length > 0) {
    checkNewPage(20);
    y += 3;

    doc.setFillColor(30, 100, 200);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHES DA SOLICITAÇÃO", margin + 4, y + 5.5);
    y += 13;

    gridX = margin;
    for (const [key, val] of detailFields) {
      const label = FIELD_LABELS[key] || key.replace(/_/g, " ").toUpperCase();
      const value = typeof val === "string" ? val : JSON.stringify(val);

      const isLong = value.length > 60;
      gridX = margin;
      const h = drawField(label, value, true) || 0;
      y += h;
    }
  }

  // ── Section: Características ──────────────────────
  if (sol.caracteristicas && typeof sol.caracteristicas === "object" && Object.keys(sol.caracteristicas).length > 0) {
    checkNewPage(20);
    y += 3;

    doc.setFillColor(30, 100, 200);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CARACTERÍSTICAS", margin + 4, y + 5.5);
    y += 13;

    gridX = margin;
    for (const [key, val] of Object.entries(sol.caracteristicas as Record<string, string>)) {
      if (!val) continue;
      const h = drawField(key, val as string, false) || 0;
      if (gridX === margin) {
        gridX = margin + contentWidth / 2 + 2;
      } else {
        gridX = margin;
        y += h;
      }
    }
    if (gridX !== margin) y += 10;
  }

  // ── Section: Andamentos ───────────────────────────
  if (andamentos.length > 0) {
    checkNewPage(20);
    y += 3;

    doc.setFillColor(30, 100, 200);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`HISTÓRICO DE ANDAMENTOS (${andamentos.length})`, margin + 4, y + 5.5);
    y += 13;

    for (const and of andamentos) {
      checkNewPage(18);

      doc.setFillColor(248, 249, 252);
      doc.roundedRect(margin, y - 2, contentWidth, 4, 1, 1, "F");

      const dataAnd = new Date(and.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 100, 200);
      doc.text(dataAnd, margin + 2, y + 1);

      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 55, 65);
      const andLines = doc.splitTextToSize(and.texto, contentWidth - 8);
      doc.text(andLines, margin + 4, y);
      y += andLines.length * 4 + 5;
    }
  }

  // ── Footer ────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 15, pageWidth - margin, pageH - 15);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 145, 160);

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    doc.text(`Documento gerado automaticamente em ${now}`, margin, pageH - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageH - 10, { align: "right" });
  }

  // Return as Uint8Array
  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

// ── Auth check ──────────────────────────────────────────────────
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Não autorizado");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Não autorizado");
  return user;
}

// ── Main handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await verifyAuth(req);

    const { solicitacaoId } = await req.json();
    if (!solicitacaoId) {
      return new Response(
        JSON.stringify({ error: "solicitacaoId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch data with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: sol, error: solErr } = await adminClient
      .from("solicitacoes")
      .select("*")
      .eq("id", solicitacaoId)
      .single();

    if (solErr || !sol) {
      return new Response(
        JSON.stringify({ error: "Solicitação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: andamentos } = await adminClient
      .from("andamentos")
      .select("*")
      .eq("solicitacao_id", solicitacaoId)
      .order("created_at");

    // Generate PDF
    console.log(`Generating PDF for solicitação ${solicitacaoId}`);
    const pdfBytes = generatePDF(sol, andamentos || []);

    // Upload to SharePoint
    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const driveId = await getDriveId(token, siteId);
    const rootFolder = Deno.env.get("SHAREPOINT_ROOT_FOLDER")!;

    const folderPath = `${rootFolder}/${sol.unidade}/${sol.tipo}/${sol.solicitante}`;
    await ensureFolderPath(token, driveId, folderPath);

    const idShort = sol.id.substring(0, 8).toUpperCase();
    const dataStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `SOL-${idShort}_${dataStr}.pdf`;

    const uploadResult = await uploadFileToSharePoint(
      token, driveId, folderPath, fileName, pdfBytes, "application/pdf"
    );

    console.log(`PDF uploaded: ${fileName} to ${folderPath}`);

    return new Response(
      JSON.stringify({ success: true, fileName, folderPath, uploadResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
