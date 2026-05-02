--
-- PostgreSQL database dump
--

\restrict zmMjiOrH4HlXx42pusD4MqseJdc5YkWl3KRpGDyPMFvxQlqqpeem59L2zfh8ZJX

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-05-01 19:26:33 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.messages DROP CONSTRAINT messages_conversation_id_fkey;
DROP TRIGGER trigger_update_conversation_timestamp ON public.messages;
DROP INDEX public.idx_offers_status_pending;
DROP INDEX public.idx_offers_conversation_id;
DROP INDEX public.idx_messages_created;
DROP INDEX public.idx_messages_conversation;
DROP INDEX public.idx_conversations_updated;
DROP INDEX public.idx_conversations_participant2;
DROP INDEX public.idx_conversations_participant1;
ALTER TABLE ONLY public.user_language_preferences DROP CONSTRAINT user_language_preferences_pkey;
ALTER TABLE ONLY public.offers DROP CONSTRAINT offers_pkey;
ALTER TABLE ONLY public.messages DROP CONSTRAINT messages_pkey;
ALTER TABLE ONLY public.conversations DROP CONSTRAINT conversations_pkey;
ALTER TABLE ONLY public.conversations DROP CONSTRAINT conversations_participant1_id_participant2_id_product_id_key;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_name_key;
ALTER TABLE public._migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.user_language_preferences;
DROP TABLE public.offers;
DROP TABLE public.messages;
DROP TABLE public.conversations;
DROP SEQUENCE public._migrations_id_seq;
DROP TABLE public._migrations;
DROP FUNCTION public.update_conversation_timestamp();
DROP EXTENSION pgcrypto;
--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3513 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 257 (class 1255 OID 16469)
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16534)
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16533)
-- Name: _migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3514 (class 0 OID 0)
-- Dependencies: 219
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- TOC entry 215 (class 1259 OID 16425)
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant1_id uuid NOT NULL,
    participant1_type character varying(10) NOT NULL,
    participant2_id uuid NOT NULL,
    participant2_type character varying(10) NOT NULL,
    product_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT conversations_participant1_type_check CHECK (((participant1_type)::text = ANY ((ARRAY['user'::character varying, 'vendor'::character varying])::text[]))),
    CONSTRAINT conversations_participant2_type_check CHECK (((participant2_type)::text = ANY ((ARRAY['user'::character varying, 'vendor'::character varying])::text[])))
);


--
-- TOC entry 216 (class 1259 OID 16437)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid,
    sender_id uuid NOT NULL,
    sender_type character varying(10) NOT NULL,
    original_text text NOT NULL,
    original_language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone,
    media_url text,
    media_type character varying(20),
    type character varying(20) DEFAULT 'text'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT messages_sender_type_check CHECK (((sender_type)::text = ANY ((ARRAY['user'::character varying, 'vendor'::character varying])::text[])))
);


--
-- TOC entry 218 (class 1259 OID 16522)
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    message_id uuid,
    sender_id uuid NOT NULL,
    proposed_price numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    counter_offer_id uuid,
    expires_at timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT offers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'countered'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- TOC entry 217 (class 1259 OID 16454)
-- Name: user_language_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_language_preferences (
    user_id uuid NOT NULL,
    user_type character varying(10) NOT NULL,
    preferred_language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    auto_translate boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT user_language_preferences_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['user'::character varying, 'vendor'::character varying])::text[])))
);


--
-- TOC entry 3330 (class 2604 OID 16537)
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- TOC entry 3507 (class 0 OID 16534)
-- Dependencies: 220
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._migrations (id, name, applied_at) FROM stdin;
1	001_initial_schema.sql	2026-04-04 16:40:48.785412+00
\.


