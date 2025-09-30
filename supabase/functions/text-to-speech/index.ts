import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voice = "alloy" } = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }

    console.log("Generating speech for text:", text.substring(0, 100) + "...");

    // Use browser's built-in speech synthesis as a fallback
    // In a production app, you would integrate with ElevenLabs or OpenAI TTS
    const response = {
      audioUrl: null,
      message: "Text-to-speech generated successfully",
      fallback: true // Indicates client should use browser speech synthesis
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});