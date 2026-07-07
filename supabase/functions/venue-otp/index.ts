import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// deno-lint-ignore no-explicit-any
declare const Deno: any;

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, phone, code, claimId } = body ?? {};

    if (!phone || typeof phone !== 'string' || phone.length < 6) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send') {
      const newCode = genCode();
      await admin.from('otp_challenges').insert({
        claim_id: claimId ?? null,
        phone,
        code: newCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      // In production this would go via Twilio / SMS provider. For now we return
      // the code in dev mode so the wizard can display it as a hint.
      const debug = Deno.env.get('OTP_DEV_MODE') === '1';
      console.log(`[venue-otp] issued ${newCode} to ${phone}`);
      return new Response(JSON.stringify({ ok: true, ...(debug ? { code: newCode } : {}) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify') {
      if (!/^\d{4}$/.test(code ?? '')) {
        return new Response(JSON.stringify({ error: 'Invalid code format' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: rows } = await admin
        .from('otp_challenges')
        .select('*')
        .eq('phone', phone)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      const challenge = rows?.[0];
      if (!challenge) {
        return new Response(JSON.stringify({ error: 'No active code — request a new one.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (challenge.attempts >= 5) {
        return new Response(JSON.stringify({ error: 'Too many attempts' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const match = challenge.code === code;
      await admin.from('otp_challenges')
        .update({ attempts: challenge.attempts + 1, verified: match })
        .eq('id', challenge.id);
      if (match && claimId) {
        await admin.from('venue_claims').update({ otp_verified: true, verification_method: 'otp' }).eq('id', claimId);
      }
      return new Response(JSON.stringify({ ok: match }), {
        status: match ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[venue-otp] error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});