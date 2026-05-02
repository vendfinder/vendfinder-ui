--
-- PostgreSQL database dump
--

\restrict RIYeALFK7o8F3HHAM3hUI1QofhnHXwn1O7dWzz6StssPsNmrlD13tXX1buvWL8v

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-05-01 19:26:24 UTC

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

ALTER TABLE ONLY public.users DROP CONSTRAINT users_primary_kyc_document_id_fkey;
ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
ALTER TABLE ONLY public.story_views DROP CONSTRAINT story_views_viewer_id_fkey;
ALTER TABLE ONLY public.story_views DROP CONSTRAINT story_views_story_id_fkey;
ALTER TABLE ONLY public.stories DROP CONSTRAINT stories_user_id_fkey;
ALTER TABLE ONLY public.kyc_extracted_data DROP CONSTRAINT kyc_extracted_data_reviewed_by_fkey;
ALTER TABLE ONLY public.kyc_extracted_data DROP CONSTRAINT kyc_extracted_data_document_id_fkey;
ALTER TABLE ONLY public.kyc_documents DROP CONSTRAINT kyc_documents_verified_by_fkey;
ALTER TABLE ONLY public.kyc_documents DROP CONSTRAINT kyc_documents_user_id_fkey;
DROP TRIGGER trigger_update_kyc_extracted_data_updated_at ON public.kyc_extracted_data;
DROP INDEX public.idx_users_subscription_tier;
DROP INDEX public.idx_users_kyc_status;
DROP INDEX public.idx_story_views_viewer_id;
DROP INDEX public.idx_story_views_story_id;
DROP INDEX public.idx_stories_user_id;
DROP INDEX public.idx_stories_expires_at;
DROP INDEX public.idx_stories_created_at;
DROP INDEX public.idx_kyc_extracted_data_review;
DROP INDEX public.idx_kyc_extracted_data_document_id;
DROP INDEX public.idx_kyc_documents_user_id;
DROP INDEX public.idx_kyc_documents_status;
DROP INDEX public.idx_kyc_documents_processing;
DROP INDEX public.idx_kyc_documents_created_at;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_pkey;
ALTER TABLE ONLY public.story_views DROP CONSTRAINT story_views_story_id_viewer_id_key;
ALTER TABLE ONLY public.story_views DROP CONSTRAINT story_views_pkey;
ALTER TABLE ONLY public.stories DROP CONSTRAINT stories_pkey;
ALTER TABLE ONLY public.kyc_extracted_data DROP CONSTRAINT kyc_extracted_data_pkey;
ALTER TABLE ONLY public.kyc_documents DROP CONSTRAINT kyc_documents_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_name_key;
ALTER TABLE public._migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.users;
DROP TABLE public.user_profiles;
DROP TABLE public.user_backup_20260430;
DROP TABLE public.story_views;
DROP TABLE public.stories;
DROP TABLE public.kyc_extracted_data;
DROP TABLE public.kyc_documents;
DROP SEQUENCE public._migrations_id_seq;
DROP TABLE public._migrations;
DROP FUNCTION public.update_kyc_extracted_data_updated_at();
DROP EXTENSION "uuid-ossp";
--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3574 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 234 (class 1255 OID 16549)
-- Name: update_kyc_extracted_data_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_kyc_extracted_data_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16432)
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 16431)
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
-- TOC entry 3575 (class 0 OID 0)
-- Dependencies: 217
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- TOC entry 221 (class 1259 OID 16490)
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    document_type character varying(50) DEFAULT 'drivers_license'::character varying NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    upload_status character varying(20) DEFAULT 'uploaded'::character varying,
    processing_status character varying(20) DEFAULT 'pending'::character varying,
    verification_status character varying(20) DEFAULT 'unverified'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    verified_at timestamp with time zone,
    verified_by uuid,
    rejection_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT chk_document_type CHECK (((document_type)::text = ANY ((ARRAY['drivers_license'::character varying, 'state_id'::character varying, 'passport'::character varying, 'national_id'::character varying])::text[]))),
    CONSTRAINT chk_processing_status CHECK (((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT chk_upload_status CHECK (((upload_status)::text = ANY ((ARRAY['uploading'::character varying, 'uploaded'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT chk_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['unverified'::character varying, 'verified'::character varying, 'rejected'::character varying, 'requires_review'::character varying])::text[])))
);


--
-- TOC entry 3576 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE kyc_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kyc_documents IS 'Stores uploaded KYC documents (driver licenses, IDs, etc.)';


--
-- TOC entry 3577 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN kyc_documents.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kyc_documents.metadata IS 'Additional metadata like image dimensions, OCR hints, etc.';


--
-- TOC entry 222 (class 1259 OID 16514)
-- Name: kyc_extracted_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_extracted_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    full_name text,
    first_name text,
    last_name text,
    middle_name text,
    date_of_birth date,
    id_number text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    country text DEFAULT 'US'::text,
    expiration_date date,
    issue_date date,
    issuing_authority text,
    extraction_confidence numeric(3,2),
    extraction_service character varying(50) DEFAULT 'google_vision'::character varying,
    raw_ocr_data jsonb,
    field_confidence jsonb,
    manual_review_required boolean DEFAULT false,
    manual_review_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kyc_extracted_data_extraction_confidence_check CHECK (((extraction_confidence >= (0)::numeric) AND (extraction_confidence <= (1)::numeric)))
);


--
-- TOC entry 3578 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE kyc_extracted_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kyc_extracted_data IS 'OCR-extracted data from KYC documents';


--
-- TOC entry 3579 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN kyc_extracted_data.extraction_confidence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kyc_extracted_data.extraction_confidence IS 'Overall confidence score from OCR service (0.0-1.0)';


--
-- TOC entry 3580 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN kyc_extracted_data.field_confidence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kyc_extracted_data.field_confidence IS 'JSON object with per-field confidence scores';


--
-- TOC entry 219 (class 1259 OID 16442)
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type character varying(10) DEFAULT 'image'::character varying NOT NULL,
    text_overlay text,
    text_position character varying(10) DEFAULT 'center'::character varying,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 16463)
-- Name: story_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    story_id uuid NOT NULL,
    viewer_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16558)
