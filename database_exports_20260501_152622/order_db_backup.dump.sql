--
-- PostgreSQL database dump
--

\restrict 802dqnhHPfUr1l6ev6kfZoZ1NfJhuhExrRe9GEy5AwcPevYkN5QyToKn0jVxJ8W

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-05-01 19:26:27 UTC

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

ALTER TABLE ONLY public.scheduled_payouts DROP CONSTRAINT scheduled_payouts_order_id_fkey;
ALTER TABLE ONLY public.scheduled_payouts DROP CONSTRAINT scheduled_payouts_escrow_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_payment_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_order_item_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_order_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_escrow_id_fkey;
ALTER TABLE ONLY public.payouts DROP CONSTRAINT payouts_payout_method_id_fkey;
ALTER TABLE ONLY public.payouts DROP CONSTRAINT payouts_order_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_order_id_fkey;
ALTER TABLE ONLY public.order_status_history DROP CONSTRAINT order_status_history_order_item_id_fkey;
ALTER TABLE ONLY public.order_status_history DROP CONSTRAINT order_status_history_order_id_fkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_fkey;
ALTER TABLE ONLY public.order_events DROP CONSTRAINT order_events_order_id_fkey;
ALTER TABLE ONLY public.escrow DROP CONSTRAINT escrow_payment_id_fkey;
ALTER TABLE ONLY public.escrow DROP CONSTRAINT escrow_order_item_id_fkey;
ALTER TABLE ONLY public.escrow DROP CONSTRAINT escrow_order_id_fkey;
ALTER TABLE ONLY public.escrow DROP CONSTRAINT escrow_dispute_id_fkey;
ALTER TABLE ONLY public.disputes DROP CONSTRAINT disputes_order_item_id_fkey;
ALTER TABLE ONLY public.disputes DROP CONSTRAINT disputes_order_id_fkey;
ALTER TABLE ONLY public.disputes DROP CONSTRAINT disputes_escrow_id_fkey;
ALTER TABLE ONLY public.dispute_messages DROP CONSTRAINT dispute_messages_dispute_id_fkey;
ALTER TABLE ONLY public.cart_items DROP CONSTRAINT cart_items_cart_id_fkey;
DROP TRIGGER update_payments_updated_at ON public.payments;
DROP TRIGGER update_orders_updated_at ON public.orders;
DROP TRIGGER update_order_items_updated_at ON public.order_items;
DROP TRIGGER update_escrow_updated_at ON public.escrow;
DROP TRIGGER update_carts_updated_at ON public.carts;
DROP TRIGGER update_cart_items_updated_at ON public.cart_items;
DROP TRIGGER set_order_number ON public.orders;
DROP INDEX public.idx_vendor_subscriptions_vendor;
DROP INDEX public.idx_vendor_subscriptions_status;
DROP INDEX public.idx_vendor_subscriptions_period_end;
DROP INDEX public.idx_vendor_shipping_vendor_id;
DROP INDEX public.idx_subscription_payments_vendor;
DROP INDEX public.idx_subscription_payments_created;
DROP INDEX public.idx_scheduled_payouts_status;
DROP INDEX public.idx_scheduled_payouts_scheduled_for;
DROP INDEX public.idx_refunds_payment_id;
DROP INDEX public.idx_refunds_order_id;
DROP INDEX public.idx_payouts_status;
DROP INDEX public.idx_payouts_seller_id;
DROP INDEX public.idx_payouts_paypal_batch_id;
DROP INDEX public.idx_payouts_order_id;
DROP INDEX public.idx_payout_profiles_vendor;
DROP INDEX public.idx_payout_profiles_region;
DROP INDEX public.idx_payout_methods_seller_id;
DROP INDEX public.idx_payout_methods_one_primary;
DROP INDEX public.idx_payments_status;
DROP INDEX public.idx_payments_provider_payment_id;
DROP INDEX public.idx_payments_order_id;
DROP INDEX public.idx_orders_stripe_pi;
DROP INDEX public.idx_orders_status;
DROP INDEX public.idx_orders_seller_id;
DROP INDEX public.idx_orders_paypal_order_id;
DROP INDEX public.idx_orders_order_number;
DROP INDEX public.idx_orders_created_at;
DROP INDEX public.idx_orders_buyer_id;
DROP INDEX public.idx_order_items_vendor_id;
DROP INDEX public.idx_order_items_status;
DROP INDEX public.idx_order_items_product_id;
DROP INDEX public.idx_order_items_order_id;
DROP INDEX public.idx_order_history_order_id;
DROP INDEX public.idx_order_events_order_id;
DROP INDEX public.idx_one_click_log_user_time;
DROP INDEX public.idx_escrow_vendor_id;
DROP INDEX public.idx_escrow_status;
DROP INDEX public.idx_escrow_order_id;
DROP INDEX public.idx_escrow_hold_until;
DROP INDEX public.idx_disputes_vendor_id;
DROP INDEX public.idx_disputes_user;
DROP INDEX public.idx_disputes_status;
DROP INDEX public.idx_disputes_order_id;
DROP INDEX public.idx_disputes_order;
DROP INDEX public.idx_disputes_buyer_id;
DROP INDEX public.idx_dispute_messages_dispute_id;
DROP INDEX public.idx_carts_user_id;
DROP INDEX public.idx_cart_items_product_id;
DROP INDEX public.idx_cart_items_cart_id;
DROP INDEX public.idx_buyer_payment_methods_user;
DROP INDEX public.idx_buyer_payment_methods_stripe;
ALTER TABLE ONLY public.vendor_subscriptions DROP CONSTRAINT vendor_subscriptions_vendor_id_key;
ALTER TABLE ONLY public.vendor_subscriptions DROP CONSTRAINT vendor_subscriptions_pkey;
ALTER TABLE ONLY public.vendor_shipping_methods DROP CONSTRAINT vendor_shipping_methods_vendor_id_name_key;
ALTER TABLE ONLY public.vendor_shipping_methods DROP CONSTRAINT vendor_shipping_methods_pkey;
ALTER TABLE ONLY public.vendor_payout_profiles DROP CONSTRAINT vendor_payout_profiles_vendor_id_key;
ALTER TABLE ONLY public.vendor_payout_profiles DROP CONSTRAINT vendor_payout_profiles_pkey;
ALTER TABLE ONLY public.subscription_payments DROP CONSTRAINT subscription_payments_pkey;
ALTER TABLE ONLY public.subscription_payments DROP CONSTRAINT subscription_payments_invoice_number_key;
ALTER TABLE ONLY public.scheduled_payouts DROP CONSTRAINT scheduled_payouts_pkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_pkey;
ALTER TABLE ONLY public.payouts DROP CONSTRAINT payouts_pkey;
ALTER TABLE ONLY public.payout_methods DROP CONSTRAINT payout_methods_pkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_order_number_key;
ALTER TABLE ONLY public.order_status_history DROP CONSTRAINT order_status_history_pkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
ALTER TABLE ONLY public.order_events DROP CONSTRAINT order_events_pkey;
ALTER TABLE ONLY public.one_click_purchase_log DROP CONSTRAINT one_click_purchase_log_pkey;
ALTER TABLE ONLY public.escrow DROP CONSTRAINT escrow_pkey;
ALTER TABLE ONLY public.disputes DROP CONSTRAINT disputes_pkey;
ALTER TABLE ONLY public.dispute_messages DROP CONSTRAINT dispute_messages_pkey;
ALTER TABLE ONLY public.carts DROP CONSTRAINT carts_user_id_key;
ALTER TABLE ONLY public.carts DROP CONSTRAINT carts_pkey;
ALTER TABLE ONLY public.cart_items DROP CONSTRAINT cart_items_pkey;
ALTER TABLE ONLY public.cart_items DROP CONSTRAINT cart_items_cart_id_product_id_size_key;
ALTER TABLE ONLY public.buyer_payment_methods DROP CONSTRAINT buyer_payment_methods_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_pkey;
ALTER TABLE ONLY public._migrations DROP CONSTRAINT _migrations_name_key;
ALTER TABLE public._migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.vendor_subscriptions;
DROP TABLE public.vendor_shipping_methods;
DROP TABLE public.vendor_payout_profiles;
DROP TABLE public.subscription_payments;
DROP TABLE public.scheduled_payouts;
DROP TABLE public.refunds;
DROP TABLE public.payouts;
DROP TABLE public.payout_methods;
DROP TABLE public.payments;
DROP TABLE public.orders;
DROP TABLE public.order_status_history;
DROP SEQUENCE public.order_number_seq;
DROP TABLE public.order_items;
DROP TABLE public.order_events;
DROP TABLE public.one_click_purchase_log;
DROP TABLE public.escrow;
DROP TABLE public.disputes;
DROP TABLE public.dispute_messages;
DROP TABLE public.carts;
DROP TABLE public.cart_items;
DROP TABLE public.buyer_payment_methods;
DROP SEQUENCE public._migrations_id_seq;
DROP TABLE public._migrations;
DROP FUNCTION public.update_order_updated_at();
DROP FUNCTION public.generate_order_number();
DROP EXTENSION pgcrypto;
--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3822 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 275 (class 1255 OID 16656)
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.order_number := 'VF-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;


--
-- TOC entry 274 (class 1255 OID 16648)
-- Name: update_order_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_order_updated_at() RETURNS trigger
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
-- TOC entry 234 (class 1259 OID 16816)
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 16815)
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
-- TOC entry 3823 (class 0 OID 0)
-- Dependencies: 233
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- TOC entry 231 (class 1259 OID 16790)
-- Name: buyer_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyer_payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_payment_method_id text NOT NULL,
    stripe_customer_id text NOT NULL,
    card_last_four text NOT NULL,
    card_brand text NOT NULL,
    card_exp_month integer NOT NULL,
    card_exp_year integer NOT NULL,
    is_default boolean DEFAULT false,
    one_click_enabled boolean DEFAULT false,
    one_click_threshold numeric(10,2) DEFAULT 50.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 216 (class 1259 OID 16432)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    size text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT cart_items_unit_price_check CHECK ((unit_price > (0)::numeric))
);


