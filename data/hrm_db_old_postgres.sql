--
-- PostgreSQL database dump
--

\restrict gOTtS4YJpeBWBksgPjhaPkich79p0bxcN0qL7Yrbis0f4fEeh5yGnAEcedRjFhB

-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_users; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.app_users (
    id character varying(50) NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(150),
    full_name character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id character varying(50),
    employee_id character varying(50),
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.app_users OWNER TO hrm_user;

--
-- Name: attendance_monthly_summary; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_monthly_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    period_id character varying(20) NOT NULL,
    scheduled_days numeric(5,2) DEFAULT 24.00 NOT NULL,
    present_days numeric(5,2) DEFAULT 24.00 NOT NULL,
    absent_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    unpaid_leave_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    paid_leave_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    annual_leave_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    sick_leave_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    public_holiday_days numeric(5,2) DEFAULT 0.00 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance_monthly_summary OWNER TO hrm_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(50),
    username character varying(100),
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    old_values jsonb,
    new_values jsonb,
    reason text,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO hrm_user;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.departments (
    id character varying(50) NOT NULL,
    name_km character varying(150) NOT NULL,
    name_en character varying(150) NOT NULL,
    description text,
    manager_id character varying(50),
    budget numeric(12,2) DEFAULT 0,
    color character varying(20) DEFAULT '#3b82f6'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO hrm_user;

--
-- Name: employee_bank_accounts; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employee_bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    bank_name character varying(100) DEFAULT 'ABA Bank'::character varying NOT NULL,
    bank_account_name character varying(150) NOT NULL,
    bank_account character varying(100) NOT NULL,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_bank_accounts OWNER TO hrm_user;

--
-- Name: employee_salary_components; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employee_salary_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    component_id character varying(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_salary_components OWNER TO hrm_user;

--
-- Name: employee_tax_profiles; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employee_tax_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    spouse integer DEFAULT 0 NOT NULL,
    minor_children integer DEFAULT 0 NOT NULL,
    is_resident boolean DEFAULT true NOT NULL,
    nssf_id character varying(50),
    tax_tin character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_tax_profiles OWNER TO hrm_user;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employees (
    id character varying(50) NOT NULL,
    khmer_name character varying(150) NOT NULL,
    english_name character varying(150) NOT NULL,
    dob date,
    khmer_id character varying(50),
    sex character varying(20) DEFAULT 'Female'::character varying NOT NULL,
    nationality character varying(50) DEFAULT 'Cambodian'::character varying NOT NULL,
    join_date date NOT NULL,
    contract_type character varying(20) DEFAULT 'UDC'::character varying NOT NULL,
    contract_start date,
    contract_end date,
    department_id character varying(50),
    position_id character varying(50),
    basic_salary numeric(12,2) DEFAULT 208.00 NOT NULL,
    sewing_skill_matrix_id character varying(50),
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    email character varying(150),
    phone character varying(50),
    avatar character varying(255),
    photo_url character varying(255),
    current_address text,
    province_city character varying(100) DEFAULT 'Phnom Penh'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(50),
    updated_by character varying(50)
);


ALTER TABLE public.employees OWNER TO hrm_user;

--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    period_key character varying(10) NOT NULL,
    rate_khr_usd numeric(10,2) DEFAULT 4100.00 NOT NULL,
    effective_date date NOT NULL,
    source character varying(100) DEFAULT 'National Bank of Cambodia / GDT'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.exchange_rates OWNER TO hrm_user;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: hrm_user
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_rates_id_seq OWNER TO hrm_user;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrm_user
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- Name: monthly_payroll; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.monthly_payroll (
    id character varying(50) NOT NULL,
    period_id character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    total_employees integer DEFAULT 0,
    total_gross_salary_usd numeric(14,2) DEFAULT 0,
    total_tax_usd numeric(14,2) DEFAULT 0,
    total_pension_employee_usd numeric(14,2) DEFAULT 0,
    total_pension_employer_usd numeric(14,2) DEFAULT 0,
    total_net_salary_usd numeric(14,2) DEFAULT 0,
    total_first_paid_usd numeric(14,2) DEFAULT 0,
    total_second_paid_usd numeric(14,2) DEFAULT 0,
    total_paid_usd numeric(14,2) DEFAULT 0,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.monthly_payroll OWNER TO hrm_user;

--
-- Name: monthly_payroll_items; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.monthly_payroll_items (
    id character varying(100) NOT NULL,
    payroll_id character varying(50) NOT NULL,
    period_id character varying(20) NOT NULL,
    employee_id character varying(50) NOT NULL,
    khmer_name character varying(150) NOT NULL,
    english_name character varying(150) NOT NULL,
    join_date date NOT NULL,
    working_period character varying(50) NOT NULL,
    working_period_months integer DEFAULT 0 NOT NULL,
    contract_type character varying(20) NOT NULL,
    bank_name character varying(100) NOT NULL,
    bank_account_name character varying(150) NOT NULL,
    bank_account character varying(100) NOT NULL,
    dob date,
    khmer_id character varying(50),
    sex character varying(20) NOT NULL,
    nationality character varying(50) NOT NULL,
    "position" character varying(150) NOT NULL,
    basic_salary numeric(12,2) NOT NULL,
    working_days numeric(5,2) DEFAULT 24.00 NOT NULL,
    absent numeric(5,2) DEFAULT 0.00 NOT NULL,
    unpaid_day numeric(5,2) DEFAULT 0.00 NOT NULL,
    basic_working_salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    seniority_bonus numeric(12,2) DEFAULT 0.00 NOT NULL,
    position_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    sewing_skill_matrix character varying(100) DEFAULT 'Standard'::character varying,
    skill_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    transport_housing numeric(12,2) DEFAULT 0.00 NOT NULL,
    attendance_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    food_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    overtime_pay numeric(12,2) DEFAULT 0.00 NOT NULL,
    overtime_food_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    achievement_bonus numeric(12,2) DEFAULT 0.00 NOT NULL,
    monthly_evaluation_bonus numeric(12,2) DEFAULT 0.00 NOT NULL,
    annual_leave numeric(12,2) DEFAULT 0.00 NOT NULL,
    with_tax_on_seniority numeric(12,2) DEFAULT 0.00 NOT NULL,
    salary_adjustment numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_salary_exclude_non_taxable numeric(12,2) DEFAULT 0.00 NOT NULL,
    pension_fund numeric(12,2) DEFAULT 0.00 NOT NULL,
    pension_fund_khr numeric(14,2) DEFAULT 0.00 NOT NULL,
    pension_employer_usd numeric(12,2) DEFAULT 0.00 NOT NULL,
    taxable_salary_usd numeric(12,2) DEFAULT 0.00 NOT NULL,
    taxable_salary_khmer numeric(14,2) DEFAULT 0.00 NOT NULL,
    spouse integer DEFAULT 0 NOT NULL,
    minor_children integer DEFAULT 0 NOT NULL,
    deduct_amount numeric(14,2) DEFAULT 0.00 NOT NULL,
    taxable_salary_base numeric(14,2) DEFAULT 0.00 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    tax_on_salary_khr numeric(14,2) DEFAULT 0.00 NOT NULL,
    tax_on_salary_usd numeric(12,2) DEFAULT 0.00 NOT NULL,
    after_tax_salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    paid_cash_adjustment numeric(12,2) DEFAULT 0.00 NOT NULL,
    first_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    paid_daily_target_bonus numeric(12,2) DEFAULT 0.00 NOT NULL,
    paid_food_fee numeric(12,2) DEFAULT 0.00 NOT NULL,
    severance_pay_5pct numeric(12,2) DEFAULT 0.00 NOT NULL,
    seniority_payback_severance numeric(12,2) DEFAULT 0.00 NOT NULL,
    paid_final_salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    second_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    status character varying(30) DEFAULT 'CALCULATED'::character varying NOT NULL,
    exchange_rate_used numeric(10,2) DEFAULT 4100.00 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.monthly_payroll_items OWNER TO hrm_user;

--
-- Name: overtime_records; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.overtime_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    period_id character varying(20) NOT NULL,
    date date NOT NULL,
    ot_type character varying(30) DEFAULT 'NORMAL'::character varying NOT NULL,
    hours numeric(5,2) NOT NULL,
    rate_multiplier numeric(4,2) DEFAULT 1.50 NOT NULL,
    hourly_rate numeric(10,4) NOT NULL,
    calculated_amount numeric(10,2) NOT NULL,
    food_allowance_eligible boolean DEFAULT false,
    food_allowance_amount numeric(10,2) DEFAULT 0.00,
    status character varying(30) DEFAULT 'APPROVED'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.overtime_records OWNER TO hrm_user;

--
-- Name: payroll_calculation_traces; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.payroll_calculation_traces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payroll_item_id character varying(100) NOT NULL,
    steps_json jsonb NOT NULL,
    summary_markdown text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_calculation_traces OWNER TO hrm_user;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.payroll_periods (
    id character varying(20) NOT NULL,
    period_code character varying(20) NOT NULL,
    name_km character varying(100) NOT NULL,
    name_en character varying(100) NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    standard_working_days integer DEFAULT 24 NOT NULL,
    exchange_rate_khr numeric(10,2) DEFAULT 4100.00 NOT NULL,
    first_payment_date date,
    second_payment_date date,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by character varying(50),
    approved_at timestamp with time zone,
    closed_at timestamp with time zone
);


ALTER TABLE public.payroll_periods OWNER TO hrm_user;

--
-- Name: pension_rules; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.pension_rules (
    id integer NOT NULL,
    scheme_name character varying(100) DEFAULT 'NSSF Pension Phase 1'::character varying NOT NULL,
    employee_rate numeric(5,4) DEFAULT 0.02 NOT NULL,
    employer_rate numeric(5,4) DEFAULT 0.02 NOT NULL,
    min_contributory_wage_khr numeric(14,2) DEFAULT 400000.00 NOT NULL,
    max_contributory_wage_khr numeric(14,2) DEFAULT 1200000.00 NOT NULL,
    effective_from date DEFAULT '2022-10-01'::date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pension_rules OWNER TO hrm_user;

--
-- Name: pension_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: hrm_user
--

CREATE SEQUENCE public.pension_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pension_rules_id_seq OWNER TO hrm_user;

--
-- Name: pension_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrm_user
--

ALTER SEQUENCE public.pension_rules_id_seq OWNED BY public.pension_rules.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.permissions (
    id character varying(50) NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO hrm_user;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.positions (
    id character varying(50) NOT NULL,
    title_km character varying(150) NOT NULL,
    title_en character varying(150) NOT NULL,
    department_id character varying(50),
    standard_allowance numeric(10,2) DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.positions OWNER TO hrm_user;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.role_permissions (
    role_id character varying(50) NOT NULL,
    permission_id character varying(50) NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO hrm_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.roles (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO hrm_user;

--
-- Name: salary_components; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.salary_components (
    id character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    name_km character varying(150) NOT NULL,
    name_en character varying(150) NOT NULL,
    component_type character varying(30) NOT NULL,
    calculation_method character varying(30) NOT NULL,
    default_amount numeric(10,2) DEFAULT 0,
    is_taxable boolean DEFAULT true,
    is_pensionable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.salary_components OWNER TO hrm_user;

--
-- Name: salary_payments; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.salary_payments (
    id character varying(100) NOT NULL,
    payroll_item_id character varying(100) NOT NULL,
    employee_id character varying(50) NOT NULL,
    payment_type character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    payment_date date NOT NULL,
    payment_method character varying(50) DEFAULT 'Bank Transfer'::character varying NOT NULL,
    bank_name character varying(100),
    bank_account character varying(100),
    reference_number character varying(100),
    status character varying(30) DEFAULT 'Approved'::character varying NOT NULL,
    notes text,
    created_by character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.salary_payments OWNER TO hrm_user;

--
-- Name: severance_records; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.severance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    contract_type character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    cumulative_wages numeric(14,2) DEFAULT 0 NOT NULL,
    severance_percentage numeric(5,2) DEFAULT 5.00 NOT NULL,
    severance_amount numeric(12,2) NOT NULL,
    seniority_payback_days numeric(5,2) DEFAULT 0,
    seniority_payback_amount numeric(12,2) DEFAULT 0,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.severance_records OWNER TO hrm_user;

--
-- Name: skill_matrix; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.skill_matrix (
    id character varying(50) NOT NULL,
    skill_code character varying(30) NOT NULL,
    category character varying(50) NOT NULL,
    grade_level character varying(20) NOT NULL,
    title_km character varying(150) NOT NULL,
    title_en character varying(150) NOT NULL,
    monthly_allowance numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.skill_matrix OWNER TO hrm_user;

--
-- Name: tax_rules; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.tax_rules (
    id integer NOT NULL,
    rule_set_name character varying(100) DEFAULT 'Cambodia GDT 2026 Progressive ToS'::character varying NOT NULL,
    min_salary_khr numeric(14,2) NOT NULL,
    max_salary_khr numeric(14,2),
    tax_rate numeric(5,2) NOT NULL,
    deduction_khr numeric(14,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'KHR'::character varying NOT NULL,
    applicable_type character varying(30) DEFAULT 'Resident'::character varying NOT NULL,
    effective_from date DEFAULT '2023-01-01'::date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tax_rules OWNER TO hrm_user;

--
-- Name: tax_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: hrm_user
--

CREATE SEQUENCE public.tax_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_rules_id_seq OWNER TO hrm_user;

--
-- Name: tax_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrm_user
--

ALTER SEQUENCE public.tax_rules_id_seq OWNED BY public.tax_rules.id;


--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- Name: pension_rules id; Type: DEFAULT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.pension_rules ALTER COLUMN id SET DEFAULT nextval('public.pension_rules_id_seq'::regclass);


--
-- Name: tax_rules id; Type: DEFAULT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.tax_rules ALTER COLUMN id SET DEFAULT nextval('public.tax_rules_id_seq'::regclass);


--
-- Data for Name: app_users; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.app_users (id, username, email, full_name, password_hash, role_id, employee_id, status, last_login, created_at, updated_at) FROM stdin;
USR_ADMIN	admin	admin@garment.kh	Chief Operating Officer	hestra123	ROLE_ADMIN	\N	Active	\N	2026-10-01 05:58:59.704557+00	2026-10-01 05:58:59.704557+00
USR_HR	hr_manager	hr@garment.kh	Keo Bopha (HR Director)	hestra123	ROLE_HR	\N	Active	\N	2026-10-01 05:58:59.704557+00	2026-10-01 05:58:59.704557+00
USR_PAYROLL	payroll	payroll@garment.kh	Seng Chanthon (Payroll Specialist)	hestra123	ROLE_PAYROLL	\N	Active	\N	2026-10-01 05:58:59.704557+00	2026-10-01 05:58:59.704557+00
USR_FINANCE	finance	finance@garment.kh	Pich Sambath (Finance Manager)	hestra123	ROLE_FINANCE	\N	Active	\N	2026-10-01 05:58:59.704557+00	2026-10-01 05:58:59.704557+00
USR_AUDITOR	auditor	auditor@garment.kh	GDT Compliance Auditor	hestra123	ROLE_AUDITOR	\N	Active	\N	2026-10-01 05:58:59.704557+00	2026-10-01 05:58:59.704557+00
\.


--
-- Data for Name: attendance_monthly_summary; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_monthly_summary (id, employee_id, period_id, scheduled_days, present_days, absent_days, unpaid_leave_days, paid_leave_days, annual_leave_days, sick_leave_days, public_holiday_days, notes, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.audit_logs (id, user_id, username, action, entity_type, entity_id, old_values, new_values, reason, ip_address, created_at) FROM stdin;
11c010e6-f5fb-4d69-8042-fd26098dd1bc	USR_ADMIN	USR_ADMIN	CALCULATE_PAYROLL	payroll_periods	2026-09	\N	{"total_net": 3576.140000000001, "total_gross": 3637, "total_employees": 10}	Batch payroll calculation completed for period 2026-09	\N	2026-10-01 06:01:14.187225+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.departments (id, name_km, name_en, description, manager_id, budget, color, created_at, updated_at) FROM stdin;
DEPT_SEW	ផ្នែកដេរ (Sewing Production)	Garment Sewing Production Lines	Garment sewing floor	\N	45000.00	#3b82f6	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
DEPT_CUT	ផ្នែកកាត់ (Cutting)	Fabric Inspection & Pattern Cutting	Fabric cutting area	\N	12000.00	#10b981	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
DEPT_QC	ផ្នែកត្រួតពិនិត្យគុណភាព (Quality Control)	In-line and End-of-line Quality Inspection	Quality assurance team	\N	9000.00	#f59e0b	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
DEPT_FIN	ផ្នែកអ៊ុត និងវេចខ្ចប់ (Finishing & Packing)	Ironing, Tagging, and Export Packaging	Packaging and export line	\N	8500.00	#8b5cf6	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
DEPT_MAINT	ផ្នែកថែទាំមេកានិច (Mechanic & Maintenance)	Sewing Machine Maintenance & Facilities	Machine technicians	\N	6000.00	#64748b	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
DEPT_HR	ផ្នែកធនធានមនុស្ស (Human Resources)	HR, Labor Compliance, and Payroll	HR & Compliance office	\N	5000.00	#ec4899	2026-10-01 05:59:14.557107+00	2026-10-01 05:59:14.557107+00
\.


--
-- Data for Name: employee_bank_accounts; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employee_bank_accounts (id, employee_id, bank_name, bank_account_name, bank_account, is_primary, created_at) FROM stdin;
572d9309-34d4-4da7-878c-a367e92eb550	EMP00001	ABA Bank	SUN SREYPOV	001 234 567	t	2026-10-01 05:59:14.565136+00
d85f4972-9c2f-44ce-9080-c81fcf129e29	EMP00002	Wing Bank	CHEA SOKHUM	088 123 4567	t	2026-10-01 05:59:14.565136+00
f12134bd-e601-48b9-857d-20583d020964	EMP00003	Canadia Bank	VAN VANNA	100 234 5678	t	2026-10-01 05:59:14.565136+00
5a55ff56-8d65-4fea-8a4d-0796dc6736c2	EMP00004	ABA Bank	MAO CHENDA	002 345 678	t	2026-10-01 05:59:14.565136+00
2b1afdd5-b149-4c37-a680-a93190ae776d	EMP00005	ACLEDA Bank	KONG SOPHEA	012 345 678901	t	2026-10-01 05:59:14.565136+00
90cf1c51-4cbe-45d0-b859-7d31a7b2a683	EMP00006	ABA Bank	HENG PISETH	003 456 789	t	2026-10-01 05:59:14.565136+00
e14bda29-6722-4c7e-9233-8249c9f1ef4b	EMP00007	Wing Bank	LY SREYMOM	098 765 4321	t	2026-10-01 05:59:14.565136+00
b56ae7c3-5e6d-4c46-9084-e46a08406ffc	EMP00008	ABA Bank	OUCH THEARA	004 567 890	t	2026-10-01 05:59:14.565136+00
4b5c7ffc-4708-4504-9770-6ca3eacaa83c	EMP00009	ABA Bank	SENG CHANTHON	005 678 901	t	2026-10-01 05:59:14.565136+00
007a96f1-0d4e-4098-9312-b4825bbdd440	EMP00010	Cash / Wing	NUON SREINEANG	CASH-PAY-010	t	2026-10-01 05:59:14.565136+00
\.


--
-- Data for Name: employee_salary_components; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employee_salary_components (id, employee_id, component_id, amount, is_active, effective_from, effective_to, created_at) FROM stdin;
\.


--
-- Data for Name: employee_tax_profiles; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employee_tax_profiles (id, employee_id, spouse, minor_children, is_resident, nssf_id, tax_tin, created_at, updated_at) FROM stdin;
7906994a-d753-45e3-9e6e-8a06a4f8bf2a	EMP00001	1	2	t	NSSF-019283	TIN-0928371	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
7b9d45fe-d482-4902-9e15-191616657ba8	EMP00002	0	1	t	NSSF-029384	TIN-0928372	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
d7b9ba34-5539-402c-a165-f4e02ad52ee5	EMP00003	1	3	t	NSSF-039485	TIN-0928373	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
75fe0447-053d-41b9-8d8a-a3dbdab517e5	EMP00004	0	0	t	NSSF-049586	TIN-0928374	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
a9144ec5-5cb9-4c2e-ab40-8dae554605ce	EMP00005	0	1	t	NSSF-059687	TIN-0928375	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
2b8c1d76-5608-4ecc-9300-bc7c3e7aaff4	EMP00006	1	2	t	NSSF-069788	TIN-0928376	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
2b37fbcc-fe71-4e1b-ba67-9afe0e598419	EMP00007	0	0	t	NSSF-079889	TIN-0928377	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
3e134957-7135-42ce-b057-85b0d4258a20	EMP00008	0	1	t	NSSF-089990	TIN-0928378	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
06351cba-ea12-4f39-a621-109dc556b009	EMP00009	1	2	t	NSSF-090091	TIN-0928379	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
b9770004-9fd6-42c6-af51-b6e32a041af5	EMP00010	0	0	t	NSSF-100192	TIN-0928380	2026-10-01 05:59:14.566341+00	2026-10-01 05:59:14.566341+00
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employees (id, khmer_name, english_name, dob, khmer_id, sex, nationality, join_date, contract_type, contract_start, contract_end, department_id, position_id, basic_salary, sewing_skill_matrix_id, status, email, phone, avatar, photo_url, current_address, province_city, created_at, updated_at, created_by, updated_by) FROM stdin;
EMP00001	ស៊ុន ស្រីពៅ	SUN Sreypov	1995-04-12	KHM-010293841	Female	Cambodian	2021-03-15	UDC	\N	\N	DEPT_SEW	POS_LINE_LEAD	285.00	SKILL_A_MULTI	Active	sreypov.sun@garment.kh	012 345 678	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00002	ជា សុខុម	CHEA Sokhum	1998-08-22	KHM-010384729	Female	Cambodian	2022-06-01	UDC	\N	\N	DEPT_SEW	POS_SEW_OP	220.00	SKILL_A_FLAT	Active	sokhum.chea@garment.kh	098 765 432	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00003	វ៉ាន់ វណ្ណា	VAN Vanna	1993-11-05	KHM-010472918	Male	Cambodian	2020-01-10	UDC	\N	\N	DEPT_CUT	POS_CUT_MST	320.00	\N	Active	vanna.van@garment.kh	089 123 456	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00004	ម៉ៅ ចិន្តា	MAO Chenda	2000-02-18	KHM-010582934	Female	Cambodian	2023-09-01	FDC	\N	\N	DEPT_SEW	POS_SEW_OP	210.00	SKILL_B_OVER	Active	chenda.mao@garment.kh	077 456 789	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00005	គង់ សុភា	KONG Sophea	1996-07-30	KHM-010693847	Female	Cambodian	2021-11-20	UDC	\N	\N	DEPT_QC	POS_QC_LEAD	260.00	\N	Active	sophea.kong@garment.kh	093 321 654	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00006	ហេង ពិសិដ្ឋ	HENG Piseth	1994-03-14	KHM-010782910	Male	Cambodian	2019-05-15	UDC	\N	\N	DEPT_MAINT	POS_MECH_TECH	310.00	\N	Active	piseth.heng@garment.kh	010 888 999	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00007	លី ស្រីមុំ	LY Sreymom	2001-10-09	KHM-010892019	Female	Cambodian	2024-02-01	FDC	\N	\N	DEPT_SEW	POS_SEW_OP	208.00	SKILL_B_POCK	Active	sreymom.ly@garment.kh	096 555 444	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00008	អ៊ុច ធារ៉ា	OUCH Theara	1997-12-25	KHM-010928374	Male	Cambodian	2022-08-15	UDC	\N	\N	DEPT_FIN	POS_IRON_OP	215.00	\N	Active	theara.ouch@garment.kh	088 777 666	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00009	សេង ចាន់ថន	SENG Chanthon	1992-06-17	KHM-010992834	Female	Cambodian	2018-02-10	UDC	\N	\N	DEPT_HR	POS_PAYROLL_OFF	450.00	\N	Active	chanthon.seng@garment.kh	017 333 222	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
EMP00010	នួន ស្រីនាង	NUON Sreineang	2002-05-03	KHM-010837261	Female	Cambodian	2024-04-10	FDC	\N	\N	DEPT_SEW	POS_SEW_OP	208.00	SKILL_C_STRG	Active	sreineang.nuon@garment.kh	097 222 111	\N	\N	\N	Phnom Penh	2026-10-01 05:59:14.56333+00	2026-10-01 05:59:14.56333+00	\N	\N
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.exchange_rates (id, period_key, rate_khr_usd, effective_date, source, created_at) FROM stdin;
1	2026-08	4095.00	2026-08-01	National Bank of Cambodia / GDT Official	2026-10-01 05:58:59.700181+00
2	2026-09	4100.00	2026-09-01	National Bank of Cambodia / GDT Official	2026-10-01 05:58:59.700181+00
3	2026-10	4105.00	2026-10-01	National Bank of Cambodia / GDT Official	2026-10-01 05:58:59.700181+00
\.


--
-- Data for Name: monthly_payroll; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.monthly_payroll (id, period_id, title, total_employees, total_gross_salary_usd, total_tax_usd, total_pension_employee_usd, total_pension_employer_usd, total_net_salary_usd, total_first_paid_usd, total_second_paid_usd, total_paid_usd, status, created_at, updated_at) FROM stdin;
PAYROLL-2026-09	2026-09	Payroll Run for September 2026	10	3637.00	3.18	57.68	57.68	3576.14	1343.00	2233.14	3576.14	CALCULATED	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
\.


--
-- Data for Name: monthly_payroll_items; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.monthly_payroll_items (id, payroll_id, period_id, employee_id, khmer_name, english_name, join_date, working_period, working_period_months, contract_type, bank_name, bank_account_name, bank_account, dob, khmer_id, sex, nationality, "position", basic_salary, working_days, absent, unpaid_day, basic_working_salary, seniority_bonus, position_allowance, sewing_skill_matrix, skill_allowance, transport_housing, attendance_allowance, food_allowance, overtime_pay, overtime_food_allowance, achievement_bonus, monthly_evaluation_bonus, annual_leave, with_tax_on_seniority, salary_adjustment, total_salary, total_salary_exclude_non_taxable, pension_fund, pension_fund_khr, pension_employer_usd, taxable_salary_usd, taxable_salary_khmer, spouse, minor_children, deduct_amount, taxable_salary_base, tax_rate, tax_on_salary_khr, tax_on_salary_usd, after_tax_salary, paid_cash_adjustment, first_paid, paid_daily_target_bonus, paid_food_fee, severance_pay_5pct, seniority_payback_severance, paid_final_salary, second_paid, total_paid, status, exchange_rate_used, created_at, updated_at) FROM stdin;
PAY-2026-09-EMP00001	PAYROLL-2026-09	2026-09	EMP00001	ស៊ុន ស្រីពៅ	SUN Sreypov	2021-03-15	5 Yrs 6 Mos	66	UDC	ABA Bank	SUN SREYPOV	001 234 567	1995-04-12	KHM-010293841	Female	Cambodian	Sewing Line Leader	285.00	24.00	0.00	0.00	285.00	6.00	35.00	Grade A - ជំនាញដេរម៉ាស៊ីនច្រើនប្រភេទ និងកអាវ (Multi-Machine / Collar Master)	30.00	7.00	10.00	25.00	0.00	0.00	20.00	10.00	0.00	0.00	0.00	428.00	415.00	5.85	24000.00	5.85	409.15	1677515.00	1	2	450000.00	1227515.00	0.00	0.00	0.00	422.15	0.00	142.50	0.00	0.00	0.00	0.00	0.00	279.65	422.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00002	PAYROLL-2026-09	2026-09	EMP00002	ជា សុខុម	CHEA Sokhum	2022-06-01	4 Yrs 3 Mos	51	UDC	Wing Bank	CHEA SOKHUM	088 123 4567	1998-08-22	KHM-010384729	Female	Cambodian	Sewing Operator	220.00	24.00	0.00	0.00	220.00	5.00	0.00	Grade A - ជំនាញម៉ាស៊ីនដេរ ៤ម្ជុល និងហ្វ្លេតឡុក (Flatlock 4-Needle Specialist)	25.00	7.00	10.00	25.00	0.00	0.00	20.00	10.00	0.00	0.00	0.00	322.00	310.00	5.85	24000.00	5.85	304.15	1247015.00	0	1	150000.00	1097015.00	0.00	0.00	0.00	316.15	0.00	110.00	0.00	0.00	0.00	0.00	0.00	206.15	316.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00003	PAYROLL-2026-09	2026-09	EMP00003	វ៉ាន់ វណ្ណា	VAN Vanna	2020-01-10	6 Yrs 8 Mos	80	UDC	Canadia Bank	VAN VANNA	100 234 5678	1993-11-05	KHM-010472918	Male	Cambodian	Cutting Master	320.00	24.00	0.00	0.00	320.00	7.00	40.00	Standard	0.00	7.00	10.00	25.00	0.00	0.00	0.00	10.00	0.00	0.00	0.00	419.00	405.00	5.85	24000.00	5.85	399.15	1636515.00	1	3	600000.00	1036515.00	0.00	0.00	0.00	413.15	0.00	160.00	0.00	0.00	0.00	0.00	0.00	253.15	413.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00004	PAYROLL-2026-09	2026-09	EMP00004	ម៉ៅ ចិន្តា	MAO Chenda	2023-09-01	3 Yrs 0 Mos	36	FDC	ABA Bank	MAO CHENDA	002 345 678	2000-02-18	KHM-010582934	Female	Cambodian	Sewing Operator	210.00	24.00	0.00	0.00	210.00	4.00	0.00	Grade B - ជំនាញម៉ាស៊ីនរត់ និងម៉ាស៊ីនកង (Lockstitch & Overlock Skilled)	15.00	7.00	10.00	25.00	0.00	0.00	20.00	10.00	0.00	0.00	0.00	301.00	294.00	5.85	24000.00	5.85	288.15	1181415.00	0	0	0.00	1181415.00	0.00	0.00	0.00	295.15	0.00	105.00	0.00	0.00	0.00	0.00	0.00	190.15	295.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00005	PAYROLL-2026-09	2026-09	EMP00005	គង់ សុភា	KONG Sophea	2021-11-20	4 Yrs 10 Mos	58	UDC	ACLEDA Bank	KONG SOPHEA	012 345 678901	1996-07-30	KHM-010693847	Female	Cambodian	QC Supervisor	260.00	24.00	0.00	0.00	260.00	5.00	30.00	Standard	0.00	7.00	10.00	25.00	0.00	0.00	0.00	10.00	0.00	0.00	0.00	347.00	335.00	5.85	24000.00	5.85	329.15	1349515.00	0	1	150000.00	1199515.00	0.00	0.00	0.00	341.15	0.00	130.00	0.00	0.00	0.00	0.00	0.00	211.15	341.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00006	PAYROLL-2026-09	2026-09	EMP00006	ហេង ពិសិដ្ឋ	HENG Piseth	2019-05-15	7 Yrs 4 Mos	88	UDC	ABA Bank	HENG PISETH	003 456 789	1994-03-14	KHM-010782910	Male	Cambodian	Sewing Technician	310.00	24.00	0.00	0.00	310.00	8.00	25.00	Standard	0.00	7.00	10.00	25.00	0.00	0.00	0.00	10.00	0.00	0.00	0.00	395.00	380.00	5.85	24000.00	5.85	374.15	1534015.00	1	2	450000.00	1084015.00	0.00	0.00	0.00	389.15	0.00	155.00	0.00	0.00	0.00	0.00	0.00	234.15	389.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00007	PAYROLL-2026-09	2026-09	EMP00007	លី ស្រីមុំ	LY Sreymom	2024-02-01	2 Yrs 7 Mos	31	FDC	Wing Bank	LY SREYMOM	098 765 4321	2001-10-09	KHM-010892019	Female	Cambodian	Sewing Operator	208.00	24.00	0.00	0.00	208.00	3.00	0.00	Grade B - ជំនាញបង្គុំហោប៉ៅ និងខ្សែរ៉ូត (Pocket Setting & Zipper Attachment)	18.00	7.00	10.00	25.00	0.00	0.00	20.00	10.00	0.00	0.00	0.00	301.00	294.00	5.85	24000.00	5.85	288.15	1181415.00	0	0	0.00	1181415.00	0.00	0.00	0.00	295.15	0.00	104.00	0.00	0.00	0.00	0.00	0.00	191.15	295.15	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00008	PAYROLL-2026-09	2026-09	EMP00008	អ៊ុច ធារ៉ា	OUCH Theara	2022-08-15	4 Yrs 1 Mos	49	UDC	ABA Bank	OUCH THEARA	004 567 890	1997-12-25	KHM-010928374	Male	Cambodian	Ironing Operator	215.00	24.00	0.00	0.00	215.00	5.00	0.00	Standard	0.00	7.00	10.00	25.00	0.00	0.00	0.00	10.00	0.00	0.00	0.00	272.00	260.00	5.20	21320.00	5.20	254.80	1044680.00	0	1	150000.00	894680.00	0.00	0.00	0.00	266.80	0.00	107.50	0.00	0.00	0.00	0.00	0.00	159.30	266.80	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00009	PAYROLL-2026-09	2026-09	EMP00009	សេង ចាន់ថន	SENG Chanthon	2018-02-10	8 Yrs 7 Mos	103	UDC	ABA Bank	SENG CHANTHON	005 678 901	1992-06-17	KHM-010992834	Female	Cambodian	Payroll Officer	450.00	24.00	0.00	0.00	450.00	9.00	50.00	Standard	0.00	7.00	10.00	25.00	0.00	0.00	0.00	10.00	0.00	0.00	0.00	561.00	545.00	5.85	24000.00	5.85	539.15	2210515.00	1	2	450000.00	1760515.00	5.00	13026.00	3.18	551.97	0.00	225.00	0.00	0.00	0.00	0.00	0.00	326.97	551.97	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
PAY-2026-09-EMP00010	PAYROLL-2026-09	2026-09	EMP00010	នួន ស្រីនាង	NUON Sreineang	2024-04-10	2 Yrs 5 Mos	29	FDC	Cash / Wing	NUON SREINEANG	CASH-PAY-010	2002-05-03	KHM-010837261	Female	Cambodian	Sewing Operator	208.00	24.00	0.00	0.00	208.00	3.00	0.00	Grade C - ជំនាញដេរបន្ទាត់ត្រង់ធម្មតា (Basic Single Needle Straight Seamer)	8.00	7.00	10.00	25.00	0.00	0.00	20.00	10.00	0.00	0.00	0.00	291.00	284.00	5.68	23288.00	5.68	278.32	1141112.00	0	0	0.00	1141112.00	0.00	0.00	0.00	285.32	0.00	104.00	0.00	0.00	0.00	0.00	0.00	181.32	285.32	CALCULATED	4100.00	2026-10-01 06:01:14.187225+00	2026-10-01 06:01:14.187225+00
\.


--
-- Data for Name: overtime_records; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.overtime_records (id, employee_id, period_id, date, ot_type, hours, rate_multiplier, hourly_rate, calculated_amount, food_allowance_eligible, food_allowance_amount, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_calculation_traces; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.payroll_calculation_traces (id, payroll_item_id, steps_json, summary_markdown, created_at) FROM stdin;
bbadca88-acaf-4219-b8c2-20eae695062b	PAY-2026-09-EMP00001	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 285, "workingDays": 24}, "result_value": 285, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $6 awarded for 5 Yrs 6 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 66, "completedYears": 5}, "result_value": 6, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Grade A - ជំនាញដេរម៉ាស៊ីនច្រើនប្រភេទ និងកអាវ (Multi-Machine / Collar Master)), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 30, "transportHousing": 7, "positionAllowance": 35, "attendanceAllowance": 10}, "result_value": 107, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.4844, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 113, "achievementBonus": 20, "salaryAdjustment": 0, "basicWorkingSalary": 285, "monthlyEvaluationBonus": 10}, "result_value": 428, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 415}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,227,515 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1227515, "taxableKhr": 1677515, "taxableUsd": 409.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 450000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 428, "pension": 5.85}, "result_value": 422.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($142.5) disbursed mid-month. Final balance ($279.65) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 142.5, "totalPaid": 422.15, "secondPaid": 279.65, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 422.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for SUN Sreypov (ស៊ុន ស្រីពៅ)\n- **Employee ID**: `EMP00001` | **Position**: Sewing Line Leader\n- **Contract Type**: `UDC` | **Service Duration**: 5 Yrs 6 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$285.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{285}{24} \\times (24 - 0) =$ **`$285.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$6.00`\n- **Position Allowance**: `$35.00`\n- **Skill Allowance (Grade A - ជំនាញដេរម៉ាស៊ីនច្រើនប្រភេទ និងកអាវ (Multi-Machine / Collar Master))**: `$30.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$30.00`\n- **Gross Total Salary**: **`$428.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$13.00`\n- **Pensionable Wage**: `$415.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$409.15`\n- **Taxable Salary (KHR)**: `1,677,515 KHR`\n- **Family Relief Deductions**: Spouse (1) + Children (2) = `450,000 KHR`\n- **Net Tax Base**: `1,227,515 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$422.15`**\n- **1st Installment (Mid-Month Advance)**: `$142.50`\n- **2nd Installment (Month-End Balance)**: `$279.65`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$422.15`**	2026-10-01 06:01:14.187225+00
e2ff5031-8981-43c7-8b01-d324d5cff481	PAY-2026-09-EMP00002	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 220, "workingDays": 24}, "result_value": 220, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $5 awarded for 4 Yrs 3 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 51, "completedYears": 4}, "result_value": 5, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Grade A - ជំនាញម៉ាស៊ីនដេរ ៤ម្ជុល និងហ្វ្លេតឡុក (Flatlock 4-Needle Specialist)), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 25, "transportHousing": 7, "positionAllowance": 0, "attendanceAllowance": 10}, "result_value": 67, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.1458, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 72, "achievementBonus": 20, "salaryAdjustment": 0, "basicWorkingSalary": 220, "monthlyEvaluationBonus": 10}, "result_value": 322, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 310}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,097,015 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1097015, "taxableKhr": 1247015, "taxableUsd": 304.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 150000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 322, "pension": 5.85}, "result_value": 316.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($110) disbursed mid-month. Final balance ($206.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 110, "totalPaid": 316.15, "secondPaid": 206.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 316.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for CHEA Sokhum (ជា សុខុម)\n- **Employee ID**: `EMP00002` | **Position**: Sewing Operator\n- **Contract Type**: `UDC` | **Service Duration**: 4 Yrs 3 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$220.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{220}{24} \\times (24 - 0) =$ **`$220.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$5.00`\n- **Position Allowance**: `$0.00`\n- **Skill Allowance (Grade A - ជំនាញម៉ាស៊ីនដេរ ៤ម្ជុល និងហ្វ្លេតឡុក (Flatlock 4-Needle Specialist))**: `$25.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$30.00`\n- **Gross Total Salary**: **`$322.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$12.00`\n- **Pensionable Wage**: `$310.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$304.15`\n- **Taxable Salary (KHR)**: `1,247,015 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (1) = `150,000 KHR`\n- **Net Tax Base**: `1,097,015 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$316.15`**\n- **1st Installment (Mid-Month Advance)**: `$110.00`\n- **2nd Installment (Month-End Balance)**: `$206.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$316.15`**	2026-10-01 06:01:14.187225+00
cbaaa425-a469-40b0-813c-7e9bdc462958	PAY-2026-09-EMP00003	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 320, "workingDays": 24}, "result_value": 320, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $7 awarded for 6 Yrs 8 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 80, "completedYears": 6}, "result_value": 7, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Standard), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 0, "transportHousing": 7, "positionAllowance": 40, "attendanceAllowance": 10}, "result_value": 82, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.6667, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 89, "achievementBonus": 0, "salaryAdjustment": 0, "basicWorkingSalary": 320, "monthlyEvaluationBonus": 10}, "result_value": 419, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 405}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,036,515 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1036515, "taxableKhr": 1636515, "taxableUsd": 399.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 600000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 419, "pension": 5.85}, "result_value": 413.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($160) disbursed mid-month. Final balance ($253.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 160, "totalPaid": 413.15, "secondPaid": 253.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 413.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for VAN Vanna (វ៉ាន់ វណ្ណា)\n- **Employee ID**: `EMP00003` | **Position**: Cutting Master\n- **Contract Type**: `UDC` | **Service Duration**: 6 Yrs 8 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$320.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{320}{24} \\times (24 - 0) =$ **`$320.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$7.00`\n- **Position Allowance**: `$40.00`\n- **Skill Allowance (Standard)**: `$0.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$10.00`\n- **Gross Total Salary**: **`$419.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$14.00`\n- **Pensionable Wage**: `$405.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$399.15`\n- **Taxable Salary (KHR)**: `1,636,515 KHR`\n- **Family Relief Deductions**: Spouse (1) + Children (3) = `600,000 KHR`\n- **Net Tax Base**: `1,036,515 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$413.15`**\n- **1st Installment (Mid-Month Advance)**: `$160.00`\n- **2nd Installment (Month-End Balance)**: `$253.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$413.15`**	2026-10-01 06:01:14.187225+00
9b825c70-b5b6-43b9-9d1d-1c01c36f5333	PAY-2026-09-EMP00004	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 210, "workingDays": 24}, "result_value": 210, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $4 awarded for 3 Yrs 0 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 36, "completedYears": 3}, "result_value": 4, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Grade B - ជំនាញម៉ាស៊ីនរត់ និងម៉ាស៊ីនកង (Lockstitch & Overlock Skilled)), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 15, "transportHousing": 7, "positionAllowance": 0, "attendanceAllowance": 10}, "result_value": 57, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.0938, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 61, "achievementBonus": 20, "salaryAdjustment": 0, "basicWorkingSalary": 210, "monthlyEvaluationBonus": 10}, "result_value": 301, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 294}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,181,415 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1181415, "taxableKhr": 1181415, "taxableUsd": 288.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 0}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 301, "pension": 5.85}, "result_value": 295.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($105) disbursed mid-month. Final balance ($190.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 105, "totalPaid": 295.15, "secondPaid": 190.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 295.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for MAO Chenda (ម៉ៅ ចិន្តា)\n- **Employee ID**: `EMP00004` | **Position**: Sewing Operator\n- **Contract Type**: `FDC` | **Service Duration**: 3 Yrs 0 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$210.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{210}{24} \\times (24 - 0) =$ **`$210.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$4.00`\n- **Position Allowance**: `$0.00`\n- **Skill Allowance (Grade B - ជំនាញម៉ាស៊ីនរត់ និងម៉ាស៊ីនកង (Lockstitch & Overlock Skilled))**: `$15.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$30.00`\n- **Gross Total Salary**: **`$301.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$7.00`\n- **Pensionable Wage**: `$294.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$288.15`\n- **Taxable Salary (KHR)**: `1,181,415 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (0) = `0 KHR`\n- **Net Tax Base**: `1,181,415 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$295.15`**\n- **1st Installment (Mid-Month Advance)**: `$105.00`\n- **2nd Installment (Month-End Balance)**: `$190.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$295.15`**	2026-10-01 06:01:14.187225+00
dc35633b-6ce1-4d30-bbb7-f609be2eeee0	PAY-2026-09-EMP00005	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 260, "workingDays": 24}, "result_value": 260, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $5 awarded for 4 Yrs 10 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 58, "completedYears": 4}, "result_value": 5, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Standard), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 0, "transportHousing": 7, "positionAllowance": 30, "attendanceAllowance": 10}, "result_value": 72, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.3542, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 77, "achievementBonus": 0, "salaryAdjustment": 0, "basicWorkingSalary": 260, "monthlyEvaluationBonus": 10}, "result_value": 347, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 335}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,199,515 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1199515, "taxableKhr": 1349515, "taxableUsd": 329.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 150000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 347, "pension": 5.85}, "result_value": 341.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($130) disbursed mid-month. Final balance ($211.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 130, "totalPaid": 341.15, "secondPaid": 211.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 341.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for KONG Sophea (គង់ សុភា)\n- **Employee ID**: `EMP00005` | **Position**: QC Supervisor\n- **Contract Type**: `UDC` | **Service Duration**: 4 Yrs 10 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$260.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{260}{24} \\times (24 - 0) =$ **`$260.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$5.00`\n- **Position Allowance**: `$30.00`\n- **Skill Allowance (Standard)**: `$0.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$10.00`\n- **Gross Total Salary**: **`$347.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$12.00`\n- **Pensionable Wage**: `$335.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$329.15`\n- **Taxable Salary (KHR)**: `1,349,515 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (1) = `150,000 KHR`\n- **Net Tax Base**: `1,199,515 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$341.15`**\n- **1st Installment (Mid-Month Advance)**: `$130.00`\n- **2nd Installment (Month-End Balance)**: `$211.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$341.15`**	2026-10-01 06:01:14.187225+00
cfed25a8-1851-48d2-b097-0ece1e65b20e	PAY-2026-09-EMP00006	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 310, "workingDays": 24}, "result_value": 310, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $8 awarded for 7 Yrs 4 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 88, "completedYears": 7}, "result_value": 8, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Standard), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 0, "transportHousing": 7, "positionAllowance": 25, "attendanceAllowance": 10}, "result_value": 67, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.6146, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 75, "achievementBonus": 0, "salaryAdjustment": 0, "basicWorkingSalary": 310, "monthlyEvaluationBonus": 10}, "result_value": 395, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 380}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,084,015 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1084015, "taxableKhr": 1534015, "taxableUsd": 374.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 450000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 395, "pension": 5.85}, "result_value": 389.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($155) disbursed mid-month. Final balance ($234.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 155, "totalPaid": 389.15, "secondPaid": 234.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 389.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for HENG Piseth (ហេង ពិសិដ្ឋ)\n- **Employee ID**: `EMP00006` | **Position**: Sewing Technician\n- **Contract Type**: `UDC` | **Service Duration**: 7 Yrs 4 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$310.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{310}{24} \\times (24 - 0) =$ **`$310.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$8.00`\n- **Position Allowance**: `$25.00`\n- **Skill Allowance (Standard)**: `$0.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$10.00`\n- **Gross Total Salary**: **`$395.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$15.00`\n- **Pensionable Wage**: `$380.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$374.15`\n- **Taxable Salary (KHR)**: `1,534,015 KHR`\n- **Family Relief Deductions**: Spouse (1) + Children (2) = `450,000 KHR`\n- **Net Tax Base**: `1,084,015 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$389.15`**\n- **1st Installment (Mid-Month Advance)**: `$155.00`\n- **2nd Installment (Month-End Balance)**: `$234.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$389.15`**	2026-10-01 06:01:14.187225+00
5afc9bcf-66b0-44f8-ad73-460b2c016860	PAY-2026-09-EMP00007	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 208, "workingDays": 24}, "result_value": 208, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $3 awarded for 2 Yrs 7 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 31, "completedYears": 2}, "result_value": 3, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Grade B - ជំនាញបង្គុំហោប៉ៅ និងខ្សែរ៉ូត (Pocket Setting & Zipper Attachment)), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 18, "transportHousing": 7, "positionAllowance": 0, "attendanceAllowance": 10}, "result_value": 60, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.0833, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 63, "achievementBonus": 20, "salaryAdjustment": 0, "basicWorkingSalary": 208, "monthlyEvaluationBonus": 10}, "result_value": 301, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 294}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,181,415 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1181415, "taxableKhr": 1181415, "taxableUsd": 288.15, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 0}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 301, "pension": 5.85}, "result_value": 295.15, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($104) disbursed mid-month. Final balance ($191.15) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 104, "totalPaid": 295.15, "secondPaid": 191.15, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 295.15, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for LY Sreymom (លី ស្រីមុំ)\n- **Employee ID**: `EMP00007` | **Position**: Sewing Operator\n- **Contract Type**: `FDC` | **Service Duration**: 2 Yrs 7 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$208.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{208}{24} \\times (24 - 0) =$ **`$208.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$3.00`\n- **Position Allowance**: `$0.00`\n- **Skill Allowance (Grade B - ជំនាញបង្គុំហោប៉ៅ និងខ្សែរ៉ូត (Pocket Setting & Zipper Attachment))**: `$18.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$30.00`\n- **Gross Total Salary**: **`$301.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$7.00`\n- **Pensionable Wage**: `$294.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$288.15`\n- **Taxable Salary (KHR)**: `1,181,415 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (0) = `0 KHR`\n- **Net Tax Base**: `1,181,415 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$295.15`**\n- **1st Installment (Mid-Month Advance)**: `$104.00`\n- **2nd Installment (Month-End Balance)**: `$191.15`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$295.15`**	2026-10-01 06:01:14.187225+00
cbf977a6-365d-4f4b-ac5f-d503e5a0c7dd	PAY-2026-09-EMP00008	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 215, "workingDays": 24}, "result_value": 215, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $5 awarded for 4 Yrs 1 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 49, "completedYears": 4}, "result_value": 5, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Standard), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 0, "transportHousing": 7, "positionAllowance": 0, "attendanceAllowance": 10}, "result_value": 42, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.1198, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 47, "achievementBonus": 0, "salaryAdjustment": 0, "basicWorkingSalary": 215, "monthlyEvaluationBonus": 10}, "result_value": 272, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.2 (21,320 KHR). Employer pays matching $5.2.", "step_number": 6, "input_values": {"cappedKhr": 1066000, "ceilingApplied": false, "pensionableUsd": 260}, "result_value": 5.2, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 894,680 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 894680, "taxableKhr": 1044680, "taxableUsd": 254.8, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 150000}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 272, "pension": 5.2}, "result_value": 266.8, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($107.5) disbursed mid-month. Final balance ($159.3) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 107.5, "totalPaid": 266.8, "secondPaid": 159.3, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 266.8, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for OUCH Theara (អ៊ុច ធារ៉ា)\n- **Employee ID**: `EMP00008` | **Position**: Ironing Operator\n- **Contract Type**: `UDC` | **Service Duration**: 4 Yrs 1 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$215.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{215}{24} \\times (24 - 0) =$ **`$215.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$5.00`\n- **Position Allowance**: `$0.00`\n- **Skill Allowance (Standard)**: `$0.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$10.00`\n- **Gross Total Salary**: **`$272.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$12.00`\n- **Pensionable Wage**: `$260.00`\n- **NSSF Pension (Employee 2%)**: `$5.20` (`21,320 KHR`)\n- **Taxable Salary (USD)**: `$254.80`\n- **Taxable Salary (KHR)**: `1,044,680 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (1) = `150,000 KHR`\n- **Net Tax Base**: `894,680 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$266.80`**\n- **1st Installment (Mid-Month Advance)**: `$107.50`\n- **2nd Installment (Month-End Balance)**: `$159.30`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$266.80`**	2026-10-01 06:01:14.187225+00
d3ca6feb-5248-487d-8ec9-a0197b828e7a	PAY-2026-09-EMP00009	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 450, "workingDays": 24}, "result_value": 450, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $9 awarded for 8 Yrs 7 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 103, "completedYears": 8}, "result_value": 9, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Standard), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 0, "transportHousing": 7, "positionAllowance": 50, "attendanceAllowance": 10}, "result_value": 92, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 2.3438, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 101, "achievementBonus": 0, "salaryAdjustment": 0, "basicWorkingSalary": 450, "monthlyEvaluationBonus": 10}, "result_value": 561, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.85 (24,000 KHR). Employer pays matching $5.85.", "step_number": 6, "input_values": {"cappedKhr": 1200000, "ceilingApplied": true, "pensionableUsd": 545}, "result_value": 5.85, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,760,515 KHR taxed at 5% = 13,026 KHR ($3.18).", "step_number": 7, "input_values": {"taxBaseKhr": 1760515, "taxableKhr": 2210515, "taxableUsd": 539.15, "matchedBracket": "5% [1,500,001 - 2,000,000 KHR]", "familyReliefKhr": 450000}, "result_value": 3.18, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 3.18, "gross": 561, "pension": 5.85}, "result_value": 551.97, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($225) disbursed mid-month. Final balance ($326.97) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 225, "totalPaid": 551.97, "secondPaid": 326.97, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 551.97, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for SENG Chanthon (សេង ចាន់ថន)\n- **Employee ID**: `EMP00009` | **Position**: Payroll Officer\n- **Contract Type**: `UDC` | **Service Duration**: 8 Yrs 7 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$450.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{450}{24} \\times (24 - 0) =$ **`$450.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$9.00`\n- **Position Allowance**: `$50.00`\n- **Skill Allowance (Standard)**: `$0.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$10.00`\n- **Gross Total Salary**: **`$561.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$16.00`\n- **Pensionable Wage**: `$545.00`\n- **NSSF Pension (Employee 2%)**: `$5.85` (`24,000 KHR`)\n- **Taxable Salary (USD)**: `$539.15`\n- **Taxable Salary (KHR)**: `2,210,515 KHR`\n- **Family Relief Deductions**: Spouse (1) + Children (2) = `450,000 KHR`\n- **Net Tax Base**: `1,760,515 KHR`\n- **Marginal Tax Bracket**: `5% [1,500,001 - 2,000,000 KHR]`\n- **Tax on Salary (KHR)**: `13,026 KHR`\n- **Tax on Salary (USD Withholding)**: **`$3.18`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$551.97`**\n- **1st Installment (Mid-Month Advance)**: `$225.00`\n- **2nd Installment (Month-End Balance)**: `$326.97`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$551.97`**	2026-10-01 06:01:14.187225+00
ae2b3d46-bec2-4e47-ab11-14bc07266aea	PAY-2026-09-EMP00010	[{"title_en": "Basic Working Salary Calculation", "title_km": "ការគណនាប្រាក់ឈ្នួលថ្ងៃធ្វើការជាក់ស្តែង", "step_code": "BASIC_WORKING_SALARY", "explanation": "Pro-rated base wage for 24 paid days out of 24 standard days.", "step_number": 1, "input_values": {"paidDays": 24, "unpaidDays": 0, "basicSalary": 208, "workingDays": 24}, "result_value": 208, "formula_expression": "Basic Salary / Working Days * (Working Days - Unpaid Days)"}, {"title_en": "Seniority Bonus", "title_km": "ប្រាក់អតីតភាពការងារ", "step_code": "SENIORITY_BONUS", "explanation": "Seniority allowance of $3 awarded for 2 Yrs 5 Mos length of service.", "step_number": 2, "input_values": {"serviceMonths": 29, "completedYears": 2}, "result_value": 3, "formula_expression": "Statutory garment scale based on years of continuous service"}, {"title_en": "Allowances Breakdown", "title_km": "ប្រាក់ឧបត្ថម្ភផ្សេងៗ", "step_code": "ALLOWANCES_BREAKDOWN", "explanation": "Calculated position, skill matrix (Grade C - ជំនាញដេរបន្ទាត់ត្រង់ធម្មតា (Basic Single Needle Straight Seamer)), transport, and attendance allowances.", "step_number": 3, "input_values": {"foodAllowance": 25, "skillAllowance": 8, "transportHousing": 7, "positionAllowance": 0, "attendanceAllowance": 10}, "result_value": 50, "formula_expression": "Position + Skill + Transport/Housing + Attendance + Food"}, {"title_en": "Overtime & OT Meal Allowance", "title_km": "ប្រាក់ថែមម៉ោង និងថ្លៃបាយថែមម៉ោង", "step_code": "OVERTIME_EARNINGS", "explanation": "Total overtime earnings computed at statutory multipliers.", "step_number": 4, "input_values": {"otPay": 0, "otHours": 0, "hourlyRate": 1.0833, "otFoodAllowance": 0}, "result_value": 0, "formula_expression": "(NormalOT * 1.5 + NightOT * 2.0 + HolidayOT * 2.0) * HourlyRate + OTMeal"}, {"title_en": "Gross Total Salary", "title_km": "ប្រាក់បៀវត្សរ៍សរុប (Gross Total)", "step_code": "GROSS_SALARY", "explanation": "Grand total earnings accrued prior to statutory deductions.", "step_number": 5, "input_values": {"otPay": 0, "annualLeavePay": 0, "totalAllowances": 53, "achievementBonus": 20, "salaryAdjustment": 0, "basicWorkingSalary": 208, "monthlyEvaluationBonus": 10}, "result_value": 291, "formula_expression": "BasicWorking + Allowances + Bonuses + Overtime + Leave + Adjustments"}, {"title_en": "NSSF Pension Fund Contribution (2%)", "title_km": "ការកាត់ភាគទានបេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស.) ផ្នែកសោធន", "step_code": "PENSION_FUND", "explanation": "Employee 2% contribution is $5.68 (23,288 KHR). Employer pays matching $5.68.", "step_number": 6, "input_values": {"cappedKhr": 1164400, "ceilingApplied": false, "pensionableUsd": 284}, "result_value": 5.68, "formula_expression": "MIN(Wage KHR, 1,200,000 KHR Ceiling) * 2% / Exchange Rate"}, {"title_en": "Cambodia Progressive Tax on Salary", "title_km": "ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Progressive Tax on Salary)", "step_code": "TAX_ON_SALARY", "explanation": "Tax base of 1,141,112 KHR taxed at 0% = 0 KHR ($0).", "step_number": 7, "input_values": {"taxBaseKhr": 1141112, "taxableKhr": 1141112, "taxableUsd": 278.32, "matchedBracket": "0% [0 - 1,500,000 KHR]", "familyReliefKhr": 0}, "result_value": 0, "formula_expression": "((Taxable KHR - Family Deductions KHR) * Rate) - Quick Deduction"}, {"title_en": "After Tax Salary (Net)", "title_km": "ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ (Net Take-Home)", "step_code": "AFTER_TAX_SALARY", "explanation": "Net salary remaining after statutory pension and tax deductions.", "step_number": 8, "input_values": {"tax": 0, "gross": 291, "pension": 5.68}, "result_value": 285.32, "formula_expression": "Gross Total - NSSF Pension - Tax on Salary"}, {"title_en": "Payment Tranches & Final Balance", "title_km": "ការទូទាត់ប្រាក់បៀវត្សរ៍ (Payment Tranches)", "step_code": "DISBURSEMENTS_SUMMARY", "explanation": "First installment ($104) disbursed mid-month. Final balance ($181.32) payable at period close.", "step_number": 9, "input_values": {"firstPaid": 104, "totalPaid": 285.32, "secondPaid": 181.32, "paidFoodFee": 0, "severancePay5pct": 0, "paidCashAdjustment": 0, "paidDailyTargetBonus": 0}, "result_value": 285.32, "formula_expression": "First Paid + Second Paid + Target Bonuses - Adjustments"}]	### 📊 Payroll Calculation Trace for NUON Sreineang (នួន ស្រីនាង)\n- **Employee ID**: `EMP00010` | **Position**: Sewing Operator\n- **Contract Type**: `FDC` | **Service Duration**: 2 Yrs 5 Mos\n- **Exchange Rate**: `1 USD = 4,100 KHR`\n\n---\n\n#### 1. Basic & Attendance Earnings\n- **Basic Monthly Salary**: `$208.00`\n- **Standard Working Days**: `24` | **Unpaid Days**: `0`\n- **Basic Working Salary**: $\\frac{208}{24} \\times (24 - 0) =$ **`$208.00`**\n\n#### 2. Allowances & Overtime\n- **Seniority Bonus**: `$3.00`\n- **Position Allowance**: `$0.00`\n- **Skill Allowance (Grade C - ជំនាញដេរបន្ទាត់ត្រង់ធម្មតា (Basic Single Needle Straight Seamer))**: `$8.00`\n- **Transport / Housing**: `$7.00`\n- **Attendance Bonus**: `$10.00`\n- **Food Allowance**: `$25.00`\n- **Overtime Pay**: `$0.00` + **OT Meal**: `$0.00`\n- **Production / Evaluation Bonuses**: `$30.00`\n- **Gross Total Salary**: **`$291.00`**\n\n#### 3. Statutory Deductions (NSSF & GDT Tax)\n- **Non-Taxable Allowances**: `$7.00`\n- **Pensionable Wage**: `$284.00`\n- **NSSF Pension (Employee 2%)**: `$5.68` (`23,288 KHR`)\n- **Taxable Salary (USD)**: `$278.32`\n- **Taxable Salary (KHR)**: `1,141,112 KHR`\n- **Family Relief Deductions**: Spouse (0) + Children (0) = `0 KHR`\n- **Net Tax Base**: `1,141,112 KHR`\n- **Marginal Tax Bracket**: `0% [0 - 1,500,000 KHR]`\n- **Tax on Salary (KHR)**: `0 KHR`\n- **Tax on Salary (USD Withholding)**: **`$0.00`**\n\n#### 4. Net Salary & Payment Distribution\n- **After Tax Salary (Net)**: **`$285.32`**\n- **1st Installment (Mid-Month Advance)**: `$104.00`\n- **2nd Installment (Month-End Balance)**: `$181.32`\n- **Severance Pay 5% (if applicable)**: `$0.00`\n- **Total Disbursed**: **`$285.32`**	2026-10-01 06:01:14.187225+00
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.payroll_periods (id, period_code, name_km, name_en, year, month, start_date, end_date, standard_working_days, exchange_rate_khr, first_payment_date, second_payment_date, status, created_at, updated_at, approved_by, approved_at, closed_at) FROM stdin;
2026-08	AUG-2026	សីហា ២០២៦	August 2026	2026	8	2026-08-01	2026-08-31	24	4095.00	2026-08-18	2026-08-31	CLOSED	2026-10-01 05:58:59.700846+00	2026-10-01 05:58:59.700846+00	\N	\N	\N
2026-10	OCT-2026	តុលា ២០២៦	October 2026	2026	10	2026-10-01	2026-10-31	24	4105.00	2026-10-18	2026-10-31	DRAFT	2026-10-01 05:58:59.700846+00	2026-10-01 05:58:59.700846+00	\N	\N	\N
2026-09	SEP-2026	កញ្ញា ២០២៦	September 2026	2026	9	2026-09-01	2026-09-30	24	4100.00	2026-09-18	2026-09-30	CALCULATED	2026-10-01 05:58:59.700846+00	2026-10-01 06:01:14.187225+00	\N	\N	\N
\.