-- Name: user_backup_20260430; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_backup_20260430 (
    id uuid,
    email character varying(255),
    username character varying(100),
    password_hash character varying(255),
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    profile_image_url text,
    is_verified boolean,
    is_active boolean,
    role character varying(20),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    trial_ends_at timestamp with time zone,
    seller_fee_paid boolean,
    seller_fee_paid_at timestamp with time zone,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    subscription_status character varying(50),
    subscription_current_period_end timestamp with time zone,
    subscription_tier character varying(20),
    free_featured_slots_used integer,
    free_featured_slots_cycle_start timestamp with time zone,
    kyc_status character varying(20),
    kyc_required_at timestamp with time zone,
    kyc_submitted_at timestamp with time zone,
    kyc_verified_at timestamp with time zone,
    kyc_business_name character varying(255),
    kyc_business_address text,
    kyc_tax_id character varying(100),
    kyc_country character varying(10),
    kyc_notes text,
    primary_kyc_document_id uuid,
    tos_accepted_at timestamp with time zone,
    privacy_accepted_at timestamp with time zone,
    email_verified_at timestamp with time zone,
    tos_version character varying(20),
    auth_provider character varying(50),
    failed_login_attempts integer,
    locked_at timestamp with time zone,
    last_login_at timestamp with time zone
);