--
-- TOC entry 215 (class 1259 OID 16422)
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 226 (class 1259 OID 16692)
-- Name: dispute_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispute_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_role text NOT NULL,
    message text NOT NULL,
    attachments text[],
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 225 (class 1259 OID 16662)
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    escrow_id uuid,
    buyer_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    reason text NOT NULL,
    description text NOT NULL,
    evidence_urls text[],
    status text DEFAULT 'open'::text NOT NULL,
    resolution_notes text,
    refund_amount numeric(10,2),
    assigned_admin_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    seller_responded_at timestamp with time zone,
    escalated_at timestamp with time zone,
    resolved_at timestamp with time zone,
    initiated_by uuid,
    resolution character varying(20),
    resolved_by uuid
);


--
-- TOC entry 220 (class 1259 OID 16521)
-- Name: escrow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrow (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    payment_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) DEFAULT 0 NOT NULL,
    vendor_payout numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'held'::text NOT NULL,
    hold_until timestamp with time zone,
    released_at timestamp with time zone,
    refunded_at timestamp with time zone,
    payout_provider text,
    payout_id text,
    payout_status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dispute_id uuid,
    dispute_reason text,
    disputed_at timestamp with time zone,
    dispute_resolved_at timestamp with time zone,
    dispute_resolution text,
    admin_notes text,
    stripe_transfer_id text,
    payout_scheduled_at timestamp with time zone,
    payout_failed_reason text,
    wise_transfer_id text,
    wise_quote_id text,
    CONSTRAINT escrow_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT escrow_platform_fee_check CHECK ((platform_fee >= (0)::numeric)),
    CONSTRAINT escrow_status_check CHECK ((status = ANY (ARRAY['held'::text, 'release_pending'::text, 'released'::text, 'refund_pending'::text, 'refunded'::text, 'disputed'::text, 'dispute_hold'::text, 'payout_scheduled'::text]))),
    CONSTRAINT escrow_vendor_payout_check CHECK ((vendor_payout >= (0)::numeric))
);


--
-- TOC entry 232 (class 1259 OID 16805)
-- Name: one_click_purchase_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.one_click_purchase_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 236 (class 1259 OID 59997)
-- Name: order_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    actor_id uuid,
    actor_role character varying(20),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 16477)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    product_name text NOT NULL,
    product_image_url text,
    product_category text,
    product_condition text,
    size text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_method text,
    status text DEFAULT 'pending'::text NOT NULL,
    tracking_number text,
    tracking_carrier text,
    tracking_url text,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_shipping_cost_check CHECK ((shipping_cost >= (0)::numeric)),
    CONSTRAINT order_items_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'shipped'::text, 'in_transit'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text]))),
    CONSTRAINT order_items_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price > (0)::numeric))
);


--
-- TOC entry 224 (class 1259 OID 16655)
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 223 (class 1259 OID 16607)
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    previous_status text,
    new_status text NOT NULL,
    changed_by uuid,
    changed_by_role text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 217 (class 1259 OID 16452)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    buyer_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    total_shipping numeric(10,2) DEFAULT 0 NOT NULL,
    total_tax numeric(10,2) DEFAULT 0 NOT NULL,
    platform_fee numeric(10,2) DEFAULT 0 NOT NULL,
    grand_total numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    shipping_name text NOT NULL,
    shipping_address_line1 text NOT NULL,
    shipping_address_line2 text,
    shipping_city text NOT NULL,
    shipping_state text NOT NULL,
    shipping_postal_code text NOT NULL,
    shipping_country text DEFAULT 'US'::text NOT NULL,
    shipping_phone text,
    billing_same_as_shipping boolean DEFAULT true,
    billing_name text,
    billing_address_line1 text,
    billing_address_line2 text,
    billing_city text,
    billing_state text,
    billing_postal_code text,
    billing_country text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone,
    completed_at timestamp with time zone,
    seller_id uuid,
    product_id uuid,
    ask_id uuid,
    stripe_payment_intent_id character varying(200),
    product_name character varying(500),
    product_image text,
    product_category character varying(100),
    size character varying(20),
    item_price numeric(12,2),
    shipping_fee numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    platform_fee_rate numeric(4,4) DEFAULT 0.0900,
    total_buyer_pays numeric(12,2),
    seller_payout numeric(12,2),
    tracking_number character varying(200),
    carrier character varying(100),
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    escrow_status character varying(30) DEFAULT 'none'::character varying,
    escrow_held_at timestamp with time zone,
    escrow_released_at timestamp with time zone,
    auto_release_at timestamp with time zone,
    paypal_order_id character varying(255),
    payment_method character varying(20) DEFAULT 'stripe'::character varying,
    seller_name character varying(200),
    CONSTRAINT orders_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT orders_platform_fee_check CHECK ((platform_fee >= (0)::numeric)),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'payment_processing'::text, 'processing'::text, 'paid'::text, 'partially_shipped'::text, 'shipped'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text, 'disputed'::text]))),
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT orders_total_shipping_check CHECK ((total_shipping >= (0)::numeric)),
    CONSTRAINT orders_total_tax_check CHECK ((total_tax >= (0)::numeric))
);


--
-- TOC entry 219 (class 1259 OID 16500)
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    provider text NOT NULL,
    provider_payment_id text,
    provider_customer_id text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method_type text,
    card_brand text,
    card_last4 text,
    failure_code text,
    failure_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payments_provider_check CHECK ((provider = ANY (ARRAY['stripe'::text, 'paypal'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'requires_action'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text, 'refunded'::text, 'partially_refunded'::text])))
);


--
-- TOC entry 237 (class 1259 OID 60018)
-- Name: payout_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    method_type character varying(20) NOT NULL,
    label character varying(100),
    account_id character varying(200) NOT NULL,
    account_name character varying(200),
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    national_id character varying(50),
    date_of_birth date,
    address character varying(500),
    CONSTRAINT payout_methods_method_type_check CHECK (((method_type)::text = ANY ((ARRAY['alipay'::character varying, 'paypal'::character varying, 'wechat'::character varying])::text[])))
);


--
-- TOC entry 235 (class 1259 OID 59981)
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    order_id uuid NOT NULL,
    gross_amount numeric(12,2) NOT NULL,
    fee_amount numeric(12,2) NOT NULL,
    net_amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    method character varying(50) DEFAULT 'stripe'::character varying,
    stripe_transfer_id character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payout_method_id uuid,
    paypal_batch_id character varying(255),
    paypal_item_id character varying(255),
    processed_at timestamp with time zone,
    error_message text,
    CONSTRAINT payouts_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- TOC entry 222 (class 1259 OID 16572)
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    payment_id uuid NOT NULL,
    escrow_id uuid,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    reason text NOT NULL,
    notes text,
    provider text NOT NULL,
    provider_refund_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    initiated_by uuid NOT NULL,
    initiated_by_role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    CONSTRAINT refunds_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT refunds_initiated_by_role_check CHECK ((initiated_by_role = ANY (ARRAY['buyer'::text, 'seller'::text, 'admin'::text]))),
    CONSTRAINT refunds_provider_check CHECK ((provider = ANY (ARRAY['stripe'::text, 'paypal'::text]))),
    CONSTRAINT refunds_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text])))
);


--
-- TOC entry 227 (class 1259 OID 16707)
-- Name: scheduled_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    escrow_id uuid NOT NULL,
    order_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    processed_at timestamp with time zone,
    stripe_transfer_id text,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 230 (class 1259 OID 16775)
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    invoice_number text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    payment_method text,
    stripe_payment_intent_id text,
    stripe_receipt_url text,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    status text DEFAULT 'paid'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 229 (class 1259 OID 16756)
-- Name: vendor_payout_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_payout_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    payout_region text NOT NULL,
    payout_method text NOT NULL,
    wise_recipient_id text,
    stripe_connect_account_id text,
    bank_account_holder_name text,
    bank_account_number_last4 text,
    bank_name text,
    bank_country text,
    currency text DEFAULT 'CNY'::text,
    status text DEFAULT 'pending_verification'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vendor_payout_profiles_payout_method_check CHECK ((payout_method = ANY (ARRAY['wise'::text, 'stripe_connect'::text]))),
    CONSTRAINT vendor_payout_profiles_payout_region_check CHECK ((payout_region = ANY (ARRAY['china'::text, 'us'::text, 'uk'::text, 'europe'::text, 'international'::text]))),
    CONSTRAINT vendor_payout_profiles_status_check CHECK ((status = ANY (ARRAY['pending_verification'::text, 'verified'::text, 'failed'::text])))
);


--
-- TOC entry 221 (class 1259 OID 16553)
-- Name: vendor_shipping_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_shipping_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    carrier text,
    price_type text DEFAULT 'flat'::text NOT NULL,
    flat_rate numeric(10,2),
    price_per_lb numeric(10,2),
    min_days integer DEFAULT 3 NOT NULL,
    max_days integer DEFAULT 7 NOT NULL,
    domestic_only boolean DEFAULT true,
    countries_served text[] DEFAULT ARRAY['US'::text],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vendor_shipping_methods_price_type_check CHECK ((price_type = ANY (ARRAY['flat'::text, 'weight'::text, 'calculated'::text])))
);


--
-- TOC entry 228 (class 1259 OID 16735)
-- Name: vendor_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    plan_type text DEFAULT 'monthly'::text NOT NULL,
    amount integer DEFAULT 10000 NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    status text DEFAULT 'past_due'::text NOT NULL,
    payment_method text,
    stripe_customer_id text,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    last_payment_at timestamp with time zone,
    last_payment_status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vendor_subscriptions_payment_method_check CHECK ((payment_method = ANY (ARRAY['alipay'::text, 'wechat_pay'::text, 'card'::text]))),
    CONSTRAINT vendor_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text, 'trialing'::text])))
);


--
-- TOC entry 3468 (class 2604 OID 16819)
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- TOC entry 3813 (class 0 OID 16816)
-- Dependencies: 234
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._migrations (id, name, applied_at) FROM stdin;
1	001_initial_schema.sql	2026-04-17 19:46:02.75443+00
2	002_payout_methods.sql	2026-04-17 19:46:02.87102+00
3	003_escrow_disputes.sql	2026-04-17 19:47:05.248495+00
4	003_payout_national_id.sql	2026-04-17 19:47:05.280507+00
5	004_payout_dob_address.sql	2026-04-17 19:47:05.291465+00
6	004_paypal_support.sql	2026-04-17 19:47:05.330552+00
7	005_payout_paypal.sql	2026-04-17 19:47:05.35347+00
8	006_seller_name.sql	2026-04-17 19:47:05.378269+00
\.


