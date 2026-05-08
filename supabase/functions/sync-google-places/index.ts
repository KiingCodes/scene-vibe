import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Places v1 "includedTypes" for each of our experience buckets.
// Workshops/pop-ups/markets/street_events have no perfect 1:1 in Places, so
// we pick the closest physical-venue analogues so the categories aren't empty.
const CATEGORY_TYPES: Record<string, string[]> = {
  food: ["restaurant", "cafe", "bakery", "meal_takeaway"],
  lounge: ["bar", "night_club"],
  market: ["market", "shopping_mall"],
  popup: ["art_gallery", "tourist_attraction"],
  workshop: ["performing_arts_theater", "community_center", "library"],
  street_event: ["amusement_park", "park", "tourist_attraction"],
};

/**
 * Pulls real food spots, cafés and lounges from Google Places (Nearby Search v1)
 * around a list of South African anchor points and upserts them into experiences.
 * Designed to be called on a 6-hour pg_cron schedule.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!PLACES_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let body: any = {};
  try { body = await req.json(); } catch { /* cron call has no body */ }

  // Anchor points: JHB CBD, Sandton, Rosebank, Pretoria CBD, Hatfield. Override via body.locations.
  const locations: Array<{ lat: number; lng: number; area: string }> = body.locations ?? [
    { lat: -26.2041, lng: 28.0473, area: "Johannesburg CBD" },
    { lat: -26.1076, lng: 28.0567, area: "Sandton" },
    { lat: -26.1467, lng: 28.0436, area: "Rosebank" },
    { lat: -25.7479, lng: 28.2293, area: "Pretoria CBD" },
    { lat: -25.7479, lng: 28.2378, area: "Hatfield" },
  ];
  const radius = body.radius ?? 2500;
  const targetCategories: string[] = body.categories ?? Object.keys(CATEGORY_TYPES);

  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const loc of locations) {
    for (const category of targetCategories) {
      const includedTypes = CATEGORY_TYPES[category];
      if (!includedTypes?.length) continue;
      try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.regularOpeningHours,places.priceLevel,places.photos,places.editorialSummary",
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: 10,
          locationRestriction: { circle: { center: { latitude: loc.lat, longitude: loc.lng }, radius } },
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("places error", category, loc.area, res.status, t);
        continue;
      }
      const json = await res.json();
      const places = json.places ?? [];

      for (const p of places) {
        const name = p.displayName?.text;
        if (!name) { skipped.push("no-name"); continue; }
        const lat = p.location?.latitude ?? null;
        const lng = p.location?.longitude ?? null;
        const address = p.formattedAddress ?? null;
        const hours = p.regularOpeningHours?.weekdayDescriptions?.join(" • ") ?? null;
        const description = p.editorialSummary?.text ?? null;
        let image_url: string | null = null;
        const photoName = p.photos?.[0]?.name;
        if (photoName) {
          // Photo media endpoint, returns redirect to image bytes — we keep the API URL as-is (browsers follow redirect)
          image_url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${PLACES_KEY}`;
        }

        // Dedupe by name + area
        const { data: existing } = await admin
          .from("experiences")
          .select("id")
          .eq("name", name)
          .eq("area", loc.area)
          .maybeSingle();

        const payload = {
          name,
          area: loc.area,
          address,
          lat,
          lng,
          category,
          opening_hours: hours,
          description,
          image_url,
          website: p.websiteUri ?? null,
          source_url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
          last_synced_at: new Date().toISOString(),
          status: "approved",
        };

        if (existing?.id) {
          await admin.from("experiences").update(payload).eq("id", existing.id);
        } else {
          const { error } = await admin.from("experiences").insert(payload);
          if (error) { skipped.push(name); continue; }
          inserted.push(name);
        }
      }
      } catch (e) {
        console.error("loc error", loc.area, category, e);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, inserted_count: inserted.length, inserted, skipped_count: skipped.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});