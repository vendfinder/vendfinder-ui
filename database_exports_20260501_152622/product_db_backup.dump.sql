--
-- PostgreSQL database dump
--

\restrict mz3jz3bs1k8gR224EoaXra6HpPttrOgLGMUeGa2PcaWOuqqlIkqVvNzG28eRIc6

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

-- Started on 2026-05-01 19:26:30 UTC

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

ALTER TABLE ONLY public.sponsored_slots DROP CONSTRAINT sponsored_slots_product_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_product_id_fkey;
ALTER TABLE ONLY public.sales_history DROP CONSTRAINT sales_history_product_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_bid_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_ask_id_fkey;
ALTER TABLE ONLY public.price_alerts DROP CONSTRAINT price_alerts_product_id_fkey;
ALTER TABLE ONLY public.featured_slots DROP CONSTRAINT featured_slots_product_id_fkey;
ALTER TABLE ONLY public.favorites DROP CONSTRAINT favorites_product_id_fkey;
ALTER TABLE ONLY public.bids DROP CONSTRAINT bids_product_id_fkey;
ALTER TABLE ONLY public.asks DROP CONSTRAINT asks_product_id_fkey;
DROP INDEX public.uq_reports_open;
DROP INDEX public.idx_sponsored_vendor;
DROP INDEX public.idx_sponsored_category;
DROP INDEX public.idx_sponsored_active;
DROP INDEX public.idx_sales_sold_at;
DROP INDEX public.idx_sales_seller_id;
DROP INDEX public.idx_sales_product_id;
DROP INDEX public.idx_sales_history_product_size;
DROP INDEX public.idx_sales_history_product;
DROP INDEX public.idx_sales_buyer_id;
DROP INDEX public.idx_reports_target;
DROP INDEX public.idx_reports_status;
DROP INDEX public.idx_reports_reporter;
DROP INDEX public.idx_products_vendor_id;
DROP INDEX public.idx_products_translations;
DROP INDEX public.idx_products_status;
DROP INDEX public.idx_products_slug;
DROP INDEX public.idx_products_name_trgm;
DROP INDEX public.idx_products_created_at;
DROP INDEX public.idx_products_category;
DROP INDEX public.idx_price_alerts_user;
DROP INDEX public.idx_price_alerts_product;
DROP INDEX public.idx_featured_product;
DROP INDEX public.idx_featured_active;
DROP INDEX public.idx_favorites_user_id;
DROP INDEX public.idx_favorites_product_id;
DROP INDEX public.idx_bids_status;
DROP INDEX public.idx_bids_product_id;
DROP INDEX public.idx_bids_buyer_id;
DROP INDEX public.idx_bids_amount;
DROP INDEX public.idx_asks_status;
DROP INDEX public.idx_asks_seller_id;
DROP INDEX public.idx_asks_product_id;
DROP INDEX public.idx_asks_price;
ALTER TABLE ONLY public.sponsored_slots DROP CONSTRAINT sponsored_slots_pkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_pkey;
ALTER TABLE ONLY public.sales_history DROP CONSTRAINT sales_history_pkey;
ALTER TABLE ONLY public.reports DROP CONSTRAINT reports_pkey;
ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
ALTER TABLE ONLY public.price_alerts DROP CONSTRAINT price_alerts_pkey;
ALTER TABLE ONLY public.featured_slots DROP CONSTRAINT featured_slots_pkey;
ALTER TABLE ONLY public.favorites DROP CONSTRAINT favorites_user_id_product_id_key;
ALTER TABLE ONLY public.favorites DROP CONSTRAINT favorites_pkey;
ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_slug_key;
ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_name_key;
ALTER TABLE ONLY public.bids DROP CONSTRAINT bids_pkey;
ALTER TABLE ONLY public.asks DROP CONSTRAINT asks_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_name_key;
ALTER TABLE public._migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.sponsored_slots;
DROP TABLE public.sales_history;
DROP TABLE public.sales;
DROP TABLE public.reports;
DROP TABLE public.products;
DROP TABLE public.price_alerts;
DROP TABLE public.featured_slots;
DROP TABLE public.favorites;
DROP TABLE public.categories;
DROP TABLE public.bids;
DROP TABLE public.asks;
DROP SEQUENCE public._migrations_id_seq;
DROP TABLE public._migrations;
DROP EXTENSION pg_trgm;
--
-- TOC entry 2 (class 3079 OID 16400)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 3652 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16391)
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 16390)
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
-- TOC entry 3653 (class 0 OID 0)
-- Dependencies: 216
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- TOC entry 220 (class 1259 OID 16516)
-- Name: asks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    size character varying(20),
    condition character varying(20) DEFAULT 'new'::character varying,
    ask_price numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    expires_at timestamp with time zone,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT asks_condition_check CHECK (((condition)::text = ANY ((ARRAY['new'::character varying, 'used_like_new'::character varying, 'used_good'::character varying, 'used_fair'::character varying])::text[]))),
    CONSTRAINT asks_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying, 'sold'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'matched'::character varying])::text[])))
);


--
-- TOC entry 221 (class 1259 OID 16534)
-- Name: bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    size character varying(20),
    bid_amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bids_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying, 'won'::character varying, 'lost'::character varying, 'expired'::character varying, 'cancelled'::character varying, 'matched'::character varying])::text[])))
);


--
-- TOC entry 218 (class 1259 OID 16481)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    image_url text,
    icon character varying(10),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16571)
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 16639)
-- Name: featured_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    duration_days integer NOT NULL,
    price_cents integer NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'pending_payment'::character varying NOT NULL,
    stripe_session_id character varying(255),
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16621)
-- Name: price_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    target_price numeric(10,2) NOT NULL,
    size character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16496)
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    name character varying(500) NOT NULL,
    slug character varying(500),
    description text,
    long_description text,
    category character varying(100) NOT NULL,
    brand character varying(200),
    retail_price numeric(12,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(12,2),
    image_url text,
    badge character varying(50),
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    quantity_available integer DEFAULT 0,
    in_stock boolean DEFAULT true,
    sku character varying(100),
    sizes text[],
    features text[],
    specifications jsonb DEFAULT '{}'::jsonb,
    media jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    translations jsonb,
    source_language character varying(10) DEFAULT NULL::character varying,
    is_global_listing boolean DEFAULT false,
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying, 'deleted'::character varying])::text[])))
);


--
-- TOC entry 228 (class 1259 OID 16673)
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    reason character varying(50) NOT NULL,
    details text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT reports_reason_check CHECK (((reason)::text = ANY ((ARRAY['counterfeit'::character varying, 'spam'::character varying, 'inappropriate'::character varying, 'scam'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))),
    CONSTRAINT reports_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['product'::character varying, 'user'::character varying, 'review'::character varying])::text[])))
);


--
-- TOC entry 222 (class 1259 OID 16549)
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    ask_id uuid,
    bid_id uuid,
    seller_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    size character varying(20),
    sale_price numeric(12,2) NOT NULL,
    sold_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 16605)
-- Name: sales_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    size character varying(20),
    sale_price numeric(10,2) NOT NULL,
    sale_date timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16654)