--
-- TOC entry 3810 (class 0 OID 16790)
-- Dependencies: 231
-- Data for Name: buyer_payment_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buyer_payment_methods (id, user_id, stripe_payment_method_id, stripe_customer_id, card_last_four, card_brand, card_exp_month, card_exp_year, is_default, one_click_enabled, one_click_threshold, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3795 (class 0 OID 16432)
-- Dependencies: 216
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, product_id, vendor_id, quantity, unit_price, size, created_at, updated_at) FROM stdin;
80f77116-445e-478a-949a-b1abfdbf7a6d	a61c70f0-cbb7-4228-b062-e54a3c068231	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	1	20.00	\N	2026-01-18 23:18:11.544876+00	2026-01-18 23:18:11.544876+00
e444250b-20b8-4be9-8a07-14e108083e67	cba2e8c8-c526-4a3f-80b7-6a4b937680f8	a4a92f5a-6b7f-4a18-a901-26624d46fbdc	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	1	156.00	\N	2026-01-20 00:30:25.057399+00	2026-01-20 00:30:25.057399+00
03e48c37-fcf3-4825-8396-05bd5a3c64fe	cba2e8c8-c526-4a3f-80b7-6a4b937680f8	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	1	20.00	\N	2026-01-20 00:30:46.664988+00	2026-01-20 00:30:46.664988+00
e76b9ad7-d0df-417b-83f1-e8a2eb8c38fc	4ccb07f5-929b-4083-a0f9-4fcc91d1dbbb	a4a92f5a-6b7f-4a18-a901-26624d46fbdc	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	1	100.00	\N	2026-01-31 18:26:28.130872+00	2026-01-31 18:26:28.130872+00
a2bf31df-b127-4da3-b0b8-a348ce80b972	d6a0780d-db8b-4579-8be4-70105c49a9ac	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	1	20.00	\N	2026-02-02 09:18:18.272785+00	2026-02-02 09:18:18.272785+00
25182c3f-d0fb-485d-9aaa-1a9addf359ba	a05368c4-b291-4923-8f6b-18039bad04b4	294b6d7b-1b00-40f9-9043-44b4b583aed5	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	1	138.00	\N	2026-02-03 02:12:51.140734+00	2026-02-03 02:12:51.140734+00
2f1f0de1-af7d-4651-ab3d-a483e70e6218	7819d2a8-0836-4fa6-b0fa-82f678139f49	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	1	150.00	\N	2026-02-04 00:31:59.728373+00	2026-02-04 00:31:59.728373+00
85340d13-0242-4f7d-b419-1c85d2715d53	3071b6af-2d55-4513-84ec-1d03a129d903	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	1	150.00	4.5	2026-02-05 23:12:08.948315+00	2026-02-05 23:12:08.948315+00
4c0baf95-84f3-4ff8-a61b-e4237570af5a	5dbb4343-14e2-4bee-afe6-691f828d6389	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	2	150.00	10.5	2026-02-07 23:59:07.498399+00	2026-02-07 23:59:07.498399+00
\.


--
-- TOC entry 3794 (class 0 OID 16422)
-- Dependencies: 215
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, user_id, created_at, updated_at) FROM stdin;
a61c70f0-cbb7-4228-b062-e54a3c068231	5692e26e-739c-4fad-ae03-fa483b192484	2026-01-18 23:01:18.714666+00	2026-01-18 23:01:18.714666+00
cc306620-3085-411e-ba5a-163fac3f5783	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	2026-01-18 23:26:24.660236+00	2026-01-18 23:26:24.660236+00
97ed5f30-30b5-4434-b87d-e952487cd640	3e91d247-0674-4514-8fcc-74a676a1ff34	2026-01-19 20:50:10.904534+00	2026-01-19 20:50:10.904534+00
cba2e8c8-c526-4a3f-80b7-6a4b937680f8	d6cd519c-65f7-4e33-b3e9-8e6de326678f	2026-01-20 00:30:16.666252+00	2026-01-20 00:30:16.666252+00
94a263f1-5d60-4e04-b062-7ba89b2b4a59	db9551ff-5f0a-4e55-8018-56b9fd1aa426	2026-01-26 12:00:06.542209+00	2026-01-26 12:00:06.542209+00
a726fa47-ce8b-42dd-b950-22cb65440741	db6e9c04-c4e9-42e2-b39a-f632b5a13c22	2026-01-26 17:56:58.074221+00	2026-01-26 17:56:58.074221+00
a5ca2fef-0d7f-491f-9736-014191e747d3	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	2026-01-27 14:18:57.517553+00	2026-01-27 14:18:57.517553+00
c0d34c08-faaf-4fc7-8cbe-d95c661d1985	dd0827aa-e997-401d-b2d8-fd3b21aa0ed7	2026-01-28 03:15:28.795936+00	2026-01-28 03:15:28.795936+00
4ccb07f5-929b-4083-a0f9-4fcc91d1dbbb	7fb95116-021d-4f08-8dec-2a1a916d53d4	2026-01-31 18:21:52.977873+00	2026-01-31 18:21:52.977873+00
2ac7da3e-e3a7-4bc8-87b9-2a11edd9c51a	080b1a45-0578-4a5a-8fe9-d94440360244	2026-01-31 19:41:04.2316+00	2026-01-31 19:41:04.2316+00
b8fe8b79-63c3-41ce-8560-c512bac12828	780ab893-749c-4cfb-9623-0cfe8d9424f7	2026-01-31 19:54:21.239071+00	2026-01-31 19:54:21.239071+00
29180b53-398d-422b-bacb-530f7666b458	9418207a-6d31-43b3-a9e5-4bbb7aa57570	2026-01-31 20:17:29.630994+00	2026-01-31 20:17:29.630994+00
9dc10feb-f74d-4fce-9169-9323db7e4928	ac710960-0f44-4467-97f9-4f91d3716923	2026-01-31 20:23:51.672278+00	2026-01-31 20:23:51.672278+00
53c45bc0-a08b-414b-a76b-d60773ece92a	f018836b-3130-4cfe-9e6a-551df3a95de2	2026-01-31 20:32:28.583638+00	2026-01-31 20:32:28.583638+00
38f3a47b-4c2f-4f03-bb9c-f3f00bbbaca9	57188906-c6dd-426b-8892-0c14cfc0f785	2026-01-31 20:47:19.109324+00	2026-01-31 20:47:19.109324+00
9fef3983-38a2-4d23-9c15-9259dcb6885c	dffc74ce-2bd5-4637-800d-2b5ba6ebe8fb	2026-01-31 21:31:15.691483+00	2026-01-31 21:31:15.691483+00
5541a319-f020-480e-9dff-82f92c8732c5	59dc7979-06ee-421e-8b45-dd16c3f9d5d4	2026-01-31 21:57:26.636859+00	2026-01-31 21:57:26.636859+00
8827559b-31b2-43f1-90fb-488e50e08a6c	2c0ebc80-acfd-4bb6-8aa1-9b8c36f0f538	2026-01-31 22:36:37.793992+00	2026-01-31 22:36:37.793992+00
4ed22faf-5ed7-4619-88d6-4fb482763b7f	be583f4e-4b4d-4944-bb3e-699d73d0a085	2026-01-31 22:40:22.344121+00	2026-01-31 22:40:22.344121+00
09a5c7f6-5c78-4131-b3fa-17a2ad4be7f1	c56b5d7b-541f-47a9-af68-f6c6cbc05e9a	2026-01-31 22:50:39.536643+00	2026-01-31 22:50:39.536643+00
2f09f21d-4b39-4054-8c66-8d2a854da145	949cd6e3-9528-4da1-9e9e-5494f52aac78	2026-01-31 22:54:35.980021+00	2026-01-31 22:54:35.980021+00
ed2abc40-9ab1-4db7-9a89-b6dd7549e26f	2b040ea7-5cfb-466c-a76b-1c1683ca921a	2026-01-31 23:01:42.041667+00	2026-01-31 23:01:42.041667+00
79f3c9eb-c1de-44d1-b4af-e497d10a0362	0da270c3-291b-4d45-989d-5c3c81af4e9e	2026-02-01 05:52:32.873007+00	2026-02-01 05:52:32.873007+00
794a0b89-cb20-4a2e-9bb0-4dca5c915d6f	6e1af4af-e460-4f4f-9b97-bfbfdaf1a3cc	2026-02-01 17:50:40.397071+00	2026-02-01 17:50:40.397071+00
641b5e0c-1ccb-449c-a4db-e2b3c0209183	93622740-651f-4065-b2a7-118ba9dc1a2a	2026-02-01 21:07:51.709136+00	2026-02-01 21:07:51.709136+00
48c76526-be54-4143-a9b8-53909b5dbb61	4f78b761-00cb-4524-8308-0e03ae3a264d	2026-02-02 00:38:22.184246+00	2026-02-02 00:38:22.184246+00
7347e881-6bfd-43af-80f7-1c1d1b5708c2	7d494aa0-1b08-4e03-b355-390ffcf29b12	2026-02-02 00:45:11.492845+00	2026-02-02 00:45:11.492845+00
7819d2a8-0836-4fa6-b0fa-82f678139f49	f941f91b-ab4f-44c2-bd88-4ad439d48fee	2026-02-02 03:23:26.985823+00	2026-02-02 03:23:26.985823+00
7f506258-6bbe-4590-91a7-9b9e10caa43e	0294a22c-84fa-4988-8cc0-767ad57a272f	2026-02-02 08:10:08.725279+00	2026-02-02 08:10:08.725279+00
d6a0780d-db8b-4579-8be4-70105c49a9ac	5761ed90-824c-428d-9ed2-1bef0a7a84b8	2026-02-02 08:13:45.840546+00	2026-02-02 08:13:45.840546+00
7b6df207-75a6-4747-830f-a1438c438b04	24a1e524-3b28-424a-b1ee-1eddc63a4411	2026-02-02 09:37:06.246536+00	2026-02-02 09:37:06.246536+00
9c48d845-136d-4767-b6fe-88886d7798a0	c81788aa-01b7-4053-b497-f84b33dee71b	2026-02-02 13:20:50.167883+00	2026-02-02 13:20:50.167883+00
a3d41973-1c49-4013-a736-ed8922bbbc7b	e9aa020a-e7ea-4061-a76b-f6881bccbb53	2026-02-02 14:33:28.899308+00	2026-02-02 14:33:28.899308+00
a05368c4-b291-4923-8f6b-18039bad04b4	df81166b-9dcb-4cbe-8c94-786e31424e07	2026-02-03 01:39:13.145036+00	2026-02-03 01:39:13.145036+00
2577369e-a984-47de-8d15-53fa071b6c34	c7bc53a2-a766-4820-8128-fa1c32d6dc59	2026-02-03 17:28:15.659755+00	2026-02-03 17:28:15.659755+00
88e7e275-9d7c-4485-86ba-743f3187df75	84709e04-5c64-466c-bb81-5d86b99509d4	2026-02-03 18:06:10.139544+00	2026-02-03 18:06:10.139544+00
da59fbec-b015-4095-b1e9-aa3e4c6785fd	a0000000-0000-0000-0000-000000000004	2026-02-04 01:31:47.702732+00	2026-02-04 01:31:47.702732+00
682358dd-447c-4996-9c76-075f674e7e03	a0000000-0000-0000-0000-000000000001	2026-02-04 03:34:18.026874+00	2026-02-04 03:34:18.026874+00
82486256-7526-4846-adaf-d0065a1afe8a	a0000000-0000-0000-0000-000000000002	2026-02-04 23:58:21.749551+00	2026-02-04 23:58:21.749551+00
3071b6af-2d55-4513-84ec-1d03a129d903	3579a216-37d9-42de-9c9d-d428fd059b69	2026-02-05 00:47:54.918895+00	2026-02-05 00:47:54.918895+00
964f5e33-18ad-40a8-a8bf-3dc3e8fb12a7	7c9c5e4d-4739-40bc-873e-da58d0161218	2026-02-06 00:37:14.770105+00	2026-02-06 00:37:14.770105+00
82ba60cf-b412-4e9c-baba-aa0957551150	746320b0-306c-47b4-bbbd-a5fa29ce4249	2026-02-06 23:51:03.40083+00	2026-02-06 23:51:03.40083+00
98112c4d-d9e6-47f1-8443-3824c453ddf4	adbefe0c-01f9-4f9b-96a7-2e8244a3e68c	2026-02-07 17:28:29.460259+00	2026-02-07 17:28:29.460259+00
5dbb4343-14e2-4bee-afe6-691f828d6389	ab4825d7-288d-48bb-8ae8-b8c10e5740c8	2026-02-07 23:56:38.957847+00	2026-02-07 23:56:38.957847+00
c42b677a-c669-4b88-a358-afb5e148e02f	332d5b4c-cb6b-4aa6-80a9-5bf02c8d89bb	2026-02-13 14:03:58.697325+00	2026-02-13 14:03:58.697325+00
8c872468-2cf8-4789-a1b2-5625d9af222e	08d839a8-dae3-4af0-a57f-6ad714c14116	2026-02-13 17:35:46.490567+00	2026-02-13 17:35:46.490567+00
af184678-2d46-410d-b351-9555bf57f0cc	4f78301b-006c-479e-b6a7-317379decc8f	2026-02-16 00:03:45.582633+00	2026-02-16 00:03:45.582633+00
c8a2adbb-1d93-4054-aee1-5054a6b3d2e2	6271aa07-c86b-4cbc-9ca5-6194bf040884	2026-02-22 21:59:08.52497+00	2026-02-22 21:59:08.52497+00
652e4202-0813-4f86-9dcc-d769e6543bce	6376c9c8-be46-4f68-a5da-c3d55118f0f9	2026-03-02 13:25:30.099534+00	2026-03-02 13:25:30.099534+00
5f7048a9-190a-4b4f-9b42-a5c6e1377587	70408a5a-3984-4cc0-8dbd-d58dc1eb7436	2026-03-04 03:52:57.341751+00	2026-03-04 03:52:57.341751+00
\.


