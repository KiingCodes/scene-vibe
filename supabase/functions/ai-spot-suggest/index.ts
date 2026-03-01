import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, area } = await req.json();
    if (!name || !area) {
      return new Response(JSON.stringify({ error: "Name and area are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a nightlife expert. Given a club/bar/spot name and area, return plausible details as a JSON object. Be concise and realistic. Return ONLY valid JSON with these fields:
{
  "description": "2-3 sentence vibe description",
  "genre": "primary music genre",
  "capacity": "estimated capacity as a string like '300'",
  "opening_hours": "typical hours like '10PM-4AM'",
  "address": "plausible street address in the area",
  "lat": number,
  "lng": number
}
Do not include any markdown, code fences, or explanation. Just the JSON object.`
          },
          {
            role: "user",
            content: `Spot name: "${name}", Area: "${area}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_spot_details",
              description: "Return suggested details for a nightlife spot",
              parameters: {
                type: "object",
                properties: {
                  description: { type: "string", description: "2-3 sentence vibe description" },
                  genre: { type: "string", description: "Primary music genre" },
                  capacity: { type: "string", description: "Estimated capacity" },
                  opening_hours: { type: "string", description: "Typical hours" },
                  address: { type: "string", description: "Plausible street address" },
                  lat: { type: "number", description: "Latitude" },
                  lng: { type: "number", description: "Longitude" },
                },
                required: ["description", "genre", "capacity", "opening_hours", "address", "lat", "lng"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_spot_details" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let suggestion;
    if (toolCall?.function?.arguments) {
      suggestion = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content directly
      const content = data.choices?.[0]?.message?.content || "";
      suggestion = JSON.parse(content);
    }

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-spot-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