-- Name: sponsored_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sponsored_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    category character varying(100),
    keyword character varying(255),
    duration_days integer NOT NULL,
    price_cents integer NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'pending_payment'::character varying NOT NULL,
    stripe_session_id character varying(255),
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sponsored_slots_check CHECK (((category IS NOT NULL) OR (keyword IS NOT NULL)))
);


--
-- TOC entry 3359 (class 2604 OID 16394)
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- TOC entry 3635 (class 0 OID 16391)
-- Dependencies: 217
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._migrations (id, name, applied_at) FROM stdin;
1	000_extensions.sql	2026-04-15 08:36:23.533343+00
2	001_initial_schema.sql	2026-04-15 08:36:23.640245+00
3	002_seed_data.sql	2026-04-15 08:36:23.825066+00
4	003_sales_history.sql	2026-04-15 08:36:23.860493+00
5	004_add_matched_status.sql	2026-04-15 08:36:23.891444+00
6	004_price_alerts.sql	2026-04-15 08:36:23.908226+00
7	005_product_translations.sql	2026-04-15 08:36:23.936036+00
8	006_featured_slots.sql	2026-04-15 08:36:23.950104+00
9	007_sponsored_slots.sql	2026-04-15 08:36:23.9727+00
10	008_reports.sql	2026-04-15 08:36:24.015074+00
\.


--
-- TOC entry 3638 (class 0 OID 16516)
-- Dependencies: 220
-- Data for Name: asks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asks (id, product_id, seller_id, size, condition, ask_price, status, expires_at, views, created_at, updated_at) FROM stdin;
d221f1e8-ee19-4a4d-8b4f-753696e80c0c	00000000-0000-0000-0000-000000000011	00000000-0000-0000-0000-000000000098	L	new	95.00	active	\N	67	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
23aeddad-42ee-4e21-bd36-aaf00e57ea27	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000099	9	new	225.00	active	\N	46	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
6ce6b02d-18c0-4ca1-9a1e-c4ce718665a7	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000098	10	new	235.00	active	\N	33	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
560d8f43-9302-44af-b6f4-1a0be6b2bb00	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000097	11	new	220.00	active	\N	29	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
d5f1b139-cf28-46a2-a8e6-2fd1a23911f2	00000000-0000-0000-0000-000000000021	00000000-0000-0000-0000-000000000097	\N	new	105.00	active	\N	35	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
7d3b4a04-ee93-4300-aa23-f9934fb07b50	00000000-0000-0000-0000-000000000027	00000000-0000-0000-0000-000000000098	\N	new	875.00	active	\N	117	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
951dd5c7-e621-47b4-a90d-86ea8c298713	00000000-0000-0000-0000-000000000006	00000000-0000-0000-0000-000000000099	\N	new	355.00	active	\N	24	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
cd377458-72f0-406e-aac9-76013401fdfa	00000000-0000-0000-0000-000000000026	00000000-0000-0000-0000-000000000099	\N	new	1250.00	active	\N	91	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
2c768c72-760c-4b0d-bd8a-7a3ada3b6afd	00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000099	9	new	120.00	active	\N	58	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
6d602e1e-f868-4894-bfb0-3bf568b1d1dc	00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000098	10	new	125.00	active	\N	43	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
\.


--
-- TOC entry 3639 (class 0 OID 16534)
-- Dependencies: 221
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bids (id, product_id, buyer_id, size, bid_amount, status, expires_at, created_at, updated_at) FROM stdin;
4ac599d6-a391-47ff-b628-f6a76c942e60	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000096	9	200.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
02b93c1e-60f8-405d-8d20-7b35418522db	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000095	10	210.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
4d8b3d30-2456-4540-b9bf-9b2b41b62c39	00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000096	9	105.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
daee1c43-97fc-4fcb-a80f-76547789f541	00000000-0000-0000-0000-000000000006	00000000-0000-0000-0000-000000000095	\N	330.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
ab78e4be-0189-43f2-8a67-c2ae12525d73	00000000-0000-0000-0000-000000000011	00000000-0000-0000-0000-000000000096	L	80.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
a59af7cc-8d36-4409-bb47-8bcd79373aee	00000000-0000-0000-0000-000000000026	00000000-0000-0000-0000-000000000095	\N	1100.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
1e89c15c-d708-4611-aa98-f9860142d0e8	00000000-0000-0000-0000-000000000027	00000000-0000-0000-0000-000000000096	\N	800.00	active	\N	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
\.


--
-- TOC entry 3636 (class 0 OID 16481)
-- Dependencies: 218
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, description, image_url, icon, sort_order, created_at, updated_at) FROM stdin;
8ffcf066-fb50-424c-9ad0-ff12ffaa7148	Sneakers	sneakers	Premium kicks from top brands	/images/categories/sneakers.jpg	👟	1	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
eb6a432f-25ba-4dcd-8470-735ff38bf2ef	Electronics	electronics	Latest tech and gadgets	/images/categories/electronics.jpg	📱	2	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
f06af74b-ad47-4a4d-b974-bba45b50ffc4	Apparel	apparel	Exclusive apparel collections	/images/categories/apparel.jpg	👕	3	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
b9590060-a405-4021-be82-a5defdfe0ef3	Home & Living	home-living	Curated home essentials	/images/categories/home-living.jpg	🏠	4	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
fcfbb0b1-49c3-4fa4-87b6-92e680128b4f	Accessories	accessories	Premium watches and accessories	/images/categories/accessories.jpg	⌚	5	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
7e33dd8c-8e40-4b6d-af7c-248d4c8ac93a	Collectibles	collectibles	Rare finds and collectible items	/images/categories/collectibles.jpg	🎭	6	2026-04-15 08:36:23.825066+00	2026-04-15 08:36:23.825066+00
\.


