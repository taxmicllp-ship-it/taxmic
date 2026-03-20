--
-- PostgreSQL database dump
--

\restrict I5qhLX8TThbYf1MmyooM3fjJNMNB2ntckMDNqy2PbIeNIGMOwwLzuyHAnaLdIBG

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: taxmic_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO taxmic_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: taxmic_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: client_status_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.client_status_enum AS ENUM (
    'active',
    'inactive',
    'archived',
    'lead'
);


ALTER TYPE public.client_status_enum OWNER TO taxmic_user;

--
-- Name: client_type_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.client_type_enum AS ENUM (
    'individual',
    'business',
    'nonprofit'
);


ALTER TYPE public.client_type_enum OWNER TO taxmic_user;

--
-- Name: document_visibility_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.document_visibility_enum AS ENUM (
    'internal',
    'client'
);


ALTER TYPE public.document_visibility_enum OWNER TO taxmic_user;

--
-- Name: email_event_type_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.email_event_type_enum AS ENUM (
    'sent',
    'delivered',
    'opened',
    'clicked',
    'bounced',
    'complained'
);


ALTER TYPE public.email_event_type_enum OWNER TO taxmic_user;

--
-- Name: invoice_status_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.invoice_status_enum AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE public.invoice_status_enum OWNER TO taxmic_user;

--
-- Name: notification_type_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.notification_type_enum AS ENUM (
    'task_assigned',
    'task_completed',
    'invoice_sent',
    'invoice_paid',
    'document_uploaded',
    'comment_added',
    'user_invited'
);


ALTER TYPE public.notification_type_enum OWNER TO taxmic_user;

--
-- Name: payment_method_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.payment_method_enum AS ENUM (
    'stripe',
    'check',
    'cash',
    'wire',
    'other'
);


ALTER TYPE public.payment_method_enum OWNER TO taxmic_user;

--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status_enum OWNER TO taxmic_user;

--
-- Name: subscription_status_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.subscription_status_enum AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid'
);


ALTER TYPE public.subscription_status_enum OWNER TO taxmic_user;

--
-- Name: task_priority_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.task_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.task_priority_enum OWNER TO taxmic_user;

--
-- Name: task_status_enum; Type: TYPE; Schema: public; Owner: taxmic_user
--

CREATE TYPE public.task_status_enum AS ENUM (
    'new',
    'in_progress',
    'waiting_client',
    'review',
    'completed'
);


ALTER TYPE public.task_status_enum OWNER TO taxmic_user;