--
-- Data for Name: pension_rules; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.pension_rules (id, scheme_name, employee_rate, employer_rate, min_contributory_wage_khr, max_contributory_wage_khr, effective_from, effective_to, created_at) FROM stdin;
1	NSSF Pension Phase 1 (2022-2027)	0.0200	0.0200	400000.00	1200000.00	2022-10-01	\N	2026-10-01 05:59:14.561728+00
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.permissions (id, module, action, description) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.positions (id, title_km, title_en, department_id, standard_allowance, description, created_at) FROM stdin;
POS_SEW_OP	ជាងដេរ (Sewing Operator)	Sewing Operator	DEPT_SEW	0.00	Standard Sewing Machine Operator	2026-10-01 05:59:14.558012+00
POS_LINE_LEAD	ប្រធានខ្សែសង្វាក់ដេរ (Sewing Line Leader)	Sewing Line Leader	DEPT_SEW	35.00	Supervises line of 40 sewing operators	2026-10-01 05:59:14.558012+00
POS_CUT_MST	មេជាងកាត់ (Cutting Master)	Cutting Master	DEPT_CUT	40.00	Master Fabric Cutter	2026-10-01 05:59:14.558012+00
POS_CUT_AST	ជំនួយការកាត់ (Cutting Assistant)	Cutting Assistant	DEPT_CUT	0.00	Cutting table assistant	2026-10-01 05:59:14.558012+00
POS_QC_LEAD	ប្រធានត្រួតពិនិត្យ (QC Supervisor)	QC Supervisor	DEPT_QC	30.00	Oversees AQL quality standards	2026-10-01 05:59:14.558012+00
POS_QC_INSP	បុគ្គលិកត្រួតពិនិត្យ (QC Inspector)	QC Inspector	DEPT_QC	0.00	Garment Quality Checker	2026-10-01 05:59:14.558012+00
POS_IRON_OP	ជាងអ៊ុតសម្លៀកបំពាក់ (Ironing Operator)	Ironing Operator	DEPT_FIN	0.00	Steam pressing and finishing	2026-10-01 05:59:14.558012+00
POS_PACK_STF	បុគ្គលិកវេចខ្ចប់ (Packing Staff)	Packing Staff	DEPT_FIN	0.00	Tagging, folding, and carton packing	2026-10-01 05:59:14.558012+00
POS_MECH_TECH	ជាងជួសជុលម៉ាស៊ីន (Sewing Technician)	Sewing Technician	DEPT_MAINT	25.00	Machine repair and calibration	2026-10-01 05:59:14.558012+00
POS_PAYROLL_OFF	មន្ត្រីគណនេយ្យបើកប្រាក់បៀវត្សរ៍ (Payroll Officer)	Payroll Officer	DEPT_HR	50.00	HR Payroll Administrator	2026-10-01 05:59:14.558012+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.roles (id, name, description, created_at) FROM stdin;
ROLE_ADMIN	System Administrator	Full system access and security administration	2026-10-01 05:58:59.69433+00
ROLE_HR	HR Manager	Manage employee records, contracts, attendance, and leave	2026-10-01 05:58:59.69433+00
ROLE_PAYROLL	Payroll Specialist	Process, calculate, adjust, and generate monthly payroll	2026-10-01 05:58:59.69433+00
ROLE_FINANCE	Finance Director	Approve payroll, disburse bank payments, view financial summaries	2026-10-01 05:58:59.69433+00
ROLE_AUDITOR	Compliance & Tax Auditor	Read-only access to audit logs, tax calculations, and payroll history	2026-10-01 05:58:59.69433+00
\.


