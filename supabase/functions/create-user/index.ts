import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _auth_uid: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar usuários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, password, nome, email, departamento, unidadePadrao, administrador, novaSolicitacaoUnidades, resolveExpedicao, resolveLogisticaCompras, resolveRecursosHumanos, diretoria, servicosPermitidos, visualizaSolicitacoesUnidades } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Usuário e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate password
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return new Response(JSON.stringify({ error: "Senha não atende aos requisitos de complexidade" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authEmail = `${username}@octarte.com.br`;

    // Create auth user
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the auto-created usuario record with the full data
    const { error: updateErr } = await adminClient
      .from("usuarios")
      .update({
        nome,
        email,
        departamento,
        unidade_padrao: unidadePadrao,
        administrador: administrador || false,
        nova_solicitacao_unidades: novaSolicitacaoUnidades || [],
        resolve_expedicao: resolveExpedicao || false,
        resolve_logistica_compras: resolveLogisticaCompras || false,
        resolve_recursos_humanos: resolveRecursosHumanos || false,
        diretoria: diretoria || [],
        servicos_permitidos: servicosPermitidos || [],
        visualiza_solicitacoes_unidades: visualizaSolicitacoesUnidades || [],
        must_change_password: true,
      })
      .eq("user_id", newUser.user!.id);

    if (updateErr) {
      console.error("Error updating usuario:", updateErr);
    }

    return new Response(JSON.stringify({ success: true, userId: newUser.user!.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
