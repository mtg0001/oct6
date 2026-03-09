const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceCheck {
  name: string;
  url: string;
  type: 'statuspage' | 'http';
  statusPageUrl?: string;
  icon: string;
}

const SERVICES: ServiceCheck[] = [
  {
    name: 'Microsoft 365',
    url: 'https://www.office.com',
    type: 'http',
    icon: '🟦',
  },
  {
    name: 'AWS',
    url: 'https://health.aws.amazon.com',
    type: 'http',
    icon: '🟧',
  },
  {
    name: 'Cloudflare',
    url: 'https://www.cloudflarestatus.com/api/v2/status.json',
    type: 'statuspage',
    icon: '🟠',
  },
  {
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    type: 'http',
    icon: '🟢',
  },
  {
    name: 'SEFAZ',
    url: 'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
    type: 'http',
    icon: '🏛️',
  },
  {
    name: 'Gov.br',
    url: 'https://www.gov.br',
    type: 'http',
    icon: '🇧🇷',
  },
  {
    name: 'Santander',
    url: 'https://www.santander.com.br',
    type: 'http',
    icon: '🔴',
  },
  {
    name: 'Pix (BACEN)',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/pix',
    type: 'http',
    icon: '💲',
  },
];

async function checkStatusPage(service: ServiceCheck): Promise<{ name: string; status: string; icon: string; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(service.url, {
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (service.type === 'statuspage') {
      const data = await res.json();
      const indicator = data?.status?.indicator || 'unknown';
      // Statuspage indicators: none, minor, major, critical
      const status = indicator === 'none' ? 'operational' : indicator === 'minor' ? 'degraded' : 'down';
      return { name: service.name, status, icon: service.icon, latency };
    }
    // HTTP check
    if (res.ok || res.status === 403 || res.status === 301 || res.status === 302) {
      return { name: service.name, status: latency > 5000 ? 'degraded' : 'operational', icon: service.icon, latency };
    }
    return { name: service.name, status: 'degraded', icon: service.icon, latency };
  } catch (e) {
    const latency = Date.now() - start;
    return { name: service.name, status: 'down', icon: service.icon, latency };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.all(SERVICES.map(checkStatusPage));
    
    return new Response(JSON.stringify({ success: true, services: results, checkedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking services:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to check services' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