--
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.salary_components (id, code, name_km, name_en, component_type, calculation_method, default_amount, is_taxable, is_pensionable, is_active, notes, created_at) FROM stdin;
COMP_BASE	BASIC_SALARY	ប្រាក់ខែមូលដ្ឋាន	Basic Salary	EARNING	FIXED	208.00	t	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_SENIORITY	SENIORITY_BONUS	ប្រាក់អតីតភាពការងារ	Seniority Bonus	ALLOWANCE	SERVICE_LINKED	5.00	f	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_POS	POSITION_ALLOWANCE	ប្រាក់ឧបត្ថម្ភមុខតំណែង	Position Allowance	ALLOWANCE	FIXED	35.00	t	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_SKILL	SKILL_ALLOWANCE	ប្រាក់ជំនាញដេរ	Sewing Skill Allowance	ALLOWANCE	FIXED	20.00	t	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_TRANS_HOUSE	TRANSPORT_HOUSING	ប្រាក់ធ្វើដំណើរនិងស្នាក់នៅ	Transport & Housing Allowance	ALLOWANCE	FIXED	7.00	f	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_ATTEND	ATTENDANCE_ALLOWANCE	ប្រាក់រង្វាន់វត្តមានការងារទៀងទាត់	Attendance Bonus	ALLOWANCE	ATTENDANCE_LINKED	10.00	t	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_FOOD	FOOD_ALLOWANCE	ប្រាក់ថ្លៃបាយប្រចាំថ្ងៃ	Food Allowance	ALLOWANCE	FIXED	25.00	f	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_OT_PAY	OVERTIME_PAY	ប្រាក់ថែមម៉ោង	Overtime Pay	EARNING	FORMULA	0.00	t	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_OT_FOOD	OVERTIME_FOOD	ប្រាក់ថ្លៃបាយថែមម៉ោង	Overtime Food Allowance	ALLOWANCE	FORMULA	0.00	f	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_ACHIEVE	ACHIEVEMENT_BONUS	ប្រាក់រង្វាន់សម្រេចគោលដៅផលិតកម្ម	Production Achievement Bonus	BONUS	FIXED	20.00	t	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_EVAL	EVALUATION_BONUS	ប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ	Monthly Evaluation Bonus	BONUS	FIXED	15.00	t	f	t	\N	2026-10-01 05:58:59.697539+00
COMP_LEAVE	ANNUAL_LEAVE_PAY	ប្រាក់ឈប់សម្រាកប្រចាំឆ្នាំ	Annual Leave Pay	EARNING	FORMULA	0.00	t	t	t	\N	2026-10-01 05:58:59.697539+00
COMP_SEV_5	SEVERANCE_5PCT	ប្រាក់បំណាច់កិច្ចសន្យា ៥%	Severance Pay 5%	SEVERANCE	FORMULA	0.00	f	f	t	\N	2026-10-01 05:58:59.697539+00
\.


