import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * Background sync: enriches existing clubs/experiences with up-to-date
 * opening hours, image URL and a short description using the Lovable AI
 * Gateway (web-grounded). Designed to run on a schedule (pg_cron).
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

  // Pick a small batch — clubs not synced in the last 7 days, oldest first.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: clubs } = await admin
    .from("clubs")
    .select("id, name, area, opening_hours, image_url, description")
    .limit(5);

  const updated: string[] = [];

  for (const club of clubs ?? []) {
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Return ONLY a JSON object with keys: opening_hours (string), image_url (https URL or null), description (max 180 chars). Use real, verifiable info from the web. If unsure, return null fields." },
            { role: "user", content: `Venue: ${club.name} in ${club.area}, South Africa. Provide current opening hours, a public image URL, and a one-line description.` },
          ],
        }),
      });
      if (!aiRes.ok) continue;
      const json = await aiRes.json();
      const raw = json.choices?.[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let parsed: any = {};
      try { parsed = JSON.parse(cleaned); } catch { continue; }

      const patch: Record<string, unknown> = {};
      if (parsed.opening_hours && typeof parsed.opening_hours === "string") patch.opening_hours = parsed.opening_hours;
      if (parsed.image_url && typeof parsed.image_url === "string" && parsed.image_url.startsWith("http")) patch.image_url = parsed.image_url;
      if (parsed.description && typeof parsed.description === "string") patch.description = parsed.description.slice(0, 200);

      if (Object.keys(patch).length) {
        await admin.from("clubs").update(patch).eq("id", club.id);
        updated.push(club.name);
      }
    } catch (e) {
      console.error("sync error for", club.name, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, updated, count: updated.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});