--
-- TOC entry 3805 (class 0 OID 16692)
-- Dependencies: 226
-- Data for Name: dispute_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dispute_messages (id, dispute_id, sender_id, sender_role, message, attachments, created_at) FROM stdin;
28fbfe87-73be-4ebd-b0ec-c89369635776	34e0e1c2-54e8-4917-9fc7-8e5ac887e85d	a1b2c3d4-e5f6-7890-abcd-ef1234567890	seller	I sincerely apologize for the damaged product. I will accept a full refund and cover return shipping costs.	{}	2026-01-25 13:27:29.127412+00
\.


--
-- TOC entry 3804 (class 0 OID 16662)
-- Dependencies: 225
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.disputes (id, order_id, order_item_id, escrow_id, buyer_id, vendor_id, reason, description, evidence_urls, status, resolution_notes, refund_amount, assigned_admin_id, created_at, updated_at, seller_responded_at, escalated_at, resolved_at, initiated_by, resolution, resolved_by) FROM stdin;
34e0e1c2-54e8-4917-9fc7-8e5ac887e85d	d4e5f6a7-b8c9-0123-def4-567890123456	e5f6a7b8-c9d0-1234-ef56-789012345678	\N	d6cd519c-65f7-4e33-b3e9-8e6de326678f	b2c3d4e5-f6a7-8901-bcde-f23456789012	item_damaged	The headphones arrived with visible damage to the headband. The left ear cup also has a crack.	{}	resolved_buyer_favor	Full refund approved due to product damage confirmed by both parties.	365.99	\N	2026-01-25 13:27:05.224348+00	2026-01-25 13:27:05.224348+00	2026-01-25 13:27:29.133607+00	\N	2026-01-25 13:29:26.976581+00	\N	\N	\N
\.


--
-- TOC entry 3799 (class 0 OID 16521)
-- Dependencies: 220
-- Data for Name: escrow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.escrow (id, order_id, order_item_id, payment_id, vendor_id, amount, platform_fee, vendor_payout, currency, status, hold_until, released_at, refunded_at, payout_provider, payout_id, payout_status, created_at, updated_at, dispute_id, dispute_reason, disputed_at, dispute_resolved_at, dispute_resolution, admin_notes, stripe_transfer_id, payout_scheduled_at, payout_failed_reason, wise_transfer_id, wise_quote_id) FROM stdin;
a7b8c9d0-e1f2-3456-bc78-901234567890	d4e5f6a7-b8c9-0123-def4-567890123456	e5f6a7b8-c9d0-1234-ef56-789012345678	f6a7b8c9-d0e1-2345-fab6-789012345678	b2c3d4e5-f6a7-8901-bcde-f23456789012	365.99	30.00	335.99	USD	refunded	\N	\N	2026-01-25 13:29:26.976581+00	\N	\N	\N	2026-01-25 13:21:27.023858+00	2026-01-25 13:29:26.976581+00	34e0e1c2-54e8-4917-9fc7-8e5ac887e85d	item_damaged	2026-01-25 13:27:05.224348+00	\N	refunded_buyer	Full refund approved due to product damage confirmed by both parties.	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3811 (class 0 OID 16805)
-- Dependencies: 232
-- Data for Name: one_click_purchase_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.one_click_purchase_log (id, user_id, order_id, created_at) FROM stdin;
\.