--
-- TOC entry 3641 (class 0 OID 16571)
-- Dependencies: 223
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorites (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- TOC entry 3644 (class 0 OID 16639)
-- Dependencies: 226
-- Data for Name: featured_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.featured_slots (id, product_id, vendor_id, duration_days, price_cents, starts_at, expires_at, status, stripe_session_id, paid_at, created_at) FROM stdin;
\.


--
-- TOC entry 3643 (class 0 OID 16621)
-- Dependencies: 225
-- Data for Name: price_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_alerts (id, user_id, product_id, target_price, size, status, triggered_at, created_at) FROM stdin;
\.


--
-- TOC entry 3637 (class 0 OID 16496)
-- Dependencies: 219
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, vendor_id, name, slug, description, long_description, category, brand, retail_price, compare_at_price, image_url, badge, rating, review_count, quantity_available, in_stock, sku, sizes, features, specifications, media, tags, status, created_at, updated_at, translations, source_language, is_global_listing) FROM stdin;
00000000-0000-0000-0000-000000000001	\N	Air Jordan 4 Retro Bred	air-jordan-4-retro-bred	The iconic AJ4 in the classic Bred colorway. Premium leather upper with visible Air unit.	The Air Jordan 4 Retro 'Bred' brings back one of the most legendary colorways in sneaker history. Featuring a black nubuck upper with cement grey accents and fire red highlights, this shoe stays true to the 1989 original. The visible Air-Sole unit in the heel provides responsive cushioning, while the mesh inserts offer breathability for all-day wear.	Sneakers	Nike	215.00	250.00	/images/products/aj4-bred-1.jpg	Sale	4.80	124	12	t	SNK-AJ4-BRD	{7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,13}	{"Premium nubuck leather upper","Visible Air-Sole unit","Mesh side panels","Rubber outsole with herringbone pattern"}	{"Brand": "Nike", "Color": "Black/Cement Grey/Fire Red", "Style": "Air Jordan 4 Retro", "Release": "2024"}	[{"url": "/images/products/aj4-bred-1.jpg", "type": "image"}]	{jordan,retro,bred,featured}	active	2024-09-15 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000002	\N	Nike Dunk Low Panda	nike-dunk-low-panda	Clean black and white colorway that goes with everything. A modern classic.	The Nike Dunk Low 'Panda' features a crisp black and white leather upper that has become one of the most popular sneakers of the decade. Originally designed as a basketball shoe in 1985, the Dunk has evolved into a streetwear staple. The padded collar and rubber cupsole provide comfort for daily wear.	Sneakers	Nike	115.00	\N	/images/products/dunk-panda-1.jpg	\N	4.60	89	25	t	SNK-DNK-PND	{6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,12}	{"Leather upper","Padded collar","Rubber cupsole","Perforated toe box"}	{"Brand": "Nike", "Color": "Black/White", "Style": "Dunk Low", "Release": "2024"}	[{"url": "/images/products/dunk-panda-1.jpg", "type": "image"}]	{nike,dunk,panda,featured}	active	2024-10-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000003	\N	New Balance 550 White Green	new-balance-550-white-green	Retro basketball silhouette with a clean white and green colorway.	The New Balance 550 revives a classic 1989 basketball design with modern styling. This White/Green colorway features a premium leather upper with perforated detailing, a flat rubber outsole, and the signature N logo in forest green. A versatile sneaker that bridges the gap between sport and style.	Sneakers	New Balance	130.00	\N	/images/products/nb550-wg-1.jpg	\N	4.50	56	18	t	SNK-NB550-WG	{7,7.5,8,8.5,9,9.5,10,10.5,11,12}	{"Premium leather upper","Flat rubber outsole","Perforated side panels","Padded tongue and collar"}	{"Brand": "New Balance", "Color": "White/Green", "Style": "550", "Release": "2024"}	[{"url": "/images/products/nb550-wg-1.jpg", "type": "image"}]	{new-balance,retro,basketball}	active	2024-08-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000004	\N	Adidas Yeezy Slide Onyx	adidas-yeezy-slide-onyx	Minimalist EVA foam slide in sleek Onyx black. Ultimate comfort.	The Adidas Yeezy Slide in Onyx delivers a minimalist aesthetic with maximum comfort. Crafted from lightweight injected EVA foam, these slides feature a soft footbed and a serrated outsole for traction. The monochrome black colorway makes them a versatile choice for casual wear.	Sneakers	Adidas	70.00	90.00	/images/products/yeezy-slide-1.jpg	Sale	4.30	201	40	t	SNK-YZY-SLD	{6,7,8,9,10,11,12,13}	{"Injected EVA foam construction","Soft footbed","Serrated outsole","Lightweight design"}	{"Brand": "Adidas", "Color": "Onyx", "Style": "Yeezy Slide", "Release": "2024"}	[{"url": "/images/products/yeezy-slide-1.jpg", "type": "image"}]	{adidas,yeezy,slides}	active	2024-07-10 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000005	\N	Nike Air Max 90 Infrared	nike-air-max-90-infrared	The OG Air Max 90 in the iconic Infrared colorway. Timeless design.	The Nike Air Max 90 Infrared is one of the most important sneakers ever created. This reissue stays faithful to the 1990 original with its layered upper of mesh, leather, and synthetic materials. The visible Max Air unit in the heel revolutionized sneaker design, and the Infrared accents remain one of the most recognizable color schemes in footwear.	Sneakers	Nike	140.00	\N	/images/products/am90-infrared-1.jpg	\N	4.70	178	8	t	SNK-AM90-INF	{7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,13}	{"Mixed material upper","Visible Max Air unit","Rubber waffle outsole","Padded collar"}	{"Brand": "Nike", "Color": "White/Black/Infrared", "Style": "Air Max 90", "Release": "2024"}	[{"url": "/images/products/am90-infrared-1.jpg", "type": "image"}]	{nike,air-max,retro}	active	2024-11-05 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000006	\N	Sony WH-1000XM5 Headphones	sony-wh1000xm5-headphones	Industry-leading noise cancelling wireless headphones with exceptional sound.	The Sony WH-1000XM5 sets the standard for premium noise-cancelling headphones. With eight microphones and two processors for unparalleled noise cancellation, 30-hour battery life, and exceptional audio quality with LDAC support, these headphones deliver an immersive listening experience. The lightweight design and soft-fit leather earpads ensure all-day comfort.	Electronics	Sony	348.00	400.00	/images/products/sony-xm5-1.jpg	Sale	4.90	312	15	t	ELC-SNY-XM5	\N	{"Industry-leading noise cancellation","30-hour battery life","LDAC Hi-Res Audio","Multipoint connection"}	{"Type": "Over-ear wireless", "Brand": "Sony", "Driver": "30mm", "Weight": "250g"}	[{"url": "/images/products/sony-xm5-1.jpg", "type": "image"}]	{sony,headphones,audio,featured}	active	2024-06-15 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000007	\N	Apple AirPods Pro 2	apple-airpods-pro-2	Active noise cancellation, spatial audio, and USB-C charging case.	AirPods Pro 2 deliver up to 2x more active noise cancellation than the previous generation. With Adaptive Transparency, personalized Spatial Audio, and a custom-built driver for incredible sound quality, these earbuds are perfect for music, calls, and everything in between. The MagSafe charging case provides up to 6 hours of listening time with a single charge.	Electronics	Apple	199.00	\N	/images/products/airpods-pro-1.jpg	\N	4.70	498	30	t	ELC-APL-APP2	\N	{"Active Noise Cancellation","Adaptive Transparency","Personalized Spatial Audio","USB-C MagSafe case"}	{"Chip": "H2", "Type": "In-ear wireless", "Brand": "Apple", "Battery Life": "6 hours"}	[{"url": "/images/products/airpods-pro-1.jpg", "type": "image"}]	{apple,airpods,audio}	active	2024-09-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
b4466646-1c8f-4b91-9cb1-12bc7c632966	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Authentic Louis Vuitton CarryAll MM M46203 Monogram Canvas Shoulder Bag	authentic-louis-vuitton-carryall-mm-m46203	Medium size CarryAll in classic monogram canvas	The CarryAll MM offers more space while maintaining the elegant silhouette. Perfect for work or travel with its organized interior and comfortable shoulder straps.	Accessories	Louis Vuitton	278.00	\N	/images/sally/lv-carryall-mm-m46203.jpg	\N	4.80	15	1	t	SALLY-LV-003	\N	\N	{}	[]	{}	active	2026-04-08 16:30:00+00	2026-04-20 11:11:41.192202+00	\N	\N	f
00000000-0000-0000-0000-000000000008	\N	Samsung Galaxy Tab S9	samsung-galaxy-tab-s9	Premium Android tablet with AMOLED display and S Pen included.	The Samsung Galaxy Tab S9 features a stunning 11-inch Dynamic AMOLED 2X display with 120Hz refresh rate, the powerful Snapdragon 8 Gen 2 processor, and comes with the S Pen included. Water-resistant with an IP68 rating, this tablet is built for productivity, creativity, and entertainment. With 128GB storage and expandable microSD support, you'll never run out of space.	Electronics	Samsung	649.00	800.00	/images/products/tab-s9-1.jpg	Sale	4.60	167	7	t	ELC-SAM-TS9	\N	{"11\\" Dynamic AMOLED 2X display","S Pen included","IP68 water resistant","Snapdragon 8 Gen 2"}	{"Brand": "Samsung", "Display": "11\\" AMOLED", "Storage": "128GB", "Processor": "Snapdragon 8 Gen 2"}	[{"url": "/images/products/tab-s9-1.jpg", "type": "image"}]	{samsung,tablet,featured}	active	2024-10-10 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000009	\N	JBL Charge 5 Speaker	jbl-charge-5-speaker	Portable Bluetooth speaker with powerful bass and 20-hour battery.	The JBL Charge 5 delivers bold JBL Original Pro Sound with its optimized long-excursion driver and dual JBL bass radiators. IP67 waterproof and dustproof, it's built for any adventure. With 20 hours of playtime and a built-in powerbank to charge your devices, the Charge 5 is the ultimate portable speaker.	Electronics	JBL	140.00	\N	/images/products/jbl-charge5-1.jpg	\N	4.50	234	22	t	ELC-JBL-CH5	\N	{"JBL Original Pro Sound","IP67 waterproof","20-hour battery","Built-in powerbank"}	{"Type": "Portable speaker", "Brand": "JBL", "Weight": "960g", "Connectivity": "Bluetooth 5.1"}	[{"url": "/images/products/jbl-charge5-1.jpg", "type": "image"}]	{jbl,speaker,bluetooth}	active	2024-08-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000010	\N	Meta Quest 3 VR Headset	meta-quest-3-vr-headset	Mixed reality headset with breakthrough graphics and immersive experiences.	Meta Quest 3 is the most powerful Quest yet, featuring the Snapdragon XR2 Gen 2 processor and a stunning 4K+ Infinite Display. With full-color passthrough and advanced mixed reality capabilities, you can seamlessly blend virtual content with your real environment. Access thousands of VR games, apps, and experiences with no PC required.	Electronics	Meta	499.00	\N	/images/products/quest3-1.jpg	\N	4.40	145	10	t	ELC-MTA-QS3	\N	{"Snapdragon XR2 Gen 2","4K+ Infinite Display","Full-color mixed reality","No PC required"}	{"Type": "VR Headset", "Brand": "Meta", "Storage": "128GB", "Processor": "Snapdragon XR2 Gen 2"}	[{"url": "/images/products/quest3-1.jpg", "type": "image"}]	{meta,vr,gaming}	active	2024-11-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000011	\N	Essentials Fear of God Hoodie	essentials-fear-of-god-hoodie	Oversized fleece hoodie with signature Essentials branding. Ultra cozy.	The Essentials Fear of God Hoodie embodies the brand's minimalist luxury aesthetic. Made from heavyweight fleece cotton with a relaxed, oversized fit, it features the signature rubber Essentials logo on the chest. The ribbed cuffs and hem, kangaroo pocket, and lined hood make it a premium wardrobe staple for any season.	Apparel	Fear of God Essentials	90.00	\N	/images/products/fog-hoodie-1.jpg	\N	4.70	89	15	t	STW-FOG-HDY	{XS,S,M,L,XL,XXL}	{"Heavyweight fleece cotton","Oversized relaxed fit","Rubber logo detail","Kangaroo pocket"}	{"Fit": "Oversized", "Care": "Machine wash cold", "Brand": "Fear of God Essentials", "Material": "100% Cotton"}	[{"url": "/images/products/fog-hoodie-1.jpg", "type": "image"}]	{essentials,hoodie,fog,featured}	active	2024-09-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000012	\N	Nike Tech Fleece Joggers	nike-tech-fleece-joggers	Slim-fit joggers in Nike's signature Tech Fleece fabric. Warm without bulk.	Nike Tech Fleece Joggers deliver warmth without the weight. The innovative Tech Fleece fabric uses a foam layer sandwiched between two layers of jersey for lightweight insulation. The tapered leg, zippered pockets, and ribbed cuffs create a clean, modern silhouette that transitions seamlessly from the gym to the street.	Apparel	Nike	110.00	\N	/images/products/nike-tech-1.jpg	\N	4.60	203	20	t	STW-NKE-TFJ	{S,M,L,XL,XXL}	{"Nike Tech Fleece fabric","Zippered pockets","Tapered slim fit","Ribbed cuffs"}	{"Fit": "Slim tapered", "Care": "Machine wash", "Brand": "Nike", "Material": "Tech Fleece"}	[{"url": "/images/products/nike-tech-1.jpg", "type": "image"}]	{nike,joggers,tech-fleece}	active	2024-10-15 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000013	\N	Supreme Box Logo Tee	supreme-box-logo-tee	The iconic Supreme box logo on premium cotton. A streetwear grail.	The Supreme Box Logo Tee is one of the most recognizable pieces in streetwear culture. This season's release features the classic box logo printed on a heavyweight 100% cotton tee. The relaxed fit and reinforced collar ensure durability and comfort. A must-have for any streetwear collection.	Apparel	Supreme	68.00	\N	/images/products/supreme-bogo-1.jpg	\N	4.40	67	5	t	STW-SPR-BOG	{S,M,L,XL}	{"Heavyweight cotton","Box logo print","Reinforced collar","Relaxed fit"}	{"Fit": "Relaxed", "Care": "Machine wash cold", "Brand": "Supreme", "Material": "100% Cotton"}	[{"url": "/images/products/supreme-bogo-1.jpg", "type": "image"}]	{supreme,tee,box-logo}	active	2024-07-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000014	\N	Stussy 8 Ball Hoodie	stussy-8-ball-hoodie	Classic Stussy graphic hoodie with the iconic 8-ball design.	The Stussy 8 Ball Hoodie is a streetwear classic that has endured for decades. This midweight fleece pullover features the iconic 8-ball graphic on the back and a small Stussy logo on the chest. With a standard fit, kangaroo pocket, and ribbed trims, it's a timeless piece that belongs in every collection.	Apparel	Stussy	85.00	100.00	/images/products/stussy-8ball-1.jpg	Sale	4.50	112	14	t	STW-STY-8BL	{S,M,L,XL,XXL}	{"Midweight fleece","Iconic 8-ball graphic","Kangaroo pocket","Ribbed cuffs and hem"}	{"Fit": "Standard", "Care": "Machine wash", "Brand": "Stussy", "Material": "80% Cotton / 20% Polyester"}	[{"url": "/images/products/stussy-8ball-1.jpg", "type": "image"}]	{stussy,hoodie,graphic}	active	2024-08-15 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000015	\N	Carhartt WIP Detroit Jacket	carhartt-wip-detroit-jacket	Rugged organic cotton canvas jacket with blanket-lined interior.	The Carhartt WIP Detroit Jacket is a workwear icon reimagined for modern streetwear. Crafted from organic cotton canvas with a blanket-lined interior for warmth, it features a corduroy collar, adjustable hem, and double chest pockets. The relaxed fit allows for layering while maintaining a structured silhouette.	Apparel	Carhartt WIP	225.00	\N	/images/products/carhartt-detroit-1.jpg	\N	4.80	76	6	t	STW-CRT-DET	{S,M,L,XL,XXL}	{"Organic cotton canvas","Blanket-lined interior","Corduroy collar","Double chest pockets"}	{"Fit": "Relaxed", "Care": "Machine wash cold", "Brand": "Carhartt WIP", "Material": "Organic cotton canvas"}	[{"url": "/images/products/carhartt-detroit-1.jpg", "type": "image"}]	{carhartt,jacket,workwear}	active	2024-10-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000016	\N	Ember Temperature Control Mug	ember-temperature-mug	Smart mug that keeps your drink at the perfect temperature for hours.	The Ember Mug 2 uses innovative temperature control technology to keep your hot beverage at your preferred drinking temperature for up to 1.5 hours on a single charge, or all day on the included charging coaster. Control everything from the Ember app — set your ideal temperature, receive notifications, and create presets.	Home & Living	Ember	130.00	\N	/images/products/ember-mug-1.jpg	\N	4.30	89	20	t	HML-EMB-MG2	\N	{"Temperature control technology","1.5-hour battery life","App controlled","Charging coaster included"}	{"Brand": "Ember", "Capacity": "10 oz", "Material": "Stainless steel", "Connectivity": "Bluetooth"}	[{"url": "/images/products/ember-mug-1.jpg", "type": "image"}]	{ember,mug,smart-home}	active	2024-06-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000017	\N	Philips Hue Starter Kit	philips-hue-starter-kit	Smart LED light bulbs with bridge. 16 million colors at your fingertips.	Transform your home lighting with the Philips Hue Starter Kit. Includes three A19 smart LED bulbs and the Hue Bridge for whole-home control. Choose from 16 million colors and shades of white to set the perfect mood. Works with Alexa, Google Home, and Apple HomeKit for seamless voice control.	Home & Living	Philips	135.00	170.00	/images/products/hue-kit-1.jpg	Sale	4.60	256	12	t	HML-PHI-HUE	\N	{"16 million colors","Voice assistant compatible","Schedule automations","Hue Bridge included"}	{"Type": "LED Smart Bulbs", "Brand": "Philips Hue", "Count": "3 bulbs + bridge", "Connectivity": "Zigbee + Bluetooth"}	[{"url": "/images/products/hue-kit-1.jpg", "type": "image"}]	{philips,smart-home,lighting,featured}	active	2024-07-15 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000018	\N	Dyson V15 Detect Vacuum	dyson-v15-detect-vacuum	Cordless vacuum with laser dust detection and powerful suction.	The Dyson V15 Detect reveals dust you can't normally see with a precisely-angled laser on the Fluffy Optic cleaner head. An acoustic piezo sensor counts and sizes particles, automatically increasing suction power when needed. With up to 60 minutes of fade-free suction and advanced filtration, it's the most intelligent cordless vacuum yet.	Home & Living	Dyson	599.00	\N	/images/products/dyson-v15-1.jpg	\N	4.70	189	5	t	HML-DYS-V15	\N	{"Laser dust detection","Piezo sensor auto-adjust","60-min battery life","HEPA filtration"}	{"Type": "Cordless vacuum", "Brand": "Dyson", "Weight": "6.8 lbs", "Run Time": "Up to 60 min"}	[{"url": "/images/products/dyson-v15-1.jpg", "type": "image"}]	{dyson,vacuum,cleaning}	active	2024-09-10 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000019	\N	Le Creuset Dutch Oven 5.5 Qt	le-creuset-dutch-oven	Iconic enameled cast iron Dutch oven. A kitchen essential for generations.	The Le Creuset Signature Round Dutch Oven is the brand's iconic piece, crafted from enameled cast iron for superior heat distribution and retention. The 5.5-quart capacity is perfect for feeding a family. The colorful exterior enamel resists chipping and cracking, while the sand-colored interior makes it easy to monitor food. Oven-safe up to 500°F.	Home & Living	Le Creuset	380.00	\N	/images/products/lecreuset-do-1.jpg	\N	4.90	342	8	t	HML-LCR-DO5	\N	{"Enameled cast iron","Superior heat distribution","Oven safe to 500°F","Lifetime warranty"}	{"Brand": "Le Creuset", "Color": "Flame Orange", "Capacity": "5.5 Qt", "Material": "Enameled cast iron"}	[{"url": "/images/products/lecreuset-do-1.jpg", "type": "image"}]	{le-creuset,cookware,kitchen}	active	2024-05-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000020	\N	Sonos One Smart Speaker	sonos-one-speaker	Compact smart speaker with rich sound and built-in voice control.	Sonos One delivers impressively rich, room-filling sound in a compact design. With built-in Alexa and Google Assistant, you can play music, check the news, and control your smart home — all with your voice. Connect multiple Sonos speakers for whole-home audio. AirPlay 2 compatible for seamless streaming from Apple devices.	Home & Living	Sonos	199.00	\N	/images/products/sonos-one-1.jpg	\N	4.60	198	16	t	HML-SNS-ONE	\N	{"Rich room-filling sound","Built-in voice assistants","AirPlay 2 compatible","Multi-room capable"}	{"Type": "Smart speaker", "Brand": "Sonos", "Weight": "4.4 lbs", "Connectivity": "Wi-Fi, AirPlay 2"}	[{"url": "/images/products/sonos-one-1.jpg", "type": "image"}]	{sonos,speaker,smart-home}	active	2024-08-05 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000021	\N	Casio G-Shock GA-2100	casio-g-shock-ga2100	Ultra-slim G-Shock with octagonal bezel. The CasiOak.	The Casio G-Shock GA-2100 — nicknamed 'CasiOak' for its resemblance to the iconic AP Royal Oak — features an ultra-slim carbon core guard structure. The octagonal bezel, double LED light, and shock-resistant design make it both stylish and rugged. Water-resistant to 200 meters with a 3-year battery life.	Accessories	Casio	99.00	\N	/images/products/gshock-2100-1.jpg	\N	4.70	267	25	t	ACC-CSO-2100	\N	{"Carbon core guard","Shock resistant","200m water resistant","3-year battery"}	{"Type": "G-Shock GA-2100", "Brand": "Casio", "Movement": "Quartz", "Water Resistance": "200m"}	[{"url": "/images/products/gshock-2100-1.jpg", "type": "image"}]	{casio,watch,g-shock,featured}	active	2024-07-01 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000022	\N	Ray-Ban Wayfarer Classic	ray-ban-wayfarer-classic	The world's most iconic sunglasses. Timeless style since 1952.	The Ray-Ban Original Wayfarer is the most recognizable style in the history of sunglasses. Since 1952, the Wayfarer has been worn by cultural icons and remains a symbol of effortless cool. These feature the original Wayfarer shape with high-quality crystal green G-15 lenses that provide excellent clarity and UV protection.	Accessories	Ray-Ban	163.00	\N	/images/products/rayban-way-1.jpg	\N	4.80	456	30	t	ACC-RBN-WAY	\N	{"Crystal green G-15 lenses","100% UV protection","Acetate frame","Metal hinges"}	{"Lens": "Crystal Green G-15", "Brand": "Ray-Ban", "Model": "RB2140 Wayfarer", "Material": "Acetate"}	[{"url": "/images/products/rayban-way-1.jpg", "type": "image"}]	{ray-ban,sunglasses,wayfarer}	active	2024-06-20 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000023	\N	Herschel Retreat Backpack	herschel-retreat-backpack	Classic backpack with laptop sleeve and signature striped lining.	The Herschel Retreat Backpack is a refined version of the brand's classic mountaineering-inspired design. Featuring a durable EcoSystem fabric exterior, fleece-lined 15" laptop sleeve, and the signature striped fabric liner, it's built for daily use. Magnetic strap closures and a drawstring top opening provide secure storage for all your essentials.	Accessories	Herschel	80.00	\N	/images/products/herschel-retreat-1.jpg	\N	4.50	134	18	t	ACC-HRS-RET	\N	{"15\\" laptop sleeve","EcoSystem recycled fabric","Magnetic strap closures","Striped fabric liner"}	{"Type": "Backpack", "Brand": "Herschel", "Volume": "19.5L", "Material": "EcoSystem fabric"}	[{"url": "/images/products/herschel-retreat-1.jpg", "type": "image"}]	{herschel,backpack,bag}	active	2024-09-05 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000024	\N	Apple Watch SE (2024)	apple-watch-se-2024	Essential Apple Watch features at an accessible price point.	The Apple Watch SE (2024) brings essential Apple Watch features at an accessible price. Track your daily activity, workout with precision, and stay connected with calls and messages right from your wrist. With crash detection, fall detection, and Emergency SOS, it's also a powerful safety device. The swim-proof design and all-day battery life make it perfect for everyday use.	Accessories	Apple	249.00	\N	/images/products/watch-se-1.jpg	\N	4.60	321	14	t	ACC-APL-WSE	\N	{"Activity tracking","Crash & fall detection","Swim proof (50m)","All-day battery life"}	{"Type": "Smartwatch", "Brand": "Apple", "Display": "OLED Retina", "Water Resistance": "50m"}	[{"url": "/images/products/watch-se-1.jpg", "type": "image"}]	{apple,watch,wearable}	active	2024-10-25 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000025	\N	The North Face Borealis Backpack	north-face-borealis-backpack	Versatile daypack with FlexVent suspension and laptop compartment.	The North Face Borealis is a versatile, durable daypack with a comfortable FlexVent suspension system. The updated design features a dedicated laptop compartment, a secondary compartment with an internal organization sleeve, and a front bungee system for extra storage. Made from 100% recycled nylon, it's built to last while reducing environmental impact.	Accessories	The North Face	99.00	110.00	/images/products/tnf-borealis-1.jpg	Sale	4.70	287	22	t	ACC-TNF-BOR	\N	{"FlexVent suspension system","Laptop compartment","100% recycled nylon","Front bungee system"}	{"Type": "Daypack", "Brand": "The North Face", "Volume": "28L", "Material": "Recycled nylon"}	[{"url": "/images/products/tnf-borealis-1.jpg", "type": "image"}]	{north-face,backpack,bag}	active	2024-08-30 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000026	\N	BE@RBRICK KAWS 1000%	bearbrick-1000-kaws	Limited edition KAWS x Medicom collaboration figure. Art meets collectible.	The BE@RBRICK KAWS 1000% represents the pinnacle of designer toy collecting. This massive 70cm figure features KAWS' signature XX eyes and crossed-out motif on the iconic bear form. A collaboration between KAWS and Medicom Toy, this limited edition piece is both a work of art and a highly sought-after collectible.	Collectibles	Medicom Toy x KAWS	1200.00	\N	/images/products/bearbrick-kaws-1.jpg	\N	4.90	23	2	t	COL-BBR-KWS	\N	{"1000% size (70cm)","KAWS collaboration","Limited edition","Premium vinyl construction"}	{"Brand": "Medicom Toy x KAWS", "Height": "70cm (27.6\\")", "Edition": "Limited", "Material": "Vinyl"}	[{"url": "/images/products/bearbrick-kaws-1.jpg", "type": "image"}]	{bearbrick,kaws,figure,limited}	active	2024-11-10 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000027	\N	Pokemon Charizard PSA 10	pokemon-charizard-psa-10	Gem Mint PSA 10 graded Base Set Charizard. The holy grail of Pokemon cards.	This PSA 10 Gem Mint Charizard from the Pokemon Base Set is one of the most coveted trading cards in the hobby. Graded by Professional Sports Authenticator at the highest possible grade, this card features perfect centering, sharp corners, and flawless surfaces. A true investment piece and the crown jewel of any Pokemon collection.	Collectibles	Pokemon	850.00	\N	/images/products/charizard-psa10-1.jpg	\N	5.00	12	1	t	COL-PKM-CHR	\N	{"PSA 10 Gem Mint grade","Base Set holographic","Authenticated & encased","Investment grade"}	{"Set": "Base Set", "Card": "#4/102 Charizard", "Year": "1999", "Grade": "PSA 10 Gem Mint"}	[{"url": "/images/products/charizard-psa10-1.jpg", "type": "image"}]	{pokemon,cards,graded,featured}	active	2024-10-05 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000028	\N	LEGO Star Wars Millennium Falcon	lego-star-wars-millennium-falcon	Ultimate Collector Series Millennium Falcon. 7,541 pieces of pure joy.	The LEGO Star Wars Ultimate Collector Series Millennium Falcon is one of the largest and most detailed LEGO sets ever created. At 7,541 pieces, this 1:1 scale replica features incredible interior detail including the cockpit, main hold with game table, rear compartment, and top/bottom gunner stations. Includes 4 classic crew minifigures plus 3 Episode VII characters.	Collectibles	LEGO	849.00	\N	/images/products/lego-falcon-1.jpg	\N	4.90	67	3	t	COL-LGO-MF	\N	{"7,541 pieces","1:1 scale replica","Detailed interior","7 minifigures included"}	{"Brand": "LEGO", "Theme": "Star Wars UCS", "Pieces": "7,541", "Dimensions": "33\\" x 22\\" x 8\\""}	[{"url": "/images/products/lego-falcon-1.jpg", "type": "image"}]	{lego,star-wars,ucs}	active	2024-06-10 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
00000000-0000-0000-0000-000000000029	\N	Funko Pop! Spider-Man Exclusive	funko-pop-spider-man-exclusive	Limited chase variant with metallic finish. A must for Marvel collectors.	This exclusive Funko Pop! Spider-Man features a stunning metallic finish that sets it apart from the standard release. The chase variant includes the character in the classic red and blue suit with web-slinging action pose. Standing approximately 3.75 inches tall, this vinyl figure comes in a window display box and is perfect for any Marvel collection.	Collectibles	Funko	45.00	55.00	/images/products/funko-spiderman-1.jpg	Sale	4.60	98	9	t	COL-FNK-SPD	\N	{"Metallic chase variant","Exclusive release","Window display box","3.75\\" vinyl figure"}	{"Line": "Pop! Marvel", "Brand": "Funko", "Height": "3.75\\"", "Material": "Vinyl"}	[{"url": "/images/products/funko-spiderman-1.jpg", "type": "image"}]	{funko,pop,marvel,exclusive}	active	2024-09-25 00:00:00+00	2026-04-15 08:36:23.825066+00	\N	\N	f
35ef7596-ce5d-43a3-b086-151bc40f160b	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Gucci GG Marmont Half Moon Quilted Leather Crossbody Bag	gucci-gg-marmont-half-moon-quilted-leather-crossbody-bag	Authentic Gucci crossbody bag in excellent condition	Luxurious Gucci GG Marmont Half Moon bag featuring quilted leather and signature GG hardware. Perfect for everyday elegance.	Accessories	Gucci	298.00	\N	/images/sally/gucci-marmont-bag.jpg	\N	4.80	5	1	t	SALLY-GUCCI-001	\N	\N	{}	[]	{}	active	2026-04-08 15:00:00+00	2026-04-20 11:11:41.192202+00	\N	\N	f
3d821011-0757-480e-9a61-a37128bc90ea	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Louis Vuitton Alma BB Trunk M28105 Monogram Canvas Handbag	louis-vuitton-alma-bb-trunk-m28105	Authentic Louis Vuitton Alma BB in iconic monogram canvas	The iconic Alma BB handbag in Monogram canvas combines timeless elegance with modern functionality. Features natural cowhide leather trim and gleaming golden hardware.	Accessories	Louis Vuitton	368.00	\N	/images/sally/lv-alma-bb-m28105.jpg	\N	4.90	12	1	t	SALLY-LV-001	\N	\N	{}	[]	{}	active	2026-04-08 15:30:00+00	2026-04-20 11:11:41.192202+00	\N	\N	f
5f6db863-dc0c-4024-bc39-25dcd64042d8	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Louis Vuitton CarryAll BB M13014 Monogram Canvas Shoulder Bag	louis-vuitton-carryall-bb-m13014	Compact and versatile Louis Vuitton CarryAll BB	The CarryAll BB in Monogram canvas is perfect for daily essentials. Features adjustable shoulder strap and spacious interior with multiple compartments.	Accessories	Louis Vuitton	308.00	\N	/images/sally/lv-carryall-bb-m13014.jpg	\N	4.70	8	1	t	SALLY-LV-002	\N	\N	{}	[]	{}	active	2026-04-08 16:00:00+00	2026-04-20 11:11:41.192202+00	\N	\N	f
49c9aa0f-7f39-4867-8665-d4f5a4a47727	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Louis Vuitton M46373 OnTheGo Small Tote Reversible Monogram Canvas	louis-vuitton-m46373-onthego-small-tote	Versatile OnTheGo Small tote in reversible monogram canvas	The OnTheGo Small tote features reversible Monogram and Monogram Giant canvas. Perfect for everyday use with its spacious interior and comfortable handles.	Accessories	Louis Vuitton	268.00	\N	/images/sally/lv-onthego-small-m46373.jpg	\N	4.60	10	1	t	SALLY-LV-004	\N	\N	{}	[]	{}	active	2026-04-08 17:00:00+00	2026-04-20 11:11:53.297136+00	\N	\N	f
42b46d20-27ff-48d6-b0f2-2ab3b08d8f0b	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	LV M46279 Pochette Métis East West Monogram Canvas Crossbody Bag	lv-m46279-pochette-metis-east-west	Elegant Pochette Métis in East West design	The Pochette Métis East West combines the houses iconic codes with contemporary functionality. Features chain shoulder strap and signature S-lock closure.	Accessories	Louis Vuitton	268.00	\N	/images/sally/lv-pochette-metis-m46279.jpg	\N	4.70	6	1	t	SALLY-LV-005	\N	\N	{}	[]	{}	active	2026-04-08 17:30:00+00	2026-04-20 11:11:53.297136+00	\N	\N	f
4df72173-81bf-4218-beff-6e81789bc20a	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Luxury Monogram Bag Top Grain Leather	luxury-monogram-bag-top-grain-leather	Premium monogram bag in top grain leather	Sophisticated monogram design crafted from top grain leather. Features elegant hardware and spacious interior perfect for luxury accessories.	Accessories	Designer	285.00	\N	/images/sally/luxury-monogram-bag.jpg	\N	4.50	7	1	t	SALLY-LUX-001	\N	\N	{}	[]	{}	active	2026-04-08 18:00:00+00	2026-04-20 11:11:53.297136+00	\N	\N	f
\.


--
-- TOC entry 3646 (class 0 OID 16673)
-- Dependencies: 228
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, reporter_id, target_type, target_id, reason, details, status, created_at, resolved_at) FROM stdin;
\.


--
-- TOC entry 3640 (class 0 OID 16549)
-- Dependencies: 222
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, product_id, ask_id, bid_id, seller_id, buyer_id, size, sale_price, sold_at) FROM stdin;
595baadd-4dfe-4eef-9f9f-24e08f148990	00000000-0000-0000-0000-000000000001	\N	\N	00000000-0000-0000-0000-000000000099	00000000-0000-0000-0000-000000000096	9	218.00	2024-10-15 00:00:00+00
8858f800-860a-449f-8999-0e77a2002484	00000000-0000-0000-0000-000000000002	\N	\N	00000000-0000-0000-0000-000000000098	00000000-0000-0000-0000-000000000095	10	112.00	2024-10-20 00:00:00+00
ee30f5ff-7e48-4baf-8284-1ab1975122db	00000000-0000-0000-0000-000000000006	\N	\N	00000000-0000-0000-0000-000000000097	00000000-0000-0000-0000-000000000096	\N	340.00	2024-11-01 00:00:00+00
a5ea558f-f6c1-4d10-90d9-c7c5e1fab5ee	00000000-0000-0000-0000-000000000011	\N	\N	00000000-0000-0000-0000-000000000099	00000000-0000-0000-0000-000000000095	M	88.00	2024-10-25 00:00:00+00
9b812aac-e2f0-4011-8914-04dae5c3b8d5	00000000-0000-0000-0000-000000000026	\N	\N	00000000-0000-0000-0000-000000000098	00000000-0000-0000-0000-000000000096	\N	1150.00	2024-11-05 00:00:00+00
\.


