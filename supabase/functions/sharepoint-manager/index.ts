import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure token error: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── SharePoint helpers ──────────────────────────────────────────
function getSiteUrl(): string {
  return Deno.env.get("SHAREPOINT_SITE_URL")!;
}

function getRootFolder(): string {
  return Deno.env.get("SHAREPOINT_ROOT_FOLDER")!;
}

function normalizeSharePointKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

const UNIDADE_SHAREPOINT_MAP: Record<string, string> = {
  goiania: "Goiânia",
  mairipora: "Mairiporã",
  pinheiros: "Pinheiros",
};

const SERVICO_SHAREPOINT_MAP: Record<string, string> = {
  "chamados ti": "Chamados TI",
  "materiais (expedicao)": "Materiais (Expedição)",
};

function toSharePointUnidade(unidade: string): string {
  const normalized = normalizeSharePointKey(unidade);
  return UNIDADE_SHAREPOINT_MAP[normalized] || unidade;
}

function toSharePointServico(servico: string): string {
  const normalized = normalizeSharePointKey(servico);
  return SERVICO_SHAREPOINT_MAP[normalized] || servico;
}

async function getSiteId(token: string): Promise<string> {
  const siteUrl = getSiteUrl();
  const parts = siteUrl.replace(/^https?:\/\//, "").split("/");
  const hostname = parts[0];
  const sitePath = parts.slice(1).join("/");

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${hostname}:/${sitePath}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get site ID: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

async function getDriveId(token: string, siteId: string): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get drives: ${err}`);
  }

  const data = await res.json();
  const drive = data.value.find((d: any) => d.name === "Documents") || data.value[0];
  return drive.id;
}

async function createFolder(
  token: string,
  driveId: string,
  parentPath: string,
  folderName: string
): Promise<any> {
  const encodedPath = encodeURIComponent(parentPath).replace(/%2F/g, "/");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/children`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    }),
  });

  if (res.status === 409) {
    return { alreadyExists: true, name: folderName };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create folder "${folderName}" in "${parentPath}": ${err}`);
  }

  return await res.json();
}

async function listFolderChildren(
  token: string,
  driveId: string,
  folderPath: string
): Promise<any[]> {
  const encodedPath = encodeURIComponent(folderPath).replace(/%2F/g, "/");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/children?$filter=folder ne null&$select=name,folder`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    // Folder might not exist yet — return empty
    return [];
  }

  const data = await res.json();
  return data.value || [];
}

function getTodayDateString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function getNextSequentialName(existingFolders: any[]): string {
  const today = getTodayDateString();
  const pattern = new RegExp(`^(\\d{4})-${today}$`);

  let maxSeq = 0;
  for (const folder of existingFolders) {
    const match = folder.name?.match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${nextSeq}-${today}`;
}

async function uploadFile(
  token: string,
  driveId: string,
  folderPath: string,
  fileName: string,
  fileContent: Uint8Array,
  contentType: string
): Promise<any> {
  const encodedPath = encodeURIComponent(`${folderPath}/${fileName}`).replace(/%2F/g, "/");
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: fileContent,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload file "${fileName}": ${err}`);
  }

  return await res.json();
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

  const {
    data: { user },
  } = await client.auth.getUser();
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

    const body = await req.json();
    const { action } = body;

    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const driveId = await getDriveId(token, siteId);
    const rootFolder = getRootFolder();

    if (action === "get-next-date-folder") {
      const { unidade, servico, userName } = body;

      if (!unidade || !servico || !userName) {
        return new Response(
          JSON.stringify({ error: "unidade, servico e userName são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Ensure user folder exists
      const unidadeSharePoint = toSharePointUnidade(unidade);
      const servicoSharePoint = toSharePointServico(servico);
      const parentPath = `${rootFolder}/${unidadeSharePoint}/${servicoSharePoint}`;
      await createFolder(token, driveId, parentPath, userName);

      const userPath = `${parentPath}/${userName}`;
      const children = await listFolderChildren(token, driveId, userPath);
      const folderName = getNextSequentialName(children);

      return new Response(JSON.stringify({ success: true, folderName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-user-folders") {
      const { userName, unidades, servicos } = body;

      if (!userName || !unidades || !servicos) {
        return new Response(
          JSON.stringify({ error: "userName, unidades and servicos são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: any[] = [];

      for (const unidade of unidades) {
        for (const servico of servicos) {
          const unidadeSharePoint = toSharePointUnidade(unidade);
          const servicoSharePoint = toSharePointServico(servico);
          const parentPath = `${rootFolder}/${unidadeSharePoint}/${servicoSharePoint}`;
          const result = await createFolder(token, driveId, parentPath, userName);
          results.push({ unidade: unidadeSharePoint, servico: servicoSharePoint, userName, result });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload-file") {
      const { unidade, servico, userName: rawUserName, fileName: rawFileName, fileBase64, contentType, datePasta } = body;

      if (!unidade || !servico || !rawUserName || !rawFileName || !fileBase64) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios faltando" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize path inputs to prevent traversal
      const userName = String(rawUserName).replace(/[\\\/\.\.]/g, "_").substring(0, 255);
      const fileName = String(rawFileName).replace(/[\\\/\.\.]/g, "_").substring(0, 255);

      const parentPath = `${rootFolder}/${toSharePointUnidade(unidade)}/${toSharePointServico(servico)}`;
      // Create user folder (parent path is fixed/pre-existing)
      await createFolder(token, driveId, parentPath, userName);

      // Create date subfolder inside user folder
      const userPath = `${parentPath}/${userName}`;
      const dateFolder = datePasta || `0001-${getTodayDateString()}`;
      await createFolder(token, driveId, userPath, dateFolder);

      const folderPath = `${userPath}/${dateFolder}`;

      // Decode base64 to Uint8Array
      const binaryString = atob(fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const result = await uploadFile(
        token,
        driveId,
        folderPath,
        fileName,
        bytes,
        contentType || "application/pdf"
      );

      return new Response(JSON.stringify({ success: true, file: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-download-link") {
      const { filePath } = body;

      if (!filePath) {
        return new Response(
          JSON.stringify({ error: "filePath é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[get-download-link] filePath:", filePath);

      const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, "/");
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        redirect: "manual",
      });

      const downloadUrl = res.headers.get("Location") || "";

      if (!downloadUrl) {
        console.error("[get-download-link] No redirect Location. Status:", res.status, "filePath:", filePath);
        // Try to read error body for more info
        try {
          const errorBody = await res.text();
          console.error("[get-download-link] Response body:", errorBody.substring(0, 500));
        } catch {}
      }

      return new Response(JSON.stringify({ success: !!downloadUrl, downloadUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SharePoint error:", err);
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação no SharePoint" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