--
-- Data for Name: salary_payments; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.salary_payments (id, payroll_item_id, employee_id, payment_type, amount, currency, payment_date, payment_method, bank_name, bank_account, reference_number, status, notes, created_by, created_at) FROM stdin;
PMT-2026-09-1-EMP00001	PAY-2026-09-EMP00001	EMP00001	FIRST_PAY	142.50	USD	2026-09-18	Bank Transfer	ABA Bank	001 234 567	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00001	PAY-2026-09-EMP00001	EMP00001	SECOND_PAY	279.65	USD	2026-09-30	Bank Transfer	ABA Bank	001 234 567	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00002	PAY-2026-09-EMP00002	EMP00002	FIRST_PAY	110.00	USD	2026-09-18	Bank Transfer	Wing Bank	088 123 4567	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00002	PAY-2026-09-EMP00002	EMP00002	SECOND_PAY	206.15	USD	2026-09-30	Bank Transfer	Wing Bank	088 123 4567	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00003	PAY-2026-09-EMP00003	EMP00003	FIRST_PAY	160.00	USD	2026-09-18	Bank Transfer	Canadia Bank	100 234 5678	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00003	PAY-2026-09-EMP00003	EMP00003	SECOND_PAY	253.15	USD	2026-09-30	Bank Transfer	Canadia Bank	100 234 5678	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00004	PAY-2026-09-EMP00004	EMP00004	FIRST_PAY	105.00	USD	2026-09-18	Bank Transfer	ABA Bank	002 345 678	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00004	PAY-2026-09-EMP00004	EMP00004	SECOND_PAY	190.15	USD	2026-09-30	Bank Transfer	ABA Bank	002 345 678	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00005	PAY-2026-09-EMP00005	EMP00005	FIRST_PAY	130.00	USD	2026-09-18	Bank Transfer	ACLEDA Bank	012 345 678901	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00005	PAY-2026-09-EMP00005	EMP00005	SECOND_PAY	211.15	USD	2026-09-30	Bank Transfer	ACLEDA Bank	012 345 678901	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00006	PAY-2026-09-EMP00006	EMP00006	FIRST_PAY	155.00	USD	2026-09-18	Bank Transfer	ABA Bank	003 456 789	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00006	PAY-2026-09-EMP00006	EMP00006	SECOND_PAY	234.15	USD	2026-09-30	Bank Transfer	ABA Bank	003 456 789	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00007	PAY-2026-09-EMP00007	EMP00007	FIRST_PAY	104.00	USD	2026-09-18	Bank Transfer	Wing Bank	098 765 4321	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00007	PAY-2026-09-EMP00007	EMP00007	SECOND_PAY	191.15	USD	2026-09-30	Bank Transfer	Wing Bank	098 765 4321	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00008	PAY-2026-09-EMP00008	EMP00008	FIRST_PAY	107.50	USD	2026-09-18	Bank Transfer	ABA Bank	004 567 890	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00008	PAY-2026-09-EMP00008	EMP00008	SECOND_PAY	159.30	USD	2026-09-30	Bank Transfer	ABA Bank	004 567 890	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00009	PAY-2026-09-EMP00009	EMP00009	FIRST_PAY	225.00	USD	2026-09-18	Bank Transfer	ABA Bank	005 678 901	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00009	PAY-2026-09-EMP00009	EMP00009	SECOND_PAY	326.97	USD	2026-09-30	Bank Transfer	ABA Bank	005 678 901	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-1-EMP00010	PAY-2026-09-EMP00010	EMP00010	FIRST_PAY	104.00	USD	2026-09-18	Bank Transfer	Cash / Wing	CASH-PAY-010	\N	Approved	Mid-Month Advance (Art. 116)	USR_ADMIN	2026-10-01 06:01:14.187225+00
PMT-2026-09-2-EMP00010	PAY-2026-09-EMP00010	EMP00010	SECOND_PAY	181.32	USD	2026-09-30	Bank Transfer	Cash / Wing	CASH-PAY-010	\N	Pending	Month-End Salary Balance	USR_ADMIN	2026-10-01 06:01:14.187225+00
\.