--
-- TOC entry 3642 (class 0 OID 16605)
-- Dependencies: 224
-- Data for Name: sales_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_history (id, product_id, size, sale_price, sale_date) FROM stdin;
\.


--
-- TOC entry 3645 (class 0 OID 16654)
-- Dependencies: 227
-- Data for Name: sponsored_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sponsored_slots (id, product_id, vendor_id, category, keyword, duration_days, price_cents, starts_at, expires_at, status, stripe_session_id, paid_at, created_at) FROM stdin;
\.


--
-- TOC entry 3654 (class 0 OID 0)
-- Dependencies: 216
-- Name: _migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public._migrations_id_seq', 10, true);


--
-- TOC entry 3416 (class 2606 OID 16399)
-- Name: _migrations _migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_name_key UNIQUE (name);


--
-- TOC entry 3418 (class 2606 OID 16397)
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3435 (class 2606 OID 16528)
-- Name: asks asks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asks
    ADD CONSTRAINT asks_pkey PRIMARY KEY (id);


--
-- TOC entry 3441 (class 2606 OID 16543)
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- TOC entry 3420 (class 2606 OID 16493)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 3422 (class 2606 OID 16491)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3424 (class 2606 OID 16495)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 3453 (class 2606 OID 16577)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 16579)
-- Name: favorites favorites_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- TOC entry 3467 (class 2606 OID 16646)
-- Name: featured_slots featured_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_slots
    ADD CONSTRAINT featured_slots_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 16628)