--
-- TOC entry 216 (class 1259 OID 16413)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    bio text,
    location character varying(255),
    website character varying(255),
    social_media jsonb,
    preferences jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 215 (class 1259 OID 16396)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    profile_image_url text,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    role character varying(20) DEFAULT 'buyer'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    trial_ends_at timestamp with time zone,
    seller_fee_paid boolean DEFAULT false,
    seller_fee_paid_at timestamp with time zone,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    subscription_status character varying(50) DEFAULT NULL::character varying,
    subscription_current_period_end timestamp with time zone,
    subscription_tier character varying(20) DEFAULT 'standard'::character varying,
    free_featured_slots_used integer DEFAULT 0,
    free_featured_slots_cycle_start timestamp with time zone,
    kyc_status character varying(20) DEFAULT 'not_required'::character varying,
    kyc_required_at timestamp with time zone,
    kyc_submitted_at timestamp with time zone,
    kyc_verified_at timestamp with time zone,
    kyc_business_name character varying(255),
    kyc_business_address text,
    kyc_tax_id character varying(100),
    kyc_country character varying(10),
    kyc_notes text,
    primary_kyc_document_id uuid,
    tos_accepted_at timestamp with time zone,
    privacy_accepted_at timestamp with time zone,
    email_verified_at timestamp with time zone,
    tos_version character varying(20) DEFAULT '1.0'::character varying,
    auth_provider character varying(50) DEFAULT 'email'::character varying,
    failed_login_attempts integer DEFAULT 0,
    locked_at timestamp with time zone,
    last_login_at timestamp with time zone,
    auth_provider_id character varying(255),
    avatar_url character varying(255),
    banner_url character varying(255),
    display_name character varying(255),
    bio text,
    location character varying(255),
    website character varying(255),
    social_links jsonb,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    verified boolean DEFAULT false,
    seller_level character varying(50) DEFAULT 'basic'::character varying,
    seller_rating numeric(3,2) DEFAULT 0.00,
    total_sales integer DEFAULT 0,
    completed_orders integer DEFAULT 0,
    response_time integer DEFAULT 0,
    join_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_active timestamp with time zone,
    preferred_language character varying(10) DEFAULT 'en'::character varying,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    account_status character varying(50) DEFAULT 'active'::character varying,
    profile_views integer DEFAULT 0,
    profile_completion integer DEFAULT 0,
    verification_level integer DEFAULT 0,
    two_factor_enabled boolean DEFAULT false,
    referral_code character varying(50),
    referred_by character varying(50),
    marketing_emails boolean DEFAULT true,
    data_processing_consent boolean DEFAULT false,
    following_count integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    likes_received integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    wishlist_count integer DEFAULT 0,
    collections_count integer DEFAULT 0,
    reviews_count integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0.00,
    social_instagram character varying(255),
    social_twitter character varying(255),
    social_facebook character varying(255),
    social_tiktok character varying(255),
    social_youtube character varying(255),
    social_linkedin character varying(255),
    social_snapchat character varying(255),
    social_pinterest character varying(255),
    social_website character varying(255),
    social_discord character varying(255),
    social_twitch character varying(255),
    social_reddit character varying(255),
    social_github character varying(255),
    social_behance character varying(255),
    social_dribbble character varying(255),
    social_etsy character varying(255)
);


--
-- TOC entry 3345 (class 2604 OID 16435)
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- TOC entry 3563 (class 0 OID 16432)
-- Dependencies: 218
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._migrations (id, name, applied_at) FROM stdin;
1	001_add_seller_fee_columns.sql	2026-04-29 20:07:36.132138+00
2	002_add_stories_tables.sql	2026-04-29 20:07:36.150806+00
3	003_seller_subscription.sql	2026-04-29 20:07:36.221765+00
4	004_subscription_tiers.sql	2026-04-29 20:07:36.234157+00
5	005_kyc.sql	2026-04-29 20:07:36.252109+00
6	006_kyc_documents.sql	2026-04-29 20:07:36.274217+00
\.


--
-- TOC entry 3566 (class 0 OID 16490)
-- Dependencies: 221
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kyc_documents (id, user_id, document_type, file_url, file_name, file_size, mime_type, upload_status, processing_status, verification_status, created_at, processed_at, verified_at, verified_by, rejection_reason, metadata) FROM stdin;
\.


