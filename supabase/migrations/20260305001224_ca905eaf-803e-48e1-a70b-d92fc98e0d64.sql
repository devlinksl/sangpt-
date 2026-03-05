
-- Memory embeddings table for persistent AI memory
CREATE TABLE public.memory_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'conversation',
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge documents table for RAG
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge chunks with embeddings
CREATE TABLE public.knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_memory_user_id ON public.memory_embeddings(user_id);
CREATE INDEX idx_knowledge_docs_user_id ON public.knowledge_documents(user_id);
CREATE INDEX idx_knowledge_chunks_doc_id ON public.knowledge_chunks(document_id);

-- Add token_usage to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS token_usage INTEGER DEFAULT 0;

-- RLS for memory_embeddings
ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memories" ON public.memory_embeddings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.memory_embeddings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.memory_embeddings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for knowledge_documents
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own docs" ON public.knowledge_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own docs" ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own docs" ON public.knowledge_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own docs" ON public.knowledge_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chunks" ON public.knowledge_chunks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chunks" ON public.knowledge_chunks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chunks" ON public.knowledge_chunks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages update policy
CREATE POLICY "Users can update messages in their conversations" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- Memory search function
CREATE OR REPLACE FUNCTION public.search_memories(
  query_embedding vector(768),
  match_user_id UUID,
  match_count INTEGER DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (id UUID, content TEXT, memory_type TEXT, similarity FLOAT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT me.id, me.content, me.memory_type, (1 - (me.embedding <=> query_embedding))::float AS similarity
  FROM public.memory_embeddings me
  WHERE me.user_id = match_user_id AND (1 - (me.embedding <=> query_embedding))::float > match_threshold
  ORDER BY me.embedding <=> query_embedding LIMIT match_count;
END;
$$;

-- Knowledge search function
CREATE OR REPLACE FUNCTION public.search_knowledge(
  query_embedding vector(768),
  match_user_id UUID,
  match_count INTEGER DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (id UUID, content TEXT, document_id UUID, similarity FLOAT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT kc.id, kc.content, kc.document_id, (1 - (kc.embedding <=> query_embedding))::float AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.user_id = match_user_id AND (1 - (kc.embedding <=> query_embedding))::float > match_threshold
  ORDER BY kc.embedding <=> query_embedding LIMIT match_count;
END;
$$;
