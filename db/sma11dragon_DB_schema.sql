--
-- PostgreSQL database dump
--

\restrict GKSuLkLlaAzFt8d6jMD75obWyNc5auHPP1uAuV00NyHBjYpn7dyKHTPl9wwGw56

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-24 07:52:41 UTC

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16817)
-- Name: expense_tracker_pending; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.expense_tracker_pending (
    chat_id bigint NOT NULL,
    date text,
    "time" text,
    amount text,
    tax text,
    vendor text,
    currency text,
    category text,
    location text,
    payment_method text,
    submission_datetime text,
    comment text,
    needs_review boolean DEFAULT false,
    review_fields text,
    current_fix_index integer DEFAULT 0,
    conversation_state text DEFAULT 'awaiting_action'::text,
    parsed_by text,
    parsing_time numeric(6,2),
    provider_tier text,
    confidence_score integer,
    receipt_image_url text,
    drive_file_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id integer
);


ALTER TABLE public.expense_tracker_pending OWNER TO root;

--
-- TOC entry 227 (class 1259 OID 16937)
-- Name: expense_tracker_pending_backup; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.expense_tracker_pending_backup (
    id integer,
    chat_id bigint,
    date text,
    "time" text,
    amount text,
    tax text,
    vendor text,
    currency text,
    category text,
    location text,
    payment_method text,
    submission_datetime text,
    comment text,
    needs_review boolean,
    review_fields text,
    current_fix_index integer,
    conversation_state text,
    parsed_by text,
    parsing_time numeric(6,2),
    provider_tier text,
    confidence_score integer,
    receipt_image_url text,
    drive_file_id text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.expense_tracker_pending_backup OWNER TO root;

--
-- TOC entry 226 (class 1259 OID 16901)
-- Name: expenses; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.expenses (
    id integer CONSTRAINT expenses_new_id_not_null NOT NULL,
    chat_id bigint CONSTRAINT expenses_new_chat_id_not_null NOT NULL,
    expense_date date CONSTRAINT expenses_new_expense_date_not_null NOT NULL,
    expense_time time without time zone,
    submitted_at timestamp without time zone DEFAULT now(),
    vendor text CONSTRAINT expenses_new_vendor_not_null NOT NULL,
    amount_original numeric(10,2) CONSTRAINT expenses_new_amount_original_not_null NOT NULL,
    currency text CONSTRAINT expenses_new_currency_not_null NOT NULL,
    amount_sgd numeric(10,2),
    exchange_rate numeric(10,6),
    category text,
    location text,
    payment_method text,
    comment text,
    parsed_by text,
    parsing_time numeric(10,2),
    provider_tier text,
    confidence_score integer,
    receipt_image_url text,
    drive_file_id text,
    needs_review boolean DEFAULT false,
    review_fields text,
    current_fix_index integer DEFAULT 0,
    conversation_state text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    user_id integer,
    bot_id integer
);


ALTER TABLE public.expenses OWNER TO root;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN expenses.expense_date; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.expenses.expense_date IS 'Date from receipt (YYYY-MM-DD)';


--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN expenses.expense_time; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.expenses.expense_time IS 'Time from receipt (HH:MM:SS), NULL if unavailable';


--
-- TOC entry 223 (class 1259 OID 16866)
-- Name: expenses_backup; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.expenses_backup (
    id integer,
    chat_id bigint,
    expense_date date,
    submitted_at timestamp without time zone,
    vendor text,
    amount_original numeric(10,2),
    currency text,
    amount_sgd numeric(10,2),
    exchange_rate numeric(10,6),
    category text,
    location text,
    payment_method text,
    comment text,
    parsed_by text,
    parsing_time numeric(6,2),
    provider_tier text,
    confidence_score integer,
    receipt_image_url text,
    drive_file_id text,
    needs_review boolean,
    review_fields text,
    current_fix_index integer,
    conversation_state text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.expenses_backup OWNER TO root;

--
-- TOC entry 224 (class 1259 OID 16895)
-- Name: expenses_backup1; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.expenses_backup1 (
    id integer,
    chat_id bigint,
    submitted_at timestamp without time zone,
    vendor text,
    amount_original numeric(10,2),
    currency text,
    amount_sgd numeric(10,2),
    exchange_rate numeric(10,6),
    category text,
    location text,
    payment_method text,
    comment text,
    parsed_by text,
    parsing_time numeric(6,2),
    provider_tier text,
    confidence_score integer,
    receipt_image_url text,
    drive_file_id text,
    needs_review boolean,
    review_fields text,
    current_fix_index integer,
    conversation_state text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    expense_date date,
    expense_time time without time zone
);


ALTER TABLE public.expenses_backup1 OWNER TO root;

--
-- TOC entry 225 (class 1259 OID 16900)
-- Name: expenses_new_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.expenses_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_new_id_seq OWNER TO root;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 225
-- Name: expenses_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.expenses_new_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 221 (class 1259 OID 16648)
-- Name: n8n_chat_histories; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.n8n_chat_histories (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    message jsonb NOT NULL
);


ALTER TABLE public.n8n_chat_histories OWNER TO root;

--
-- TOC entry 220 (class 1259 OID 16647)
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.n8n_chat_histories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNER TO root;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 220
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNED BY public.n8n_chat_histories.id;


--
-- TOC entry 233 (class 1259 OID 17018)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer,
    otp character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_resets OWNER TO root;

--
-- TOC entry 232 (class 1259 OID 17017)
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO root;

--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 232
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- TOC entry 235 (class 1259 OID 17051)
-- Name: user_telegram_bots; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_telegram_bots (
    id integer NOT NULL,
    user_id integer,
    bot_token text NOT NULL,
    bot_username text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_telegram_bots OWNER TO root;

--
-- TOC entry 234 (class 1259 OID 17050)
-- Name: user_telegram_bots_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_telegram_bots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_telegram_bots_id_seq OWNER TO root;

--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 234
-- Name: user_telegram_bots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_telegram_bots_id_seq OWNED BY public.user_telegram_bots.id;


--
-- TOC entry 229 (class 1259 OID 16977)
-- Name: users; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    location character varying(100),
    telegram_chat_id bigint,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    telegram_bot_username character varying(100),
    telegram_bot_token character varying(100),
    telegram_user_id bigint
);


ALTER TABLE public.users OWNER TO root;

--
-- TOC entry 228 (class 1259 OID 16976)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO root;

--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 231 (class 1259 OID 16998)
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(64) NOT NULL,
    type character varying(20) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    telegram_user_id bigint,
    telegram_username character varying(255),
    verified_at timestamp without time zone
);


ALTER TABLE public.verification_tokens OWNER TO root;

--
-- TOC entry 230 (class 1259 OID 16997)
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_tokens_id_seq OWNER TO root;

--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 230
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- TOC entry 3340 (class 2604 OID 16904)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_new_id_seq'::regclass);


--
-- TOC entry 3333 (class 2604 OID 16651)
-- Name: n8n_chat_histories id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.n8n_chat_histories ALTER COLUMN id SET DEFAULT nextval('public.n8n_chat_histories_id_seq'::regclass);


--
-- TOC entry 3351 (class 2604 OID 17021)
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- TOC entry 3354 (class 2604 OID 17054)
-- Name: user_telegram_bots id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_telegram_bots ALTER COLUMN id SET DEFAULT nextval('public.user_telegram_bots_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 16980)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3349 (class 2604 OID 17001)
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- TOC entry 3360 (class 2606 OID 16965)
-- Name: expense_tracker_pending expense_tracker_pending_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expense_tracker_pending
    ADD CONSTRAINT expense_tracker_pending_pkey PRIMARY KEY (id);


--
-- TOC entry 3366 (class 2606 OID 16919)
-- Name: expenses expenses_new_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_new_pkey PRIMARY KEY (id);


--
-- TOC entry 3358 (class 2606 OID 16658)
-- Name: n8n_chat_histories n8n_chat_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.n8n_chat_histories
    ADD CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id);


--
-- TOC entry 3388 (class 2606 OID 17028)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 17064)
-- Name: user_telegram_bots user_telegram_bots_bot_token_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_telegram_bots
    ADD CONSTRAINT user_telegram_bots_bot_token_key UNIQUE (bot_token);


