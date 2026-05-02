--
-- PostgreSQL database dump
--

\restrict baI7HhrhjOU1B4DQGp3lvcYvId6gEWzXArikPsmsRjQ32TZkp6SohXb1CLg0YJy

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-05-01 19:26:36 UTC

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

DROP INDEX public.idx_sessions_user;
DROP INDEX public.idx_sessions_started;
DROP INDEX public.idx_revenue_vendor;
DROP INDEX public.idx_revenue_order;
DROP INDEX public.idx_revenue_date;
DROP INDEX public.idx_hourly_type;
DROP INDEX public.idx_hourly_hour;
DROP INDEX public.idx_hourly_entity;
DROP INDEX public.idx_events_vendor;
DROP INDEX public.idx_events_user;
DROP INDEX public.idx_events_type;
DROP INDEX public.idx_events_metadata;
DROP INDEX public.idx_events_entity;
DROP INDEX public.idx_events_created;
DROP INDEX public.idx_daily_type;
DROP INDEX public.idx_daily_entity;
DROP INDEX public.idx_daily_date;
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT user_sessions_pkey;
ALTER TABLE ONLY public.revenue_records DROP CONSTRAINT revenue_records_pkey;
ALTER TABLE ONLY public.hourly_metrics DROP CONSTRAINT hourly_metrics_pkey;
ALTER TABLE ONLY public.hourly_metrics DROP CONSTRAINT hourly_metrics_metric_type_entity_type_entity_id_hour_key;
ALTER TABLE ONLY public.events DROP CONSTRAINT events_pkey;
ALTER TABLE ONLY public.daily_metrics DROP CONSTRAINT daily_metrics_pkey;
ALTER TABLE ONLY public.daily_metrics DROP CONSTRAINT daily_metrics_metric_type_entity_type_entity_id_date_key;
ALTER TABLE public.user_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.revenue_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.hourly_metrics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.daily_metrics ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.user_sessions_id_seq;
DROP TABLE public.user_sessions;
DROP SEQUENCE public.revenue_records_id_seq;
DROP TABLE public.revenue_records;
DROP SEQUENCE public.hourly_metrics_id_seq;
DROP TABLE public.hourly_metrics;
DROP SEQUENCE public.events_id_seq;
DROP TABLE public.events;
DROP SEQUENCE public.daily_metrics_id_seq;
DROP TABLE public.daily_metrics;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16421)
-- Name: daily_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_metrics (
    id integer NOT NULL,
    metric_type character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    date date NOT NULL,
    count integer DEFAULT 0,
    sum numeric(15,2) DEFAULT 0,
    avg numeric(15,2) DEFAULT 0,
    min numeric(15,2),
    max numeric(15,2),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- TOC entry 218 (class 1259 OID 16420)
-- Name: daily_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3490 (class 0 OID 0)
-- Dependencies: 218
-- Name: daily_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_metrics_id_seq OWNED BY public.daily_metrics.id;


--
-- TOC entry 215 (class 1259 OID 16386)
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    user_id character varying(100),
    vendor_id character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 214 (class 1259 OID 16385)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3491 (class 0 OID 0)
-- Dependencies: 214
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 217 (class 1259 OID 16403)
-- Name: hourly_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hourly_metrics (
    id integer NOT NULL,
    metric_type character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    hour timestamp with time zone NOT NULL,
    count integer DEFAULT 0,
    sum numeric(15,2) DEFAULT 0,
    avg numeric(15,2) DEFAULT 0,
    min numeric(15,2),
    max numeric(15,2),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- TOC entry 216 (class 1259 OID 16402)
-- Name: hourly_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hourly_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3492 (class 0 OID 0)
-- Dependencies: 216
-- Name: hourly_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hourly_metrics_id_seq OWNED BY public.hourly_metrics.id;


--
-- TOC entry 221 (class 1259 OID 16439)
-- Name: revenue_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenue_records (
    id integer NOT NULL,
    order_id character varying(100) NOT NULL,
    vendor_id character varying(100) NOT NULL,
    buyer_id character varying(100),
    gross_amount numeric(15,2) NOT NULL,
    platform_fee numeric(15,2) DEFAULT 0,
    net_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 220 (class 1259 OID 16438)
-- Name: revenue_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revenue_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3493 (class 0 OID 0)
-- Dependencies: 220
-- Name: revenue_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revenue_records_id_seq OWNED BY public.revenue_records.id;


--
-- TOC entry 223 (class 1259 OID 16453)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id character varying(100),
    session_id character varying(100) NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    page_views integer DEFAULT 0,
    actions integer DEFAULT 0,
    device_type character varying(50),
    browser character varying(100),
    ip_address character varying(45)
);


--
-- TOC entry 222 (class 1259 OID 16452)
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3494 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 3288 (class 2604 OID 16424)
-- Name: daily_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_metrics ALTER COLUMN id SET DEFAULT nextval('public.daily_metrics_id_seq'::regclass);


--
-- TOC entry 3280 (class 2604 OID 16389)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 3283 (class 2604 OID 16406)
-- Name: hourly_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hourly_metrics ALTER COLUMN id SET DEFAULT nextval('public.hourly_metrics_id_seq'::regclass);


--
-- TOC entry 3293 (class 2604 OID 16442)
-- Name: revenue_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_records ALTER COLUMN id SET DEFAULT nextval('public.revenue_records_id_seq'::regclass);


--
-- TOC entry 3298 (class 2604 OID 16456)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 3480 (class 0 OID 16421)
-- Dependencies: 219
-- Data for Name: daily_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_metrics (id, metric_type, entity_type, entity_id, date, count, sum, avg, min, max, metadata) FROM stdin;
\.


--
-- TOC entry 3476 (class 0 OID 16386)
-- Dependencies: 215
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, event_type, entity_type, entity_id, user_id, vendor_id, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3478 (class 0 OID 16403)
-- Dependencies: 217
-- Data for Name: hourly_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hourly_metrics (id, metric_type, entity_type, entity_id, hour, count, sum, avg, min, max, metadata) FROM stdin;
\.


--
-- TOC entry 3482 (class 0 OID 16439)
-- Dependencies: 221
-- Data for Name: revenue_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revenue_records (id, order_id, vendor_id, buyer_id, gross_amount, platform_fee, net_amount, currency, status, created_at) FROM stdin;
\.


--
-- TOC entry 3484 (class 0 OID 16453)
-- Dependencies: 223
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, user_id, session_id, started_at, ended_at, page_views, actions, device_type, browser, ip_address) FROM stdin;
\.


--
-- TOC entry 3495 (class 0 OID 0)
-- Dependencies: 218
-- Name: daily_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_metrics_id_seq', 1, false);


--
-- TOC entry 3496 (class 0 OID 0)
-- Dependencies: 214
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 1, false);


