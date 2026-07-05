import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * Background sync: enriches existing clubs/experiences with up-to-date
 * opening hours, image URL and a short description using the Lovable AI
 * Gateway (web-grounded). Designed to run on a schedule (pg_cron).
 */
const COUNTRY_LABEL: Record<string, string> = { ZA: 'South Africa', ZW: 'Zimbabwe' };

/**
 * Modes:
 *   { mode: "heal" }    → default; fills only missing fields (fast, cheap)
 *   { mode: "refresh" } → daily job; re-verifies image_url/opening_hours/website
 *                        for every venue and updates when the source of truth changed
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let country: string | null = null;
  let mode: "heal" | "refresh" = "heal";
  try {
    const body = await req.json();
    if (body?.country === "ZA" || body?.country === "ZW") country = body.country;
    if (body?.mode === "refresh") mode = "refresh";
  } catch { /* no body */ }

  const askAI = async (kind: "club" | "experience", row: any) => {
    const label = COUNTRY_LABEL[row.country] || row.country || "South Africa";
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Return ONLY a JSON object with keys: opening_hours (string), image_url (https URL or null), description (max 180 chars), website (https URL or null). Use real, verifiable info from the web. If unsure, return null fields." },
          { role: "user", content: `${kind === "club" ? "Venue" : "Experience"}: ${row.name} in ${row.area}, ${label}. Provide current opening hours, official cover image URL, official website, and a one-line description.` },
        ],
      }),
    });
    if (!aiRes.ok) return null;
    const j = await aiRes.json();
    const raw = j.choices?.[0]?.message?.content || "{}";
    try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return null; }
  };

  const buildPatch = (existing: any, parsed: any, mode: "heal" | "refresh") => {
    const patch: Record<string, unknown> = {};
    const setIf = (key: string, val: any, validate?: (v: any) => boolean) => {
      if (val == null) return;
      if (validate && !validate(val)) return;
      if (mode === "refresh" || !existing[key]) patch[key] = typeof val === "string" ? val.slice(0, 500) : val;
    };
    setIf("opening_hours", parsed.opening_hours, (v) => typeof v === "string" && v.length > 0);
    setIf("image_url", parsed.image_url, (v) => typeof v === "string" && v.startsWith("http"));
    setIf("description", parsed.description, (v) => typeof v === "string");
    setIf("website", parsed.website, (v) => typeof v === "string" && v.startsWith("http"));
    return patch;
  };

  const clubUpdated: string[] = [];
  const expUpdated: string[] = [];
  const LIMIT = mode === "refresh" ? 20 : 5;

  // --- Clubs ---
  let clubQ = admin.from("clubs").select("id, name, area, country, opening_hours, image_url, description, website");
  if (country) clubQ = clubQ.eq("country", country);
  if (mode === "heal") clubQ = clubQ.or("image_url.is.null,opening_hours.is.null,description.is.null");
  else clubQ = clubQ.order("updated_at", { ascending: true, nullsFirst: true });
  const { data: clubs } = await clubQ.limit(LIMIT);

  for (const c of clubs ?? []) {
    try {
      const parsed = await askAI("club", c);
      if (!parsed) continue;
      const patch = buildPatch(c, parsed, mode);
      if (Object.keys(patch).length) {
        await admin.from("clubs").update(patch).eq("id", c.id);
        clubUpdated.push(c.name);
      }
    } catch (e) { console.error("club sync err", c.name, e); }
  }

  // --- Experiences ---
  try {
    let expQ = admin.from("experiences").select("id, name, area, country, opening_hours, image_url, description, website");
    if (country) expQ = expQ.eq("country", country);
    if (mode === "heal") expQ = expQ.or("image_url.is.null,opening_hours.is.null,description.is.null");
    else expQ = expQ.order("updated_at", { ascending: true, nullsFirst: true });
    const { data: exps } = await expQ.limit(LIMIT);
    for (const x of exps ?? []) {
      try {
        const parsed = await askAI("experience", x);
        if (!parsed) continue;
        const patch = buildPatch(x, parsed, mode);
        if (Object.keys(patch).length) {
          await admin.from("experiences").update(patch).eq("id", x.id);
          expUpdated.push(x.name);
        }
      } catch (e) { console.error("exp sync err", x.name, e); }
    }
  } catch (e) { console.error("experiences sync loop failed", e); }

  return new Response(JSON.stringify({
    ok: true, mode, country,
    clubs: clubUpdated, experiences: expUpdated,
    count: clubUpdated.length + expUpdated.length,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});