--
-- Data for Name: severance_records; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.severance_records (id, employee_id, contract_type, start_date, end_date, cumulative_wages, severance_percentage, severance_amount, seniority_payback_days, seniority_payback_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: skill_matrix; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.skill_matrix (id, skill_code, category, grade_level, title_km, title_en, monthly_allowance, created_at) FROM stdin;
SKILL_A_MULTI	SKL-A01	Sewing	Grade A	ជំនាញដេរម៉ាស៊ីនច្រើនប្រភេទ និងកអាវ (Multi-Machine / Collar Master)	Multi-Machine & Collar Assembly	30.00	2026-10-01 05:58:59.696694+00
SKILL_A_FLAT	SKL-A02	Sewing	Grade A	ជំនាញម៉ាស៊ីនដេរ ៤ម្ជុល និងហ្វ្លេតឡុក (Flatlock 4-Needle Specialist)	Flatlock & Overedge Specialist	25.00	2026-10-01 05:58:59.696694+00
SKILL_B_OVER	SKL-B01	Sewing	Grade B	ជំនាញម៉ាស៊ីនរត់ និងម៉ាស៊ីនកង (Lockstitch & Overlock Skilled)	Skilled Lockstitch & Overlock	15.00	2026-10-01 05:58:59.696694+00
SKILL_B_POCK	SKL-B02	Sewing	Grade B	ជំនាញបង្គុំហោប៉ៅ និងខ្សែរ៉ូត (Pocket Setting & Zipper Attachment)	Pocket & Zipper Specialist	18.00	2026-10-01 05:58:59.696694+00
SKILL_C_STRG	SKL-C01	Sewing	Grade C	ជំនាញដេរបន្ទាត់ត្រង់ធម្មតា (Basic Single Needle Straight Seamer)	Standard Straight Stitch	8.00	2026-10-01 05:58:59.696694+00
SKILL_D_HLPR	SKL-D01	Sewing	Grade D	ជំនួយការកាត់អំបោះ និងផ្គុំ (Sewing Line Helper)	Line Helper & Thread Trimmer	0.00	2026-10-01 05:58:59.696694+00
\.


--
-- Data for Name: tax_rules; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.tax_rules (id, rule_set_name, min_salary_khr, max_salary_khr, tax_rate, deduction_khr, currency, applicable_type, effective_from, effective_to, created_at) FROM stdin;
1	Cambodia GDT 2026 Progressive ToS	0.00	1500000.00	0.00	0.00	KHR	Resident	2023-01-01	\N	2026-10-01 05:59:14.560884+00
2	Cambodia GDT 2026 Progressive ToS	1500001.00	2000000.00	0.05	75000.00	KHR	Resident	2023-01-01	\N	2026-10-01 05:59:14.560884+00
3	Cambodia GDT 2026 Progressive ToS	2000001.00	8500000.00	0.10	175000.00	KHR	Resident	2023-01-01	\N	2026-10-01 05:59:14.560884+00
4	Cambodia GDT 2026 Progressive ToS	8500001.00	12500000.00	0.15	600000.00	KHR	Resident	2023-01-01	\N	2026-10-01 05:59:14.560884+00
5	Cambodia GDT 2026 Progressive ToS	12500001.00	\N	0.20	1225000.00	KHR	Resident	2023-01-01	\N	2026-10-01 05:59:14.560884+00
\.


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrm_user
--

SELECT pg_catalog.setval('public.exchange_rates_id_seq', 6, true);


--
-- Name: pension_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrm_user
--

SELECT pg_catalog.setval('public.pension_rules_id_seq', 1, false);


--
-- Name: tax_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrm_user
--

SELECT pg_catalog.setval('public.tax_rules_id_seq', 1, false);


--
-- Name: app_users app_users_email_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_email_key UNIQUE (email);


--
-- Name: app_users app_users_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);


