CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    query text NOT NULL,
    sources jsonb DEFAULT '{"arxiv": true, "pubmed": true, "patents": false, "clinical": true}'::jsonb,
    max_results integer DEFAULT 20,
    results jsonb,
    synthesis text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: uploaded_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploaded_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    filename text NOT NULL,
    storage_path text NOT NULL,
    file_size bigint,
    mime_type text,
    status text DEFAULT 'uploaded'::text,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    CONSTRAINT uploaded_documents_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: uploaded_documents uploaded_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploaded_documents
    ADD CONSTRAINT uploaded_documents_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: uploaded_documents uploaded_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploaded_documents
    ADD CONSTRAINT uploaded_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: uploaded_documents Users can delete their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own documents" ON public.uploaded_documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_searches Users can delete their own searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own searches" ON public.saved_searches FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: uploaded_documents Users can insert their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own documents" ON public.uploaded_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_searches Users can insert their own searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own searches" ON public.saved_searches FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: uploaded_documents Users can update their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own documents" ON public.uploaded_documents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: uploaded_documents Users can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own documents" ON public.uploaded_documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_searches Users can view their own searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own searches" ON public.saved_searches FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

--
-- Name: uploaded_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


