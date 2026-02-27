import { supabase } from "@/integrations/supabase/client";

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
        unidade,
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
        unidade,
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

    const basePath = `${getRootFolder()}/${unidade}/${servico}/${userName}`;
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