--
-- Name: get_next_invoice_number(uuid); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.get_next_invoice_number(p_firm_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO invoice_sequences (firm_id, last_number, created_at, updated_at)
    VALUES (p_firm_id, 1, now(), now())
    ON CONFLICT (firm_id) DO UPDATE
      SET last_number = invoice_sequences.last_number + 1,
          updated_at  = now()
    RETURNING last_number INTO v_next;
  RETURN v_next;
END;
$$;


ALTER FUNCTION public.get_next_invoice_number(p_firm_id uuid) OWNER TO taxmic_user;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO taxmic_user;

--
-- Name: update_clients_search_vector(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.update_clients_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_clients_search_vector() OWNER TO taxmic_user;

--
-- Name: update_contacts_search_vector(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.update_contacts_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contacts_search_vector() OWNER TO taxmic_user;

--
-- Name: update_documents_search_vector(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.update_documents_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.filename, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_documents_search_vector() OWNER TO taxmic_user;

--
-- Name: update_storage_usage(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.update_storage_usage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (firm_id, total_bytes, document_count, last_calculated_at, created_at, updated_at)
      VALUES (NEW.firm_id, NEW.size_bytes, 1, now(), now(), now())
      ON CONFLICT (firm_id) DO UPDATE
        SET total_bytes        = storage_usage.total_bytes + NEW.size_bytes,
            document_count     = storage_usage.document_count + 1,
            last_calculated_at = now(),
            updated_at         = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
      SET total_bytes        = GREATEST(0, total_bytes - OLD.size_bytes),
          document_count     = GREATEST(0, document_count - 1),
          last_calculated_at = now(),
          updated_at         = now()
      WHERE firm_id = OLD.firm_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_storage_usage() OWNER TO taxmic_user;

--
-- Name: update_tasks_search_vector(); Type: FUNCTION; Schema: public; Owner: taxmic_user
--

CREATE FUNCTION public.update_tasks_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tasks_search_vector() OWNER TO taxmic_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO taxmic_user;

--
-- Name: activity_events; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.activity_events (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid,
    actor_user_id uuid,
    actor_client_user_id uuid,
    event_type character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT activity_events_actor_xor CHECK ((((actor_user_id IS NOT NULL) AND (actor_client_user_id IS NULL)) OR ((actor_user_id IS NULL) AND (actor_client_user_id IS NOT NULL))))
);


ALTER TABLE public.activity_events OWNER TO taxmic_user;

--
-- Name: client_addresses; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.client_addresses (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    street_line1 character varying(255),
    street_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100),
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_addresses OWNER TO taxmic_user;

--
-- Name: client_contacts; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.client_contacts (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.client_contacts OWNER TO taxmic_user;

--
-- Name: client_users; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.client_users (
    id uuid NOT NULL,
    client_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.client_users OWNER TO taxmic_user;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.clients (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(20),
    type public.client_type_enum,
    status public.client_status_enum DEFAULT 'active'::public.client_status_enum NOT NULL,
    tax_id character varying(50),
    website character varying(255),
    notes text,
    search_vector tsvector,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.clients OWNER TO taxmic_user;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.contacts (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(20),
    title character varying(100),
    is_primary boolean DEFAULT false NOT NULL,
    notes text,
    search_vector tsvector,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.contacts OWNER TO taxmic_user;

--
-- Name: document_permissions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.document_permissions (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    visibility public.document_visibility_enum DEFAULT 'internal'::public.document_visibility_enum NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.document_permissions OWNER TO taxmic_user;

--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.document_versions (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    file_key character varying(500) NOT NULL,
    size_bytes bigint NOT NULL,
    uploaded_by uuid,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_current boolean DEFAULT false NOT NULL
);


ALTER TABLE public.document_versions OWNER TO taxmic_user;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid,
    folder_id uuid,
    filename character varying(500) NOT NULL,
    file_key character varying(500) NOT NULL,
    mime_type character varying(100),
    size_bytes bigint NOT NULL,
    description text,
    uploaded_by uuid,
    current_version integer DEFAULT 1 NOT NULL,
    search_vector tsvector,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.documents OWNER TO taxmic_user;

--
-- Name: email_events; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.email_events (
    id uuid NOT NULL,
    firm_id uuid,
    message_id character varying(255) NOT NULL,
    email_to character varying(255) NOT NULL,
    email_from character varying(255) NOT NULL,
    subject text,
    template_name character varying(100),
    event_type public.email_event_type_enum NOT NULL,
    event_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.email_events OWNER TO taxmic_user;

--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.failed_jobs (
    id uuid NOT NULL,
    queue character varying(100) NOT NULL,
    job_id character varying(255) NOT NULL,
    payload jsonb NOT NULL,
    error text NOT NULL,
    attempts integer NOT NULL,
    failed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at timestamp(3) without time zone,
    resolved_by uuid,
    resolution_notes text
);


ALTER TABLE public.failed_jobs OWNER TO taxmic_user;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.feature_flags (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    enabled_globally boolean DEFAULT false NOT NULL,
    rollout_percentage integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    CONSTRAINT feature_flags_rollout_range CHECK (((rollout_percentage >= 0) AND (rollout_percentage <= 100)))
);


ALTER TABLE public.feature_flags OWNER TO taxmic_user;

--
-- Name: firm_feature_flags; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.firm_feature_flags (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    feature_flag_id uuid NOT NULL,
    enabled boolean NOT NULL,
    enabled_at timestamp(3) without time zone,
    enabled_by uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.firm_feature_flags OWNER TO taxmic_user;

--
-- Name: firm_settings; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.firm_settings (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    timezone character varying(50) DEFAULT 'America/New_York'::character varying NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    date_format character varying(20) DEFAULT 'MM/DD/YYYY'::character varying NOT NULL,
    invoice_prefix character varying(10),
    invoice_terms text,
    invoice_footer text,
    logo_url character varying(500),
    primary_color character varying(7),
    email_from_name character varying(255),
    email_reply_to character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.firm_settings OWNER TO taxmic_user;

--
-- Name: firms; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.firms (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    website character varying(255),
    logo_url character varying(500),
    timezone character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.firms OWNER TO taxmic_user;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.folders (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid,
    parent_id uuid,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.folders OWNER TO taxmic_user;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.invoice_items (
    id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    amount numeric(10,2) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    CONSTRAINT invoice_items_amount_nonneg CHECK ((amount >= (0)::numeric)),
    CONSTRAINT invoice_items_quantity_positive CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_items_unit_price_nonneg CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.invoice_items OWNER TO taxmic_user;

--
-- Name: invoice_sequences; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.invoice_sequences (
    firm_id uuid NOT NULL,
    last_number integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoice_sequences OWNER TO taxmic_user;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid NOT NULL,
    number integer NOT NULL,
    status public.invoice_status_enum DEFAULT 'draft'::public.invoice_status_enum NOT NULL,
    issue_date date NOT NULL,
    due_date date,
    subtotal_amount numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    pdf_url character varying(500),
    sent_at timestamp(3) without time zone,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    CONSTRAINT invoices_paid_amount_nonneg CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT invoices_paid_lte_total CHECK ((paid_amount <= total_amount)),
    CONSTRAINT invoices_total_amount_nonneg CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.invoices OWNER TO taxmic_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type_enum NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO taxmic_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public.payment_method_enum NOT NULL,
    status public.payment_status_enum DEFAULT 'pending'::public.payment_status_enum NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_charge_id character varying(255),
    reference_number character varying(255),
    notes text,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO taxmic_user;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO taxmic_user;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.plans (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(50) NOT NULL,
    description text,
    price_monthly numeric(10,2) NOT NULL,
    price_annual numeric(10,2) NOT NULL,
    max_clients integer,
    max_users integer,
    max_storage_gb integer,
    features jsonb,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.plans OWNER TO taxmic_user;

--
-- Name: portal_sessions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.portal_sessions (
    id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.portal_sessions OWNER TO taxmic_user;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO taxmic_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO taxmic_user;

--
-- Name: storage_usage; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.storage_usage (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    total_bytes bigint DEFAULT 0 NOT NULL,
    document_count integer DEFAULT 0 NOT NULL,
    last_calculated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.storage_usage OWNER TO taxmic_user;

--
-- Name: subscription_events; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.subscription_events (
    id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.subscription_events OWNER TO taxmic_user;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.subscriptions (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public.subscription_status_enum DEFAULT 'trialing'::public.subscription_status_enum NOT NULL,
    stripe_subscription_id character varying(255),
    stripe_customer_id character varying(255),
    current_period_start timestamp(3) without time zone,
    current_period_end timestamp(3) without time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    canceled_at timestamp(3) without time zone,
    trial_start timestamp(3) without time zone,
    trial_end timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO taxmic_user;

--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.task_assignments (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_assignments OWNER TO taxmic_user;

--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.task_comments (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid,
    comment text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.task_comments OWNER TO taxmic_user;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    client_id uuid,
    title character varying(255) NOT NULL,
    description text,
    status public.task_status_enum DEFAULT 'new'::public.task_status_enum NOT NULL,
    priority public.task_priority_enum DEFAULT 'medium'::public.task_priority_enum NOT NULL,
    due_date date,
    completed_at timestamp(3) without time zone,
    created_by uuid,
    search_vector tsvector,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.tasks OWNER TO taxmic_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    firm_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO taxmic_user;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.user_settings (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    timezone character varying(50),
    language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    desktop_notifications boolean DEFAULT true NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_settings OWNER TO taxmic_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    firm_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    avatar_url character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO taxmic_user;

--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: taxmic_user
--

CREATE TABLE public.webhook_events (
    id uuid NOT NULL,
    event_id character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payload jsonb,
    error text,
    received_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.webhook_events OWNER TO taxmic_user;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_events activity_events_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_pkey PRIMARY KEY (id);


--
-- Name: client_addresses client_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_addresses
    ADD CONSTRAINT client_addresses_pkey PRIMARY KEY (id);


--
-- Name: client_contacts client_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_contacts
    ADD CONSTRAINT client_contacts_pkey PRIMARY KEY (id);


--
-- Name: client_users client_users_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: document_permissions document_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_events email_events_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: firm_feature_flags firm_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_feature_flags
    ADD CONSTRAINT firm_feature_flags_pkey PRIMARY KEY (id);


--
-- Name: firm_settings firm_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_settings
    ADD CONSTRAINT firm_settings_pkey PRIMARY KEY (id);


--
-- Name: firms firms_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firms
    ADD CONSTRAINT firms_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_sequences invoice_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoice_sequences
    ADD CONSTRAINT invoice_sequences_pkey PRIMARY KEY (firm_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: portal_sessions portal_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.portal_sessions
    ADD CONSTRAINT portal_sessions_pkey PRIMARY KEY (id);


--
-- Name: portal_sessions portal_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.portal_sessions
    ADD CONSTRAINT portal_sessions_token_key UNIQUE (token);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: storage_usage storage_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.storage_usage
    ADD CONSTRAINT storage_usage_pkey PRIMARY KEY (id);


--
-- Name: subscription_events subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: activity_events_actor_client_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_actor_client_user_id_idx ON public.activity_events USING btree (actor_client_user_id);


--
-- Name: activity_events_actor_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_actor_user_id_idx ON public.activity_events USING btree (actor_user_id);


--
-- Name: activity_events_client_id_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_client_id_created_at_idx ON public.activity_events USING btree (client_id, created_at);


--
-- Name: activity_events_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_client_id_idx ON public.activity_events USING btree (client_id);


--
-- Name: activity_events_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_created_at_idx ON public.activity_events USING btree (created_at);


--
-- Name: activity_events_entity_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_entity_type_idx ON public.activity_events USING btree (entity_type);


--
-- Name: activity_events_event_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_event_type_idx ON public.activity_events USING btree (event_type);


--
-- Name: activity_events_firm_id_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_firm_id_created_at_idx ON public.activity_events USING btree (firm_id, created_at);


--
-- Name: activity_events_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX activity_events_firm_id_idx ON public.activity_events USING btree (firm_id);


--
-- Name: client_addresses_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_addresses_client_id_idx ON public.client_addresses USING btree (client_id);


--
-- Name: client_addresses_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_addresses_firm_id_idx ON public.client_addresses USING btree (firm_id);


--
-- Name: client_addresses_is_primary_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_addresses_is_primary_idx ON public.client_addresses USING btree (is_primary);


--
-- Name: client_addresses_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_addresses_type_idx ON public.client_addresses USING btree (type);


--
-- Name: client_contacts_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_contacts_client_id_idx ON public.client_contacts USING btree (client_id);


--
-- Name: client_contacts_contact_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_contacts_contact_id_idx ON public.client_contacts USING btree (contact_id);


--
-- Name: client_contacts_firm_id_client_id_contact_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX client_contacts_firm_id_client_id_contact_id_key ON public.client_contacts USING btree (firm_id, client_id, contact_id);


--
-- Name: client_contacts_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_contacts_firm_id_idx ON public.client_contacts USING btree (firm_id);


--
-- Name: client_contacts_is_primary_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_contacts_is_primary_idx ON public.client_contacts USING btree (is_primary);


--
-- Name: client_users_client_id_email_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX client_users_client_id_email_key ON public.client_users USING btree (client_id, email) WHERE (deleted_at IS NULL);


--
-- Name: client_users_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_users_client_id_idx ON public.client_users USING btree (client_id);


--
-- Name: client_users_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_users_deleted_at_idx ON public.client_users USING btree (deleted_at);


--
-- Name: client_users_email_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX client_users_email_idx ON public.client_users USING btree (email);


--
-- Name: clients_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_deleted_at_idx ON public.clients USING btree (deleted_at);


--
-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_email_idx ON public.clients USING btree (email);


--
-- Name: clients_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_firm_id_idx ON public.clients USING btree (firm_id);


--
-- Name: clients_search_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_search_idx ON public.clients USING gin (search_vector);


--
-- Name: clients_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_status_idx ON public.clients USING btree (status);


--
-- Name: clients_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX clients_type_idx ON public.clients USING btree (type);


--
-- Name: contacts_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX contacts_deleted_at_idx ON public.contacts USING btree (deleted_at);


--
-- Name: contacts_email_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX contacts_email_idx ON public.contacts USING btree (email);


--
-- Name: contacts_firm_id_email_unique; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX contacts_firm_id_email_unique ON public.contacts USING btree (firm_id, email) WHERE ((email IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: contacts_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX contacts_firm_id_idx ON public.contacts USING btree (firm_id);


--
-- Name: contacts_search_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX contacts_search_idx ON public.contacts USING gin (search_vector);


--
-- Name: document_permissions_document_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_permissions_document_id_idx ON public.document_permissions USING btree (document_id);


--
-- Name: document_permissions_visibility_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_permissions_visibility_idx ON public.document_permissions USING btree (visibility);


--
-- Name: document_versions_current_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_versions_current_idx ON public.document_versions USING btree (document_id) WHERE (is_current = true);


--
-- Name: document_versions_document_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_versions_document_id_idx ON public.document_versions USING btree (document_id);


--
-- Name: document_versions_document_id_version_number_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX document_versions_document_id_version_number_key ON public.document_versions USING btree (document_id, version_number);


--
-- Name: document_versions_is_current_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_versions_is_current_idx ON public.document_versions USING btree (is_current);


--
-- Name: document_versions_uploaded_by_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX document_versions_uploaded_by_idx ON public.document_versions USING btree (uploaded_by);


--
-- Name: documents_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_client_id_idx ON public.documents USING btree (client_id);


--
-- Name: documents_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_created_at_idx ON public.documents USING btree (created_at);


--
-- Name: documents_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_deleted_at_idx ON public.documents USING btree (deleted_at);


--
-- Name: documents_firm_id_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_firm_id_client_id_idx ON public.documents USING btree (firm_id, client_id);


--
-- Name: documents_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_firm_id_idx ON public.documents USING btree (firm_id);


--
-- Name: documents_folder_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_folder_id_idx ON public.documents USING btree (folder_id);


--
-- Name: documents_search_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_search_idx ON public.documents USING gin (search_vector);


--
-- Name: documents_uploaded_by_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX documents_uploaded_by_idx ON public.documents USING btree (uploaded_by);


--
-- Name: email_events_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_created_at_idx ON public.email_events USING btree (created_at);


--
-- Name: email_events_email_to_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_email_to_idx ON public.email_events USING btree (email_to);


--
-- Name: email_events_event_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_event_type_idx ON public.email_events USING btree (event_type);


--
-- Name: email_events_firm_id_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_firm_id_created_at_idx ON public.email_events USING btree (firm_id, created_at);


--
-- Name: email_events_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_firm_id_idx ON public.email_events USING btree (firm_id);


--
-- Name: email_events_message_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX email_events_message_id_idx ON public.email_events USING btree (message_id);


--
-- Name: failed_jobs_failed_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX failed_jobs_failed_at_idx ON public.failed_jobs USING btree (failed_at);


--
-- Name: failed_jobs_queue_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX failed_jobs_queue_idx ON public.failed_jobs USING btree (queue);


--
-- Name: failed_jobs_resolved_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX failed_jobs_resolved_at_idx ON public.failed_jobs USING btree (resolved_at);


--
-- Name: failed_jobs_unresolved_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX failed_jobs_unresolved_idx ON public.failed_jobs USING btree (failed_at) WHERE (resolved_at IS NULL);


--
-- Name: feature_flags_name_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX feature_flags_name_key ON public.feature_flags USING btree (name);


--
-- Name: firm_feature_flags_feature_flag_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX firm_feature_flags_feature_flag_id_idx ON public.firm_feature_flags USING btree (feature_flag_id);


--
-- Name: firm_feature_flags_firm_id_feature_flag_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX firm_feature_flags_firm_id_feature_flag_id_key ON public.firm_feature_flags USING btree (firm_id, feature_flag_id);


--
-- Name: firm_feature_flags_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX firm_feature_flags_firm_id_idx ON public.firm_feature_flags USING btree (firm_id);


--
-- Name: firm_settings_firm_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX firm_settings_firm_id_key ON public.firm_settings USING btree (firm_id);


--
-- Name: firms_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX firms_deleted_at_idx ON public.firms USING btree (deleted_at);


--
-- Name: firms_email_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX firms_email_idx ON public.firms USING btree (email);


--
-- Name: firms_slug_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX firms_slug_key ON public.firms USING btree (slug);


--
-- Name: folders_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX folders_client_id_idx ON public.folders USING btree (client_id);


--
-- Name: folders_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX folders_deleted_at_idx ON public.folders USING btree (deleted_at);


--
-- Name: folders_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX folders_firm_id_idx ON public.folders USING btree (firm_id);


--
-- Name: folders_parent_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX folders_parent_id_idx ON public.folders USING btree (parent_id);


--
-- Name: invoice_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items USING btree (invoice_id);


--
-- Name: invoice_items_sort_order_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoice_items_sort_order_idx ON public.invoice_items USING btree (sort_order);


--
-- Name: invoices_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_client_id_idx ON public.invoices USING btree (client_id);


--
-- Name: invoices_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_created_at_idx ON public.invoices USING btree (created_at);


--
-- Name: invoices_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_deleted_at_idx ON public.invoices USING btree (deleted_at);


--
-- Name: invoices_due_date_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_due_date_idx ON public.invoices USING btree (due_date);


--
-- Name: invoices_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_firm_id_idx ON public.invoices USING btree (firm_id);


--
-- Name: invoices_firm_id_number_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX invoices_firm_id_number_key ON public.invoices USING btree (firm_id, number) WHERE (deleted_at IS NULL);


--
-- Name: invoices_firm_id_status_due_date_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_firm_id_status_due_date_idx ON public.invoices USING btree (firm_id, status, due_date);


--
-- Name: invoices_number_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_number_idx ON public.invoices USING btree (number);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX notifications_firm_id_idx ON public.notifications USING btree (firm_id);


--
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: notifications_user_id_is_read_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX notifications_user_id_is_read_created_at_idx ON public.notifications USING btree (user_id, is_read, created_at);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at);


--
-- Name: payments_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_firm_id_idx ON public.payments USING btree (firm_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payments_paid_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_paid_at_idx ON public.payments USING btree (paid_at);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: payments_stripe_payment_intent_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX payments_stripe_payment_intent_id_idx ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: permissions_action_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX permissions_action_idx ON public.permissions USING btree (action);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: permissions_resource_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX permissions_resource_idx ON public.permissions USING btree (resource);


--
-- Name: plans_is_active_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX plans_is_active_idx ON public.plans USING btree (is_active);


--
-- Name: plans_slug_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX plans_slug_key ON public.plans USING btree (slug);


--
-- Name: plans_sort_order_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX plans_sort_order_idx ON public.plans USING btree (sort_order);


--
-- Name: portal_sessions_client_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX portal_sessions_client_user_id_idx ON public.portal_sessions USING btree (client_user_id);


--
-- Name: portal_sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX portal_sessions_expires_at_idx ON public.portal_sessions USING btree (expires_at);


--
-- Name: role_permissions_permission_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX role_permissions_permission_id_idx ON public.role_permissions USING btree (permission_id);


--
-- Name: role_permissions_role_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX role_permissions_role_id_idx ON public.role_permissions USING btree (role_id);


--
-- Name: role_permissions_role_id_permission_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: storage_usage_firm_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX storage_usage_firm_id_key ON public.storage_usage USING btree (firm_id);


--
-- Name: subscription_events_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscription_events_created_at_idx ON public.subscription_events USING btree (created_at);


--
-- Name: subscription_events_event_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscription_events_event_type_idx ON public.subscription_events USING btree (event_type);


--
-- Name: subscription_events_subscription_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscription_events_subscription_id_idx ON public.subscription_events USING btree (subscription_id);


--
-- Name: subscriptions_current_period_end_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscriptions_current_period_end_idx ON public.subscriptions USING btree (current_period_end);


--
-- Name: subscriptions_firm_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX subscriptions_firm_id_key ON public.subscriptions USING btree (firm_id);


--
-- Name: subscriptions_plan_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscriptions_plan_id_idx ON public.subscriptions USING btree (plan_id);


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscriptions_status_idx ON public.subscriptions USING btree (status);


--
-- Name: subscriptions_stripe_subscription_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX subscriptions_stripe_subscription_id_idx ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: task_assignments_assigned_by_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_assignments_assigned_by_idx ON public.task_assignments USING btree (assigned_by);


--
-- Name: task_assignments_task_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_assignments_task_id_idx ON public.task_assignments USING btree (task_id);


--
-- Name: task_assignments_task_id_user_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX task_assignments_task_id_user_id_key ON public.task_assignments USING btree (task_id, user_id);


--
-- Name: task_assignments_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_assignments_user_id_idx ON public.task_assignments USING btree (user_id);


--
-- Name: task_comments_created_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_comments_created_at_idx ON public.task_comments USING btree (created_at);


--
-- Name: task_comments_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_comments_deleted_at_idx ON public.task_comments USING btree (deleted_at);


--
-- Name: task_comments_task_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_comments_task_id_idx ON public.task_comments USING btree (task_id);


--
-- Name: task_comments_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX task_comments_user_id_idx ON public.task_comments USING btree (user_id);


--
-- Name: tasks_client_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_client_id_idx ON public.tasks USING btree (client_id);


--
-- Name: tasks_created_by_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_created_by_idx ON public.tasks USING btree (created_by);


--
-- Name: tasks_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_deleted_at_idx ON public.tasks USING btree (deleted_at);


--
-- Name: tasks_due_date_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_due_date_idx ON public.tasks USING btree (due_date);


--
-- Name: tasks_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_firm_id_idx ON public.tasks USING btree (firm_id);


--
-- Name: tasks_firm_id_status_due_date_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_firm_id_status_due_date_idx ON public.tasks USING btree (firm_id, status, due_date);


--
-- Name: tasks_priority_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_priority_idx ON public.tasks USING btree (priority);


--
-- Name: tasks_search_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_search_idx ON public.tasks USING gin (search_vector);


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: user_roles_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX user_roles_firm_id_idx ON public.user_roles USING btree (firm_id);


--
-- Name: user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX user_roles_role_id_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: user_roles_user_id_role_id_firm_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_firm_id_key ON public.user_roles USING btree (user_id, role_id, firm_id);


--
-- Name: user_settings_user_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX users_deleted_at_idx ON public.users USING btree (deleted_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_firm_id_email_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX users_firm_id_email_key ON public.users USING btree (firm_id, email) WHERE (deleted_at IS NULL);


--
-- Name: users_firm_id_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX users_firm_id_idx ON public.users USING btree (firm_id);


--
-- Name: webhook_events_event_id_key; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE UNIQUE INDEX webhook_events_event_id_key ON public.webhook_events USING btree (event_id);


--
-- Name: webhook_events_payload_gin; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX webhook_events_payload_gin ON public.webhook_events USING gin (payload);


--
-- Name: webhook_events_received_at_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX webhook_events_received_at_idx ON public.webhook_events USING btree (received_at);


--
-- Name: webhook_events_status_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX webhook_events_status_idx ON public.webhook_events USING btree (status);


--
-- Name: webhook_events_type_idx; Type: INDEX; Schema: public; Owner: taxmic_user
--

CREATE INDEX webhook_events_type_idx ON public.webhook_events USING btree (type);


--
-- Name: clients clients_search_vector_update; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER clients_search_vector_update BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_clients_search_vector();


--
-- Name: contacts contacts_search_vector_update; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER contacts_search_vector_update BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_contacts_search_vector();


--
-- Name: documents documents_search_vector_update; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER documents_search_vector_update BEFORE INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_documents_search_vector();


--
-- Name: documents documents_storage_usage_update; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER documents_storage_usage_update AFTER INSERT OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();


--
-- Name: client_addresses set_client_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_client_addresses_updated_at BEFORE UPDATE ON public.client_addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: client_users set_client_users_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_client_users_updated_at BEFORE UPDATE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: clients set_clients_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contacts set_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: document_permissions set_document_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_document_permissions_updated_at BEFORE UPDATE ON public.document_permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents set_documents_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: feature_flags set_feature_flags_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: firm_settings set_firm_settings_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_firm_settings_updated_at BEFORE UPDATE ON public.firm_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: firms set_firms_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_firms_updated_at BEFORE UPDATE ON public.firms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: folders set_folders_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_items set_invoice_items_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoice_sequences set_invoice_sequences_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_invoice_sequences_updated_at BEFORE UPDATE ON public.invoice_sequences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: invoices set_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: payments set_payments_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: plans set_plans_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: storage_usage set_storage_usage_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_storage_usage_updated_at BEFORE UPDATE ON public.storage_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subscriptions set_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: task_comments set_task_comments_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tasks set_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_settings set_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tasks tasks_search_vector_update; Type: TRIGGER; Schema: public; Owner: taxmic_user
--

CREATE TRIGGER tasks_search_vector_update BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_tasks_search_vector();


--
-- Name: activity_events activity_events_actor_client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_actor_client_user_id_fkey FOREIGN KEY (actor_client_user_id) REFERENCES public.client_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_events activity_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_events activity_events_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_events activity_events_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_addresses client_addresses_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_addresses
    ADD CONSTRAINT client_addresses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_addresses client_addresses_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_addresses
    ADD CONSTRAINT client_addresses_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_contacts client_contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_contacts
    ADD CONSTRAINT client_contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_contacts client_contacts_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_contacts
    ADD CONSTRAINT client_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_contacts client_contacts_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_contacts
    ADD CONSTRAINT client_contacts_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_users client_users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.client_users
    ADD CONSTRAINT client_users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: clients clients_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contacts contacts_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_permissions document_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_versions document_versions_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_events email_events_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: failed_jobs failed_jobs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: firm_feature_flags firm_feature_flags_enabled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_feature_flags
    ADD CONSTRAINT firm_feature_flags_enabled_by_fkey FOREIGN KEY (enabled_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: firm_feature_flags firm_feature_flags_feature_flag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_feature_flags
    ADD CONSTRAINT firm_feature_flags_feature_flag_id_fkey FOREIGN KEY (feature_flag_id) REFERENCES public.feature_flags(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: firm_feature_flags firm_feature_flags_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_feature_flags
    ADD CONSTRAINT firm_feature_flags_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: firm_settings firm_settings_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.firm_settings
    ADD CONSTRAINT firm_settings_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: folders folders_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_sequences invoice_sequences_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoice_sequences
    ADD CONSTRAINT invoice_sequences_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: portal_sessions portal_sessions_client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.portal_sessions
    ADD CONSTRAINT portal_sessions_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES public.client_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: storage_usage storage_usage_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.storage_usage
    ADD CONSTRAINT storage_usage_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_assignments task_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taxmic_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activity_events; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_events activity_events_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY activity_events_isolation ON public.activity_events USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: client_addresses; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: client_addresses client_addresses_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY client_addresses_isolation ON public.client_addresses USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: client_contacts; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: client_contacts client_contacts_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY client_contacts_isolation ON public.client_contacts USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: client_users; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

--
-- Name: client_users client_users_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY client_users_isolation ON public.client_users USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: clients clients_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY clients_isolation ON public.clients USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts contacts_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY contacts_isolation ON public.contacts USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: document_permissions; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: document_permissions document_permissions_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY document_permissions_isolation ON public.document_permissions USING ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: document_versions; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: document_versions document_versions_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY document_versions_isolation ON public.document_versions USING ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: documents documents_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY documents_isolation ON public.documents USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: email_events; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

--
-- Name: email_events email_events_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY email_events_isolation ON public.email_events USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: firm_feature_flags; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.firm_feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: firm_feature_flags firm_flags_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY firm_flags_isolation ON public.firm_feature_flags USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: firm_settings; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.firm_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: firm_settings firm_settings_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY firm_settings_isolation ON public.firm_settings USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: folders; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

--
-- Name: folders folders_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY folders_isolation ON public.folders USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items invoice_items_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY invoice_items_isolation ON public.invoice_items USING ((invoice_id IN ( SELECT invoices.id
   FROM public.invoices
  WHERE (invoices.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: invoice_sequences invoice_seq_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY invoice_seq_isolation ON public.invoice_sequences USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: invoice_sequences; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY invoices_isolation ON public.invoices USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY notifications_isolation ON public.notifications USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY payments_isolation ON public.payments USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: portal_sessions; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: portal_sessions portal_sessions_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY portal_sessions_isolation ON public.portal_sessions USING ((client_user_id IN ( SELECT cu.id
   FROM (public.client_users cu
     JOIN public.clients c ON ((c.id = cu.client_id)))
  WHERE (c.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: storage_usage; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: storage_usage storage_usage_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY storage_usage_isolation ON public.storage_usage USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions subscriptions_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY subscriptions_isolation ON public.subscriptions USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: task_assignments; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: task_assignments task_assignments_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY task_assignments_isolation ON public.task_assignments USING ((task_id IN ( SELECT tasks.id
   FROM public.tasks
  WHERE (tasks.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: task_comments; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: task_comments task_comments_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY task_comments_isolation ON public.task_comments USING ((task_id IN ( SELECT tasks.id
   FROM public.tasks
  WHERE (tasks.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY tasks_isolation ON public.tasks USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY user_roles_isolation ON public.user_roles USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings user_settings_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY user_settings_isolation ON public.user_settings USING ((user_id IN ( SELECT users.id
   FROM public.users
  WHERE (users.firm_id = (current_setting('app.current_firm_id'::text, true))::uuid))));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: taxmic_user
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_isolation; Type: POLICY; Schema: public; Owner: taxmic_user
--

CREATE POLICY users_isolation ON public.users USING ((firm_id = (current_setting('app.current_firm_id'::text, true))::uuid));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: taxmic_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict I5qhLX8TThbYf1MmyooM3fjJNMNB2ntckMDNqy2PbIeNIGMOwwLzuyHAnaLdIBG