--
-- TOC entry 3815 (class 0 OID 59997)
-- Dependencies: 236
-- Data for Name: order_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_events (id, order_id, event_type, actor_id, actor_role, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3797 (class 0 OID 16477)
-- Dependencies: 218
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, vendor_id, product_name, product_image_url, product_category, product_condition, size, quantity, unit_price, subtotal, shipping_cost, shipping_method, status, tracking_number, tracking_carrier, tracking_url, shipped_at, delivered_at, confirmed_at, created_at, updated_at) FROM stdin;
5e8d0928-22c0-4710-b80d-a42c82068a5a	3ec5c6bf-1a0c-45aa-94c0-6950400ab8de	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	Anime friends shirt	/uploads/products/4c223e7a-db1e-4044-b723-9623222f0246.jpeg	Fashion	New	\N	1	20.00	20.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-18 23:10:35.121539+00	2026-01-18 23:10:35.121539+00
69d38897-7b3c-4620-b464-f682f5ef8e8a	ba7a61e4-db35-4ab1-be8b-59a3b366a6fa	a4a92f5a-6b7f-4a18-a901-26624d46fbdc	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	Jordan 5	/uploads/products/471026a6-d044-4f32-9775-e00beb24409e.jpeg	Sneakers	New	\N	2	156.00	312.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-19 04:50:25.484593+00	2026-01-19 04:50:25.484593+00
67704aed-c035-4734-98ae-3403876c24cb	ba7a61e4-db35-4ab1-be8b-59a3b366a6fa	c0000000-0000-0000-0000-000000000003	b0000000-0000-0000-0000-000000000007	Yeezy Boost 350 V2 Zebra	https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400	Sneakers	New	\N	1	230.00	230.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-19 04:50:25.484593+00	2026-01-19 04:50:25.484593+00
59964a3c-e105-4bb9-9871-89b8675b1640	ba7a61e4-db35-4ab1-be8b-59a3b366a6fa	c0000000-0000-0000-0000-000000000018	b0000000-0000-0000-0000-000000000002	Apple AirPods Pro 2nd Gen	https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400	Electronics	New	\N	1	249.00	249.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-19 04:50:25.484593+00	2026-01-19 04:50:25.484593+00
e5f6a7b8-c9d0-1234-ef56-789012345678	d4e5f6a7-b8c9-0123-def4-567890123456	c3d4e5f6-a7b8-9012-cdef-345678901234	b2c3d4e5-f6a7-8901-bcde-f23456789012	Sony WH-1000XM5 Wireless Headphones	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400	Electronics	New	\N	1	299.99	299.99	12.00	\N	delivered	\N	\N	\N	\N	2026-01-23 13:21:27.023858+00	\N	2026-01-25 13:21:27.023858+00	2026-01-25 13:21:27.023858+00
28b1eb6f-31c0-446e-af32-c4be6372750c	05003b20-1365-48cc-ab31-3c6dcd827714	a4a92f5a-6b7f-4a18-a901-26624d46fbdc	b2edf9f6-49a5-4938-9dc9-c2baf24e12a2	Jordan 5	/uploads/products/471026a6-d044-4f32-9775-e00beb24409e.jpeg	Sneakers	New	\N	1	100.00	100.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-27 14:22:36.769299+00	2026-01-27 14:22:36.769299+00
0912a542-e4ab-49a1-b37b-16e301342478	e9e5e179-7436-42a9-b9cb-b35a56fba4a0	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	Anime friends shirt	/uploads/products/4c223e7a-db1e-4044-b723-9623222f0246.jpeg	Fashion	New	\N	1	20.00	20.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-27 14:26:07.270078+00	2026-01-27 14:26:07.270078+00
7be1daf3-27bc-4c5d-85d3-432d4e467ef2	e9aaeb0f-92ab-47af-9fa1-cf3372dce3a4	e78d391f-7cb6-414e-a3c3-b44038631d04	ceae7cf7-141e-4037-a22f-5eeea5913207	Anime friends shirt	/uploads/products/4c223e7a-db1e-4044-b723-9623222f0246.jpeg	Fashion	New	\N	1	20.00	20.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-01-27 14:33:39.850838+00	2026-01-27 14:33:39.850838+00
fd8c7581-8b33-4693-83ca-6e48c055f6d6	2af2c672-9187-4c8e-8a41-751f2f98e098	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-03 18:13:45.473327+00	2026-02-03 18:13:45.473327+00
218c20ca-4cc3-4b14-96ab-bbffe97fccd3	2cc47021-1804-4d50-b34c-3a938ab814cb	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-03 18:16:24.933887+00	2026-02-03 18:16:24.933887+00
b74330cc-c8eb-4d16-9e26-359627a15163	42ca1fae-64a7-4738-adf9-57a70b0a50c3	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 01:05:27.735066+00	2026-02-04 01:05:27.735066+00
1cca1e12-c01a-493d-a056-cf1b8f399ea0	2d525469-85e4-4c25-9b20-75efea0452df	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 01:07:38.450413+00	2026-02-04 01:07:38.450413+00
0317ce44-8df3-406d-a605-b0d77124b176	14ac3aaf-c655-48bb-bb81-ed1c77dbff88	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 01:10:48.131834+00	2026-02-04 01:10:48.131834+00
872460ff-26b4-46d0-b376-27d1b7960c81	1f387fbe-4903-4875-be02-4c449f6313bc	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 01:32:24.075903+00	2026-02-04 01:32:24.075903+00
7cc8e89d-c01c-46a8-925c-fa061f546997	1cdf90c8-fac8-436f-9862-eedfd51c9dcb	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 01:50:41.233612+00	2026-02-04 01:50:41.233612+00
3addb922-2170-4ba0-b8cd-9c16329ffbb6	16d9673b-7fcf-4794-845e-8fcaa03ed6cc	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 02:00:44.655886+00	2026-02-04 02:00:44.655886+00
c2f4e0bf-2168-47e9-b78e-ae0c9a9dee9c	decffd2e-a535-4290-af13-b2e0b55893fc	03bd9fe6-466b-45c2-bc2a-86c6cf724b49	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	Air Jordan 5 Wolf Grey	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/71d3b518-8758-4ebf-879e-461a101bedb9.jpeg	Sneakers	New	\N	1	150.00	150.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-02-04 02:30:13.324357+00	2026-02-04 02:30:13.324357+00
0d3a176f-f496-4437-8e99-8939760267cc	96a06359-6a91-4e85-8878-4bcc99ba59fa	35ef7596-ce5d-43a3-b086-151bc40f160b	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	Gucci GG Marmont Half Moon Quilted Leather Crossbody Bag	\N	\N	\N	\N	1	298.00	298.00	0.00	\N	confirmed	\N	\N	\N	\N	\N	\N	2026-04-08 15:30:00+00	2026-04-09 15:01:27.752204+00
d22ad877-1ce8-40ad-9ac0-a57993494045	db6529e7-1fca-4c79-9ee9-c08c2678abf1	a55784cd-7ea9-4c71-8562-6f825168ad0a	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	ysl羊皮革斜挎包	https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com/products/5466d59c-a728-4c6b-87be-3006e317eae7.jpg	Accessories	New	\N	1	299.00	299.00	0.00	Standard	pending	\N	\N	\N	\N	\N	\N	2026-03-04 15:24:15.020931+00	2026-04-09 15:06:40.115648+00
\.


--
-- TOC entry 3802 (class 0 OID 16607)
-- Dependencies: 223
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status_history (id, order_id, order_item_id, previous_status, new_status, changed_by, changed_by_role, notes, created_at) FROM stdin;
a5d50654-b88a-49d0-af49-ed3942783bd5	3ec5c6bf-1a0c-45aa-94c0-6950400ab8de	\N	\N	pending	5692e26e-739c-4fad-ae03-fa483b192484	buyer	Order created	2026-01-18 23:10:35.258818+00
e2398096-d8b6-45be-80b4-59f12ad0d653	ba7a61e4-db35-4ab1-be8b-59a3b366a6fa	\N	\N	pending	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	seller	Order created	2026-01-19 04:50:25.667358+00
c0c42991-c79e-4af4-94a3-4b70e196e14e	d4e5f6a7-b8c9-0123-def4-567890123456	e5f6a7b8-c9d0-1234-ef56-789012345678	delivered	disputed	d6cd519c-65f7-4e33-b3e9-8e6de326678f	buyer	Dispute opened: item_damaged	2026-01-25 13:27:05.307794+00
f39f1204-461e-40a5-a627-a9eab0fefd1d	05003b20-1365-48cc-ab31-3c6dcd827714	\N	\N	pending	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	buyer	Order created	2026-01-27 14:22:36.854634+00
7a0aa82c-90b8-42aa-be59-a1a6c2077507	e9e5e179-7436-42a9-b9cb-b35a56fba4a0	\N	\N	pending	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	buyer	Order created	2026-01-27 14:26:07.35072+00
94d2b1a2-73a9-4dab-b8c7-978c6255dc6e	e9aaeb0f-92ab-47af-9fa1-cf3372dce3a4	\N	\N	pending	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	buyer	Order created	2026-01-27 14:33:39.92755+00
e6271676-f786-4822-813c-972354d3ec40	2af2c672-9187-4c8e-8a41-751f2f98e098	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-03 18:13:45.574363+00
4359b089-0e1c-4a50-a355-eee59e205a38	2cc47021-1804-4d50-b34c-3a938ab814cb	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-03 18:16:25.055572+00
2679dab2-258c-46dd-a0be-ed2dbb5fc946	42ca1fae-64a7-4738-adf9-57a70b0a50c3	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-04 01:05:27.818777+00
807962d4-a912-4ee6-b1e5-39f554178451	2d525469-85e4-4c25-9b20-75efea0452df	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-04 01:07:38.526183+00
4233d2a9-8628-47ce-96bf-0b00c5b2c387	14ac3aaf-c655-48bb-bb81-ed1c77dbff88	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-04 01:10:48.206849+00
03c19be8-beff-427d-b888-07a13a3ebdf3	1f387fbe-4903-4875-be02-4c449f6313bc	\N	\N	pending	a0000000-0000-0000-0000-000000000004	buyer	Order created	2026-02-04 01:32:24.159627+00
f4afd5bb-41b2-45e9-bd10-2bedf79fc8a5	1cdf90c8-fac8-436f-9862-eedfd51c9dcb	\N	\N	pending	a0000000-0000-0000-0000-000000000004	buyer	Order created	2026-02-04 01:50:41.296111+00
d23c5955-5b87-4c77-9722-482a507b8097	16d9673b-7fcf-4794-845e-8fcaa03ed6cc	\N	\N	pending	a0000000-0000-0000-0000-000000000004	buyer	Order created	2026-02-04 02:00:44.748879+00
66b4c13d-a589-4efe-8d3d-65132e119008	decffd2e-a535-4290-af13-b2e0b55893fc	\N	\N	pending	84709e04-5c64-466c-bb81-5d86b99509d4	buyer	Order created	2026-02-04 02:30:13.394816+00
1da3f784-fdef-41a9-b76b-5c7b1f83d95f	db6529e7-1fca-4c79-9ee9-c08c2678abf1	\N	\N	pending	2b040ea7-5cfb-466c-a76b-1c1683ca921a	buyer	Order created	2026-03-04 15:24:15.14376+00
\.


