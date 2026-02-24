import { createClient, SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY_URL = "SUPABASE_URL";
const STORAGE_KEY_ANON = "SUPABASE_ANON_KEY";

export function getSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || "";
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || "";
  return { url, anonKey };
}

export function setSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_URL, url.replace(/\/+$/, ""));
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  // Reset cached client so next call creates a fresh one
  cachedClient = null;
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase não configurado. Preencha URL e ANON KEY.");
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}

/** Test connection by hitting the Auth health endpoint */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const cleanUrl = url.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (res.ok) {
      return { ok: true, message: "Conexão bem-sucedida! Supabase acessível." };
    }

    const body = await res.text();
    return {
      ok: false,
      message: `Erro ${res.status}: ${body || res.statusText}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Falha na conexão: ${err.message || "Verifique a URL e tente novamente."}`,
    };
  }
}