--
-- TOC entry 3502 (class 0 OID 16425)
-- Dependencies: 215
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, participant1_id, participant1_type, participant2_id, participant2_type, product_id, created_at, updated_at) FROM stdin;
7327b573-b0cf-4878-9ae4-ebb805367236	bb1279cc-4717-437d-a035-312e09c28363	user	43dc8866-7112-43d6-b104-8f17642eb453	user	4fe3c678-c936-460f-aa30-251fb2d99d83	2026-04-05 16:47:05.274	2026-04-05 16:47:38.391181
211bfb6e-fe8d-4a9b-8daa-805b4b42a558	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	43dc8866-7112-43d6-b104-8f17642eb453	user	4fe3c678-c936-460f-aa30-251fb2d99d83	2026-04-05 16:46:00.605206	2026-04-05 18:23:05.47049
c3904724-003a-42e5-b98c-b6a8de3fd9bc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	75237ae6-c81d-41cd-88c9-8ea0f8beeb74	2026-04-07 04:55:57.39272	2026-04-07 04:55:57.39272
858cffa1-39dd-426a-8ced-eac00fd92dd1	5128d5ac-fa24-4908-ae52-776105339c91	user	43dc8866-7112-43d6-b104-8f17642eb453	user	4fe3c678-c936-460f-aa30-251fb2d99d83	2026-04-05 18:46:53.59675	2026-04-06 05:36:21.2943
819dc592-946a-4de5-adb3-a0ac91a9db14	5761ed90-824c-428d-9ed2-1bef0a7a84b8	user	a192b684-7720-4244-b438-bcdc21132ced	vendor	\N	2026-02-04 02:09:16.56976	2026-02-04 02:09:16.56976
d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	a192b684-7720-4244-b438-bcdc21132ced	vendor	\N	2026-02-02 08:32:42.508515	2026-02-06 04:46:31.644467
05c60274-dee3-4955-a830-d16616358cc1	ab4825d7-288d-48bb-8ae8-b8c10e5740c8	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-08 00:01:23.637428	2026-02-08 00:01:23.637428
8c90d859-c65c-4699-98dd-82b214f2bcfd	3f222be4-8ce8-4690-b0a3-c9d52f10832c	user	43dc8866-7112-43d6-b104-8f17642eb453	user	4fe3c678-c936-460f-aa30-251fb2d99d83	2026-04-05 19:49:41.188159	2026-04-06 05:36:25.6817
14eadaca-b9de-4d91-ae16-28317afb2271	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	b1076367-db11-423c-93e2-d1407c1fbb8a	2026-04-07 04:25:00.437292	2026-04-07 12:20:35.8759
dacf611a-f685-4e1e-94ee-7c7207381ac7	08d839a8-dae3-4af0-a57f-6ad714c14116	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-13 17:36:56.441257	2026-02-13 17:37:57.878188
c0c3aef2-1e49-44fd-824a-197dbfc13c25	6271aa07-c86b-4cbc-9ca5-6194bf040884	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-22 22:00:56.414867	2026-02-22 22:00:56.414867
9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	\N	2026-01-15 15:13:37.173079	2026-01-16 08:51:46.926045
9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-03 17:56:47.128112	2026-03-02 02:38:52.887489
9e0a158a-2640-4664-8e56-003c8182084f	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	\N	2026-01-18 21:25:46.78827	2026-01-19 00:01:16.76846
1a30f99f-c6c2-4622-8394-d4a62b5ba162	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	b0000000-0000-0000-0000-000000000007	vendor	\N	2026-01-19 13:25:42.214861	2026-01-19 13:25:42.214861
cf61677f-06f8-4621-a7a6-73afc10c4aee	84709e04-5c64-466c-bb81-5d86b99509d4	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-04 02:40:40.564495	2026-02-04 05:23:46.493507
7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	43acdeeb-06ad-463d-a96a-ea5422dfce93	2026-04-06 10:17:53.999693	2026-04-08 16:58:38.508383
bb0d2c8f-5a61-40cc-aebd-b7f7931539e6	3579a216-37d9-42de-9c9d-d428fd059b69	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-05 01:44:00.13037	2026-02-05 01:44:00.13037
444f853e-35c4-4b62-935f-29eecadece1f	a0000000-0000-0000-0000-000000000001	user	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	\N	2026-02-05 02:22:47.272513	2026-02-05 02:22:47.272513
447952c3-ac61-4c9c-82da-15b964abd119	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	ceae7cf7-141e-4037-a22f-5eeea5913207	vendor	\N	2026-01-15 14:23:50.922516	2026-01-26 04:53:24.455399
918d265f-8c85-4f23-80c3-d81f75f02943	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	user	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	\N	2026-01-28 02:25:17.485432	2026-01-28 02:25:17.485432
0ddf0828-c9eb-4042-ae46-962c934bf2e8	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	00000000-0000-0000-0000-000000000001	user	\N	2026-03-10 14:01:23.250211	2026-03-10 14:01:23.279995
6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	\N	2026-02-03 02:06:29.926166	2026-02-05 02:29:55.862852
5c01e594-91bb-441d-b4b1-f7a3c2474e73	0da270c3-291b-4d45-989d-5c3c81af4e9e	user	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	\N	2026-02-01 07:01:22.490036	2026-02-01 07:01:29.632059
00ed231e-6e9f-4d5f-b248-fc24426c549d	bb1279cc-4717-437d-a035-312e09c28363	user	00000000-0000-0000-0000-000000000001	user	\N	2026-03-16 00:18:27.042656	2026-03-22 12:58:30.090269
7cb71606-0f94-42b3-9da9-b24848c2dbf7	5128d5ac-fa24-4908-ae52-776105339c91	user	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	90f1660b-0e49-46cb-aa13-06864b5f0db6	2026-04-03 22:50:19.609321	2026-04-03 22:50:19.609321
430eeb64-bf5e-4fc0-bea2-70f3d32ff37f	bb1279cc-4717-437d-a035-312e09c28363	user	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	fbca4800-d1c0-46ba-92fd-b2af7bc2a5f5	2026-04-04 14:49:43.734671	2026-04-04 17:25:19.695584
1ef8259c-1833-4edc-8845-f01d0bc0ffb1	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	b8c1ef7f-72eb-4d94-9696-9c24377a0b35	vendor	\N	2026-02-03 03:38:29.358912	2026-02-03 03:38:39.592777
60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	\N	2026-02-06 00:39:03.961077	2026-02-06 01:47:24.229085
e67a2058-972a-4916-b84f-1f66d0dd622c	bb1279cc-4717-437d-a035-312e09c28363	user	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	90f1660b-0e49-46cb-aa13-06864b5f0db6	2026-04-04 17:12:18.816685	2026-04-05 00:30:19.905906
b92400cd-0568-4f9b-abca-2cd56c7bb7f9	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	\N	2026-02-06 02:03:30.494952	2026-02-06 02:07:58.166478
c0b626c0-a58c-4d7a-8db8-611305cf8d1b	5128d5ac-fa24-4908-ae52-776105339c91	user	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	4fd56e63-3457-41ff-a4bb-4a5d94f5bafc	2026-04-05 00:14:49.790133	2026-04-05 00:51:19.022904
7395e6bb-40c3-4368-bba9-c3d68613f464	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	00000000-0000-0000-0000-000000000001	user	\N	2026-04-06 03:43:30.676319	2026-04-07 04:22:48.829399
a8c2d936-0895-4027-adac-e41ad19eb774	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	90f1660b-0e49-46cb-aa13-06864b5f0db6	2026-04-06 07:26:13.189362	2026-04-07 04:22:48.829399
58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	67a872f0-802e-4322-97d7-5e2bf1f767af	2026-04-06 11:23:33.757429	2026-04-07 04:22:48.841561
\.