--
-- TOC entry 3497 (class 0 OID 0)
-- Dependencies: 216
-- Name: hourly_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hourly_metrics_id_seq', 1, false);


--
-- TOC entry 3498 (class 0 OID 0)
-- Dependencies: 220
-- Name: revenue_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.revenue_records_id_seq', 1, false);


--
-- TOC entry 3499 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- TOC entry 3318 (class 2606 OID 16434)
-- Name: daily_metrics daily_metrics_metric_type_entity_type_entity_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_metrics
    ADD CONSTRAINT daily_metrics_metric_type_entity_type_entity_id_date_key UNIQUE (metric_type, entity_type, entity_id, date);


--
-- TOC entry 3320 (class 2606 OID 16432)
-- Name: daily_metrics daily_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_metrics
    ADD CONSTRAINT daily_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 3303 (class 2606 OID 16395)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3311 (class 2606 OID 16416)
-- Name: hourly_metrics hourly_metrics_metric_type_entity_type_entity_id_hour_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hourly_metrics
    ADD CONSTRAINT hourly_metrics_metric_type_entity_type_entity_id_hour_key UNIQUE (metric_type, entity_type, entity_id, hour);


--
-- TOC entry 3313 (class 2606 OID 16414)
-- Name: hourly_metrics hourly_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hourly_metrics
    ADD CONSTRAINT hourly_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 3328 (class 2606 OID 16448)
-- Name: revenue_records revenue_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_pkey PRIMARY KEY (id);


--
-- TOC entry 3332 (class 2606 OID 16461)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3321 (class 1259 OID 16437)
-- Name: idx_daily_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_date ON public.daily_metrics USING btree (date);


--
-- TOC entry 3322 (class 1259 OID 16436)
-- Name: idx_daily_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_entity ON public.daily_metrics USING btree (entity_type, entity_id);


--
-- TOC entry 3323 (class 1259 OID 16435)
-- Name: idx_daily_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_type ON public.daily_metrics USING btree (metric_type);


--
-- TOC entry 3304 (class 1259 OID 16400)
-- Name: idx_events_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created ON public.events USING btree (created_at);


--
-- TOC entry 3305 (class 1259 OID 16397)
-- Name: idx_events_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_entity ON public.events USING btree (entity_type, entity_id);


--
-- TOC entry 3306 (class 1259 OID 16401)
-- Name: idx_events_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_metadata ON public.events USING gin (metadata);


--
-- TOC entry 3307 (class 1259 OID 16396)
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (event_type);


--
-- TOC entry 3308 (class 1259 OID 16398)
-- Name: idx_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_user ON public.events USING btree (user_id);


--
-- TOC entry 3309 (class 1259 OID 16399)
-- Name: idx_events_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_vendor ON public.events USING btree (vendor_id);


--
-- TOC entry 3314 (class 1259 OID 16418)
-- Name: idx_hourly_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hourly_entity ON public.hourly_metrics USING btree (entity_type, entity_id);


--
-- TOC entry 3315 (class 1259 OID 16419)
-- Name: idx_hourly_hour; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hourly_hour ON public.hourly_metrics USING btree (hour);


--
-- TOC entry 3316 (class 1259 OID 16417)
-- Name: idx_hourly_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hourly_type ON public.hourly_metrics USING btree (metric_type);


--
-- TOC entry 3324 (class 1259 OID 16451)
-- Name: idx_revenue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_date ON public.revenue_records USING btree (created_at);


--
-- TOC entry 3325 (class 1259 OID 16450)
-- Name: idx_revenue_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_order ON public.revenue_records USING btree (order_id);


--
-- TOC entry 3326 (class 1259 OID 16449)
-- Name: idx_revenue_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_vendor ON public.revenue_records USING btree (vendor_id);


--
-- TOC entry 3329 (class 1259 OID 16463)
-- Name: idx_sessions_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_started ON public.user_sessions USING btree (started_at);


--
-- TOC entry 3330 (class 1259 OID 16462)
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.user_sessions USING btree (user_id);


-- Completed on 2026-05-01 19:26:36 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict baI7HhrhjOU1B4DQGp3lvcYvId6gEWzXArikPsmsRjQ32TZkp6SohXb1CLg0YJy