--
-- TOC entry 3796 (class 0 OID 16452)
-- Dependencies: 217
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_number, buyer_id, status, subtotal, total_shipping, total_tax, platform_fee, grand_total, currency, shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, billing_same_as_shipping, billing_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at, paid_at, completed_at, seller_id, product_id, ask_id, stripe_payment_intent_id, product_name, product_image, product_category, size, item_price, shipping_fee, tax_amount, platform_fee_rate, total_buyer_pays, seller_payout, tracking_number, carrier, shipped_at, delivered_at, escrow_status, escrow_held_at, escrow_released_at, auto_release_at, paypal_order_id, payment_method, seller_name) FROM stdin;
3ec5c6bf-1a0c-45aa-94c0-6950400ab8de	VF-2026-00001	5692e26e-739c-4fad-ae03-fa483b192484	pending	20.00	0.00	0.00	2.00	20.00	USD	test_user	1800weballat		TestNation	GA	56891	US		t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 23:10:35.121539+00	2026-01-18 23:10:35.121539+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
ba7a61e4-db35-4ab1-be8b-59a3b366a6fa	VF-2026-00002	0779a028-ca3a-41cb-b17a-c65dcb00e9ae	pending	791.00	0.00	0.00	79.10	791.00	USD	Winter Groover	3227 Fenton Ave		bronx	ny	10469	US		t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 04:50:25.484593+00	2026-01-19 04:50:25.484593+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
2af2c672-9187-4c8e-8a41-751f2f98e098	VF-2026-00007	84709e04-5c64-466c-bb81-5d86b99509d4	pending	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth 	66 Saint Louis 		Buffalo	NY	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 18:13:45.473327+00	2026-02-03 18:13:45.473327+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
05003b20-1365-48cc-ab31-3c6dcd827714	VF-2026-00004	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	cancelled	100.00	0.00	0.00	10.00	100.00	USD	Test Buyer	123 Test Street	\N	Los Angeles	CA	90001	US	555-123-4567	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 14:22:36.769299+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
e9e5e179-7436-42a9-b9cb-b35a56fba4a0	VF-2026-00005	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	cancelled	20.00	0.00	0.00	2.00	20.00	USD	Anthony Hudnall	310 center lake ln 		oviedo	Florida	32765	US	4487772302	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 14:26:07.270078+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
e9aaeb0f-92ab-47af-9fa1-cf3372dce3a4	VF-2026-00006	d3cc474e-41d9-4c3e-98bf-7a79ac6c4382	cancelled	20.00	0.00	0.00	2.00	20.00	USD	Anthony Hudnall	310 center lake ln		oviedo	Florida	32765	US	4487772302	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 14:33:39.850838+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
42ca1fae-64a7-4738-adf9-57a70b0a50c3	VF-2026-00009	84709e04-5c64-466c-bb81-5d86b99509d4	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth 	66 Saint Louis Ave		Buffalo 	Nu	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 01:05:27.735066+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
2d525469-85e4-4c25-9b20-75efea0452df	VF-2026-00010	84709e04-5c64-466c-bb81-5d86b99509d4	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth	66 Saint Louis Ave 		Buffalo	NY	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 01:07:38.450413+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
14ac3aaf-c655-48bb-bb81-ed1c77dbff88	VF-2026-00011	84709e04-5c64-466c-bb81-5d86b99509d4	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth 	66 Saint Louis Ave		Buffalo	NY	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 01:10:48.131834+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
1f387fbe-4903-4875-be02-4c449f6313bc	VF-2026-00012	a0000000-0000-0000-0000-000000000004	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Anthony Hudnall	310 center lake ln		Oviedo	Florida	32765	US	4487772302	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 01:32:24.075903+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
1cdf90c8-fac8-436f-9862-eedfd51c9dcb	VF-2026-00013	a0000000-0000-0000-0000-000000000004	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Anthony Hudnall	310 center lake ln		Oviedo	Florida	32765	US	4487772302	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 01:50:41.233612+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
16d9673b-7fcf-4794-845e-8fcaa03ed6cc	VF-2026-00014	a0000000-0000-0000-0000-000000000004	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Anthony Hudnall	310 Center Lake ln		Oviedo	Florida	32439	US	4487772302	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 02:00:44.655886+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
decffd2e-a535-4290-af13-b2e0b55893fc	VF-2026-00015	84709e04-5c64-466c-bb81-5d86b99509d4	cancelled	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth 	66 Saint Louis Ave		Buffalo 	NY	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 02:30:13.324357+00	2026-04-07 22:53:11.473839+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
d4e5f6a7-b8c9-0123-def4-567890123456	VF-2026-00003	d6cd519c-65f7-4e33-b3e9-8e6de326678f	refunded	299.99	0.00	24.00	30.00	365.99	USD	Anthony Hudnall	123 Production St	\N	Atlanta	GA	30301	US	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 13:21:27.023858+00	2026-04-07 23:01:39.165587+00	2026-01-25 13:21:27.023858+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
2cc47021-1804-4d50-b34c-3a938ab814cb	VF-2026-00008	84709e04-5c64-466c-bb81-5d86b99509d4	processing	150.00	0.00	0.00	15.00	150.00	USD	Vincent Stallworth 	66 Saint Louis ave 		Buffalo	NY	14211	US	7163742738	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 18:16:24.933887+00	2026-04-08 19:28:54.654938+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
db6529e7-1fca-4c79-9ee9-c08c2678abf1	VF-2026-00016	2b040ea7-5cfb-466c-a76b-1c1683ca921a	processing	299.00	0.00	0.00	29.90	299.00	USD	John doe	347 Fenton ave		Bronx	Ny	10469	US		t	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-04 15:24:15.020931+00	2026-04-09 02:03:42.786466+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
96a06359-6a91-4e85-8878-4bcc99ba59fa	VF-2026-00017	f1e2d3c4-b5a6-9876-5432-1098765432ab	processing	298.00	0.00	23.84	0.00	321.84	USD	Kathie Lee	Address from Stripe	\N	City	State	00000	US	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 15:30:00+00	2026-04-09 15:01:16.843931+00	2026-04-08 15:30:00+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.0900	\N	\N	\N	\N	\N	\N	none	\N	\N	\N	\N	stripe	\N
\.


--
-- TOC entry 3798 (class 0 OID 16500)
-- Dependencies: 219
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, order_id, provider, provider_payment_id, provider_customer_id, amount, currency, status, payment_method_type, card_brand, card_last4, failure_code, failure_message, metadata, created_at, updated_at) FROM stdin;
f6a7b8c9-d0e1-2345-fab6-789012345678	d4e5f6a7-b8c9-0123-def4-567890123456	stripe	pi_prod_test_123	\N	365.99	USD	succeeded	card	visa	4242	\N	\N	{}	2026-01-25 13:21:27.023858+00	2026-01-25 13:21:27.023858+00
720c20f1-ceb9-40e2-8944-e61f20c0a43f	05003b20-1365-48cc-ab31-3c6dcd827714	stripe	pi_3SuDAIKvyxhojMb22CfwFBgx	\N	100.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-01-27 14:22:46.730642+00	2026-01-27 14:22:46.730642+00
2669fe64-996a-47d0-828c-5e848a49b25f	e9e5e179-7436-42a9-b9cb-b35a56fba4a0	stripe	pi_3SuDDXKvyxhojMb201vd8TR0	\N	20.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-01-27 14:26:07.753252+00	2026-01-27 14:26:07.753252+00
eaa5c1f1-a0fd-43b6-8a61-3299958d2377	e9aaeb0f-92ab-47af-9fa1-cf3372dce3a4	stripe	pi_3SuDKqKvyxhojMb20d5zdxO4	\N	20.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-01-27 14:33:40.29487+00	2026-01-27 14:33:40.29487+00
b9bc87ee-3516-4fee-bf20-34803394aec2	42ca1fae-64a7-4738-adf9-57a70b0a50c3	stripe	pi_3SwuX6KvyxhojMb20Sd9CMzc	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 01:05:28.489404+00	2026-02-04 01:05:28.489404+00
58b17ed2-0e85-47be-87c4-67483770811e	2d525469-85e4-4c25-9b20-75efea0452df	stripe	pi_3SwuZCKvyxhojMb2252Gs122	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 01:07:39.06105+00	2026-02-04 01:07:39.06105+00
917456c9-b3a3-4e90-ae23-c9ada896d32d	14ac3aaf-c655-48bb-bb81-ed1c77dbff88	stripe	pi_3SwucGKvyxhojMb21nyOtoEB	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 01:10:48.532035+00	2026-02-04 01:10:48.532035+00
3913be63-265c-484f-ba03-eac887bd9286	1f387fbe-4903-4875-be02-4c449f6313bc	stripe	pi_3SwuxAKvyxhojMb20tNBsB50	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 01:32:24.518125+00	2026-02-04 01:32:24.518125+00
4288de7a-3857-4535-839c-d49b2733fe78	1cdf90c8-fac8-436f-9862-eedfd51c9dcb	stripe	pi_3SwvErKvyxhojMb20IXdYGEn	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 01:50:41.867738+00	2026-02-04 01:50:41.867738+00
6cc1c7c0-f6a6-4473-82a6-4e83391c4a80	16d9673b-7fcf-4794-845e-8fcaa03ed6cc	stripe	pi_3SwvObKvyxhojMb22tE16ON9	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 02:00:45.366692+00	2026-02-04 02:00:45.366692+00
074ea493-2899-46f3-9c8e-8df30adb6f98	decffd2e-a535-4290-af13-b2e0b55893fc	stripe	pi_3Swvr7KvyxhojMb21Spluukp	\N	150.00	USD	pending	\N	\N	\N	\N	\N	{}	2026-02-04 02:30:13.8036+00	2026-02-04 02:30:13.8036+00
1d7aa91c-3a8d-4537-86b7-be5f459c0ef6	db6529e7-1fca-4c79-9ee9-c08c2678abf1	stripe	pi_3T7HHXKvyxhojMb20KkgytRd	\N	299.00	USD	succeeded	\N	\N	\N	\N	\N	{}	2026-03-04 15:24:15.534795+00	2026-04-09 02:03:42.786466+00
62f2d22c-f99c-49eb-94e7-bc9a896358d6	96a06359-6a91-4e85-8878-4bcc99ba59fa	stripe	pi_3TpPoKvyxhojMb28R0I20W	\N	321.84	USD	succeeded	\N	\N	\N	\N	\N	{}	2026-04-08 15:30:00+00	2026-04-09 15:01:27.752204+00
\.


--
-- TOC entry 3816 (class 0 OID 60018)
-- Dependencies: 237
-- Data for Name: payout_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_methods (id, seller_id, method_type, label, account_id, account_name, is_primary, created_at, updated_at, national_id, date_of_birth, address) FROM stdin;
\.


--
-- TOC entry 3814 (class 0 OID 59981)
-- Dependencies: 235
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payouts (id, seller_id, order_id, gross_amount, fee_amount, net_amount, status, method, stripe_transfer_id, created_at, updated_at, payout_method_id, paypal_batch_id, paypal_item_id, processed_at, error_message) FROM stdin;
\.


--
-- TOC entry 3801 (class 0 OID 16572)
-- Dependencies: 222
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refunds (id, order_id, order_item_id, payment_id, escrow_id, amount, currency, reason, notes, provider, provider_refund_id, status, initiated_by, initiated_by_role, created_at, processed_at) FROM stdin;
\.


--
-- TOC entry 3806 (class 0 OID 16707)
-- Dependencies: 227
-- Data for Name: scheduled_payouts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scheduled_payouts (id, escrow_id, order_id, vendor_id, amount, scheduled_for, status, processed_at, stripe_transfer_id, failure_reason, created_at) FROM stdin;
\.


--
-- TOC entry 3809 (class 0 OID 16775)
-- Dependencies: 230
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_payments (id, vendor_id, invoice_number, amount, currency, payment_method, stripe_payment_intent_id, stripe_receipt_url, period_start, period_end, status, created_at) FROM stdin;
\.


