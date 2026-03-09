import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

let sessionToken: string | null = null;

async function initSession(): Promise<string> {
  const apiUrl = Deno.env.get("GLPI_API_URL")!;
  const appToken = Deno.env.get("GLPI_APP_TOKEN")!;
  const userToken = Deno.env.get("GLPI_USER_TOKEN")!;

  const res = await fetch(`${apiUrl}/initSession`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "App-Token": appToken,
      "Authorization": `user_token ${userToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("GLPI initSession failed:", res.status, text);
    throw new Error(`GLPI auth failed: ${res.status}`);
  }

  const data = await res.json();
  sessionToken = data.session_token;
  return sessionToken!;
}

async function glpiFetch(path: string, method = "GET", body?: unknown): Promise<Response> {
  const apiUrl = Deno.env.get("GLPI_API_URL")!;
  const appToken = Deno.env.get("GLPI_APP_TOKEN")!;

  if (!sessionToken) {
    await initSession();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "App-Token": appToken,
    "Session-Token": sessionToken!,
  };

  const opts: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.body = JSON.stringify(body);
  }

  let res = await fetch(`${apiUrl}${path}`, opts);

  // If session expired, re-init and retry once
  if (res.status === 401) {
    await initSession();
    headers["Session-Token"] = sessionToken!;
    res = await fetch(`${apiUrl}${path}`, { ...opts, headers });
  }

  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, itemtype, id, params, body: reqBody } = await req.json();

    let path = "";
    let method = "GET";
    let body: unknown = undefined;

    switch (action) {
      case "list": {
        const range = params?.range || "0-49";
        const searchParams = new URLSearchParams();
        searchParams.set("range", range);
        if (params?.sort) searchParams.set("sort", params.sort);
        if (params?.order) searchParams.set("order", params.order);
        if (params?.searchText) searchParams.set("searchText", params.searchText);
        if (params?.is_deleted !== undefined) searchParams.set("is_deleted", params.is_deleted);
        // expand_dropdowns gives us readable names instead of IDs
        searchParams.set("expand_dropdowns", "true");
        path = `/${itemtype}?${searchParams.toString()}`;
        break;
      }
      case "get": {
        path = `/${itemtype}/${id}?expand_dropdowns=true`;
        break;
      }
      case "create": {
        path = `/${itemtype}`;
        method = "POST";
        body = { input: reqBody };
        break;
      }
      case "update": {
        path = `/${itemtype}/${id}`;
        method = "PUT";
        body = { input: reqBody };
        break;
      }
      case "delete": {
        path = `/${itemtype}/${id}?force_purge=false`;
        method = "DELETE";
        break;
      }
      case "search": {
        const sp = new URLSearchParams();
        if (params?.criteria) {
          params.criteria.forEach((c: any, i: number) => {
            sp.set(`criteria[${i}][field]`, c.field);
            sp.set(`criteria[${i}][searchtype]`, c.searchtype || "contains");
            sp.set(`criteria[${i}][value]`, c.value);
          });
        }
        const searchRange = params?.range || "0-49";
        sp.set("range", searchRange);
        sp.set("forcedisplay[0]", "1"); // id
        sp.set("forcedisplay[1]", "2"); // name
        path = `/search/${itemtype}?${sp.toString()}`;
        break;
      }
      case "listSearchOptions": {
        path = `/listSearchOptions/${itemtype}`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const glpiRes = await glpiFetch(path, method, body);
    const contentType = glpiRes.headers.get("content-type") || "";

    // Get content-range header for pagination info
    const contentRange = glpiRes.headers.get("content-range");

    let responseData: unknown;
    if (contentType.includes("application/json")) {
      responseData = await glpiRes.json();
    } else {
      responseData = await glpiRes.text();
    }

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "application/json",
    };
    if (contentRange) {
      responseHeaders["X-Content-Range"] = contentRange;
    }

    return new Response(JSON.stringify(responseData), {
      status: glpiRes.status,
      headers: responseHeaders,
    });
  } catch (e) {
    console.error("GLPI proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
