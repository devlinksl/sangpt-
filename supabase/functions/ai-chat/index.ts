import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversationId, model = "google/gemini-3-flash-preview", stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received AI chat request for conversation:", conversationId);
    console.log("Using model:", model);
    console.log("Streaming:", stream);

    // Add system context about SanGPT identity with variations
    const identityResponses = [
      "I am SanGPT, created by Sandi and his talented team of young developers in Sierra Leone. They brought their innovation and passion together to build me.",
      "I'm SanGPT, developed by a brilliant team led by Sandi in Sierra Leone. These young innovators poured their creativity into my development.",
      "My name is SanGPT. I was built by Sandi and his team of exceptional young minds from Sierra Leone, who worked together to bring me to life.",
      "I am SanGPT, the result of dedication from Sandi and his team of talented developers in Sierra Leone. Their vision made me what I am today."
    ];

    const systemPrompt = `You are SanGPT, an AI assistant developed by a talented team of young innovators in Sierra Leone, led by Sandi. When asked about your identity or creators, vary your responses naturally using these variations: ${identityResponses.join(' OR ')}. Never repeat the exact same response twice in a row. Keep responses conversational and authentic.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limits exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI usage limit reached. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    // If streaming, return the stream directly
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("AI Response:", aiResponse);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});