--
-- Name: app_users app_users_username_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_username_key UNIQUE (username);


--
-- Name: attendance_monthly_summary attendance_monthly_summary_employee_id_period_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_monthly_summary
    ADD CONSTRAINT attendance_monthly_summary_employee_id_period_id_key UNIQUE (employee_id, period_id);


--
-- Name: attendance_monthly_summary attendance_monthly_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_monthly_summary
    ADD CONSTRAINT attendance_monthly_summary_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employee_bank_accounts employee_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_bank_accounts
    ADD CONSTRAINT employee_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: employee_salary_components employee_salary_components_employee_id_component_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_employee_id_component_id_key UNIQUE (employee_id, component_id);


--
-- Name: employee_salary_components employee_salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_pkey PRIMARY KEY (id);


--
-- Name: employee_tax_profiles employee_tax_profiles_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_tax_profiles
    ADD CONSTRAINT employee_tax_profiles_employee_id_key UNIQUE (employee_id);


--
-- Name: employee_tax_profiles employee_tax_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_tax_profiles
    ADD CONSTRAINT employee_tax_profiles_pkey PRIMARY KEY (id);


--
-- Name: employees employees_khmer_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_khmer_id_key UNIQUE (khmer_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_period_key_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_period_key_key UNIQUE (period_key);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: monthly_payroll_items monthly_payroll_items_payroll_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll_items
    ADD CONSTRAINT monthly_payroll_items_payroll_id_employee_id_key UNIQUE (payroll_id, employee_id);


--
-- Name: monthly_payroll_items monthly_payroll_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll_items
    ADD CONSTRAINT monthly_payroll_items_pkey PRIMARY KEY (id);


--
-- Name: monthly_payroll monthly_payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll
    ADD CONSTRAINT monthly_payroll_pkey PRIMARY KEY (id);


--
-- Name: overtime_records overtime_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.overtime_records
    ADD CONSTRAINT overtime_records_pkey PRIMARY KEY (id);


--
-- Name: payroll_calculation_traces payroll_calculation_traces_payroll_item_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_calculation_traces
    ADD CONSTRAINT payroll_calculation_traces_payroll_item_id_key UNIQUE (payroll_item_id);


--
-- Name: payroll_calculation_traces payroll_calculation_traces_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_calculation_traces
    ADD CONSTRAINT payroll_calculation_traces_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_period_code_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_period_code_key UNIQUE (period_code);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: pension_rules pension_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.pension_rules
    ADD CONSTRAINT pension_rules_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salary_components salary_components_code_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_code_key UNIQUE (code);


--
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- Name: salary_payments salary_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_payments
    ADD CONSTRAINT salary_payments_pkey PRIMARY KEY (id);


--
-- Name: severance_records severance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.severance_records
    ADD CONSTRAINT severance_records_pkey PRIMARY KEY (id);


--
-- Name: skill_matrix skill_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.skill_matrix
    ADD CONSTRAINT skill_matrix_pkey PRIMARY KEY (id);


--
-- Name: skill_matrix skill_matrix_skill_code_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.skill_matrix
    ADD CONSTRAINT skill_matrix_skill_code_key UNIQUE (skill_code);


--
-- Name: tax_rules tax_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT tax_rules_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_monthly_payroll_items_employee_id; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_monthly_payroll_items_employee_id ON public.monthly_payroll_items USING btree (employee_id);


--
-- Name: idx_monthly_payroll_items_payroll_id; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_monthly_payroll_items_payroll_id ON public.monthly_payroll_items USING btree (payroll_id);


--
-- Name: idx_monthly_payroll_items_period_id; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_monthly_payroll_items_period_id ON public.monthly_payroll_items USING btree (period_id);


--
-- Name: idx_salary_payments_item_id; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_salary_payments_item_id ON public.salary_payments USING btree (payroll_item_id);


--
-- Name: app_users app_users_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: app_users app_users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: attendance_monthly_summary attendance_monthly_summary_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_monthly_summary
    ADD CONSTRAINT attendance_monthly_summary_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance_monthly_summary attendance_monthly_summary_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_monthly_summary
    ADD CONSTRAINT attendance_monthly_summary_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: employee_bank_accounts employee_bank_accounts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_bank_accounts
    ADD CONSTRAINT employee_bank_accounts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_salary_components employee_salary_components_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.salary_components(id) ON DELETE CASCADE;


--
-- Name: employee_salary_components employee_salary_components_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_tax_profiles employee_tax_profiles_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_tax_profiles
    ADD CONSTRAINT employee_tax_profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: employees employees_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;


--
-- Name: employees employees_sewing_skill_matrix_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_sewing_skill_matrix_id_fkey FOREIGN KEY (sewing_skill_matrix_id) REFERENCES public.skill_matrix(id) ON DELETE SET NULL;


--
-- Name: monthly_payroll_items monthly_payroll_items_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll_items
    ADD CONSTRAINT monthly_payroll_items_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: monthly_payroll_items monthly_payroll_items_payroll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll_items
    ADD CONSTRAINT monthly_payroll_items_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES public.monthly_payroll(id) ON DELETE CASCADE;


--
-- Name: monthly_payroll_items monthly_payroll_items_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll_items
    ADD CONSTRAINT monthly_payroll_items_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: monthly_payroll monthly_payroll_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.monthly_payroll
    ADD CONSTRAINT monthly_payroll_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: overtime_records overtime_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.overtime_records
    ADD CONSTRAINT overtime_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: overtime_records overtime_records_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.overtime_records
    ADD CONSTRAINT overtime_records_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: payroll_calculation_traces payroll_calculation_traces_payroll_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_calculation_traces
    ADD CONSTRAINT payroll_calculation_traces_payroll_item_id_fkey FOREIGN KEY (payroll_item_id) REFERENCES public.monthly_payroll_items(id) ON DELETE CASCADE;


--
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: salary_payments salary_payments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_payments
    ADD CONSTRAINT salary_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: salary_payments salary_payments_payroll_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_payments
    ADD CONSTRAINT salary_payments_payroll_item_id_fkey FOREIGN KEY (payroll_item_id) REFERENCES public.monthly_payroll_items(id) ON DELETE CASCADE;


--
-- Name: severance_records severance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.severance_records
    ADD CONSTRAINT severance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gOTtS4YJpeBWBksgPjhaPkich79p0bxcN0qL7Yrbis0f4fEeh5yGnAEcedRjFhB

