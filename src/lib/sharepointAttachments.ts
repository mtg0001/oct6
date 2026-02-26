import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to SharePoint via the sharepoint-manager edge function.
 * Path: ROOT / unidade / servico / userName / fileName
 */
export async function uploadAttachmentToSharePoint({
  file,
  unidade,
  servico,
  userName,
}: {
  file: File;
  unidade: string;
  servico: string;
  userName: string;
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
 * Builds the path from unidade/servico/userName/fileName.
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
    const { data, error } = await supabase.functions.invoke("sharepoint-manager", {
      body: {
        action: "get-download-link",
        filePath: `${getRootFolder()}/${unidade}/${servico}/${userName}/${fileName}`,
      },
    });

    if (error || !data?.downloadUrl) return null;
    return data.downloadUrl;
  } catch {
    return null;
  }
}

function getRootFolder(): string {
  // This must match the SHAREPOINT_ROOT_FOLDER env var on the edge function.
  // We hardcode it here since the client can't read server secrets.
  return "General/DIRETORIA OPERACIONAL/ANEXOS ARMAZENADOS DO SISTEMA";
}