--
-- TOC entry 3567 (class 0 OID 16514)
-- Dependencies: 222
-- Data for Name: kyc_extracted_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kyc_extracted_data (id, document_id, full_name, first_name, last_name, middle_name, date_of_birth, id_number, address_line1, address_line2, city, state, zip_code, country, expiration_date, issue_date, issuing_authority, extraction_confidence, extraction_service, raw_ocr_data, field_confidence, manual_review_required, manual_review_notes, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3564 (class 0 OID 16442)
-- Dependencies: 219
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stories (id, user_id, media_url, media_type, text_overlay, text_position, view_count, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 3565 (class 0 OID 16463)
-- Dependencies: 220
-- Data for Name: story_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.story_views (id, story_id, viewer_id, viewed_at) FROM stdin;
\.


--
-- TOC entry 3568 (class 0 OID 16558)
-- Dependencies: 223
-- Data for Name: user_backup_20260430; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_backup_20260430 (id, email, username, password_hash, first_name, last_name, phone, profile_image_url, is_verified, is_active, role, created_at, updated_at, trial_ends_at, seller_fee_paid, seller_fee_paid_at, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_tier, free_featured_slots_used, free_featured_slots_cycle_start, kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at, kyc_business_name, kyc_business_address, kyc_tax_id, kyc_country, kyc_notes, primary_kyc_document_id, tos_accepted_at, privacy_accepted_at, email_verified_at, tos_version, auth_provider, failed_login_attempts, locked_at, last_login_at) FROM stdin;
e037a025-ff9b-4fff-94ff-e18d876ccb14	admin-test@vendfinder.com	vf_admin_test	$2b$12$dWUmqeaJqiqh2mOLd0zEG.V2IGtxfuFzQhuxw0svrclwB0uhUgjL.	Admin	Test	\N	\N	t	t	admin	2026-04-29 20:06:03.616357+00	2026-04-30 21:41:01.257111+00	\N	f	\N	\N	\N	\N	\N	premium	0	\N	verified	\N	\N	2026-04-30 21:41:01.257111+00	\N	\N	\N	\N	\N	\N	2026-04-30 21:41:01.257111+00	2026-04-30 21:41:01.257111+00	2026-04-30 21:41:01.257111+00	1.0	email	0	\N	\N
\.


--
-- TOC entry 3561 (class 0 OID 16413)
-- Dependencies: 216
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (id, user_id, bio, location, website, social_media, preferences, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3560 (class 0 OID 16396)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, first_name, last_name, phone, profile_image_url, is_verified, is_active, role, created_at, updated_at, trial_ends_at, seller_fee_paid, seller_fee_paid_at, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_tier, free_featured_slots_used, free_featured_slots_cycle_start, kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at, kyc_business_name, kyc_business_address, kyc_tax_id, kyc_country, kyc_notes, primary_kyc_document_id, tos_accepted_at, privacy_accepted_at, email_verified_at, tos_version, auth_provider, failed_login_attempts, locked_at, last_login_at, auth_provider_id, avatar_url, banner_url, display_name, bio, location, website, social_links, email_notifications, push_notifications, verified, seller_level, seller_rating, total_sales, completed_orders, response_time, join_date, last_active, preferred_language, timezone, account_status, profile_views, profile_completion, verification_level, two_factor_enabled, referral_code, referred_by, marketing_emails, data_processing_consent, following_count, followers_count, posts_count, likes_received, comments_count, shares_count, wishlist_count, collections_count, reviews_count, average_rating, social_instagram, social_twitter, social_facebook, social_tiktok, social_youtube, social_linkedin, social_snapchat, social_pinterest, social_website, social_discord, social_twitch, social_reddit, social_github, social_behance, social_dribbble, social_etsy) FROM stdin;
e037a025-ff9b-4fff-94ff-e18d876ccb14	admin-test@vendfinder.com	vf_admin_test	$2b$12$KWRm8kW6SCm3sznaoNa/Z.0UQCc56kx7ND63tFr8rYXDRSV.5/.Om	Admin	Test	\N	\N	t	t	admin	2026-04-29 20:06:03.616357+00	2026-04-30 21:44:24.973438+00	\N	f	\N	\N	\N	\N	\N	premium	0	\N	verified	\N	\N	2026-04-30 21:44:24.973438+00	\N	\N	\N	\N	\N	\N	2026-04-30 21:44:24.973438+00	2026-04-30 21:44:24.973438+00	2026-04-30 21:44:24.973438+00	1.0	email	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	basic	0.00	0	0	0	2026-04-30 21:54:14.009568+00	\N	en	UTC	active	0	0	0	f	\N	\N	t	f	0	0	0	0	0	0	0	0	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3e384143-90c8-4870-bb50-43258f178084	seller-test@vendfinder.com	vf_seller_test	$2b$12$gET9zCf3sO.fUnk73r7bBOUE5ZsZCjBx19ilIBl.g8Ynmuu6WdUPi	Seller	Test	\N	\N	t	t	seller	2026-04-29 20:06:03.616357+00	2026-04-30 21:44:26.050444+00	2026-05-06 20:06:03.616357+00	t	2026-04-30 21:44:26.050444+00	\N	\N	\N	\N	premium	0	\N	verified	\N	\N	2026-04-30 21:44:26.050444+00	\N	\N	\N	\N	\N	\N	2026-04-30 21:44:26.050444+00	2026-04-30 21:44:26.050444+00	2026-04-30 21:44:26.050444+00	1.0	email	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	basic	0.00	0	0	0	2026-04-30 21:54:14.009568+00	\N	en	UTC	active	0	0	0	f	\N	\N	t	f	0	0	0	0	0	0	0	0	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fd8e1ff9-60ca-4a28-ba00-f03757bd0de7	buyer-test@vendfinder.com	vf_buyer_test	$2b$12$Ud5900msTsFg4/.3mN5ITugoLq1vKAn7TT103OAvy/nMK5Y7iUVJC	\N	\N	\N	\N	t	t	buyer	2026-04-30 21:43:31.963167+00	2026-04-30 21:44:27.34173+00	\N	f	\N	\N	\N	\N	\N	premium	0	\N	verified	\N	\N	2026-04-30 21:44:27.34173+00	\N	\N	\N	\N	\N	\N	2026-04-30 21:44:27.34173+00	2026-04-30 21:44:27.34173+00	2026-04-30 21:44:27.34173+00	1.0	email	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	basic	0.00	0	0	0	2026-04-30 21:54:14.009568+00	\N	en	UTC	active	0	0	0	f	\N	\N	t	f	0	0	0	0	0	0	0	0	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1d6bad5d-0d2e-42b1-842f-98e1c8aa1ee1	test4@example.com	testuser4	$2a$10$eyVzjpiySVZ6DsGsUCg3MOGn8nS/O7nXRoIJaPJ3pPre87yxlBHke	\N	\N	\N	\N	f	t	buyer	2026-04-30 21:59:06.013045+00	2026-04-30 21:59:06.013045+00	\N	f	\N	\N	\N	\N	\N	standard	0	\N	not_required	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 21:59:06.013045+00	\N	\N	buyer-v1	email	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	f	basic	0.00	0	0	0	2026-04-30 21:59:06.013045+00	\N	en	UTC	active	0	0	0	f	\N	\N	t	f	0	0	0	0	0	0	0	0	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bae1ca89-f726-448e-aa92-6ce4eeedf4e2	newuser@example.com	newuser2026	$2a$10$ggCymPVJnpnXXeFKk0ddyeZd8xxYfyo1PkhBgL1HWYzwYH6oPQc.S	\N	\N	\N	\N	f	t	buyer	2026-04-30 22:10:41.956893+00	2026-04-30 22:10:41.956893+00	\N	f	\N	\N	\N	\N	\N	standard	0	\N	not_required	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 22:10:41.956893+00	\N	\N	buyer-v1	email	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	f	basic	0.00	0	0	0	2026-04-30 22:10:41.956893+00	\N	en	UTC	active	0	0	0	f	\N	\N	t	f	0	0	0	0	0	0	0	0	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3581 (class 0 OID 0)
-- Dependencies: 217
-- Name: _migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public._migrations_id_seq', 6, true);


--
-- TOC entry 3384 (class 2606 OID 16440)
-- Name: _migrations _migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_name_key UNIQUE (name);


--
-- TOC entry 3386 (class 2606 OID 16438)
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3403 (class 2606 OID 16503)
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3407 (class 2606 OID 16527)
-- Name: kyc_extracted_data kyc_extracted_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_extracted_data
    ADD CONSTRAINT kyc_extracted_data_pkey PRIMARY KEY (id);


--
-- TOC entry 3391 (class 2606 OID 16454)
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- TOC entry 3395 (class 2606 OID 16469)
-- Name: story_views story_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_pkey PRIMARY KEY (id);


--
-- TOC entry 3397 (class 2606 OID 16471)
-- Name: story_views story_views_story_id_viewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_story_id_viewer_id_key UNIQUE (story_id, viewer_id);


--
-- TOC entry 3382 (class 2606 OID 16422)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 16410)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3378 (class 2606 OID 16408)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 16412)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3398 (class 1259 OID 16545)
-- Name: idx_kyc_documents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_created_at ON public.kyc_documents USING btree (created_at DESC);