--
-- TOC entry 3503 (class 0 OID 16437)
-- Dependencies: 216
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, sender_id, sender_type, original_text, original_language, translations, created_at, read_at, media_url, media_type, type, metadata) FROM stdin;
5bc7be97-530c-47f1-9ca3-1290d5a519a3	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	test	en	{"en": "test"}	2026-01-15 15:17:54.029329	2026-01-16 02:21:20.44599	\N	\N	text	{}
b8278149-ae42-4e6e-b24f-4364546ef2eb	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	Hey! I am looking for some Nike Air Max. Do you have any in stock?	en	{"en": "Hey! I am looking for some Nike Air Max. Do you have any in stock?"}	2026-01-15 15:13:50.5436	2026-01-16 02:21:20.44599	\N	\N	text	{}
22ad72c9-a9c9-4ebc-bb99-b7c76fc7b8da	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	Hi there! Yes, we have several Air Max models. What size are you looking for?	en	{"en": "Hi there! Yes, we have several Air Max models. What size are you looking for?"}	2026-01-15 15:13:50.5436	2026-01-16 02:21:20.44599	\N	\N	text	{}
b4ff2830-4442-4867-8e96-93a65f2bcd08	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	Size 11 US. What colors do you have?	en	{"en": "Size 11 US. What colors do you have?"}	2026-01-15 15:13:50.5436	2026-01-16 02:21:20.44599	\N	\N	text	{}
036a6ef2-d147-4e57-93a7-92a43c599bb1	447952c3-ac61-4c9c-82da-15b964abd119	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	Test one two three	en	{"en": "Test one two three"}	2026-01-16 02:21:35.809463	\N	\N	\N	text	{}
86c7d8c8-066d-472d-8852-b8426bfb0b9b	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	test	en	{"en": "test"}	2026-01-16 08:44:22.400858	2026-01-16 08:48:13.482589	\N	\N	text	{}
3c49cafc-2315-40f1-91ff-356e8f82b687	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	Hello	en	{"en": "Hello"}	2026-01-16 08:48:23.579235	2026-01-16 08:48:27.012489	\N	\N	text	{}
df51e9b6-2ced-4260-a90a-7e9355186eb7	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	你好 (Nǐ hǎo)	zh-CN	{"en": "Hello (Nǐ hǎo)", "zh-CN": "你好 (Nǐ hǎo)"}	2026-01-16 08:49:37.015372	2026-01-16 08:50:24.125942	\N	\N	text	{}
2df6d197-761c-4f0b-9fa7-3f7fc4110347	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	5692e26e-739c-4fad-ae03-fa483b192484	user	你好吗？(Nǐ hǎo ma?)	zh-CN	{"en": "How are you?", "zh-CN": "你好吗？(Nǐ hǎo ma?)"}	2026-01-16 08:51:20.446644	2026-01-16 08:51:28.721105	\N	\N	text	{}
313611df-54a8-44a8-9780-97359358e0c6	9234deb4-a1a8-43d7-b85a-4c40f3be16ab	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	I’m doing good!	en	{"en": "I’m doing good!", "zh": "我很好！"}	2026-01-16 08:51:46.919871	2026-01-16 08:52:00.982445	\N	\N	text	{}
568b6895-9001-4bb6-a6df-550d82acca42	9e0a158a-2640-4664-8e56-003c8182084f	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	vendor	test	en	{"en": "test", "zh": "测试"}	2026-01-19 00:01:16.761606	2026-01-19 00:01:31.206377	\N	\N	text	{}
24dd4c92-576b-4ee8-a09d-366d8fcafb18	447952c3-ac61-4c9c-82da-15b964abd119	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	yo	ht	{"en": "them", "ht": "yo"}	2026-01-26 04:52:53.592615	\N	\N	\N	text	{}
67772f21-49ca-47f7-ad1c-ebd4bd17b42e	447952c3-ac61-4c9c-82da-15b964abd119	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	hello	en	{"en": "hello"}	2026-01-26 04:53:05.321891	\N	\N	\N	text	{}
e9d9becd-c9ee-481d-b0f6-bee3fa9f893e	447952c3-ac61-4c9c-82da-15b964abd119	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	hello	en	{"en": "hello"}	2026-01-26 04:53:24.45227	\N	\N	\N	text	{}
79487b78-2dc7-438a-903e-02f6d60dacf2	5c01e594-91bb-441d-b4b1-f7a3c2474e73	0da270c3-291b-4d45-989d-5c3c81af4e9e	user	你好	zh-CN	{"en": "Hello", "zh-CN": "你好"}	2026-02-01 07:01:29.621407	\N	\N	\N	text	{}
7b9bcfe1-f518-472f-9d61-67e40c1d021f	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	hello how are you?	en	{"en": "hello how are you?"}	2026-02-02 08:33:20.944359	2026-02-02 08:33:27.660292	\N	\N	text	{}
8ddf21d5-1869-429b-a23b-a995b590ff0e	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	hello,friend.	en	{"en": "hello,friend."}	2026-02-02 08:33:48.216405	2026-02-02 08:34:18.912598	\N	\N	text	{}
5ffb9ed6-fe6b-451b-9a4a-2ff3b524865a	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	good,how are you? how can i help you?	en	{"en": "good,how are you? how can i help you?"}	2026-02-02 08:34:24.763212	2026-02-02 08:34:34.095576	\N	\N	text	{}
6637c2a5-4078-45aa-aa5c-196f43052c3d	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I noticed you are a new store. how long before your done setting up your store?	en	{"en": "I noticed you are a new store. how long before your done setting up your store?"}	2026-02-02 08:35:16.074348	2026-02-02 08:35:28.375422	\N	\N	text	{}
935c6b8b-d20a-41eb-a7aa-af9baf384381	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	have 13 years,friend.	en	{"en": "have 13 years,friend."}	2026-02-02 08:35:44.632081	2026-02-02 08:36:26.29612	\N	\N	text	{}
85692759-7516-4fa1-b755-a2ef6b95dee8	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	we are ppf supplier from Guangzhou,china.	en	{"en": "we are ppf supplier from Guangzhou,china."}	2026-02-02 08:36:08.553366	2026-02-02 08:36:26.29612	\N	\N	text	{}
f6c8933c-ad04-4ac9-94ee-7218f99e733c	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	is the Glossy TPU PPF the only thing your selling?	en	{"en": "is the Glossy TPU PPF the only thing your selling?"}	2026-02-02 08:35:48.02652	2026-02-02 08:37:07.086319	\N	\N	text	{}
e4edecaa-3d36-4eb0-b130-94c6dd514235	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	we sells ppf,window film, color wrap vinyl,window tint film,led lens projector	en	{"en": "we sells ppf,window film, color wrap vinyl,window tint film,led lens projector"}	2026-02-02 08:36:56.691205	2026-02-02 08:37:07.086319	\N	\N	text	{}
9a83da7c-27ff-4a08-8a76-53c17c8a79e1	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I would like to browse through your products	en	{"en": "I would like to browse through your products"}	2026-02-02 08:36:59.110885	2026-02-02 08:37:07.086319	\N	\N	text	{}
faa73a4f-afc1-4781-97af-26afc440cf5b	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	no problem, i can send website to you,can have a look.	en	{"en": "no problem, i can send website to you,can have a look."}	2026-02-02 08:37:42.160018	2026-02-02 08:37:54.934398	\N	\N	text	{}
a1eab1d5-1791-4346-a258-e56a006ab6e3	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	http://www.icarnfts.c​​om https://www.cartpuppf.com	en	{"en": "http://www.icarnfts.c​​om https://www.cartpuppf.com"}	2026-02-02 08:38:07.451862	2026-02-02 08:38:15.527934	\N	\N	text	{}
d977e083-a518-42da-847a-08a3a052e0f3	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	are you going to upload more products to your store?	en	{"en": "are you going to upload more products to your store?"}	2026-02-02 08:37:33.713625	2026-02-02 08:38:16.463335	\N	\N	text	{}
51b5611d-4e3a-4ff4-a9a2-43fc40cdebf9	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	no problem I will take a look	en	{"en": "no problem I will take a look"}	2026-02-02 08:38:48.028556	2026-02-02 08:38:56.760188	\N	\N	text	{}
b0c54839-5b1c-4471-9c47-f78c6035989c	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	okay,if you need can tell me.i can give a good price.	en	{"en": "okay,if you need can tell me.i can give a good price."}	2026-02-02 08:39:23.712664	2026-02-02 08:39:30.138503	\N	\N	text	{}
3637fc11-2f4a-4994-aedd-54fdd869a519	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	i'm not sure.as you can see,it will takes a few days design it.	en	{"en": "i'm not sure.as you can see,it will takes a few days design it."}	2026-02-02 08:41:49.224041	2026-02-02 08:41:55.609856	\N	\N	text	{}
c154c8fb-54d2-499b-bb0e-6a069ef0967d	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	i will uplode more asap.	en	{"en": "i will uplode more asap."}	2026-02-02 08:43:08.758017	2026-02-02 08:43:41.723932	\N	\N	text	{}
ecc5bcf0-2b8d-477a-a1e4-4c875074ba45	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	yes then maybe I can add to my cart and order.thank you	en	{"en": "yes then maybe I can add to my cart and order.thank you"}	2026-02-02 08:44:19.049838	2026-02-02 08:46:20.328525	\N	\N	text	{}
1b919122-74d4-4704-950c-fc20e2513619	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	usually a roll glossy ppf 7.5mil is 186$ a roll,not including shipping fees. if you need now,can tell me your address calculate shipping fees,make invoice to you.then payment and arrange shipping.	en	{"en": "usually a roll glossy ppf 7.5mil is 186$ a roll,not including shipping fees. if you need now,can tell me your address calculate shipping fees,make invoice to you.then payment and arrange shipping."}	2026-02-02 08:50:47.049258	2026-02-02 08:52:01.464749	\N	\N	text	{}
de89ea27-90f0-41a5-8668-ebce2da53c63	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I see I add to my cart and checkout when I find what I'm looking for.	en	{"en": "I see I add to my cart and checkout when I find what I'm looking for."}	2026-02-02 09:00:50.864253	2026-02-02 09:00:58.983141	\N	\N	text	{}
38d306fc-706c-4f50-96ab-8476bf90b541	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	okay,friend.	en	{"en": "okay,friend."}	2026-02-02 09:01:24.682654	2026-02-02 09:01:31.423699	\N	\N	text	{}
2f4baf90-6fac-499f-97f2-6d4e0f591e0b	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	waiting on my partner to wakeup to help me shop	en	{"en": "waiting on my partner to wakeup to help me shop"}	2026-02-02 09:39:35.122256	2026-02-03 01:44:16.288758	\N	\N	text	{}
5cb47dc1-b5fd-4262-8bc0-6ba83e618db2	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	hello how are you?	en	{"en": "hello how are you?"}	2026-02-03 02:06:44.134883	2026-02-03 02:06:51.577529	\N	\N	text	{}
9c806875-9b87-4adc-93f8-ac6bf3430817	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	Hey dear friend	en	{"en": "Hey dear friend"}	2026-02-03 02:07:36.67007	2026-02-03 02:07:48.744829	\N	\N	text	{}
5dfd06ba-c138-4632-9aa1-1ec7ab82ef8a	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I see your a new store? is thus	en	{"en": "I see your a new store? is thus"}	2026-02-03 02:08:10.32821	2026-02-03 02:08:47.399352	\N	\N	text	{}
ec846e57-f888-43bb-b7fd-be67595e9f63	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	is this all your items?	en	{"en": "is this all your items?"}	2026-02-03 02:08:20.119407	2026-02-03 02:08:47.399352	\N	\N	text	{}
cb7dfd97-c28a-479c-9432-32840f975340	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	do you ship to America?	en	{"en": "do you ship to America?"}	2026-02-03 02:08:30.643282	2026-02-03 02:08:47.399352	\N	\N	text	{}
6fd91563-a960-4650-9ff7-6839da983f2d	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	Can ship to the US, dear friend	en	{"en": "Can ship to the US, dear friend"}	2026-02-03 02:09:38.387841	2026-02-03 02:10:06.667558	\N	\N	text	{}
fa131306-6e31-4ab9-8190-47ed8654dc8e	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	whatApp13617494776	ms	{"en": "whatApp13617494776", "ms": "whatApp13617494776"}	2026-02-03 02:11:13.203462	2026-02-03 02:11:30.755391	\N	\N	text	{}
da5793d4-bae6-4023-aed2-c2b22e8fa3a2	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	Hey there, dear friend!	en	{"en": "Hey there, dear friend!"}	2026-02-03 02:13:59.228476	2026-02-03 02:15:19.20589	\N	\N	text	{}
f99e0bbc-3e64-403c-9107-07e2be7f710a	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I will search and pay through the platform	en	{"en": "I will search and pay through the platform"}	2026-02-03 02:15:40.70308	2026-02-03 02:24:47.6656	\N	\N	text	{}
8f981aab-784e-4756-94ab-490ef526699f	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	secure for both of us to guarantee delivery	en	{"en": "secure for both of us to guarantee delivery"}	2026-02-03 02:16:02.679457	2026-02-03 02:24:47.6656	\N	\N	text	{}
6aaf1ed5-cb90-4871-b44d-382832a03059	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	Sure, dear friend. You can also add me on WhatsApp.	en	{"en": "Sure, dear friend. You can also add me on WhatsApp."}	2026-02-03 02:26:12.994366	2026-02-03 02:32:31.495564	\N	\N	text	{}
366d5a24-4b8a-4b86-974f-ab7dda5e12d0	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	vendor	I sell a lot of products.	en	{"en": "I sell a lot of products."}	2026-02-03 02:26:44.50338	2026-02-03 02:32:31.495564	\N	\N	text	{}
5f31c9f4-e550-4d4e-a565-7a775fe5a5e1	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	yes I see	en	{"en": "yes I see"}	2026-02-03 02:35:42.303128	\N	\N	\N	text	{}
07858fb0-05b3-4a34-9b9f-38d2300c8a21	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	ill shop with you when I see more items	en	{"en": "ill shop with you when I see more items"}	2026-02-03 02:37:33.304789	\N	\N	\N	text	{}
eeb12db0-e2df-4d10-b583-5cbdd9ef3a78	1ef8259c-1833-4edc-8845-f01d0bc0ffb1	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	hello	en	{"en": "hello"}	2026-02-03 03:38:39.586034	\N	\N	\N	text	{}
414624ab-bbf6-472d-84d8-0e024cdc9e28	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	hello	en	{"en": "hello"}	2026-02-03 17:56:52.77997	2026-02-03 17:58:28.691881	\N	\N	text	{}
b40fd491-c6d9-4a48-9c40-1e316a81a332	9f392ecd-dc03-4cf5-b4e9-f935747e9777	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	hello .	en	{"en": "hello ."}	2026-02-03 17:58:32.446933	2026-02-03 17:59:00.837189	\N	\N	text	{}
40a238c8-2cc2-4053-9a9d-99efc8b1f548	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	I see your shoes I will order a pair today	en	{"en": "I see your shoes I will order a pair today"}	2026-02-03 17:59:21.440878	2026-02-03 18:07:52.403695	\N	\N	text	{}
2696af23-3d63-476b-aa18-8627cc75d13f	9f392ecd-dc03-4cf5-b4e9-f935747e9777	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	ok . thanks .	en	{"en": "ok . thanks ."}	2026-02-03 18:08:06.590176	2026-02-03 18:08:17.587402	\N	\N	text	{}
040a2d89-0779-4788-b345-f8ee59c82ec2	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	Hello do you have window tints as well?	en	{"en": "Hello do you have window tints as well?"}	2026-02-03 16:51:42.669232	2026-02-04 01:36:16.557245	\N	\N	text	{}
3257515f-0bf8-4ac7-adbe-e06ce4dbe60f	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	hello,friend. yes,we have window tint film.	en	{"en": "hello,friend. yes,we have window tint film."}	2026-02-04 01:36:40.536656	2026-02-04 01:37:07.760257	\N	\N	text	{}
681647ee-7be7-4bf8-95b4-88f57554d2ab	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	we have 1py,2ply dye film.nano ceramic film. usually a roll nano ceramic film 116$,not including shipping fees.	en	{"en": "we have 1py,2ply dye film.nano ceramic film. usually a roll nano ceramic film 116$,not including shipping fees."}	2026-02-04 01:38:58.136284	2026-02-04 01:40:36.875	\N	\N	text	{}
6c305bc6-368f-4bf0-86d4-dc6cf527792e	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	1.52*30m,VLT5,15,30,50,70,75%.	en	{"en": "1.52*30m,VLT5,15,30,50,70,75%."}	2026-02-04 01:40:25.636127	2026-02-04 01:40:36.875	\N	\N	text	{}
951fd9c5-060f-46ed-baf5-c8f8dddca2ea	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	do you have whatsapp or instagram?i can send more photos or videos details to you. my whatsapp is +8615920178845.my instagram is icarnfts_ppf_rowan.	en	{"en": "do you have whatsapp or instagram?i can send more photos or videos details to you. my whatsapp is +8615920178845.my instagram is icarnfts_ppf_rowan."}	2026-02-04 01:42:55.430252	2026-02-04 01:43:03.564025	\N	\N	text	{}
acc7f568-53e9-4a8d-bf69-9946259c37f4	cf61677f-06f8-4621-a7a6-73afc10c4aee	84709e04-5c64-466c-bb81-5d86b99509d4	user	Size 12	en	{"en": "Size 12"}	2026-02-04 02:40:56.192993	2026-02-04 05:23:37.329648	\N	\N	text	{}
46696aa1-eadd-4726-8fb6-9300321fa5d0	cf61677f-06f8-4621-a7a6-73afc10c4aee	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	hello	en	{"en": "hello"}	2026-02-04 05:23:41.305911	\N	\N	\N	text	{}
ed2065ef-b1be-4167-aaec-b2f5b79cee48	cf61677f-06f8-4621-a7a6-73afc10c4aee	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	what shoes in sz 12 ?	en	{"en": "what shoes in sz 12 ?"}	2026-02-04 05:23:46.488391	\N	\N	\N	text	{}
be4fbdda-57d6-43e9-bc05-da30fdc909e1	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	tech fixing payment processor now to get your order done	en	{"en": "tech fixing payment processor now to get your order done"}	2026-02-04 01:23:35.488363	2026-02-04 05:23:51.020056	\N	\N	text	{}
5e6b3e35-59f3-4eb1-8aef-3bb05a391b16	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	It was an order placed did you see it bro?	en	{"en": "It was an order placed did you see it bro?"}	2026-02-04 02:41:23.024482	2026-02-04 05:23:51.020056	\N	\N	text	{}
fb54fc19-bbb4-436b-84ff-8a892857b8d0	9f392ecd-dc03-4cf5-b4e9-f935747e9777	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	vendor	let me see	en	{"en": "let me see"}	2026-02-04 05:23:58.331104	2026-02-04 05:50:47.708661	\N	\N	text	{}
5195e040-ee17-4f61-9ba2-e465de55eaf0	6c7db9b0-db6a-4bad-bcb1-dcb04800e92b	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	hello	en	{"en": "hello"}	2026-02-05 02:29:55.854571	\N	\N	\N	text	{}
56ff4706-f5df-435d-85ce-8d4f46310fcd	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user	Hey what sizes do you have available?	en	{"en": "Hey what sizes do you have available?"}	2026-02-06 00:39:33.954954	2026-02-06 00:39:56.59859	\N	\N	text	{}
7ae0de72-96cf-4ea5-8b01-8b6b393617ea	60efacbc-a699-43a5-bf3f-64c96546ce6c	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	I have size 34	en	{"en": "I have size 34"}	2026-02-06 00:40:14.502304	2026-02-06 00:40:26.86929	\N	\N	text	{}
19a301e8-8417-419e-9dbd-0b941b8533d0	60efacbc-a699-43a5-bf3f-64c96546ce6c	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	I mean 14	en	{"en": "I mean 14"}	2026-02-06 00:40:41.837149	2026-02-06 00:40:58.536845	\N	\N	text	{}
4568f9b1-1f7c-4d02-92b1-ec7d15149d10	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user	do you have this sneaker?	en	{"en": "do you have this sneaker?"}	2026-02-06 00:43:28.850172	2026-02-06 00:43:36.881255	\N	\N	text	{}
200083f6-0cdc-4651-b5ac-e3ebbd7c36b1	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user		und	{"en": "", "und": ""}	2026-02-06 00:43:55.81567	2026-02-06 00:44:05.79766	\N	\N	text	{}
289a5021-12b0-4296-a981-3d5805528b74	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user		und	{"en": "", "und": ""}	2026-02-06 01:21:07.052957	2026-02-06 01:21:20.311519	\N	\N	text	{}
9c7ab9bf-9a2a-47de-ab5b-91fe3349b54b	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user		und	{}	2026-02-06 01:46:50.41356	2026-02-06 01:46:58.292375	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/chat/2e9fb1c6-11ec-4204-af90-c3bc93c511aa.webp	image	text	{}
d2b80a7b-37d8-4dd9-9cc3-430c49f9da01	60efacbc-a699-43a5-bf3f-64c96546ce6c	3579a216-37d9-42de-9c9d-d428fd059b69	user	do you have this shoe?	en	{}	2026-02-06 01:47:24.221597	2026-02-06 01:47:29.422931	\N	\N	text	{}
9b96015a-4fcd-4c42-84c7-dd8c641b7ddc	b92400cd-0568-4f9b-abca-2cd56c7bb7f9	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor		und	{}	2026-02-06 02:03:58.052933	2026-02-06 02:04:10.418917	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/c2f614bd-822d-462f-a6c9-0554dc1023e6.jpeg	image	text	{}
b043314a-a05e-4630-88be-f3f38e85e682	b92400cd-0568-4f9b-abca-2cd56c7bb7f9	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	what you got for sell hoe?	en	{}	2026-02-06 02:04:00.887462	2026-02-06 02:04:10.418917	\N	\N	text	{}
908b0e3d-d480-4a67-8dcd-848e942b1c3f	b92400cd-0568-4f9b-abca-2cd56c7bb7f9	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	Jordan 1	en	{}	2026-02-06 02:04:18.127837	2026-02-06 02:04:20.216467	\N	\N	text	{}
265eb7ae-2633-4b1d-ab9c-b054b6dd243f	b92400cd-0568-4f9b-abca-2cd56c7bb7f9	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	yoo	yo	{}	2026-02-06 02:04:53.533859	2026-02-06 02:04:54.451993	\N	\N	text	{}
b0d6558d-2053-442f-9d16-fa2386571308	b92400cd-0568-4f9b-abca-2cd56c7bb7f9	df5789fe-1afb-4f08-a075-0d36216a45ce	vendor	您好 (	zh-CN	{}	2026-02-06 02:07:58.151135	2026-02-06 02:07:59.330332	\N	\N	text	{}
ac87e9dc-82da-4752-a3eb-989ea860ff64	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	did you setup account so I can pay you?	en	{}	2026-02-06 02:11:24.276729	\N	\N	\N	text	{}
02e25028-65b3-420f-9315-0ec9da1b6c72	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	what colors you have?	en	{}	2026-02-06 02:31:13.95969	2026-02-06 04:22:50.243667	\N	\N	text	{}
537d6fa5-af6a-4b04-80dc-40f82661a53c	d049c77a-0f70-4719-bfaa-9702fb169662	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	you can send pics now	en	{}	2026-02-06 02:31:36.511885	2026-02-06 04:22:50.243667	\N	\N	text	{}
11084454-1e5a-4691-94b0-f113d007ea42	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	we have more than 400colors.this platform can't send catalog to you.	en	{}	2026-02-06 04:27:55.539451	2026-02-06 04:32:21.593077	\N	\N	text	{}
f4d1bc6c-d0af-49a8-8927-74a1792ed1f1	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	usually is 130-250$ a roll,not including shipping fees.	en	{}	2026-02-06 04:28:25.613039	2026-02-06 04:32:21.593077	\N	\N	text	{}
bc586fb2-eeac-496f-a918-6d483618515b	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor		und	{}	2026-02-06 04:45:11.993476	2026-02-06 04:45:29.742016	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/chat/d5ca3567-1398-408a-9a45-f9f34a6d5b27.jpg	image	text	{}
352cdd1a-20a9-42ea-bf2c-7b15a4ff00ef	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor		und	{}	2026-02-06 04:45:42.189139	2026-02-06 04:46:24.411014	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/chat/587a0524-2bb9-44d1-bc0b-5f2caa809f24.mp4	video	text	{}
7e959b9f-7553-4701-8c21-a07aaa4f38b2	d049c77a-0f70-4719-bfaa-9702fb169662	a192b684-7720-4244-b438-bcdc21132ced	vendor	which color you need?can send me photos. i will show videos and photos,price to you.	en	{}	2026-02-06 04:46:31.639602	2026-02-06 04:46:38.556758	\N	\N	text	{}
4b8f3c3e-05de-4d8c-ad2c-d6221d9f16d5	dacf611a-f685-4e1e-94ee-7c7207381ac7	08d839a8-dae3-4af0-a57f-6ad714c14116	user	Do you have the Travis Scott pink pack?	en	{}	2026-02-13 17:37:57.854964	\N	\N	\N	text	{}
69c47a0a-b7b2-4e4a-883d-4de528a23bff	9f392ecd-dc03-4cf5-b4e9-f935747e9777	2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	How long shipping for wolf greys	en	{}	2026-03-02 02:38:52.861255	\N	\N	\N	text	{}
753941d9-34c9-4b9a-a07e-f413727e71fc	0ddf0828-c9eb-4042-ae46-962c934bf2e8	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	what products are available	en	{}	2026-03-10 14:01:23.279995	\N	\N	\N	text	{}
68ac8017-f873-4009-be53-e46aec0f9607	00ed231e-6e9f-4d5f-b248-fc24426c549d	bb1279cc-4717-437d-a035-312e09c28363	user	test	en	{}	2026-03-16 00:18:27.056962	\N	\N	\N	text	{}
94269b8e-df4f-4055-af3b-8304155f51ee	00ed231e-6e9f-4d5f-b248-fc24426c549d	bb1279cc-4717-437d-a035-312e09c28363	user	Testing support bot	en	{}	2026-03-22 12:57:16.269092	\N	\N	\N	text	{}
053efad7-79cb-451d-9fa8-186384109144	00ed231e-6e9f-4d5f-b248-fc24426c549d	bb1279cc-4717-437d-a035-312e09c28363	user	Testing support bot	en	{}	2026-03-22 12:58:30.090269	\N	\N	\N	text	{}
91055a3d-eb72-4929-ba7b-11d6e079a7fb	e67a2058-972a-4916-b84f-1f66d0dd622c	bb1279cc-4717-437d-a035-312e09c28363	user	This is just a test bro	en	{"en": "This is just a test bro"}	2026-04-04 17:12:37.102629	2026-04-04 17:26:40.200671	\N	\N	text	{}
77ad9c23-d2cc-49c7-8233-d49019c1deda	e67a2058-972a-4916-b84f-1f66d0dd622c	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	What’s up bro	en	{"en": "What’s up bro"}	2026-04-04 17:26:50.192691	2026-04-04 17:29:47.635596	\N	\N	text	{}
137ee96d-e436-4a0d-b460-c18bb8e1f876	e67a2058-972a-4916-b84f-1f66d0dd622c	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	How you?	en	{"en": "How you?"}	2026-04-04 17:27:15.514701	2026-04-04 17:29:47.635596	\N	\N	text	{}
5b880b99-b1e8-48f6-a21c-8f50a8d021b1	e67a2058-972a-4916-b84f-1f66d0dd622c	bb1279cc-4717-437d-a035-312e09c28363	user	Can you hear the anything?	en	{"en": "Can you hear the anything?"}	2026-04-04 17:30:09.24061	2026-04-04 19:05:35.850514	\N	\N	text	{}
8f00466f-9f0c-4ec9-afaf-5f50e2df231f	c0b626c0-a58c-4d7a-8db8-611305cf8d1b	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Yooo	rw	{"en": "Oh no", "rw": "Yooo"}	2026-04-05 00:27:52.136507	2026-04-05 00:32:13.51938	\N	\N	text	{}
c098dbe7-bdd6-4c06-9653-f2c3a3567fc1	c0b626c0-a58c-4d7a-8db8-611305cf8d1b	5128d5ac-fa24-4908-ae52-776105339c91	user	test	en	{"en": "test"}	2026-04-05 00:32:28.206843	2026-04-05 00:36:06.072281	\N	\N	text	{}
ea9846b9-930e-4800-983f-035f9fe701ce	c0b626c0-a58c-4d7a-8db8-611305cf8d1b	5128d5ac-fa24-4908-ae52-776105339c91	user	test	en	{"en": "test"}	2026-04-05 00:36:00.137862	2026-04-05 00:36:06.072281	\N	\N	text	{}
72dc1298-5181-47e2-89bb-469dee10bf51	c0b626c0-a58c-4d7a-8db8-611305cf8d1b	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Uooo	mi	{"en": "Wow", "mi": "Uooo"}	2026-04-05 00:36:14.044289	2026-04-05 00:57:41.129121	\N	\N	text	{}
8436751a-184a-49c3-8563-fa0f01ff4bd3	c0b626c0-a58c-4d7a-8db8-611305cf8d1b	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Yooo	rw	{"en": "Oh no", "rw": "Yooo"}	2026-04-05 00:51:19.0157	2026-04-05 00:57:41.129121	\N	\N	text	{}
848158b4-b68a-4101-ae9b-e068f098c0dc	e67a2058-972a-4916-b84f-1f66d0dd622c	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Try now	en	{"en": "Try now"}	2026-04-04 19:05:42.496942	2026-04-05 14:09:57.620499	\N	\N	text	{}
abca17c9-fe09-4291-a9cf-eb95cfef3910	e67a2058-972a-4916-b84f-1f66d0dd622c	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Maybe my phone a vibrate	en	{"en": "Maybe my phone a vibrate"}	2026-04-04 19:05:51.291839	2026-04-05 14:09:57.620499	\N	\N	text	{}
506033c5-8ca4-4d47-9222-a8437ab36c49	e67a2058-972a-4916-b84f-1f66d0dd622c	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Yooo	rw	{"en": "Oh no", "rw": "Yooo"}	2026-04-05 00:30:19.897809	2026-04-05 14:09:57.620499	\N	\N	text	{}
6d1d7769-5bb6-422d-a3b6-f1c9287cc8b7	211bfb6e-fe8d-4a9b-8daa-805b4b42a558	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Hey bro it’s me	en	{"en": "Hey bro it’s me"}	2026-04-05 16:46:12.761462	2026-04-05 18:20:50.506882	\N	\N	text	{}
ea70a6fa-6c98-4267-a4e9-697eafb6c778	211bfb6e-fe8d-4a9b-8daa-805b4b42a558	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	I’m buying slides now	en	{"en": "I’m buying slides now"}	2026-04-05 16:46:26.079149	2026-04-05 18:20:50.506882	\N	\N	text	{}
79bcc3a3-6195-417b-9130-441c0688a605	7327b573-b0cf-4878-9ae4-ebb805367236	bb1279cc-4717-437d-a035-312e09c28363	user	Awesome! Thank you first post! Welcome to Vendfinder	en	{"en": "Awesome! Thank you first post! Welcome to Vendfinder"}	2026-04-05 16:47:38.383061	2026-04-05 18:20:59.164842	\N	\N	text	{}
78b3ffee-1dec-424d-b135-f86383e72960	211bfb6e-fe8d-4a9b-8daa-805b4b42a558	43dc8866-7112-43d6-b104-8f17642eb453	user	ok	en	{"en": "ok"}	2026-04-05 18:20:54.31602	2026-04-05 18:22:37.316704	\N	\N	text	{}
262756d4-38ef-4868-b508-8b8e9cb3d9b0	211bfb6e-fe8d-4a9b-8daa-805b4b42a558	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Thanks bro I want to send you bonus for helping when this is complete	en	{"en": "Thanks bro I want to send you bonus for helping when this is complete"}	2026-04-05 18:23:05.461453	2026-04-06 05:35:58.816918	\N	\N	text	{}
2ce5c0c7-73d9-4455-b6c1-27a0aec5de0a	858cffa1-39dd-426a-8ced-eac00fd92dd1	43dc8866-7112-43d6-b104-8f17642eb453	user	yes	en	{"en": "yes"}	2026-04-06 05:36:21.286668	\N	\N	\N	text	{}
31e7ab3f-5bb6-4ebd-80bb-1d181a9a2d15	8c90d859-c65c-4699-98dd-82b214f2bcfd	43dc8866-7112-43d6-b104-8f17642eb453	user	yes	en	{"en": "yes"}	2026-04-06 05:36:25.677198	\N	\N	\N	text	{}
0d7877a6-cdc1-447c-b56e-53c32e1be4ba	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	英文	ja	{"en": "English", "en-US": "English"}	2026-04-06 11:18:45.615523	2026-04-06 11:34:46.717596	\N	\N	text	{}
a650ab75-4a21-4487-846d-7c7b05fa446a	430eeb64-bf5e-4fc0-bea2-70f3d32ff37f	bb1279cc-4717-437d-a035-312e09c28363	user	test	en	{"en": "test"}	2026-04-04 17:25:19.686998	2026-04-06 10:33:55.198661	\N	\N	text	{}
111a1d2c-202b-4f01-a3c4-4d546aa4895a	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Hello I may buy this bag soon	en	{"zh-CN": "你好，我可能很快会买这个包"}	2026-04-06 10:18:36.417918	2026-04-06 10:22:13.659028	\N	\N	text	{}
acc7c5eb-414a-418e-af4a-477f6bcd76ff	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	今天会确认订单吗	zh-CN	{"en": "Will the order be confirmed today?", "en-US": "Will the order be confirmed today?"}	2026-04-06 11:19:38.41457	2026-04-06 11:34:46.717596	\N	\N	text	{}
bea3530e-56c3-456f-b885-bb981ef3f5ca	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	This is new platform once we get everything fixed properly this will become huge. Thanks for helping us make sure it works properly.	en	{"zh-CN": "这是一个新平台，一旦我们正确修复所有问题，这将变得巨大。感谢您帮助我们确保它正常工作。"}	2026-04-06 10:25:06.851963	2026-04-06 10:40:32.309817	\N	\N	text	{}
463d15d6-fb78-4c5d-9c93-f0331098f824	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Is your messages coming through in Chinese or English?	en	{"zh-CN": "您的消息是用中文还是英文发送的？"}	2026-04-06 10:25:32.521503	2026-04-06 10:40:32.309817	\N	\N	text	{}
e39d826a-91b8-4b7d-86a4-fcd20dff934c	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	Dear,Thanks for your support	en	\N	2026-04-06 10:23:19.010884	2026-04-06 10:23:40.647548	\N	\N	text	{}
94392bf9-6946-4532-8710-1da74d491526	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	hi	en	\N	2026-04-06 10:22:24.793514	2026-04-06 10:23:40.647548	\N	\N	text	{}
7f7d5747-cdc3-4538-817c-6ed36fef2b1c	7395e6bb-40c3-4368-bba9-c3d68613f464	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	怎样发布产品	en	{}	2026-04-06 03:43:30.687692	2026-04-07 04:33:29.177105	\N	\N	text	{}
3978fc0f-e8b4-444d-912f-130eb2898561	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Yes I will try	en	{"zh-CN": "好的，我会试试"}	2026-04-06 11:34:58.088901	2026-04-06 11:38:20.184324	\N	\N	text	{}
57640656-fdfa-41f8-8ed2-df7a96cd681b	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Is the live translation working still? Is yours in Chinese?	en	{"zh-CN": "实时翻译还在工作吗？你的是中文吗？"}	2026-04-06 11:35:18.56424	2026-04-06 11:38:20.184324	\N	\N	text	{}
080c1f16-8219-4e28-8394-ab0d6f853f74	14eadaca-b9de-4d91-ae16-28317afb2271	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	test can you see this?	en	{"en": "test can you see this?"}	2026-04-07 04:25:13.845149	2026-04-07 04:32:32.971992	\N	\N	text	{}
79b138be-a9f8-4421-9de1-8035b0d24299	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	Hi! are my messages appearing in English or Simplified Chinese	en	{"zh-CN": "嗨！我的消息是用英文还是简体中文显示的"}	2026-04-06 11:45:40.122478	2026-04-06 11:56:33.057047	\N	\N	text	{}
8e577aea-301b-4c77-91a7-e70bf684db0f	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	I'm the Developer for the platform I want to make sure this is working correctly.	en	{"zh-CN": "我是这个平台的开发者，我想确保这个功能正常工作。"}	2026-04-06 11:46:19.727545	2026-04-06 11:56:33.057047	\N	\N	text	{}
e4eff75e-8a2f-4c45-b963-e5aa56ea07c1	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	Hi	en	{"en": "Hi"}	2026-04-07 04:33:36.78906	2026-04-07 04:34:05.144085	\N	\N	text	{}
9295c414-8d36-4e3c-bf89-67918214c74f	58cb36dc-7eec-4f32-899b-034e792ec0fc	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	Is English	en	{"zh-CN": "是英文"}	2026-04-06 11:56:52.068195	2026-04-06 12:12:04.314729	\N	\N	text	{}
1a6ce666-fabd-451f-973c-906945b07727	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	Yes I see this in English	en	{"en": "Yes I see this in English", "zh": "是的，我在英文版中看到了。"}	2026-04-06 12:12:13.921663	2026-04-06 12:59:05.640857	\N	\N	text	{}
330705c5-4f68-4c76-989a-3c46fb3a4725	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	Do my messages appear in Chinese?	en	{"en": "Do my messages appear in Chinese?", "zh": "我的消息会以中文显示吗？"}	2026-04-06 12:12:47.396462	2026-04-06 12:59:05.640857	\N	\N	text	{}
cb5c4661-88f9-48a8-90bf-6763e97989dd	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	No the messages don't appear in Chinese they appear in English	en	{"en": "No the messages don't appear in Chinese they appear in English", "zh": "不，这些信息不是以中文显示的，而是以英文显示的。"}	2026-04-06 12:29:36.209702	2026-04-06 12:59:05.640857	\N	\N	text	{}
ed2388a0-ce4e-4fa1-98df-dd19dad1725b	58cb36dc-7eec-4f32-899b-034e792ec0fc	cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	Disregard that last message	en	{"en": "Disregard that last message", "zh": "请忽略最后那条消息。"}	2026-04-06 12:30:03.778954	2026-04-06 12:59:05.640857	\N	\N	text	{}
00435730-4126-4f5a-91e7-d6e011086126	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	is English	en	{"zh-CN": "是英文"}	2026-04-06 11:56:30.534537	2026-04-07 00:33:12.118734	\N	\N	text	{}
62c17b27-d783-4ab9-a7cd-a9de0b99b865	58cb36dc-7eec-4f32-899b-034e792ec0fc	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	是的，中文	zh-CN	{"en": "Yes, Chinese", "zh-CN": "是的，中文"}	2026-04-06 13:00:40.899324	2026-04-07 01:13:22.039679	\N	\N	text	{}
3af9cf29-b7fb-4476-9dcc-a79521893d30	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Your messages in Chinese yet?	en	{"en": "Your messages in Chinese yet?", "zh": "你用中文发信息了吗？"}	2026-04-07 00:33:24.834845	2026-04-07 01:55:13.933351	\N	\N	text	{}
cc331ce0-b11f-4724-9d60-f5291138ff66	7cee7b85-4b65-4461-9217-8dfef1ffad5f	5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	现在用中文发送	zh-CN	{"en": "Sending in Chinese now", "zh-CN": "现在用中文发送"}	2026-04-07 01:55:34.779488	2026-04-07 04:16:45.029089	\N	\N	text	{}
33179f8f-e0f9-4c62-80ea-9b773a728964	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Ok	en	{"en": "Ok", "zh": "好的"}	2026-04-07 04:17:04.521013	2026-04-07 04:32:24.398596	\N	\N	text	{}
e9e84436-bce9-4fd5-abd4-ad5a6ff41141	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	Hello	en	{"en": "Hello"}	2026-04-07 04:26:46.178551	2026-04-07 04:32:24.398596	\N	\N	text	{}
5cf0f049-cc7b-4ff8-90f2-68756b899b5c	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	When he brings back your products I’ll order	en	{"en": "When he brings back your products I’ll order"}	2026-04-07 04:34:24.77223	2026-04-07 04:36:31.677272	\N	\N	text	{}
0f6cdbbc-d9e4-434e-bede-75d8e8d4b8b3	14eadaca-b9de-4d91-ae16-28317afb2271	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	Yes	en	{"en": "Yes"}	2026-04-07 12:20:35.863479	2026-04-07 22:55:06.379215	\N	\N	text	{}
7bdab99c-1577-4e04-9672-215b43659f22	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3ad53a5d-ade0-4a33-8fb9-2a72900201f1	user	OK	en	{"en": "OK"}	2026-04-07 12:20:08.692986	2026-04-08 02:30:46.204811	\N	\N	text	{}
a4db3bc3-7c75-4777-89c7-fa024958e675	7cee7b85-4b65-4461-9217-8dfef1ffad5f	3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	I just brought two purses	en	{"en": "I just brought two purses"}	2026-04-08 16:58:38.498209	2026-04-08 22:20:38.352636	\N	\N	text	{}
\.


--
-- TOC entry 3505 (class 0 OID 16522)
-- Dependencies: 218
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offers (id, conversation_id, message_id, sender_id, proposed_price, status, counter_offer_id, expires_at, resolved_at, created_at) FROM stdin;
\.


--
-- TOC entry 3504 (class 0 OID 16454)
-- Dependencies: 217
-- Data for Name: user_language_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_language_preferences (user_id, user_type, preferred_language, auto_translate, created_at, updated_at) FROM stdin;
0779a028-ca3a-41cb-b17a-c65dcb00e9ae	user	en	t	2026-01-15 14:23:32.514868	2026-01-26 04:53:32.119888
dffc74ce-2bd5-4637-800d-2b5ba6ebe8fb	user	ko	t	2026-01-31 21:31:41.835504	2026-01-31 21:31:41.835504
5761ed90-824c-428d-9ed2-1bef0a7a84b8	user	zh-TW	t	2026-02-02 08:39:38.767774	2026-02-03 01:44:25.006998
df81166b-9dcb-4cbe-8c94-786e31424e07	user	en	t	2026-02-03 02:23:57.777268	2026-02-03 02:24:37.935569
2b040ea7-5cfb-466c-a76b-1c1683ca921a	user	en	t	2026-02-02 08:45:42.022983	2026-02-06 02:10:37.096797
5f0cec3d-7af8-48b2-b628-ef3dedb8ef29	user	zh	t	2026-04-06 11:15:40.662952	2026-04-06 11:15:40.662952
5692e26e-739c-4fad-ae03-fa483b192484	user	zh	t	2026-01-16 08:48:37.98371	2026-04-06 11:15:45.238518
93622740-651f-4065-b2a7-118ba9dc1a2a	user	zh	t	2026-02-01 21:08:59.785398	2026-04-06 11:15:45.238518
4f78b761-00cb-4524-8308-0e03ae3a264d	user	zh	t	2026-02-02 00:39:14.531416	2026-04-06 11:15:45.238518
7c9c5e4d-4739-40bc-873e-da58d0161218	user	zh	t	2026-02-06 00:41:07.291638	2026-04-06 11:15:45.238518
6376c9c8-be46-4f68-a5da-c3d55118f0f9	user	zh	t	2026-03-02 15:19:08.030213	2026-04-06 11:15:45.238518
3a08fdb1-fdbd-47d8-b878-1706254a5e02	user	en	t	2026-04-06 11:15:40.662952	2026-04-06 11:15:40.662952
cfc1f4a9-e4f9-4a52-9186-f32b60cfd1f3	user	en	t	2026-04-06 12:02:37.934167	2026-04-06 12:02:37.934167
\.


--
-- TOC entry 3515 (class 0 OID 0)
-- Dependencies: 219
-- Name: _migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public._migrations_id_seq', 1, true);


--
-- TOC entry 3355 (class 2606 OID 16542)
-- Name: _migrations _migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_name_key UNIQUE (name);


--
-- TOC entry 3357 (class 2606 OID 16540)
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3338 (class 2606 OID 16436)
-- Name: conversations conversations_participant1_id_participant2_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant1_id_participant2_id_product_id_key UNIQUE (participant1_id, participant2_id, product_id);


--
-- TOC entry 3340 (class 2606 OID 16434)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 3347 (class 2606 OID 16448)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 16530)
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- TOC entry 3349 (class 2606 OID 16463)
-- Name: user_language_preferences user_language_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_language_preferences
    ADD CONSTRAINT user_language_preferences_pkey PRIMARY KEY (user_id, user_type);


