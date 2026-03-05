import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate embeddings using Lovable AI gateway (Gemini embedding model)
async function generateEmbedding(text: string): Promise<number[]> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Embedding API error:", err);
    throw new Error("Failed to generate embedding");
  }

  const data = await response.json();
  return data.embedding.values;
}

// Chunk text into smaller pieces
function chunkText(text: string, maxChunkSize = 500, overlap = 50): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxChunkSize && current) {
      chunks.push(current.trim());
      // Keep overlap
      const words = current.split(" ");
      current = words.slice(-Math.ceil(overlap / 5)).join(" ") + " " + sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "store_memory": {
        const { content, memory_type = "fact", conversation_id } = params;
        const embedding = await generateEmbedding(content);
        const { error } = await supabase.from("memory_embeddings").insert({
          user_id: user.id,
          content,
          memory_type,
          conversation_id: conversation_id || null,
          embedding: `[${embedding.join(",")}]`,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search_memory": {
        const { query, limit = 5, threshold = 0.5 } = params;
        const embedding = await generateEmbedding(query);
        const { data, error } = await supabase.rpc("search_memories", {
          query_embedding: `[${embedding.join(",")}]`,
          match_user_id: user.id,
          match_count: limit,
          match_threshold: threshold,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ memories: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "ingest_document": {
        const { title, content, source_type = "text" } = params;
        // Create document record
        const { data: doc, error: docError } = await supabase
          .from("knowledge_documents")
          .insert({ user_id: user.id, title, content, source_type, status: "processing" })
          .select()
          .single();
        if (docError) throw docError;

        // Chunk and embed
        const chunks = chunkText(content);
        const chunkInserts = [];
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(chunks[i]);
          chunkInserts.push({
            document_id: doc.id,
            user_id: user.id,
            content: chunks[i],
            chunk_index: i,
            embedding: `[${embedding.join(",")}]`,
          });
        }

        const { error: chunkError } = await supabase.from("knowledge_chunks").insert(chunkInserts);
        if (chunkError) throw chunkError;

        // Update document status
        await supabase.from("knowledge_documents")
          .update({ status: "ready", chunk_count: chunks.length })
          .eq("id", doc.id);

        return new Response(JSON.stringify({ document_id: doc.id, chunks: chunks.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search_knowledge": {
        const { query, limit = 5, threshold = 0.5 } = params;
        const embedding = await generateEmbedding(query);
        const { data, error } = await supabase.rpc("search_knowledge", {
          query_embedding: `[${embedding.join(",")}]`,
          match_user_id: user.id,
          match_count: limit,
          match_threshold: threshold,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ results: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "embed_query": {
        const { query } = params;
        const embedding = await generateEmbedding(query);
        return new Response(JSON.stringify({ embedding }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Memory/RAG error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