--
-- TOC entry 3399 (class 1259 OID 16546)
-- Name: idx_kyc_documents_processing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_processing ON public.kyc_documents USING btree (processing_status) WHERE ((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying])::text[]));


--
-- TOC entry 3400 (class 1259 OID 16544)
-- Name: idx_kyc_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_status ON public.kyc_documents USING btree (verification_status);


--
-- TOC entry 3401 (class 1259 OID 16543)
-- Name: idx_kyc_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents USING btree (user_id);


--
-- TOC entry 3404 (class 1259 OID 16547)
-- Name: idx_kyc_extracted_data_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_extracted_data_document_id ON public.kyc_extracted_data USING btree (document_id);


--
-- TOC entry 3405 (class 1259 OID 16548)
-- Name: idx_kyc_extracted_data_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_extracted_data_review ON public.kyc_extracted_data USING btree (manual_review_required) WHERE (manual_review_required = true);


--
-- TOC entry 3387 (class 1259 OID 16462)
-- Name: idx_stories_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_created_at ON public.stories USING btree (created_at DESC);


--
-- TOC entry 3388 (class 1259 OID 16461)
-- Name: idx_stories_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_expires_at ON public.stories USING btree (expires_at);


--
-- TOC entry 3389 (class 1259 OID 16460)
-- Name: idx_stories_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_user_id ON public.stories USING btree (user_id);


