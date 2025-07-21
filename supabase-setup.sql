-- Supabase Setup Script for Clause AI
-- Run this in your Supabase SQL Editor

-- 1. Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id uuid NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index int,
  created_at timestamp DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for users to access their own document chunks
CREATE POLICY "Users can access their own document chunks"
ON public.document_chunks FOR ALL
USING (auth.uid() = user_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON public.document_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_created_at ON public.document_chunks(created_at);

-- 6. Create index for vector similarity search (for future RAG functionality)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 7. Optional: Create a documents table for metadata (for future features)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text,
  file_type text,
  file_size bigint,
  total_chunks int DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 8. Enable RLS for documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 9. Create policy for documents table
CREATE POLICY "Users can access their own documents"
ON public.documents FOR ALL
USING (auth.uid() = user_id);

-- 10. Create indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create trigger for documents table
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON public.documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant permissions (if needed)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.document_chunks TO authenticated;
GRANT ALL ON public.documents TO authenticated;

-- Setup complete!
-- Now configure your .env.local file with:
-- NEXT_PUBLIC_SUPABASE_URL=your_project_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key 