--
-- TOC entry 3392 (class 2606 OID 17062)
-- Name: user_telegram_bots user_telegram_bots_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_telegram_bots
    ADD CONSTRAINT user_telegram_bots_pkey PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 16994)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3378 (class 2606 OID 16990)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 16996)
-- Name: users users_telegram_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telegram_chat_id_key UNIQUE (telegram_chat_id);


--
-- TOC entry 3382 (class 2606 OID 16992)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3384 (class 2606 OID 17008)
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3386 (class 2606 OID 17010)
-- Name: verification_tokens verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_key UNIQUE (token);


--
-- TOC entry 3361 (class 1259 OID 17049)
-- Name: idx_expense_tracker_pending_user_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expense_tracker_pending_user_id ON public.expense_tracker_pending USING btree (user_id);


--
-- TOC entry 3367 (class 1259 OID 16924)
-- Name: idx_expenses_chat_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_chat_id ON public.expenses USING btree (chat_id);


--
-- TOC entry 3368 (class 1259 OID 16921)
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- TOC entry 3369 (class 1259 OID 16923)
-- Name: idx_expenses_date_time; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_date_time ON public.expenses USING btree (expense_date, expense_time);


--
-- TOC entry 3370 (class 1259 OID 16922)
-- Name: idx_expenses_time; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_time ON public.expenses USING btree (expense_time);