-- Name: price_alerts price_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_alerts
    ADD CONSTRAINT price_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 3433 (class 2606 OID 16515)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3479 (class 2606 OID 16685)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3461 (class 2606 OID 16611)
-- Name: sales_history sales_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3451 (class 2606 OID 16555)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 16664)
-- Name: sponsored_slots sponsored_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsored_slots
    ADD CONSTRAINT sponsored_slots_pkey PRIMARY KEY (id);


--
-- TOC entry 3436 (class 1259 OID 16594)
-- Name: idx_asks_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asks_price ON public.asks USING btree (ask_price);


--
-- TOC entry 3437 (class 1259 OID 16591)
-- Name: idx_asks_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asks_product_id ON public.asks USING btree (product_id);


--
-- TOC entry 3438 (class 1259 OID 16592)
-- Name: idx_asks_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asks_seller_id ON public.asks USING btree (seller_id);


--
-- TOC entry 3439 (class 1259 OID 16593)
-- Name: idx_asks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asks_status ON public.asks USING btree (status);


--
-- TOC entry 3442 (class 1259 OID 16598)
-- Name: idx_bids_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_amount ON public.bids USING btree (bid_amount DESC);


--
-- TOC entry 3443 (class 1259 OID 16596)
-- Name: idx_bids_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_buyer_id ON public.bids USING btree (buyer_id);