--
-- TOC entry 3808 (class 0 OID 16756)
-- Dependencies: 229
-- Data for Name: vendor_payout_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_payout_profiles (id, vendor_id, payout_region, payout_method, wise_recipient_id, stripe_connect_account_id, bank_account_holder_name, bank_account_number_last4, bank_name, bank_country, currency, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3800 (class 0 OID 16553)
-- Dependencies: 221
-- Data for Name: vendor_shipping_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_shipping_methods (id, vendor_id, name, carrier, price_type, flat_rate, price_per_lb, min_days, max_days, domestic_only, countries_served, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3807 (class 0 OID 16735)
-- Dependencies: 228
-- Data for Name: vendor_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_subscriptions (id, vendor_id, plan_type, amount, currency, status, payment_method, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, last_payment_at, last_payment_status, created_at, updated_at) FROM stdin;
c837473b-6bc4-4c3c-8f58-d2759acb936e	ff806e3c-d6fc-4e2a-a99a-5514a8bcefff	monthly	10000	usd	past_due	alipay	cus_TtXD75DrrcQbBP	\N	\N	\N	\N	\N	2026-01-31 19:47:36.117713+00	2026-01-31 19:48:15.597324+00
bbedda2e-c210-4cb0-895f-4d68f69cdac6	c632ae7c-6b10-47a3-836e-00dddafa657f	monthly	10000	usd	past_due	card	cus_TtYBVOZhs6T90N	\N	\N	\N	\N	\N	2026-01-31 20:47:43.818542+00	2026-01-31 21:28:44.106632+00
39e55c95-148a-4db8-8db5-3ea0a83e5897	b214e834-ab03-430c-abf4-56bbf12589ec	monthly	10000	usd	past_due	alipay	cus_TtZ4rGOIMcqPsH	\N	\N	\N	\N	\N	2026-01-31 21:43:05.130779+00	2026-01-31 21:43:05.130779+00
4ae63dfd-8f79-449a-b588-13bd2a19b861	28474b68-8f05-48cc-9e2c-2dcc8955adc7	monthly	10000	usd	past_due	alipay	cus_TtZKp4r3ue6Xux	\N	\N	\N	\N	\N	2026-01-31 21:58:24.238809+00	2026-01-31 22:13:57.955772+00
0123f7c7-46e8-45fb-b1bd-ab48dede13c7	40f2f386-0b34-4af7-ba82-0c45b7a89d06	monthly	10000	usd	trialing	\N	\N	\N	2026-02-02 00:44:06.68+00	2026-02-09 00:44:06.68+00	\N	\N	2026-02-02 00:44:06.680203+00	2026-02-02 00:44:06.680203+00
4aa68885-584e-4437-ac8e-a244b798a759	719bfe5b-8cf6-4143-ae15-04c696d2cde7	monthly	10000	usd	trialing	\N	\N	\N	2026-02-02 00:44:28.766+00	2026-02-09 00:44:28.766+00	\N	\N	2026-02-02 00:44:28.763874+00	2026-02-02 00:44:28.763874+00
2daeeffb-cb0e-4c2a-adb4-94a15bdc06f1	1bb3aa55-da1e-44a0-bc79-280d446059a7	monthly	10000	usd	trialing	\N	\N	\N	2026-02-02 00:45:22.442+00	2026-02-09 00:45:22.442+00	\N	\N	2026-02-02 00:45:22.440908+00	2026-02-02 00:45:22.440908+00
cd5067da-4990-452e-b181-ba24b0a3168e	6270b81f-11d6-40f8-a3b3-7e4180140e30	monthly	10000	usd	trialing	\N	\N	\N	2026-02-02 03:23:43.959+00	2026-02-09 03:23:43.959+00	\N	\N	2026-02-02 03:23:43.96227+00	2026-02-02 03:23:43.96227+00
3b5e513c-eb71-4399-810e-3757e2274959	b8c1ef7f-72eb-4d94-9696-9c24377a0b35	monthly	10000	usd	trialing	\N	\N	\N	2026-02-02 14:37:56.341+00	2026-02-09 14:37:56.341+00	\N	\N	2026-02-02 14:37:56.345475+00	2026-02-02 14:37:56.345475+00
441d7cb2-62ba-4b49-a58c-dd8a7cb3d82d	65a6a876-a26b-4a06-acfa-c7de14e8e9e9	monthly	10000	usd	trialing	\N	\N	\N	2026-02-03 01:44:43.156+00	2026-02-10 01:44:43.156+00	\N	\N	2026-02-03 01:44:43.147792+00	2026-02-03 01:44:43.147792+00
05028e6f-76dd-43a7-8884-b9126bf85ec8	b19d2ed4-0c2b-4a53-9f61-7c134b5ec560	monthly	10000	usd	trialing	\N	\N	\N	2026-02-03 17:45:45.896+00	2026-02-10 17:45:45.896+00	\N	\N	2026-02-03 17:45:45.894141+00	2026-02-03 17:45:45.894141+00
8b352da1-55d9-4a61-b24e-04448b28a9ba	dead1123-02ac-4045-9c7f-19c20923b164	monthly	10000	usd	trialing	\N	\N	\N	2026-02-04 23:59:28.906+00	2026-02-11 23:59:28.906+00	\N	\N	2026-02-04 23:59:28.907295+00	2026-02-04 23:59:28.907295+00
378d7e62-f5c0-4470-ac3f-6ddbe6c7e0a3	df5789fe-1afb-4f08-a075-0d36216a45ce	monthly	10000	usd	trialing	\N	\N	\N	2026-02-06 00:37:13.604+00	2026-02-13 00:37:13.604+00	\N	\N	2026-02-06 00:37:13.601563+00	2026-02-06 00:37:13.601563+00
49ff0600-e8ea-479d-966c-7d74209e63fd	a192b684-7720-4244-b438-bcdc21132ced	monthly	10000	usd	past_due	wechat_pay	cus_Tul3t6pfDfqj4g	\N	2026-02-02 08:22:28.506+00	2026-02-09 08:22:28.506+00	\N	\N	2026-02-02 08:22:28.507258+00	2026-02-10 03:22:42.869367+00
16f4d778-d61e-4d77-87df-f421d5fe186b	a3256ba6-bdb2-4893-aed6-3b148ca80e8a	monthly	10000	usd	active	\N	\N	\N	2026-04-01 00:00:00+00	2026-05-01 00:00:00+00	\N	\N	2026-03-02 13:56:17.277807+00	2026-04-09 02:04:17.820282+00
\.


--
-- TOC entry 3824 (class 0 OID 0)
-- Dependencies: 233
-- Name: _migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public._migrations_id_seq', 8, true);


--
-- TOC entry 3825 (class 0 OID 0)
-- Dependencies: 224
-- Name: order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_number_seq', 17, true);


--
-- TOC entry 3607 (class 2606 OID 16824)
-- Name: _migrations _migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_name_key UNIQUE (name);


--
-- TOC entry 3609 (class 2606 OID 16822)
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3600 (class 2606 OID 16802)
-- Name: buyer_payment_methods buyer_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer_payment_methods
    ADD CONSTRAINT buyer_payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3520 (class 2606 OID 16446)
-- Name: cart_items cart_items_cart_id_product_id_size_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_id_size_key UNIQUE (cart_id, product_id, size);


--
-- TOC entry 3522 (class 2606 OID 16444)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3515 (class 2606 OID 16429)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 3517 (class 2606 OID 16431)
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- TOC entry 3574 (class 2606 OID 16700)
-- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3566 (class 2606 OID 16672)
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- TOC entry 3548 (class 2606 OID 16537)
-- Name: escrow escrow_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow
    ADD CONSTRAINT escrow_pkey PRIMARY KEY (id);


--
-- TOC entry 3605 (class 2606 OID 16811)
-- Name: one_click_purchase_log one_click_purchase_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_click_purchase_log
    ADD CONSTRAINT one_click_purchase_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3618 (class 2606 OID 60006)
-- Name: order_events order_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_pkey PRIMARY KEY (id);


--
-- TOC entry 3541 (class 2606 OID 16494)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3564 (class 2606 OID 16615)
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3533 (class 2606 OID 16476)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 3535 (class 2606 OID 16474)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3546 (class 2606 OID 16515)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3622 (class 2606 OID 60029)
-- Name: payout_methods payout_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_methods
    ADD CONSTRAINT payout_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3615 (class 2606 OID 59991)
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- TOC entry 3561 (class 2606 OID 16586)
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- TOC entry 3579 (class 2606 OID 16716)
-- Name: scheduled_payouts scheduled_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_payouts
    ADD CONSTRAINT scheduled_payouts_pkey PRIMARY KEY (id);


--
-- TOC entry 3596 (class 2606 OID 16787)
-- Name: subscription_payments subscription_payments_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 3598 (class 2606 OID 16785)
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3590 (class 2606 OID 16770)
-- Name: vendor_payout_profiles vendor_payout_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payout_profiles
    ADD CONSTRAINT vendor_payout_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3592 (class 2606 OID 16772)
-- Name: vendor_payout_profiles vendor_payout_profiles_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payout_profiles
    ADD CONSTRAINT vendor_payout_profiles_vendor_id_key UNIQUE (vendor_id);


--
-- TOC entry 3555 (class 2606 OID 16569)
-- Name: vendor_shipping_methods vendor_shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_shipping_methods
    ADD CONSTRAINT vendor_shipping_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3557 (class 2606 OID 16571)
-- Name: vendor_shipping_methods vendor_shipping_methods_vendor_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_shipping_methods
    ADD CONSTRAINT vendor_shipping_methods_vendor_id_name_key UNIQUE (vendor_id, name);


--
-- TOC entry 3584 (class 2606 OID 16750)
-- Name: vendor_subscriptions vendor_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_subscriptions
    ADD CONSTRAINT vendor_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3586 (class 2606 OID 16752)
-- Name: vendor_subscriptions vendor_subscriptions_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_subscriptions
    ADD CONSTRAINT vendor_subscriptions_vendor_id_key UNIQUE (vendor_id);


--
-- TOC entry 3601 (class 1259 OID 16804)
-- Name: idx_buyer_payment_methods_stripe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_payment_methods_stripe ON public.buyer_payment_methods USING btree (stripe_payment_method_id);


--
-- TOC entry 3602 (class 1259 OID 16803)
-- Name: idx_buyer_payment_methods_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_payment_methods_user ON public.buyer_payment_methods USING btree (user_id);


--
-- TOC entry 3523 (class 1259 OID 16627)
-- Name: idx_cart_items_cart_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);


--
-- TOC entry 3524 (class 1259 OID 16628)
-- Name: idx_cart_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_product_id ON public.cart_items USING btree (product_id);


--
-- TOC entry 3518 (class 1259 OID 16626)
-- Name: idx_carts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carts_user_id ON public.carts USING btree (user_id);


--
-- TOC entry 3575 (class 1259 OID 16706)
-- Name: idx_dispute_messages_dispute_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispute_messages_dispute_id ON public.dispute_messages USING btree (dispute_id);


--
-- TOC entry 3567 (class 1259 OID 16689)
-- Name: idx_disputes_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_buyer_id ON public.disputes USING btree (buyer_id);


--
-- TOC entry 3568 (class 1259 OID 60058)
-- Name: idx_disputes_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_order ON public.disputes USING btree (order_id);


--
-- TOC entry 3569 (class 1259 OID 16688)
-- Name: idx_disputes_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_order_id ON public.disputes USING btree (order_id);


--
-- TOC entry 3570 (class 1259 OID 16691)
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);