--
-- TOC entry 3371 (class 1259 OID 17041)
-- Name: idx_expenses_user_category; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_user_category ON public.expenses USING btree (user_id, category);


--
-- TOC entry 3372 (class 1259 OID 17040)
-- Name: idx_expenses_user_date; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_user_date ON public.expenses USING btree (user_id, expense_date DESC);


--
-- TOC entry 3373 (class 1259 OID 17039)
-- Name: idx_expenses_user_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_expenses_user_id ON public.expenses USING btree (user_id);


--
-- TOC entry 3362 (class 1259 OID 16832)
-- Name: idx_pending_chat_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_pending_chat_id ON public.expense_tracker_pending USING btree (chat_id);


--
-- TOC entry 3363 (class 1259 OID 16833)
-- Name: idx_pending_conversation_state; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_pending_conversation_state ON public.expense_tracker_pending USING btree (chat_id, conversation_state) WHERE (conversation_state <> 'completed'::text);


--
-- TOC entry 3364 (class 1259 OID 16834)
-- Name: idx_pending_needs_review; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_pending_needs_review ON public.expense_tracker_pending USING btree (chat_id, needs_review) WHERE (needs_review = true);


--
-- TOC entry 3374 (class 1259 OID 17043)
-- Name: idx_users_telegram_user_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_users_telegram_user_id ON public.users USING btree (telegram_user_id);


--
-- TOC entry 3399 (class 2620 OID 16920)
-- Name: expenses trigger_update_amount_sgd; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trigger_update_amount_sgd BEFORE INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_amount_sgd();


--
-- TOC entry 3393 (class 2606 OID 17044)
-- Name: expense_tracker_pending expense_tracker_pending_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expense_tracker_pending
    ADD CONSTRAINT expense_tracker_pending_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3394 (class 2606 OID 17070)
-- Name: expenses expenses_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.user_telegram_bots(id);


--
-- TOC entry 3395 (class 2606 OID 17034)
-- Name: expenses fk_expenses_user_id; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3397 (class 2606 OID 17029)
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3398 (class 2606 OID 17065)
-- Name: user_telegram_bots user_telegram_bots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_telegram_bots
    ADD CONSTRAINT user_telegram_bots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3396 (class 2606 OID 17011)
-- Name: verification_tokens verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2026-01-24 07:52:43 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict GKSuLkLlaAzFt8d6jMD75obWyNc5auHPP1uAuV00NyHBjYpn7dyKHTPl9wwGw56