--
-- TOC entry 3392 (class 1259 OID 16482)
-- Name: idx_story_views_story_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_story_views_story_id ON public.story_views USING btree (story_id);


--
-- TOC entry 3393 (class 1259 OID 16483)
-- Name: idx_story_views_viewer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_story_views_viewer_id ON public.story_views USING btree (viewer_id);


--
-- TOC entry 3373 (class 1259 OID 16489)
-- Name: idx_users_kyc_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_kyc_status ON public.users USING btree (kyc_status);


--
-- TOC entry 3374 (class 1259 OID 16487)
-- Name: idx_users_subscription_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_subscription_tier ON public.users USING btree (subscription_tier);


--
-- TOC entry 3417 (class 2620 OID 16550)
-- Name: kyc_extracted_data trigger_update_kyc_extracted_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_kyc_extracted_data_updated_at BEFORE UPDATE ON public.kyc_extracted_data FOR EACH ROW EXECUTE FUNCTION public.update_kyc_extracted_data_updated_at();


--
-- TOC entry 3413 (class 2606 OID 16504)
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3414 (class 2606 OID 16509)
-- Name: kyc_documents kyc_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- TOC entry 3415 (class 2606 OID 16528)
-- Name: kyc_extracted_data kyc_extracted_data_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_extracted_data
    ADD CONSTRAINT kyc_extracted_data_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.kyc_documents(id) ON DELETE CASCADE;


--
-- TOC entry 3416 (class 2606 OID 16533)
-- Name: kyc_extracted_data kyc_extracted_data_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_extracted_data
    ADD CONSTRAINT kyc_extracted_data_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- TOC entry 3410 (class 2606 OID 16455)
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3411 (class 2606 OID 16472)
-- Name: story_views story_views_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 3412 (class 2606 OID 16477)
-- Name: story_views story_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3409 (class 2606 OID 16423)
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3408 (class 2606 OID 16538)
-- Name: users users_primary_kyc_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_primary_kyc_document_id_fkey FOREIGN KEY (primary_kyc_document_id) REFERENCES public.kyc_documents(id);


-- Completed on 2026-05-01 19:26:24 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict RIYeALFK7o8F3HHAM3hUI1QofhnHXwn1O7dWzz6StssPsNmrlD13tXX1buvWL8v