--
-- TOC entry 3444 (class 1259 OID 16595)
-- Name: idx_bids_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_product_id ON public.bids USING btree (product_id);


--
-- TOC entry 3445 (class 1259 OID 16597)
-- Name: idx_bids_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_status ON public.bids USING btree (status);


--
-- TOC entry 3456 (class 1259 OID 16604)
-- Name: idx_favorites_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_product_id ON public.favorites USING btree (product_id);


--
-- TOC entry 3457 (class 1259 OID 16603)
-- Name: idx_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);


--
-- TOC entry 3468 (class 1259 OID 16652)
-- Name: idx_featured_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_active ON public.featured_slots USING btree (status, expires_at) WHERE ((status)::text = 'active'::text);


--
-- TOC entry 3469 (class 1259 OID 16653)
-- Name: idx_featured_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_product ON public.featured_slots USING btree (product_id);


--
-- TOC entry 3462 (class 1259 OID 16635)
-- Name: idx_price_alerts_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_alerts_product ON public.price_alerts USING btree (product_id, status);


--
-- TOC entry 3463 (class 1259 OID 16634)
-- Name: idx_price_alerts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_alerts_user ON public.price_alerts USING btree (user_id, status);


--
-- TOC entry 3425 (class 1259 OID 16586)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- TOC entry 3426 (class 1259 OID 16590)
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);


