import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversationId, model = "gemini-2.0-flash-exp" } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Received Gemini chat request for conversation:", conversationId);
    console.log("Using model:", model);
    console.log("Messages:", messages);

    // Add system context - only respond about identity when explicitly asked
    const systemPrompt = {
      role: "user",
      parts: [{ 
        text: `You are SanGPT, an AI assistant. IMPORTANT: Only mention your identity or creators when the user SPECIFICALLY asks questions like "who are you?", "what are you?", "who made you?", or "who created you?". For such questions, respond: "I am SanGPT, a large language model trained by Sandi and his team." For all other conversations, respond naturally to the user's actual question without introducing yourself.`
      }]
    };

    const modelResponse = {
      role: "model",
      parts: [{ text: "Understood. I will only mention my identity when explicitly asked about it." }]
    };

    // Transform messages to Gemini format
    const geminiMessages = [
      systemPrompt,
      modelResponse,
      ...messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limits exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Failed to get Gemini response");
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from Gemini");
    }

    console.log("Gemini Response:", aiResponse);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
