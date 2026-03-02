import { supabase } from "@/integrations/supabase/client";

/**
 * Map URL-style unidade slugs to the proper SharePoint folder names.
 */
const UNIDADE_SHAREPOINT_MAP: Record<string, string> = {
  goiania: "Goiânia",
  mairipora: "Mairiporã",
  pinheiros: "Pinheiros",
};

export function toSharePointUnidade(unidade: string): string {
  return UNIDADE_SHAREPOINT_MAP[unidade] || unidade;
}

/**
 * Returns today's date as ddMMyyyy string.
 */
export function getDateFolder(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

/**
 * Fetch the next sequential folder name from SharePoint.
 * Returns e.g. "0001-27022026", "0002-27022026" etc.
 */
export async function getNextSequentialFolder(
  unidade: string,
  servico: string,
  userName: string
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("sharepoint-manager", {
      body: {
        action: "get-next-date-folder",
        unidade: toSharePointUnidade(unidade),
        servico,
        userName,
      },
    });
    if (error || !data?.folderName) {
      // Fallback: use 0001-ddMMyyyy
      return `0001-${getDateFolder()}`;
    }
    return data.folderName;
  } catch {
    return `0001-${getDateFolder()}`;
  }
}

/**
 * Build the stored file name with sequential date prefix: "0001-ddMMyyyy/filename.pdf"
 * If no dateFolder provided, uses a simple date fallback.
 */
export function buildStoredFileName(fileName: string, dateFolder?: string): string {
  const folder = dateFolder || `0001-${getDateFolder()}`;
  return `${folder}/${fileName}`;
}

/**
 * Extract date folder from a stored filename.
 * Supports both "0001-ddMMyyyy/file.pdf" and legacy "ddMMyyyy/file.pdf".
 */
export function getDateFolderFromStoredName(storedName: string): string | undefined {
  const idx = storedName.indexOf("/");
  if (idx <= 0) return undefined;
  const folder = storedName.substring(0, idx);
  if (/^(\d{4}-\d{8}|\d{8})$/.test(folder)) return folder;
  return undefined;
}

function findDateFolderInText(text: string): string | undefined {
  const match = text.match(/(\d{4}-\d{8}|\d{8})\//);
  return match?.[1];
}

function findDateFolderDeep(value: unknown, seen = new Set<unknown>()): string | undefined {
  if (typeof value === "string") {
    return getDateFolderFromStoredName(value) || findDateFolderInText(value);
  }

  if (!value || typeof value !== "object") return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findDateFolderDeep(item, seen);
      if (found) return found;
    }
    return undefined;
  }

  for (const v of Object.values(value as Record<string, unknown>)) {
    const found = findDateFolderDeep(v, seen);
    if (found) return found;
  }

  return undefined;
}

/**
 * Resolve an already existing folder (NNNN-ddMMyyyy or ddMMyyyy) from known data.
 */
export function resolveExistingDateFolder(values: unknown[]): string | undefined {
  for (const value of values) {
    const found = findDateFolderDeep(value);
    if (found) return found;
  }
  return undefined;
}

/**
 * Extract just the display name from a stored filename.
 * "0001-26072025/file.pdf" → "file.pdf"
 * "26072025/file.pdf" → "file.pdf" (backward compat)
 * "file.pdf" → "file.pdf" (backward compat)
 */
export function getDisplayFileName(storedName: string): string {
  const idx = storedName.indexOf("/");
  if (idx >= 0) return storedName.substring(idx + 1);
  return storedName;
}

/**
 * Upload a file to SharePoint via the sharepoint-manager edge function.
 * Path: ROOT / unidade / servico / userName / datePasta / fileName
 */
export async function uploadAttachmentToSharePoint({
  file,
  unidade,
  servico,
  userName,
  datePasta,
}: {
  file: File;
  unidade: string;
  servico: string;
  userName: string;
  datePasta?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const fileBase64 = btoa(binary);

    const { data, error } = await supabase.functions.invoke("sharepoint-manager", {
      body: {
        action: "upload-file",
        unidade: toSharePointUnidade(unidade),
        servico,
        userName,
        fileName: file.name,
        fileBase64,
        contentType: file.type || "application/pdf",
        datePasta: datePasta || `0001-${getDateFolder()}`,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao enviar anexo para SharePoint:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get a download link for a file stored in SharePoint.
 * fileName can be "0001-ddMMyyyy/filename.pdf" (new) or "ddMMyyyy/filename.pdf" (legacy) or "filename.pdf" (oldest).
 */
export async function getSharePointDownloadLink({
  unidade,
  servico,
  userName,
  fileName,
}: {
  unidade: string;
  servico: string;
  userName: string;
  fileName: string;
}): Promise<string | null> {
  try {
    // Parse date subfolder from stored name
    let datePart = "";
    let actualFileName = fileName;
    const slashIdx = fileName.indexOf("/");
    if (slashIdx >= 0) {
      datePart = fileName.substring(0, slashIdx);
      actualFileName = fileName.substring(slashIdx + 1);
    }

    const basePath = `${getRootFolder()}/${toSharePointUnidade(unidade)}/${servico}/${userName}`;
    const filePath = datePart
      ? `${basePath}/${datePart}/${actualFileName}`
      : `${basePath}/${actualFileName}`;

    const { data, error } = await supabase.functions.invoke("sharepoint-manager", {
      body: {
        action: "get-download-link",
        filePath,
      },
    });

    if (error || !data?.downloadUrl) return null;
    return data.downloadUrl;
  } catch {
    return null;
  }
}

function getRootFolder(): string {
  return "General/DIRETORIA OPERACIONAL/ANEXOS ARMAZENADOS DO SISTEMA";
}