--
-- TOC entry 3427 (class 1259 OID 16589)
-- Name: idx_products_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name_trgm ON public.products USING gin (name public.gin_trgm_ops);


--
-- TOC entry 3428 (class 1259 OID 16588)
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- TOC entry 3429 (class 1259 OID 16587)
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- TOC entry 3430 (class 1259 OID 16638)
-- Name: idx_products_translations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_translations ON public.products USING gin (translations);


--
-- TOC entry 3431 (class 1259 OID 16585)
-- Name: idx_products_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_vendor_id ON public.products USING btree (vendor_id);


--
-- TOC entry 3475 (class 1259 OID 16688)
-- Name: idx_reports_reporter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_reporter ON public.reports USING btree (reporter_id);


--
-- TOC entry 3476 (class 1259 OID 16687)
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status) WHERE ((status)::text = 'pending'::text);


--
-- TOC entry 3477 (class 1259 OID 16686)
-- Name: idx_reports_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_target ON public.reports USING btree (target_type, target_id);


--
-- TOC entry 3446 (class 1259 OID 16602)
-- Name: idx_sales_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_buyer_id ON public.sales USING btree (buyer_id);


--
-- TOC entry 3458 (class 1259 OID 16617)
-- Name: idx_sales_history_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_history_product ON public.sales_history USING btree (product_id, sale_date DESC);