--
-- TOC entry 3571 (class 1259 OID 60059)
-- Name: idx_disputes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_user ON public.disputes USING btree (initiated_by, status);


--
-- TOC entry 3572 (class 1259 OID 16690)
-- Name: idx_disputes_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_vendor_id ON public.disputes USING btree (vendor_id);


--
-- TOC entry 3549 (class 1259 OID 16643)
-- Name: idx_escrow_hold_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escrow_hold_until ON public.escrow USING btree (hold_until);


--
-- TOC entry 3550 (class 1259 OID 16640)
-- Name: idx_escrow_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escrow_order_id ON public.escrow USING btree (order_id);


--
-- TOC entry 3551 (class 1259 OID 16642)
-- Name: idx_escrow_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escrow_status ON public.escrow USING btree (status);


--
-- TOC entry 3552 (class 1259 OID 16641)
-- Name: idx_escrow_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escrow_vendor_id ON public.escrow USING btree (vendor_id);


--
-- TOC entry 3603 (class 1259 OID 16812)
-- Name: idx_one_click_log_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_one_click_log_user_time ON public.one_click_purchase_log USING btree (user_id, created_at DESC);


--
-- TOC entry 3616 (class 1259 OID 60017)
-- Name: idx_order_events_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_events_order_id ON public.order_events USING btree (order_id);


--
-- TOC entry 3562 (class 1259 OID 16647)
-- Name: idx_order_history_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_history_order_id ON public.order_status_history USING btree (order_id);


--
-- TOC entry 3536 (class 1259 OID 16633)
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- TOC entry 3537 (class 1259 OID 16635)
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- TOC entry 3538 (class 1259 OID 16636)
-- Name: idx_order_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_status ON public.order_items USING btree (status);


--
-- TOC entry 3539 (class 1259 OID 16634)
-- Name: idx_order_items_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_vendor_id ON public.order_items USING btree (vendor_id);


--
-- TOC entry 3525 (class 1259 OID 16629)
-- Name: idx_orders_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_buyer_id ON public.orders USING btree (buyer_id);


--
-- TOC entry 3526 (class 1259 OID 16631)
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- TOC entry 3527 (class 1259 OID 16632)
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);


--
-- TOC entry 3528 (class 1259 OID 60061)
-- Name: idx_orders_paypal_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_paypal_order_id ON public.orders USING btree (paypal_order_id) WHERE (paypal_order_id IS NOT NULL);


--
-- TOC entry 3529 (class 1259 OID 60012)
-- Name: idx_orders_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_seller_id ON public.orders USING btree (seller_id);


--
-- TOC entry 3530 (class 1259 OID 16630)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 3531 (class 1259 OID 60013)
-- Name: idx_orders_stripe_pi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_stripe_pi ON public.orders USING btree (stripe_payment_intent_id);


--
-- TOC entry 3542 (class 1259 OID 16637)
-- Name: idx_payments_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);


--
-- TOC entry 3543 (class 1259 OID 16638)
-- Name: idx_payments_provider_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_provider_payment_id ON public.payments USING btree (provider_payment_id);


--
-- TOC entry 3544 (class 1259 OID 16639)
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- TOC entry 3619 (class 1259 OID 60030)
-- Name: idx_payout_methods_one_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payout_methods_one_primary ON public.payout_methods USING btree (seller_id) WHERE (is_primary = true);


--
-- TOC entry 3620 (class 1259 OID 60031)
-- Name: idx_payout_methods_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_methods_seller_id ON public.payout_methods USING btree (seller_id);


--
-- TOC entry 3587 (class 1259 OID 16774)
-- Name: idx_payout_profiles_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_profiles_region ON public.vendor_payout_profiles USING btree (payout_region);


--
-- TOC entry 3588 (class 1259 OID 16773)
-- Name: idx_payout_profiles_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_profiles_vendor ON public.vendor_payout_profiles USING btree (vendor_id);


--
-- TOC entry 3610 (class 1259 OID 60015)
-- Name: idx_payouts_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_order_id ON public.payouts USING btree (order_id);


--
-- TOC entry 3611 (class 1259 OID 60064)
-- Name: idx_payouts_paypal_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_paypal_batch_id ON public.payouts USING btree (paypal_batch_id) WHERE (paypal_batch_id IS NOT NULL);


--
-- TOC entry 3612 (class 1259 OID 60014)
-- Name: idx_payouts_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_seller_id ON public.payouts USING btree (seller_id);


--
-- TOC entry 3613 (class 1259 OID 60016)
-- Name: idx_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_status ON public.payouts USING btree (status);


--
-- TOC entry 3558 (class 1259 OID 16645)
-- Name: idx_refunds_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refunds_order_id ON public.refunds USING btree (order_id);


--
-- TOC entry 3559 (class 1259 OID 16646)
-- Name: idx_refunds_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refunds_payment_id ON public.refunds USING btree (payment_id);


--
-- TOC entry 3576 (class 1259 OID 16728)
-- Name: idx_scheduled_payouts_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_payouts_scheduled_for ON public.scheduled_payouts USING btree (scheduled_for);


--
-- TOC entry 3577 (class 1259 OID 16727)
-- Name: idx_scheduled_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_payouts_status ON public.scheduled_payouts USING btree (status);


--
-- TOC entry 3593 (class 1259 OID 16789)
-- Name: idx_subscription_payments_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_created ON public.subscription_payments USING btree (created_at DESC);


--
-- TOC entry 3594 (class 1259 OID 16788)
-- Name: idx_subscription_payments_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_vendor ON public.subscription_payments USING btree (vendor_id);


--
-- TOC entry 3553 (class 1259 OID 16644)
-- Name: idx_vendor_shipping_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_shipping_vendor_id ON public.vendor_shipping_methods USING btree (vendor_id);


--
-- TOC entry 3580 (class 1259 OID 16755)
-- Name: idx_vendor_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_subscriptions_period_end ON public.vendor_subscriptions USING btree (current_period_end);


--
-- TOC entry 3581 (class 1259 OID 16754)
-- Name: idx_vendor_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_subscriptions_status ON public.vendor_subscriptions USING btree (status);


--
-- TOC entry 3582 (class 1259 OID 16753)
-- Name: idx_vendor_subscriptions_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_subscriptions_vendor ON public.vendor_subscriptions USING btree (vendor_id);


--
-- TOC entry 3647 (class 2620 OID 16657)
-- Name: orders set_order_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();


--
-- TOC entry 3646 (class 2620 OID 16650)
-- Name: cart_items update_cart_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3645 (class 2620 OID 16649)
-- Name: carts update_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3651 (class 2620 OID 16654)
-- Name: escrow update_escrow_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON public.escrow FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3649 (class 2620 OID 16652)
-- Name: order_items update_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3648 (class 2620 OID 16651)
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3650 (class 2620 OID 16653)
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_order_updated_at();


--
-- TOC entry 3623 (class 2606 OID 16447)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- TOC entry 3639 (class 2606 OID 16701)
-- Name: dispute_messages dispute_messages_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- TOC entry 3636 (class 2606 OID 16683)
-- Name: disputes disputes_escrow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_escrow_id_fkey FOREIGN KEY (escrow_id) REFERENCES public.escrow(id);


--
-- TOC entry 3637 (class 2606 OID 16673)
-- Name: disputes disputes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3638 (class 2606 OID 16678)
-- Name: disputes disputes_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- TOC entry 3626 (class 2606 OID 16729)
-- Name: escrow escrow_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow
    ADD CONSTRAINT escrow_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id);


--
-- TOC entry 3627 (class 2606 OID 16538)
-- Name: escrow escrow_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow
    ADD CONSTRAINT escrow_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3628 (class 2606 OID 16543)
-- Name: escrow escrow_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow
    ADD CONSTRAINT escrow_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- TOC entry 3629 (class 2606 OID 16548)
-- Name: escrow escrow_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow
    ADD CONSTRAINT escrow_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- TOC entry 3644 (class 2606 OID 60007)
-- Name: order_events order_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3624 (class 2606 OID 16495)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3634 (class 2606 OID 16616)
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3635 (class 2606 OID 16621)
-- Name: order_status_history order_status_history_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- TOC entry 3625 (class 2606 OID 16516)
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3642 (class 2606 OID 59992)
-- Name: payouts payouts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3643 (class 2606 OID 60032)
-- Name: payouts payouts_payout_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_payout_method_id_fkey FOREIGN KEY (payout_method_id) REFERENCES public.payout_methods(id);


--
-- TOC entry 3630 (class 2606 OID 16602)
-- Name: refunds refunds_escrow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_escrow_id_fkey FOREIGN KEY (escrow_id) REFERENCES public.escrow(id);


--
-- TOC entry 3631 (class 2606 OID 16587)
-- Name: refunds refunds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3632 (class 2606 OID 16592)
-- Name: refunds refunds_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- TOC entry 3633 (class 2606 OID 16597)
-- Name: refunds refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- TOC entry 3640 (class 2606 OID 16717)
-- Name: scheduled_payouts scheduled_payouts_escrow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_payouts
    ADD CONSTRAINT scheduled_payouts_escrow_id_fkey FOREIGN KEY (escrow_id) REFERENCES public.escrow(id);


--
-- TOC entry 3641 (class 2606 OID 16722)
-- Name: scheduled_payouts scheduled_payouts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_payouts
    ADD CONSTRAINT scheduled_payouts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


-- Completed on 2026-05-01 19:26:28 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict 802dqnhHPfUr1l6ev6kfZoZ1NfJhuhExrRe9GEy5AwcPevYkN5QyToKn0jVxJ8W