--
-- TOC entry 3341 (class 1259 OID 16466)
-- Name: idx_conversations_participant1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_participant1 ON public.conversations USING btree (participant1_id, participant1_type);


--
-- TOC entry 3342 (class 1259 OID 16467)
-- Name: idx_conversations_participant2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_participant2 ON public.conversations USING btree (participant2_id, participant2_type);


--
-- TOC entry 3343 (class 1259 OID 16468)
-- Name: idx_conversations_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_updated ON public.conversations USING btree (updated_at DESC);


--
-- TOC entry 3344 (class 1259 OID 16464)
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- TOC entry 3345 (class 1259 OID 16465)
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at DESC);


--
-- TOC entry 3350 (class 1259 OID 16531)
-- Name: idx_offers_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_conversation_id ON public.offers USING btree (conversation_id);


--
-- TOC entry 3351 (class 1259 OID 16532)
-- Name: idx_offers_status_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_status_pending ON public.offers USING btree (status) WHERE ((status)::text = 'pending'::text);


--
-- TOC entry 3359 (class 2620 OID 16519)
-- Name: messages trigger_update_conversation_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_conversation_timestamp AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- TOC entry 3358 (class 2606 OID 16449)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


-- Completed on 2026-05-01 19:26:33 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict zmMjiOrH4HlXx42pusD4MqseJdc5YkWl3KRpGDyPMFvxQlqqpeem59L2zfh8ZJX