--
-- TOC entry 3459 (class 1259 OID 16618)
-- Name: idx_sales_history_product_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_history_product_size ON public.sales_history USING btree (product_id, size, sale_date DESC);


--
-- TOC entry 3447 (class 1259 OID 16599)
-- Name: idx_sales_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_product_id ON public.sales USING btree (product_id);


--
-- TOC entry 3448 (class 1259 OID 16601)
-- Name: idx_sales_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_seller_id ON public.sales USING btree (seller_id);


--
-- TOC entry 3449 (class 1259 OID 16600)
-- Name: idx_sales_sold_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_sold_at ON public.sales USING btree (sold_at DESC);


--
-- TOC entry 3470 (class 1259 OID 16670)
-- Name: idx_sponsored_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsored_active ON public.sponsored_slots USING btree (status, expires_at) WHERE ((status)::text = 'active'::text);


--
-- TOC entry 3471 (class 1259 OID 16671)
-- Name: idx_sponsored_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsored_category ON public.sponsored_slots USING btree (lower((category)::text)) WHERE ((status)::text = 'active'::text);


--
-- TOC entry 3472 (class 1259 OID 16672)
-- Name: idx_sponsored_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsored_vendor ON public.sponsored_slots USING btree (vendor_id);


--
-- TOC entry 3480 (class 1259 OID 16689)
-- Name: uq_reports_open; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_reports_open ON public.reports USING btree (reporter_id, target_type, target_id) WHERE ((status)::text = 'pending'::text);


--
-- TOC entry 3481 (class 2606 OID 16529)
-- Name: asks asks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asks
    ADD CONSTRAINT asks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3482 (class 2606 OID 16544)
-- Name: bids bids_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3486 (class 2606 OID 16580)
-- Name: favorites favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3489 (class 2606 OID 16647)
-- Name: featured_slots featured_slots_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_slots
    ADD CONSTRAINT featured_slots_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3488 (class 2606 OID 16629)
-- Name: price_alerts price_alerts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_alerts
    ADD CONSTRAINT price_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3483 (class 2606 OID 16561)
-- Name: sales sales_ask_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_ask_id_fkey FOREIGN KEY (ask_id) REFERENCES public.asks(id);


--
-- TOC entry 3484 (class 2606 OID 16566)
-- Name: sales sales_bid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id);


--
-- TOC entry 3487 (class 2606 OID 16612)
-- Name: sales_history sales_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3485 (class 2606 OID 16556)
-- Name: sales sales_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3490 (class 2606 OID 16665)
-- Name: sponsored_slots sponsored_slots_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsored_slots
    ADD CONSTRAINT sponsored_slots_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


-- Completed on 2026-05-01 19:26:31 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict mz3jz3bs1k8gR224EoaXra6HpPttrOgLGMUeGa2PcaWOuqqlIkqVvNzG28eRIc6

