--
-- PostgreSQL database dump
--

\restrict cY4tCH0Udqxlu5yqQReWajkahHgqmOxzLW8e2AHkcIM3SXGxzYKS76nlajSYcxA

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: hrm_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO hrm_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: hrm_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: date(); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.date() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$;


ALTER FUNCTION public.date() OWNER TO hrm_user;

--
-- Name: date(text[]); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.date(VARIADIC text[]) RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$;


ALTER FUNCTION public.date(VARIADIC text[]) OWNER TO hrm_user;

--
-- Name: date(text); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.date(text) RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$;


ALTER FUNCTION public.date(text) OWNER TO hrm_user;

--
-- Name: datetime(); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.datetime() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$;


ALTER FUNCTION public.datetime() OWNER TO hrm_user;

--
-- Name: datetime(text[]); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.datetime(VARIADIC text[]) RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$;


ALTER FUNCTION public.datetime(VARIADIC text[]) OWNER TO hrm_user;

--
-- Name: datetime(text); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.datetime(text) RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$;


ALTER FUNCTION public.datetime(text) OWNER TO hrm_user;

--
-- Name: instr(text, text); Type: FUNCTION; Schema: public; Owner: hrm_user
--

CREATE FUNCTION public.instr(text, text) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT POSITION($2 IN $1); $_$;


ALTER FUNCTION public.instr(text, text) OWNER TO hrm_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.announcements (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author_id text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    pinned integer DEFAULT 0,
    created_at text NOT NULL
);


ALTER TABLE public.announcements OWNER TO hrm_user;

--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.approval_requests (
    id text NOT NULL,
    request_number text NOT NULL,
    employee_id text NOT NULL,
    request_type text NOT NULL,
    item_name text NOT NULL,
    item_category text NOT NULL,
    requires_top_management integer DEFAULT 0 NOT NULL,
    current_salary real DEFAULT 0,
    proposed_salary real DEFAULT 0,
    estimated_cost real DEFAULT 0,
    quantity integer DEFAULT 1,
    urgency text DEFAULT 'Medium'::text,
    reason text NOT NULL,
    specifications text,
    status text DEFAULT 'Pending Line Manager'::text NOT NULL,
    line_manager_id text,
    line_manager_name text,
    line_manager_status text DEFAULT 'Pending'::text,
    line_manager_reviewed_at text,
    line_manager_comments text,
    hr_reviewer_id text,
    hr_reviewer_name text,
    hr_status text DEFAULT 'Pending'::text,
    hr_reviewed_at text,
    hr_comments text,
    top_management_id text,
    top_management_name text,
    top_management_status text DEFAULT 'Pending'::text,
    top_management_reviewed_at text,
    top_management_comments text,
    rejected_by_stage text,
    rejection_reason text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.approval_requests OWNER TO hrm_user;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    employee_id text NOT NULL,
    date text NOT NULL,
    clock_in text,
    clock_out text,
    status text NOT NULL,
    work_hours real DEFAULT 0,
    notes text,
    code text DEFAULT '1'::text,
    hours real DEFAULT 8.0,
    overtime_hours real DEFAULT 0.0,
    source text DEFAULT 'manual'::text
);


ALTER TABLE public.attendance OWNER TO hrm_user;

--
-- Name: attendance_corrections; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_corrections (
    id text NOT NULL,
    attendance_id text NOT NULL,
    employee_id text NOT NULL,
    date text NOT NULL,
    field_changed text NOT NULL,
    old_value text,
    new_value text NOT NULL,
    reason text NOT NULL,
    changed_by text NOT NULL,
    changed_at text NOT NULL
);


ALTER TABLE public.attendance_corrections OWNER TO hrm_user;

--
-- Name: attendance_device_commands; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_device_commands (
    id text NOT NULL,
    device_id text,
    target_key text NOT NULL,
    command text NOT NULL,
    status text DEFAULT 'PENDING'::text,
    created_at text NOT NULL,
    delivered_at text,
    executed_at text
);


ALTER TABLE public.attendance_device_commands OWNER TO hrm_user;

--
-- Name: attendance_device_users; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_device_users (
    id text NOT NULL,
    device_id text NOT NULL,
    device_user_id text NOT NULL,
    employee_id text,
    device_user_name text,
    card_number text,
    privilege text DEFAULT 'User'::text,
    has_fingerprint integer DEFAULT 0,
    has_face integer DEFAULT 0,
    has_card integer DEFAULT 0,
    has_password integer DEFAULT 0,
    biometric_status text DEFAULT 'Enrolled'::text,
    sync_status text DEFAULT 'Needs Mapping'::text,
    match_confidence real DEFAULT 0,
    match_method text DEFAULT 'Manual'::text,
    user_photo text,
    last_sync_at text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.attendance_device_users OWNER TO hrm_user;

--
-- Name: attendance_devices; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_devices (
    id text NOT NULL,
    name text NOT NULL,
    model text DEFAULT 'SpeedFace-V5L'::text NOT NULL,
    platform text DEFAULT 'ZAM230'::text,
    serial_number text,
    firmware_version text,
    mac_address text,
    fingerprint_alg text DEFAULT 'ZKFinger VX13.0'::text,
    face_alg text DEFAULT 'ZKFace VX3.6'::text,
    ip_address text NOT NULL,
    port integer DEFAULT 4370 NOT NULL,
    connection_type text DEFAULT 'TCP/IP'::text,
    auth_password text DEFAULT '0'::text,
    location text NOT NULL,
    site_name text DEFAULT 'Head Office'::text,
    department_id text,
    is_enabled integer DEFAULT 1,
    status text DEFAULT 'Offline'::text,
    last_connection text,
    last_successful_connection text,
    last_sync text,
    last_successful_sync text,
    last_error text,
    error_code text,
    last_sync_status text,
    user_count integer DEFAULT 0,
    log_count integer DEFAULT 0,
    fingerprint_count integer DEFAULT 0,
    face_count integer DEFAULT 0,
    device_time text,
    server_time text,
    time_difference_sec integer DEFAULT 0,
    sync_interval_minutes integer DEFAULT 5,
    connection_timeout integer DEFAULT 10,
    retry_attempts integer DEFAULT 3,
    auto_sync integer DEFAULT 1,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.attendance_devices OWNER TO hrm_user;

--
-- Name: attendance_raw_transactions; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_raw_transactions (
    id text NOT NULL,
    device_id text NOT NULL,
    device_user_id text NOT NULL,
    employee_id text,
    transaction_id text NOT NULL,
    attendance_timestamp text NOT NULL,
    punch_date text NOT NULL,
    punch_time text NOT NULL,
    attendance_type text DEFAULT 'Check-In'::text,
    verification_method text DEFAULT 'Fingerprint'::text,
    device_serial text,
    device_ip text,
    location text,
    raw_payload text,
    raw_data text,
    is_processed integer DEFAULT 0,
    processed_at text,
    attendance_record_id text,
    source text DEFAULT 'ZKTeco Direct'::text,
    created_at text NOT NULL
);


ALTER TABLE public.attendance_raw_transactions OWNER TO hrm_user;

--
-- Name: attendance_status_codes; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_status_codes (
    code text NOT NULL,
    name_en text NOT NULL,
    name_km text NOT NULL,
    description text,
    is_paid integer DEFAULT 1 NOT NULL,
    attendance_value real DEFAULT 1.0 NOT NULL,
    payroll_effect text DEFAULT 'full'::text NOT NULL,
    badge_color text DEFAULT '#059669'::text,
    badge_bg text DEFAULT '#ecfdf5'::text,
    is_active integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.attendance_status_codes OWNER TO hrm_user;

--
-- Name: attendance_sync_jobs; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_sync_jobs (
    id text NOT NULL,
    job_type text NOT NULL,
    device_id text,
    status text DEFAULT 'Pending'::text NOT NULL,
    started_at text,
    completed_at text,
    records_retrieved integer DEFAULT 0,
    records_created integer DEFAULT 0,
    duplicates integer DEFAULT 0,
    errors integer DEFAULT 0,
    retry_count integer DEFAULT 0,
    error_message text,
    error_code text,
    details text,
    created_at text NOT NULL
);


ALTER TABLE public.attendance_sync_jobs OWNER TO hrm_user;

--
-- Name: attendance_sync_logs; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.attendance_sync_logs (
    id text NOT NULL,
    "timestamp" text NOT NULL,
    device_id text,
    device_name text,
    operation text NOT NULL,
    result text NOT NULL,
    records_retrieved integer DEFAULT 0,
    records_created integer DEFAULT 0,
    duplicates integer DEFAULT 0,
    errors integer DEFAULT 0,
    duration_sec real DEFAULT 0,
    ip_address text,
    user_name text,
    details text,
    error_code text,
    created_at text NOT NULL
);


ALTER TABLE public.attendance_sync_logs OWNER TO hrm_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    user_name text,
    action text NOT NULL,
    module text NOT NULL,
    record_id text,
    old_value text,
    new_value text,
    ip_address text,
    created_at text NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO hrm_user;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.departments (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    manager_id text,
    color text DEFAULT '#3b82f6'::text
);


ALTER TABLE public.departments OWNER TO hrm_user;

--
-- Name: duty_roster; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.duty_roster (
    id text NOT NULL,
    employee_id text NOT NULL,
    date text NOT NULL,
    shift_type text NOT NULL,
    start_time text,
    end_time text,
    hours real DEFAULT 8.0,
    location text,
    notes text,
    created_at text NOT NULL
);


ALTER TABLE public.duty_roster OWNER TO hrm_user;

--
-- Name: employee_groups; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employee_groups (
    id text NOT NULL,
    name text NOT NULL,
    department_id text,
    description text,
    created_at text DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'::text) NOT NULL
);


ALTER TABLE public.employee_groups OWNER TO hrm_user;

--
-- Name: employee_medical_records; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employee_medical_records (
    id text NOT NULL,
    employee_id text NOT NULL,
    visit_date text NOT NULL,
    visit_time text,
    symptoms text NOT NULL,
    diagnosis text NOT NULL,
    temperature real,
    blood_pressure text,
    heart_rate integer,
    respiratory_rate integer,
    weight_kg real,
    medicine_prescribed text,
    dosage text,
    frequency text,
    duration text,
    doctor_name text NOT NULL,
    medical_notes text,
    recommended_action text,
    medical_leave_granted integer DEFAULT 0,
    medical_leave_days real DEFAULT 0,
    follow_up_date text,
    status text DEFAULT 'Completed'::text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.employee_medical_records OWNER TO hrm_user;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.employees (
    id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    role text NOT NULL,
    department_id text NOT NULL,
    employment_type text NOT NULL,
    employee_type text DEFAULT 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)'::text,
    status text NOT NULL,
    salary real NOT NULL,
    join_date text NOT NULL,
    manager_id text,
    avatar text,
    location text,
    bio text,
    emergency_contact_name text,
    emergency_contact_phone text,
    gender text DEFAULT 'ប្រុស (Male)'::text,
    dob text,
    nationality text DEFAULT 'កម្ពុជា (Cambodian)'::text,
    marital_status text DEFAULT 'នៅលីវ (Single)'::text,
    national_id text,
    current_address text,
    province_city text,
    district text,
    commune_sangkat text,
    village text,
    contract_type text DEFAULT 'UDC (មិនកំណត់ថិរវេលា)'::text,
    contract_start text,
    contract_end text,
    work_location text,
    salary_currency text DEFAULT 'USD ($)'::text,
    salary_frequency text DEFAULT 'ប្រចាំខែ (Monthly)'::text,
    bank_name text DEFAULT 'ABA Bank'::text,
    bank_account_name text,
    bank_account_number text,
    nssf_member text DEFAULT 'មាន (Yes)'::text,
    nssf_number text,
    nssf_reg_date text,
    emergency_contact_relationship text,
    emergency_contact_address text,
    doc_national_id text,
    doc_passport text,
    doc_contract text,
    doc_others text,
    created_at text NOT NULL,
    transport_allowance real DEFAULT 0,
    meal_allowance real DEFAULT 0,
    housing_allowance real DEFAULT 0,
    attendance_allowance real DEFAULT 0,
    skill_allowance real DEFAULT 0,
    seniority_bonus real DEFAULT 0,
    position_allowance real DEFAULT 0,
    sewing_skill_matrix real DEFAULT 0,
    labor_type text DEFAULT 'Direct Labour'::text,
    group_name text,
    group_id text,
    resignation_date text,
    working_period integer DEFAULT 0,
    khmer_name text,
    pay_grade text DEFAULT 'Grade 2'::text,
    last_salary_review text,
    monthly_eval_bonus real DEFAULT 0,
    severance_pay real DEFAULT 0
);


ALTER TABLE public.employees OWNER TO hrm_user;

--
-- Name: it_asset_logs; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.it_asset_logs (
    id text NOT NULL,
    asset_id text NOT NULL,
    action text NOT NULL,
    performed_by text NOT NULL,
    employee_id text,
    notes text,
    created_at text NOT NULL
);


ALTER TABLE public.it_asset_logs OWNER TO hrm_user;

--
-- Name: it_assets; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.it_assets (
    id text NOT NULL,
    asset_tag text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    serial_number text,
    status text DEFAULT 'Available'::text NOT NULL,
    condition text DEFAULT 'Good'::text NOT NULL,
    assigned_to text,
    assigned_date text,
    department_id text,
    location text,
    ip_address text,
    purchase_date text,
    purchase_cost real DEFAULT 0,
    warranty_end text,
    specs text,
    notes text,
    windows_operation text,
    m365_account text,
    local_account text,
    device_username text,
    device_password text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.it_assets OWNER TO hrm_user;

--
-- Name: it_m365_accounts; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.it_m365_accounts (
    id text NOT NULL,
    email text NOT NULL,
    display_name text NOT NULL,
    license_plan text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    assigned_to text,
    assigned_date text,
    mfa_status text DEFAULT 'Enforced'::text NOT NULL,
    mailbox_usage_gb real DEFAULT 0,
    mailbox_quota_gb real DEFAULT 50,
    onedrive_usage_gb real DEFAULT 0,
    onedrive_quota_gb real DEFAULT 1024,
    monthly_cost real DEFAULT 12.50,
    renewal_date text,
    admin_notes text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.it_m365_accounts OWNER TO hrm_user;

--
-- Name: job_candidates; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.job_candidates (
    id text NOT NULL,
    job_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    stage text DEFAULT 'Applied'::text NOT NULL,
    rating integer DEFAULT 3,
    applied_date text NOT NULL,
    notes text
);


ALTER TABLE public.job_candidates OWNER TO hrm_user;

--
-- Name: job_postings; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.job_postings (
    id text NOT NULL,
    title text NOT NULL,
    department_id text NOT NULL,
    location text NOT NULL,
    type text NOT NULL,
    experience_level text NOT NULL,
    salary_range text NOT NULL,
    description text,
    requirements text,
    status text DEFAULT 'Active'::text NOT NULL,
    posted_date text NOT NULL,
    applicants_count integer DEFAULT 0
);


ALTER TABLE public.job_postings OWNER TO hrm_user;

--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.leave_balances (
    id text NOT NULL,
    employee_id text NOT NULL,
    annual_total real DEFAULT 20,
    annual_used real DEFAULT 0,
    sick_total real DEFAULT 10,
    sick_used real DEFAULT 0,
    casual_total real DEFAULT 5,
    casual_used real DEFAULT 0
);


ALTER TABLE public.leave_balances OWNER TO hrm_user;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.leave_requests (
    id text NOT NULL,
    employee_id text NOT NULL,
    leave_type text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    days_count real NOT NULL,
    reason text,
    status text DEFAULT 'Pending Manager'::text NOT NULL,
    line_manager_id text,
    line_manager_reviewed_at text,
    line_manager_comments text,
    admin_reviewer_id text,
    admin_reviewed_at text,
    admin_comments text,
    reviewer_id text,
    reviewed_at text,
    reviewer_comments text,
    created_at text NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO hrm_user;

--
-- Name: medicine_issuances; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.medicine_issuances (
    id text NOT NULL,
    medical_record_id text,
    employee_id text NOT NULL,
    medicine_id text NOT NULL,
    quantity_issued integer NOT NULL,
    prescription_instruction text,
    dosage text,
    frequency text,
    duration text,
    issued_by text NOT NULL,
    issued_at text NOT NULL,
    cost_at_issue real DEFAULT 0.0,
    total_cost real DEFAULT 0.0,
    batch_number text,
    notes text
);


ALTER TABLE public.medicine_issuances OWNER TO hrm_user;

--
-- Name: medicine_stock_transactions; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.medicine_stock_transactions (
    id text NOT NULL,
    medicine_id text NOT NULL,
    transaction_type text NOT NULL,
    quantity integer NOT NULL,
    batch_number text,
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    unit_cost real DEFAULT 0.0,
    total_cost real DEFAULT 0.0,
    supplier_or_dest text,
    reference_id text,
    performed_by text NOT NULL,
    notes text,
    created_at text NOT NULL
);


ALTER TABLE public.medicine_stock_transactions OWNER TO hrm_user;

--
-- Name: medicines; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.medicines (
    id text NOT NULL,
    name text NOT NULL,
    generic_name text,
    category text NOT NULL,
    unit text NOT NULL,
    dosage text NOT NULL,
    supplier text,
    batch_number text NOT NULL,
    expiry_date text NOT NULL,
    quantity_in_stock integer DEFAULT 0,
    min_stock_level integer DEFAULT 10,
    purchase_price real DEFAULT 0.0,
    status text DEFAULT 'In Stock'::text,
    storage_location text,
    description text,
    side_effects text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.medicines OWNER TO hrm_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text,
    role text DEFAULT 'All'::text,
    title text NOT NULL,
    title_km text,
    message text,
    message_km text,
    type text NOT NULL,
    link text DEFAULT '/'::text NOT NULL,
    is_read integer DEFAULT 0 NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.notifications OWNER TO hrm_user;

--
-- Name: overtime_requests; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.overtime_requests (
    id text NOT NULL,
    employee_id text NOT NULL,
    date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    hours real NOT NULL,
    ot_rate_type text NOT NULL,
    multiplier real DEFAULT 1.5 NOT NULL,
    hourly_rate real DEFAULT 0,
    estimated_pay real DEFAULT 0,
    reason text NOT NULL,
    project_name text,
    status text DEFAULT 'Pending Manager'::text NOT NULL,
    line_manager_id text,
    line_manager_reviewed_at text,
    line_manager_comments text,
    admin_reviewer_id text,
    admin_reviewed_at text,
    admin_comments text,
    created_at text NOT NULL
);


ALTER TABLE public.overtime_requests OWNER TO hrm_user;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.payroll_periods (
    id text NOT NULL,
    name text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    working_days real DEFAULT 26 NOT NULL,
    working_hours_per_day real DEFAULT 8 NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    locked_by text,
    locked_at text,
    approved_by text,
    approved_at text,
    notes text,
    created_at text NOT NULL
);


ALTER TABLE public.payroll_periods OWNER TO hrm_user;

--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.payrolls (
    id text NOT NULL,
    employee_id text NOT NULL,
    pay_period text NOT NULL,
    payment_date text NOT NULL,
    base_salary real NOT NULL,
    allowances real DEFAULT 0,
    bonuses real DEFAULT 0,
    tax_deduction real DEFAULT 0,
    insurance_deduction real DEFAULT 0,
    other_deductions real DEFAULT 0,
    net_salary real NOT NULL,
    status text DEFAULT 'Paid'::text NOT NULL,
    payment_method text DEFAULT 'Direct Deposit'::text,
    created_at text NOT NULL,
    working_days real DEFAULT 26,
    absent_days real DEFAULT 0,
    unpaid_days real DEFAULT 0,
    basic_working_salary real DEFAULT 0,
    seniority_bonus real DEFAULT 0,
    position_allowance real DEFAULT 0,
    sewing_skill_matrix real DEFAULT 0,
    skill_allowance real DEFAULT 0,
    transport_housing real DEFAULT 0,
    attendance_allowance real DEFAULT 0,
    food_allowance real DEFAULT 0,
    overtime_pay real DEFAULT 0,
    overtime_food real DEFAULT 0,
    achievement_bonus real DEFAULT 0,
    monthly_eval_bonus real DEFAULT 0,
    annual_leave real DEFAULT 0,
    salary_adjustment real DEFAULT 0,
    gross_salary real DEFAULT 0,
    non_taxable_amount real DEFAULT 0,
    taxable_salary_usd real DEFAULT 0,
    taxable_salary_khr real DEFAULT 0,
    pension_usd real DEFAULT 0,
    pension_khr real DEFAULT 0,
    dependents_count integer DEFAULT 0,
    taxable_base_khr real DEFAULT 0,
    tax_rate text DEFAULT '0%'::text,
    tax_khr real DEFAULT 0,
    tax_usd real DEFAULT 0,
    after_tax_salary real DEFAULT 0,
    first_paid real DEFAULT 0,
    target_bonus real DEFAULT 0,
    severance_pay real DEFAULT 0,
    seniority_payback real DEFAULT 0,
    paid_final_salary real DEFAULT 0,
    second_paid real DEFAULT 0,
    total_paid real DEFAULT 0,
    labor_type text DEFAULT 'Direct Labour'::text,
    exchange_rate_khr real DEFAULT 4044,
    nssf_rate_khr real DEFAULT 4049,
    calculation_trace text,
    period_id text,
    locked_at text
);


ALTER TABLE public.payrolls OWNER TO hrm_user;

--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.performance_reviews (
    id text NOT NULL,
    employee_id text NOT NULL,
    reviewer_id text NOT NULL,
    review_period text NOT NULL,
    rating real NOT NULL,
    goals_achievement real NOT NULL,
    strengths text,
    areas_for_growth text,
    status text DEFAULT 'Completed'::text NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.performance_reviews OWNER TO hrm_user;

--
-- Name: salary_adjustments; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.salary_adjustments (
    id text NOT NULL,
    employee_id text NOT NULL,
    previous_salary real NOT NULL,
    new_salary real NOT NULL,
    increase_amount real NOT NULL,
    increase_percentage real NOT NULL,
    effective_date text NOT NULL,
    adjustment_type text NOT NULL,
    currency text DEFAULT 'USD ($)'::text,
    reason text,
    approved_by text,
    created_at text NOT NULL
);


ALTER TABLE public.salary_adjustments OWNER TO hrm_user;

--
-- Name: sewing_bonus_rules; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.sewing_bonus_rules (
    id text NOT NULL,
    group_name text,
    weekly_target_qty integer DEFAULT 1200 NOT NULL,
    base_bonus real DEFAULT 5.0 NOT NULL,
    tier_1_min_pct real DEFAULT 100.0 NOT NULL,
    tier_1_bonus real DEFAULT 10.0 NOT NULL,
    tier_2_min_pct real DEFAULT 110.0 NOT NULL,
    tier_2_bonus real DEFAULT 15.0 NOT NULL,
    tier_3_min_pct real DEFAULT 120.0 NOT NULL,
    tier_3_bonus real DEFAULT 20.0 NOT NULL,
    is_active integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.sewing_bonus_rules OWNER TO hrm_user;

--
-- Name: sewing_production_weekly; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.sewing_production_weekly (
    id text NOT NULL,
    week_number integer NOT NULL,
    week_start text NOT NULL,
    week_end text NOT NULL,
    month text NOT NULL,
    employee_id text NOT NULL,
    group_name text DEFAULT 'Sew-L.1'::text NOT NULL,
    mon_qty integer DEFAULT 0 NOT NULL,
    tue_qty integer DEFAULT 0 NOT NULL,
    wed_qty integer DEFAULT 0 NOT NULL,
    thu_qty integer DEFAULT 0 NOT NULL,
    fri_qty integer DEFAULT 0 NOT NULL,
    sat_qty integer DEFAULT 0 NOT NULL,
    total_qty integer DEFAULT 0 NOT NULL,
    target_qty integer DEFAULT 1200 NOT NULL,
    achievement_pct real DEFAULT 0 NOT NULL,
    bonus_amount real DEFAULT 0 NOT NULL,
    status text DEFAULT 'Approved'::text NOT NULL,
    notes text,
    created_at text NOT NULL
);


ALTER TABLE public.sewing_production_weekly OWNER TO hrm_user;

--
-- Name: system_meta; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.system_meta (
    key text NOT NULL,
    value text
);


ALTER TABLE public.system_meta OWNER TO hrm_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hrm_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text,
    name text NOT NULL,
    email text,
    role text DEFAULT 'Employee'::text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    employee_id text,
    department_name text,
    avatar text,
    two_factor_enabled integer DEFAULT 0,
    permissions text,
    password text DEFAULT '@9218njo0(TWp<3q"(3{'::text,
    last_login text,
    created_at text NOT NULL
);


ALTER TABLE public.users OWNER TO hrm_user;

--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.announcements (id, title, content, author_id, category, pinned, created_at) FROM stdin;
\.


--
-- Data for Name: approval_requests; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.approval_requests (id, request_number, employee_id, request_type, item_name, item_category, requires_top_management, current_salary, proposed_salary, estimated_cost, quantity, urgency, reason, specifications, status, line_manager_id, line_manager_name, line_manager_status, line_manager_reviewed_at, line_manager_comments, hr_reviewer_id, hr_reviewer_name, hr_status, hr_reviewed_at, hr_comments, top_management_id, top_management_name, top_management_status, top_management_reviewed_at, top_management_comments, rejected_by_stage, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance (id, employee_id, date, clock_in, clock_out, status, work_hours, notes, code, hours, overtime_hours, source) FROM stdin;
att-EMP-2026-004-2026-10-01	EMP-2026-004	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-02	EMP-2026-004	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-03	EMP-2026-004	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-04	EMP-2026-004	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-10-05	EMP-2026-004	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-06	EMP-2026-004	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-07	EMP-2026-004	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-08	EMP-2026-004	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-09	EMP-2026-004	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-10	EMP-2026-004	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-12	EMP-2026-004	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-13	EMP-2026-004	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-14	EMP-2026-004	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-15	EMP-2026-004	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-16	EMP-2026-004	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-17	EMP-2026-004	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-18	EMP-2026-004	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-10-19	EMP-2026-004	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-20	EMP-2026-004	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-21	EMP-2026-004	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-22	EMP-2026-004	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-23	EMP-2026-004	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-24	EMP-2026-004	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-11	EMP-2026-004	2026-10-11	02:58:30	02:58:43	Present	0.1	Sunday Weekly Rest | Faced in via ZKTeco SpeedFace-V5L (ZKTeco-01 - Main Entrance) | Alg: ZKFace VX3.6 | Conf: 99.1% | Faced out via ZKTeco SpeedFace-V5L (ZKTeco-01 - Main Entrance) at 02:58:43 [Conf: 98.6%]	OFF	0	0	calendar
att-EMP-2026-004-2026-10-25	EMP-2026-004	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-10-26	EMP-2026-004	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-27	EMP-2026-004	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-28	EMP-2026-004	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-29	EMP-2026-004	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-30	EMP-2026-004	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-10-31	EMP-2026-004	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-01	EMP-2026-008	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-02	EMP-2026-008	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-03	EMP-2026-008	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-04	EMP-2026-008	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-10-05	EMP-2026-008	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-06	EMP-2026-008	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-07	EMP-2026-008	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-08	EMP-2026-008	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-09	EMP-2026-008	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-10	EMP-2026-008	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-11	EMP-2026-008	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-10-12	EMP-2026-008	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-13	EMP-2026-008	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-14	EMP-2026-008	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-15	EMP-2026-008	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-16	EMP-2026-008	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-17	EMP-2026-008	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-18	EMP-2026-008	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-10-19	EMP-2026-008	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-20	EMP-2026-008	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-21	EMP-2026-008	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-22	EMP-2026-008	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-23	EMP-2026-008	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-24	EMP-2026-008	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-25	EMP-2026-008	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-10-26	EMP-2026-008	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-27	EMP-2026-008	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-28	EMP-2026-008	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-29	EMP-2026-008	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-30	EMP-2026-008	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-10-31	EMP-2026-008	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-01	EMP-2026-005	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-02	EMP-2026-005	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-03	EMP-2026-005	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-04	EMP-2026-005	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-10-05	EMP-2026-005	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-06	EMP-2026-005	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-07	EMP-2026-005	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-08	EMP-2026-005	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-09	EMP-2026-005	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-10	EMP-2026-005	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-11	EMP-2026-005	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-10-12	EMP-2026-005	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-13	EMP-2026-005	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-14	EMP-2026-005	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-15	EMP-2026-005	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-16	EMP-2026-005	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-17	EMP-2026-005	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-18	EMP-2026-005	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-10-19	EMP-2026-005	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-20	EMP-2026-005	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-21	EMP-2026-005	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-22	EMP-2026-005	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-23	EMP-2026-005	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-24	EMP-2026-005	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-25	EMP-2026-005	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-10-26	EMP-2026-005	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-27	EMP-2026-005	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-28	EMP-2026-005	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-29	EMP-2026-005	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-30	EMP-2026-005	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-10-31	EMP-2026-005	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-01	EMP-2026-006	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-02	EMP-2026-006	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-03	EMP-2026-006	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-04	EMP-2026-006	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-10-05	EMP-2026-006	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-06	EMP-2026-006	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-07	EMP-2026-006	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-08	EMP-2026-006	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-09	EMP-2026-006	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-10	EMP-2026-006	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-11	EMP-2026-006	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-10-12	EMP-2026-006	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-13	EMP-2026-006	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-14	EMP-2026-006	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-15	EMP-2026-006	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-16	EMP-2026-006	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-17	EMP-2026-006	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-18	EMP-2026-006	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-10-19	EMP-2026-006	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-20	EMP-2026-006	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-21	EMP-2026-006	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-22	EMP-2026-006	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-23	EMP-2026-006	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-24	EMP-2026-006	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-25	EMP-2026-006	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-10-26	EMP-2026-006	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-27	EMP-2026-006	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-28	EMP-2026-006	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-29	EMP-2026-006	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-30	EMP-2026-006	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-10-31	EMP-2026-006	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-01	EMP-2026-003	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-02	EMP-2026-003	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-03	EMP-2026-003	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-04	EMP-2026-003	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-10-05	EMP-2026-003	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-06	EMP-2026-003	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-07	EMP-2026-003	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-08	EMP-2026-003	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-09	EMP-2026-003	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-10	EMP-2026-003	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-11	EMP-2026-003	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-10-12	EMP-2026-003	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-13	EMP-2026-003	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-14	EMP-2026-003	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-15	EMP-2026-003	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-16	EMP-2026-003	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-17	EMP-2026-003	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-18	EMP-2026-003	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-10-19	EMP-2026-003	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-20	EMP-2026-003	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-21	EMP-2026-003	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-22	EMP-2026-003	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-23	EMP-2026-003	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-24	EMP-2026-003	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-25	EMP-2026-003	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-10-26	EMP-2026-003	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-27	EMP-2026-003	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-28	EMP-2026-003	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-29	EMP-2026-003	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-30	EMP-2026-003	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-10-31	EMP-2026-003	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-01	EMP-2026-010	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-02	EMP-2026-010	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-03	EMP-2026-010	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-04	EMP-2026-010	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-10-05	EMP-2026-010	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-06	EMP-2026-010	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-07	EMP-2026-010	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-08	EMP-2026-010	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-09	EMP-2026-010	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-10	EMP-2026-010	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-11	EMP-2026-010	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-10-12	EMP-2026-010	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-13	EMP-2026-010	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-14	EMP-2026-010	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-15	EMP-2026-010	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-16	EMP-2026-010	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-17	EMP-2026-010	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-18	EMP-2026-010	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-10-19	EMP-2026-010	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-20	EMP-2026-010	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-21	EMP-2026-010	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-22	EMP-2026-010	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-23	EMP-2026-010	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-24	EMP-2026-010	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-25	EMP-2026-010	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-10-26	EMP-2026-010	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-27	EMP-2026-010	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-28	EMP-2026-010	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-29	EMP-2026-010	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-30	EMP-2026-010	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-10-31	EMP-2026-010	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-01	EMP-2026-002	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-02	EMP-2026-002	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-03	EMP-2026-002	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-04	EMP-2026-002	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-10-05	EMP-2026-002	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-06	EMP-2026-002	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-07	EMP-2026-002	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-08	EMP-2026-002	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-09	EMP-2026-002	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-10	EMP-2026-002	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-11	EMP-2026-002	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-10-12	EMP-2026-002	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-13	EMP-2026-002	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-14	EMP-2026-002	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-15	EMP-2026-002	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-16	EMP-2026-002	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-17	EMP-2026-002	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-18	EMP-2026-002	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-10-19	EMP-2026-002	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-20	EMP-2026-002	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-21	EMP-2026-002	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-22	EMP-2026-002	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-23	EMP-2026-002	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-24	EMP-2026-002	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-25	EMP-2026-002	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-10-26	EMP-2026-002	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-27	EMP-2026-002	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-28	EMP-2026-002	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-29	EMP-2026-002	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-30	EMP-2026-002	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-10-31	EMP-2026-002	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-01	EMP-2026-009	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-02	EMP-2026-009	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-03	EMP-2026-009	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-04	EMP-2026-009	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-10-05	EMP-2026-009	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-06	EMP-2026-009	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-07	EMP-2026-009	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-08	EMP-2026-009	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-09	EMP-2026-009	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-10	EMP-2026-009	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-11	EMP-2026-009	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-10-12	EMP-2026-009	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-13	EMP-2026-009	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-14	EMP-2026-009	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-15	EMP-2026-009	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-16	EMP-2026-009	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-17	EMP-2026-009	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-18	EMP-2026-009	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-10-19	EMP-2026-009	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-20	EMP-2026-009	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-21	EMP-2026-009	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-22	EMP-2026-009	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-23	EMP-2026-009	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-24	EMP-2026-009	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-25	EMP-2026-009	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-10-26	EMP-2026-009	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-27	EMP-2026-009	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-28	EMP-2026-009	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-29	EMP-2026-009	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-30	EMP-2026-009	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-10-31	EMP-2026-009	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-01	EMP-2026-007	2026-10-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-02	EMP-2026-007	2026-10-02	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-03	EMP-2026-007	2026-10-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-04	EMP-2026-007	2026-10-04	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-10-05	EMP-2026-007	2026-10-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-06	EMP-2026-007	2026-10-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-07	EMP-2026-007	2026-10-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-08	EMP-2026-007	2026-10-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-09	EMP-2026-007	2026-10-09	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-10	EMP-2026-007	2026-10-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-11	EMP-2026-007	2026-10-11	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-10-12	EMP-2026-007	2026-10-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-13	EMP-2026-007	2026-10-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-14	EMP-2026-007	2026-10-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-15	EMP-2026-007	2026-10-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-16	EMP-2026-007	2026-10-16	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-17	EMP-2026-007	2026-10-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-18	EMP-2026-007	2026-10-18	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-10-19	EMP-2026-007	2026-10-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-20	EMP-2026-007	2026-10-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-21	EMP-2026-007	2026-10-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-22	EMP-2026-007	2026-10-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-23	EMP-2026-007	2026-10-23	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-24	EMP-2026-007	2026-10-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-25	EMP-2026-007	2026-10-25	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-10-26	EMP-2026-007	2026-10-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-27	EMP-2026-007	2026-10-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-28	EMP-2026-007	2026-10-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-29	EMP-2026-007	2026-10-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-30	EMP-2026-007	2026-10-30	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-10-31	EMP-2026-007	2026-10-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-01	EMP-2026-002	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-02	EMP-2026-002	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-08-03	EMP-2026-002	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-04	EMP-2026-002	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-05	EMP-2026-002	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-06	EMP-2026-002	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-07	EMP-2026-002	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-08	EMP-2026-002	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-09	EMP-2026-002	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-08-10	EMP-2026-002	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-11	EMP-2026-002	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-12	EMP-2026-002	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-13	EMP-2026-002	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-14	EMP-2026-002	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-15	EMP-2026-002	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-16	EMP-2026-002	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-08-17	EMP-2026-002	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-18	EMP-2026-002	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-19	EMP-2026-002	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-20	EMP-2026-002	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-21	EMP-2026-002	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-22	EMP-2026-002	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-23	EMP-2026-002	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-08-24	EMP-2026-002	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-25	EMP-2026-002	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-26	EMP-2026-002	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-27	EMP-2026-002	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-28	EMP-2026-002	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-29	EMP-2026-002	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-002-2026-08-30	EMP-2026-002	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-002-2026-08-31	EMP-2026-002	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-01	EMP-2026-003	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-02	EMP-2026-003	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-08-03	EMP-2026-003	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-04	EMP-2026-003	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-05	EMP-2026-003	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-06	EMP-2026-003	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-07	EMP-2026-003	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-08	EMP-2026-003	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-09	EMP-2026-003	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-08-10	EMP-2026-003	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-11	EMP-2026-003	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-12	EMP-2026-003	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-13	EMP-2026-003	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-14	EMP-2026-003	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-15	EMP-2026-003	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-16	EMP-2026-003	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-08-17	EMP-2026-003	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-18	EMP-2026-003	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-19	EMP-2026-003	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-20	EMP-2026-003	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-21	EMP-2026-003	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-22	EMP-2026-003	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-23	EMP-2026-003	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-08-24	EMP-2026-003	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-25	EMP-2026-003	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-26	EMP-2026-003	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-27	EMP-2026-003	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-28	EMP-2026-003	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-29	EMP-2026-003	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-003-2026-08-30	EMP-2026-003	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-003-2026-08-31	EMP-2026-003	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-01	EMP-2026-004	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-02	EMP-2026-004	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-08-03	EMP-2026-004	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-04	EMP-2026-004	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-05	EMP-2026-004	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-06	EMP-2026-004	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-07	EMP-2026-004	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-08	EMP-2026-004	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-09	EMP-2026-004	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-08-10	EMP-2026-004	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-11	EMP-2026-004	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-12	EMP-2026-004	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-13	EMP-2026-004	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-14	EMP-2026-004	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-15	EMP-2026-004	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-16	EMP-2026-004	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-08-17	EMP-2026-004	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-18	EMP-2026-004	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-19	EMP-2026-004	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-20	EMP-2026-004	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-21	EMP-2026-004	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-22	EMP-2026-004	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-23	EMP-2026-004	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-08-24	EMP-2026-004	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-25	EMP-2026-004	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-26	EMP-2026-004	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-27	EMP-2026-004	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-28	EMP-2026-004	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-29	EMP-2026-004	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-004-2026-08-30	EMP-2026-004	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-004-2026-08-31	EMP-2026-004	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-01	EMP-2026-005	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-02	EMP-2026-005	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-08-03	EMP-2026-005	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-04	EMP-2026-005	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-05	EMP-2026-005	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-06	EMP-2026-005	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-07	EMP-2026-005	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-08	EMP-2026-005	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-09	EMP-2026-005	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-08-10	EMP-2026-005	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-11	EMP-2026-005	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-12	EMP-2026-005	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-13	EMP-2026-005	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-14	EMP-2026-005	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-15	EMP-2026-005	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-16	EMP-2026-005	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-08-17	EMP-2026-005	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-18	EMP-2026-005	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-19	EMP-2026-005	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-20	EMP-2026-005	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-21	EMP-2026-005	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-22	EMP-2026-005	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-23	EMP-2026-005	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-08-24	EMP-2026-005	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-25	EMP-2026-005	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-26	EMP-2026-005	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-27	EMP-2026-005	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-28	EMP-2026-005	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-29	EMP-2026-005	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-005-2026-08-30	EMP-2026-005	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-005-2026-08-31	EMP-2026-005	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-01	EMP-2026-006	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-02	EMP-2026-006	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-08-03	EMP-2026-006	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-04	EMP-2026-006	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-05	EMP-2026-006	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-06	EMP-2026-006	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-07	EMP-2026-006	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-08	EMP-2026-006	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-09	EMP-2026-006	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-08-10	EMP-2026-006	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-11	EMP-2026-006	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-12	EMP-2026-006	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-13	EMP-2026-006	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-14	EMP-2026-006	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-15	EMP-2026-006	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-16	EMP-2026-006	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-08-17	EMP-2026-006	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-18	EMP-2026-006	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-19	EMP-2026-006	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-20	EMP-2026-006	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-21	EMP-2026-006	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-22	EMP-2026-006	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-23	EMP-2026-006	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-08-24	EMP-2026-006	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-25	EMP-2026-006	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-26	EMP-2026-006	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-27	EMP-2026-006	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-28	EMP-2026-006	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-29	EMP-2026-006	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-006-2026-08-30	EMP-2026-006	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-006-2026-08-31	EMP-2026-006	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-01	EMP-2026-007	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-02	EMP-2026-007	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-08-03	EMP-2026-007	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-04	EMP-2026-007	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-05	EMP-2026-007	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-06	EMP-2026-007	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-07	EMP-2026-007	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-08	EMP-2026-007	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-09	EMP-2026-007	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-08-10	EMP-2026-007	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-11	EMP-2026-007	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-12	EMP-2026-007	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-13	EMP-2026-007	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-14	EMP-2026-007	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-15	EMP-2026-007	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-16	EMP-2026-007	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-08-17	EMP-2026-007	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-18	EMP-2026-007	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-19	EMP-2026-007	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-20	EMP-2026-007	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-21	EMP-2026-007	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-22	EMP-2026-007	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-23	EMP-2026-007	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-08-24	EMP-2026-007	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-25	EMP-2026-007	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-26	EMP-2026-007	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-27	EMP-2026-007	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-28	EMP-2026-007	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-29	EMP-2026-007	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-007-2026-08-30	EMP-2026-007	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-007-2026-08-31	EMP-2026-007	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-01	EMP-2026-008	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-02	EMP-2026-008	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-08-03	EMP-2026-008	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-04	EMP-2026-008	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-05	EMP-2026-008	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-06	EMP-2026-008	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-07	EMP-2026-008	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-08	EMP-2026-008	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-09	EMP-2026-008	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-08-10	EMP-2026-008	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-11	EMP-2026-008	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-12	EMP-2026-008	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-13	EMP-2026-008	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-14	EMP-2026-008	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-15	EMP-2026-008	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-16	EMP-2026-008	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-08-17	EMP-2026-008	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-18	EMP-2026-008	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-19	EMP-2026-008	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-20	EMP-2026-008	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-21	EMP-2026-008	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-22	EMP-2026-008	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-23	EMP-2026-008	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-08-24	EMP-2026-008	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-25	EMP-2026-008	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-26	EMP-2026-008	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-27	EMP-2026-008	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-28	EMP-2026-008	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-29	EMP-2026-008	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-008-2026-08-30	EMP-2026-008	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-008-2026-08-31	EMP-2026-008	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-01	EMP-2026-009	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-02	EMP-2026-009	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-08-03	EMP-2026-009	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-04	EMP-2026-009	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-05	EMP-2026-009	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-06	EMP-2026-009	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-07	EMP-2026-009	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-08	EMP-2026-009	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-09	EMP-2026-009	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-08-10	EMP-2026-009	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-11	EMP-2026-009	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-12	EMP-2026-009	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-13	EMP-2026-009	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-14	EMP-2026-009	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-15	EMP-2026-009	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-16	EMP-2026-009	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-08-17	EMP-2026-009	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-18	EMP-2026-009	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-19	EMP-2026-009	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-20	EMP-2026-009	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-21	EMP-2026-009	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-22	EMP-2026-009	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-23	EMP-2026-009	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-08-24	EMP-2026-009	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-25	EMP-2026-009	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-26	EMP-2026-009	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-27	EMP-2026-009	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-28	EMP-2026-009	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-29	EMP-2026-009	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-009-2026-08-30	EMP-2026-009	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-009-2026-08-31	EMP-2026-009	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-01	EMP-2026-010	2026-08-01	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-02	EMP-2026-010	2026-08-02	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-08-03	EMP-2026-010	2026-08-03	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-04	EMP-2026-010	2026-08-04	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-05	EMP-2026-010	2026-08-05	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-06	EMP-2026-010	2026-08-06	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-07	EMP-2026-010	2026-08-07	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-08	EMP-2026-010	2026-08-08	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-09	EMP-2026-010	2026-08-09	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-08-10	EMP-2026-010	2026-08-10	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-11	EMP-2026-010	2026-08-11	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-12	EMP-2026-010	2026-08-12	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-13	EMP-2026-010	2026-08-13	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-14	EMP-2026-010	2026-08-14	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-15	EMP-2026-010	2026-08-15	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-16	EMP-2026-010	2026-08-16	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-08-17	EMP-2026-010	2026-08-17	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-18	EMP-2026-010	2026-08-18	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-19	EMP-2026-010	2026-08-19	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-20	EMP-2026-010	2026-08-20	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-21	EMP-2026-010	2026-08-21	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-22	EMP-2026-010	2026-08-22	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-23	EMP-2026-010	2026-08-23	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-08-24	EMP-2026-010	2026-08-24	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-25	EMP-2026-010	2026-08-25	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-26	EMP-2026-010	2026-08-26	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-27	EMP-2026-010	2026-08-27	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-28	EMP-2026-010	2026-08-28	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-29	EMP-2026-010	2026-08-29	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-EMP-2026-010-2026-08-30	EMP-2026-010	2026-08-30	\N	\N	Rest Day	0	Sunday Weekly Rest	OFF	0	0	calendar
att-EMP-2026-010-2026-08-31	EMP-2026-010	2026-08-31	07:30:00	16:30:00	Present	8	\N	1	8	0	biometric
att-usr-admin-2026-10-10-8493	usr-admin	2026-10-10	01:45:58	01:46:01	Present	0.1	Clocked in manually via HESTRA HRM Web | Shift ended manually	1	8	0	manual
att-EMP-001-2026-10-10-0264	EMP-001	2026-10-10	02:40:57	\N	Present	0	Faced in via ZKTeco SpeedFace-V5L (ZKTeco-01 - Main Entrance) | Alg: ZKFace VX3.6 | Conf: 98.8% | Faced out via ZKTeco SpeedFace-V5L (ZKTeco-01 - Main Entrance) at 02:04:20 [Conf: 99.2%] | Faced in via ZKTeco SpeedFace-V5L (ZKTeco-01 - Main Entrance) | Alg: ZKFace VX3.6 | Conf: 99.1%	1	8	0	manual
\.


--
-- Data for Name: attendance_corrections; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_corrections (id, attendance_id, employee_id, date, field_changed, old_value, new_value, reason, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: attendance_device_commands; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_device_commands (id, device_id, target_key, command, status, created_at, delivered_at, executed_at) FROM stdin;
9809705	zk-01	sf5l2026001	DATA QUERY USERPIC PIN=003	PENDING	2026-10-09T10:16:20.970Z	\N	\N
98097035	zk-01	sf5l2026001	DATA QUERY BIOPHOTO PIN=003	PENDING	2026-10-09T10:16:20.971Z	\N	\N
\.


--
-- Data for Name: attendance_device_users; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_device_users (id, device_id, device_user_id, employee_id, device_user_name, card_number, privilege, has_fingerprint, has_face, has_card, has_password, biometric_status, sync_status, match_confidence, match_method, user_photo, last_sync_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_devices; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_devices (id, name, model, platform, serial_number, firmware_version, mac_address, fingerprint_alg, face_alg, ip_address, port, connection_type, auth_password, location, site_name, department_id, is_enabled, status, last_connection, last_successful_connection, last_sync, last_successful_sync, last_error, error_code, last_sync_status, user_count, log_count, fingerprint_count, face_count, device_time, server_time, time_difference_sec, sync_interval_minutes, connection_timeout, retry_attempts, auto_sync, created_at, updated_at) FROM stdin;
zk-02	ZKTeco-02	SpeedFace-V5L	ZAM230	SF5L2026002	Ver 6.60 (ZAM230)	\N	ZKFinger VX13.0	ZKFace VX3.6	192.168.88.202	8081	Push/ADMS	0	Secondary Entrance	Secondary Entrance	dept-prod	1	Offline	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	\N	\N	0	5	10	3	1	2026-10-08 14:38:06	2026-10-08 14:38:06
zk-01	ZKTeco-01	SpeedFace-V5L	ZAM230	SF5L2026001	Ver 6.60 (ZAM230)	\N	ZKFinger VX13.0	ZKFace VX3.6	192.168.88.201	8081	Push/ADMS	0	Main Entrance	Main Entrance	dept-prod	1	Offline	2026-10-09T10:16:20.955Z	\N	\N	\N	\N	\N	\N	1	0	0	1	\N	\N	0	5	10	3	1	2026-10-08 14:38:06	2026-10-09T10:16:20.961Z
\.


--
-- Data for Name: attendance_raw_transactions; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_raw_transactions (id, device_id, device_user_id, employee_id, transaction_id, attendance_timestamp, punch_date, punch_time, attendance_type, verification_method, device_serial, device_ip, location, raw_payload, raw_data, is_processed, processed_at, attendance_record_id, source, created_at) FROM stdin;
raw-face-1791597850265-99udv	zk-01	EMP-001	EMP-001	TX-FACE-1791597850265	2026-10-10T02:04:10.263Z	2026-10-10	02:04:10	Check-In	Face	SF5L2026001	192.168.88.201	Main Entrance	{"source":"ZKTeco SpeedFace Camera","algorithm":"ZKFace VX3.6","confidence":0.988,"device_name":"ZKTeco-01","verified":true,"mode":"Visible Light Facial Biometric"}	\N	1	2026-10-10T02:04:10.263Z	att-EMP-001-2026-10-10-0264	ZKTeco SpeedFace Camera	2026-10-10T02:04:10.263Z
raw-face-1791597860913-wmmkl	zk-01	EMP-001	EMP-001	TX-FACE-1791597860913	2026-10-10T02:04:20.911Z	2026-10-10	02:04:20	Check-Out	Face	SF5L2026001	192.168.88.201	Main Entrance	{"source":"ZKTeco SpeedFace Camera","algorithm":"ZKFace VX3.6","confidence":0.992,"device_name":"ZKTeco-01","verified":true,"mode":"Visible Light Facial Biometric"}	\N	1	2026-10-10T02:04:20.911Z	att-EMP-001-2026-10-10-0264	ZKTeco SpeedFace Camera	2026-10-10T02:04:20.911Z
raw-face-1791600057174-b8ycd	zk-01	EMP-001	EMP-001	TX-FACE-1791600057174	2026-10-10T02:40:57.172Z	2026-10-10	02:40:57	Check-In	Face	SF5L2026001	192.168.88.201	Main Entrance	{"source":"ZKTeco SpeedFace Camera","algorithm":"ZKFace VX3.6","confidence":0.991,"device_name":"ZKTeco-01","verified":true,"mode":"Visible Light Facial Biometric"}	\N	1	2026-10-10T02:40:57.172Z	att-EMP-001-2026-10-10-0264	ZKTeco SpeedFace Camera	2026-10-10T02:40:57.172Z
raw-face-1791687511037-0a48m	zk-01	EMP-2026-004	EMP-2026-004	TX-FACE-1791687511037	2026-10-11T02:58:30.991Z	2026-10-11	02:58:30	Check-In	Face	SF5L2026001	192.168.88.201	Main Entrance	{"source":"ZKTeco SpeedFace Camera","algorithm":"ZKFace VX3.6","confidence":0.991,"device_name":"ZKTeco-01","verified":true,"mode":"Visible Light Facial Biometric"}	\N	1	2026-10-11T02:58:30.991Z	att-EMP-2026-004-2026-10-11	ZKTeco SpeedFace Camera	2026-10-11T02:58:30.991Z
raw-face-1791687523580-m4gs3	zk-01	EMP-2026-004	EMP-2026-004	TX-FACE-1791687523580	2026-10-11T02:58:43.578Z	2026-10-11	02:58:43	Check-Out	Face	SF5L2026001	192.168.88.201	Main Entrance	{"source":"ZKTeco SpeedFace Camera","algorithm":"ZKFace VX3.6","confidence":0.986,"device_name":"ZKTeco-01","verified":true,"mode":"Visible Light Facial Biometric"}	\N	1	2026-10-11T02:58:43.578Z	att-EMP-2026-004-2026-10-11	ZKTeco SpeedFace Camera	2026-10-11T02:58:43.578Z
\.


--
-- Data for Name: attendance_status_codes; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_status_codes (code, name_en, name_km, description, is_paid, attendance_value, payroll_effect, badge_color, badge_bg, is_active) FROM stdin;
1	Present / Full Day	វត្តមានពេញ	បុគ្គលិកបំពេញការងារពេញមួយថ្ងៃ (៨ម៉ោង)	1	1	full	#059669	#ecfdf5	1
0.5	Half Day	កន្លះថ្ងៃ	បំពេញការងារកន្លះថ្ងៃ (៤ម៉ោង)	1	0.5	half	#d97706	#fef3c7	1
AB	Absent	អវត្តមានឥតច្បាប់	អវត្តមានមិនមានការអនុញ្ញាត (កាត់ប្រាក់)	0	0	unpaid	#dc2626	#fee2e2	1
AL	Annual Leave	ច្បាប់ប្រចាំឆ្នាំ	ឈប់សម្រាកប្រចាំឆ្នាំមានប្រាក់ឈ្នួល	1	1	full	#2563eb	#eff6ff	1
ML	Maternity Leave	លំហែមាតុភាព	ច្បាប់ឈប់សម្រាកឆ្លងទន្លេមានប្រាក់ឧបត្ថម្ភ	1	1	full	#db2777	#fdf2f8	1
HL	Public Holiday	បុណ្យជាតិ	ថ្ងៃឈប់បុណ្យជាតិប្រពៃណីមានប្រាក់ឈ្នួល	1	1	full	#7c3aed	#f5f3ff	1
SL	Sick Leave	ច្បាប់ឈឺ	ឈប់សម្រាកដោយមានជំងឺ/វេជ្ជបញ្ជា	1	1	full	#0891b2	#ecfeff	1
OL	Other Leave	ច្បាប់ផ្សេងៗ	ច្បាប់ផ្ទាល់ខ្លួន/ការអនុញ្ញាតពិសេស	0	0	unpaid	#ea580c	#fff7ed	1
OFF	Weekly Rest Day	ថ្ងៃសម្រាកសប្តាហ៍	ថ្ងៃអាទិត្យឈប់សម្រាកប្រចាំសប្តាហ៍	0	0	none	#64748b	#f8fafc	1
\.


--
-- Data for Name: attendance_sync_jobs; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_sync_jobs (id, job_type, device_id, status, started_at, completed_at, records_retrieved, records_created, duplicates, errors, retry_count, error_message, error_code, details, created_at) FROM stdin;
\.


--
-- Data for Name: attendance_sync_logs; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.attendance_sync_logs (id, "timestamp", device_id, device_name, operation, result, records_retrieved, records_created, duplicates, errors, duration_sec, ip_address, user_name, details, error_code, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.audit_logs (id, user_id, user_name, action, module, record_id, old_value, new_value, ip_address, created_at) FROM stdin;
audit-1791473524615-34t42n	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-08T15-32-04-474Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-08T15-32-04-474Z.sql (104.6 KB)	\N	2026-10-08 15:32:04
audit-1791473533229-1vkin8	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-08T15-32-13-089Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-08T15-32-13-089Z.sql (104.8 KB)	\N	2026-10-08 15:32:13
audit-1791476941421-k8d7i9	usr-admin	Administrator	UPDATE_REPORTING_LINE	Company Structure	EMP-2026-010	{"manager_id":null}	{"manager_id":"EMP-2026-003"}	\N	2026-10-08 16:29:01
audit-1791513780204-r9b0p2	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-09T02-43-00-054Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-09T02-43-00-054Z.sql (144.0 KB)	\N	2026-10-09 02:43:00
audit-1791513786193-5jgl3z	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-09T02-43-06-051Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-09T02-43-06-051Z.sql (144.2 KB)	\N	2026-10-09 02:43:06
audit-1791536310429-0mk15c	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-09T08-58-30-286Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-09T08-58-30-286Z.sql (144.4 KB)	\N	2026-10-09 08:58:30
audit-1791536319290-xxpgyv	system	System Admin	BACKUP	Database	hestrahrm_backup_2026-10-09T08-58-39-150Z.sql	\N	Created PostgreSQL backup: hestrahrm_backup_2026-10-09T08-58-39-150Z.sql (144.6 KB)	\N	2026-10-09 08:58:39
audit-1791536344064-ggumoq	system	Administrator	CALCULATE_PERIOD_PAYROLL	Payroll Engine	period-2026-08	\N	{"count":9,"totalGross":12769,"totalNet":11502.050000000003}	\N	2026-10-09 08:59:04
audit-1791597569755-0pqqvd	system	Administrator	CALCULATE_PERIOD_PAYROLL	Payroll Engine	period-2026-08	\N	{"count":10,"totalGross":13410,"totalNet":12118.490000000003}	\N	2026-10-10 01:59:29
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.departments (id, name, description, manager_id, color) FROM stdin;
dept-1791471602578	Board of Directors		EMP-2026-001	#3b82f6
dept-it	បច្ចេកវិទ្យាព័ត៌មាន (Information Technology)	IT Infrastructure & Digital Systems	EMP-2026-004	#06b6d4
dept-prod	ផ្នែកផលិតកម្ម (Production)	Glove Manufacturing & Production Operations	EMP-2026-007	#6366f1
dept-log	ភស្តុភារកម្ម (Logistics)	Logistics, Shipping & Transportation	EMP-2026-008	#8b5cf6
dept-proc	លទ្ធកម្ម (Procurement)	Procurement & Material Sourcing	EMP-2026-006	#f59e0b
dept-fin	ហិរញ្ញវត្ថុ និងគណនេយ្យ (Finance & Accounting)	Financial Management, Accounting & Payroll	EMP-2026-005	#10b981
dept-gm	អគ្គនាយកដ្ឋាន (General Management)	Executive Management & Governance	EMP-2026-002	#7c3aed
dept-wh	Warehouse	Raw Material & Finished Goods Storage	EMP-2026-009	#f97316
dept-hr	ធនធានមនុស្ស និងរដ្ឋបាល (Human Resources & Administration)	HR, Administration, Health & Medical Services	EMP-2026-003	#3b82f6
\.


--
-- Data for Name: duty_roster; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.duty_roster (id, employee_id, date, shift_type, start_time, end_time, hours, location, notes, created_at) FROM stdin;
\.


--
-- Data for Name: employee_groups; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employee_groups (id, name, department_id, description, created_at) FROM stdin;
grp-pat	Pattern Making	dept-prod	Pattern Design & Technical Sampling	2026-10-08 14:38:06
grp-pak	Packing	dept-prod	Packaging & Boxing	2026-10-08 14:38:06
grp-sew1	Sewing Line 1	dept-prod	Sewing Production Line 1	2026-10-08 14:38:06
grp-sew2	Sewing Line 2	dept-prod	Sewing Production Line 2	2026-10-08 14:38:06
grp-cut	Cutting	dept-prod	Fabric & Leather Cutting	2026-10-08 14:38:06
grp-qc	Quality Control	dept-prod	Quality Assurance & Inspection	2026-10-08 14:38:06
grp-clean	Cleaning Services	\N	Sanitation & Janitorial Services	2026-10-08 14:38:06
grp-maint	Maintenance & Repair	\N	Machinery Maintenance & Repair	2026-10-08 14:38:06
\.


--
-- Data for Name: employee_medical_records; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employee_medical_records (id, employee_id, visit_date, visit_time, symptoms, diagnosis, temperature, blood_pressure, heart_rate, respiratory_rate, weight_kg, medicine_prescribed, dosage, frequency, duration, doctor_name, medical_notes, recommended_action, medical_leave_granted, medical_leave_days, follow_up_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.employees (id, first_name, last_name, email, phone, role, department_id, employment_type, employee_type, status, salary, join_date, manager_id, avatar, location, bio, emergency_contact_name, emergency_contact_phone, gender, dob, nationality, marital_status, national_id, current_address, province_city, district, commune_sangkat, village, contract_type, contract_start, contract_end, work_location, salary_currency, salary_frequency, bank_name, bank_account_name, bank_account_number, nssf_member, nssf_number, nssf_reg_date, emergency_contact_relationship, emergency_contact_address, doc_national_id, doc_passport, doc_contract, doc_others, created_at, transport_allowance, meal_allowance, housing_allowance, attendance_allowance, skill_allowance, seniority_bonus, position_allowance, sewing_skill_matrix, labor_type, group_name, group_id, resignation_date, working_period, khmer_name, pay_grade, last_salary_review, monthly_eval_bonus, severance_pay) FROM stdin;
EMP-2026-001	Magnusson	Anton Martin	\N	012 345 678	Chairman	dept-1791471602578	ក្រុមប្រឹក្សាភិបាល (Board of Directors)	សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)	Active	0	2026-01-15	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	1/15/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ប្រចាំខែ (Monthly)	ABA Bank	Magnusson Anton Martin		មាន (Yes)		1/15/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.046Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 8 - Executive / C-Suite	\N	0	0
EMP-2026-007	Sorann	Phorn	\N	15 345 678	Production Manager	dept-prod	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Sorann Phorn		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.068Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-003	Sarath	Te	\N	13 345 678	Human Resources & Administration Manager	dept-hr	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	5000	2026-02-15	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	2/15/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Sarath Te		មាន (Yes)		2/15/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.055Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Grade 5	2026-10-08	0	0
EMP-2026-002	Hamamoto	Tomoyuki	\N	012 345 679	General Manager	dept-gm	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	3500	2026-02-01	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	2/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Hamamoto Tomoyuki		មាន (Yes)		2/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.052Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-006	Sophath	Phon	\N	14 345 679	Procurement Manager	dept-proc	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	EMP-2026-007		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Sophath Phon		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.063Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-010	Sophy	Lov	\N	16 345 679	Nurse & HR Assistant	dept-hr	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	EMP-2026-003		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Sophy Lov		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.076Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-005	Dara	Met	\N	14 345 678	Finance & Accounting Manager	dept-fin	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Dara Met		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.061Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-004	Sitha	Sim	\N	13 345 679	Senior IT Officer	dept-it	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	300	2026-03-01	\N	data:image/jpeg;base64,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	រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Sitha Sim		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.058Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 2 - Junior	\N	0	0
EMP-2026-008	Khemara	Chan	\N	15 345 679	Logistics Manager	dept-log	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Khemara Chan		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.071Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-009	Chantheoun	Ben	\N	16 345 678	Warehouse Manager	dept-wh	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-03-01	\N		រាជធានីភ្នំពេញ (Phnom Penh)	Auto-imported employee record			ប្រុស (Male)		កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	3/1/2026		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ពីរសប្តាហ៍ម្តង (Bi-weekly)	ABA Bank	Chantheoun Ben		មាន (Yes)		3/1/2026	ប្តី/ប្រពន្ធ (Spouse)						2026-10-08T14:47:51.073Z	0	0	0	0	0	0	0	0	Indirect Labour	\N	\N	\N	0	\N	Level 6 - Manager	\N	0	0
EMP-2026-807	Keochenda	Bou	\N	012888666	Doctor	dept-hr	ពេញម៉ោង (Full-Time)	បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)	Active	600	2026-10-09	EMP-2026-003		រាជធានីភ្នំពេញ (Phnom Penh)				ប្រុស (Male)	1998-05-15	កម្ពុជា (Cambodian)	នៅលីវ (Single)			រាជធានីភ្នំពេញ (Phnom Penh)				UDC (មិនកំណត់ថិរវេលា)	2026-10-09		ការិយាល័យកណ្តាល (Head Office)	USD ($)	ប្រចាំខែ (Monthly)	ABA Bank (ធនាគារ អេ ប៊ី អេ)	KEOCHENDA BOU		មាន (Yes)		2026-10-09	ប្តី/ប្រពន្ធ (Spouse)						2026-10-09T12:47:36.597Z	0	0	0	0	0	0	0	0	Direct Labour	\N	\N	\N	0	\N	Level 3 - Officer	\N	0	0
\.


--
-- Data for Name: it_asset_logs; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at) FROM stdin;
\.


--
-- Data for Name: it_assets; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.it_assets (id, asset_tag, name, category, brand, model, serial_number, status, condition, assigned_to, assigned_date, department_id, location, ip_address, purchase_date, purchase_cost, warranty_end, specs, notes, windows_operation, m365_account, local_account, device_username, device_password, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: it_m365_accounts; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.it_m365_accounts (id, email, display_name, license_plan, status, assigned_to, assigned_date, mfa_status, mailbox_usage_gb, mailbox_quota_gb, onedrive_usage_gb, onedrive_quota_gb, monthly_cost, renewal_date, admin_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_candidates; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.job_candidates (id, job_id, name, email, phone, stage, rating, applied_date, notes) FROM stdin;
\.


--
-- Data for Name: job_postings; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.job_postings (id, title, department_id, location, type, experience_level, salary_range, description, requirements, status, posted_date, applicants_count) FROM stdin;
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.leave_balances (id, employee_id, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used) FROM stdin;
bal-EMP-2026-001	EMP-2026-001	20	0	10	0	5	0
bal-EMP-2026-002	EMP-2026-002	20	0	10	0	5	0
bal-EMP-2026-003	EMP-2026-003	20	0	10	0	5	0
bal-EMP-2026-004	EMP-2026-004	20	0	10	0	5	0
bal-EMP-2026-005	EMP-2026-005	20	0	10	0	5	0
bal-EMP-2026-006	EMP-2026-006	20	0	10	0	5	0
bal-EMP-2026-007	EMP-2026-007	20	0	10	0	5	0
bal-EMP-2026-008	EMP-2026-008	20	0	10	0	5	0
bal-EMP-2026-009	EMP-2026-009	20	0	10	0	5	0
bal-EMP-2026-010	EMP-2026-010	20	0	10	0	5	0
bal-EMP-2026-807	EMP-2026-807	20	0	10	0	5	0
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.leave_requests (id, employee_id, leave_type, start_date, end_date, days_count, reason, status, line_manager_id, line_manager_reviewed_at, line_manager_comments, admin_reviewer_id, admin_reviewed_at, admin_comments, reviewer_id, reviewed_at, reviewer_comments, created_at) FROM stdin;
\.


--
-- Data for Name: medicine_issuances; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.medicine_issuances (id, medical_record_id, employee_id, medicine_id, quantity_issued, prescription_instruction, dosage, frequency, duration, issued_by, issued_at, cost_at_issue, total_cost, batch_number, notes) FROM stdin;
\.


--
-- Data for Name: medicine_stock_transactions; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.medicine_stock_transactions (id, medicine_id, transaction_type, quantity, batch_number, previous_stock, new_stock, unit_cost, total_cost, supplier_or_dest, reference_id, performed_by, notes, created_at) FROM stdin;
stk-in-1791690567704-73	med-567702	Stock-in	100	BATCH-2026-43	0	100	0.1	10	Pharma Product Manufacturing (PPM)	PO-INIT-med-567702	HR Admin	New medicine SKU intake into pharmacy stock	2026-10-11T03:49:27.702Z
\.


--
-- Data for Name: medicines; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.medicines (id, name, generic_name, category, unit, dosage, supplier, batch_number, expiry_date, quantity_in_stock, min_stock_level, purchase_price, status, storage_location, description, side_effects, created_at, updated_at) FROM stdin;
med-567702	Paracetamal 500mg	Ancetaminophen	Analgesics & Antipyretics	Tablets	500mg	Pharma Product Manufacturing (PPM)	BATCH-2026-43	2027-10-11	100	20	0.1	In Stock	Clinic Cabinet A1			2026-10-11T03:49:27.702Z	2026-10-11T03:49:27.702Z
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.notifications (id, user_id, role, title, title_km, message, message_km, type, link, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: overtime_requests; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.overtime_requests (id, employee_id, date, start_time, end_time, hours, ot_rate_type, multiplier, hourly_rate, estimated_pay, reason, project_name, status, line_manager_id, line_manager_reviewed_at, line_manager_comments, admin_reviewer_id, admin_reviewed_at, admin_comments, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.payroll_periods (id, name, start_date, end_date, working_days, working_hours_per_day, status, locked_by, locked_at, approved_by, approved_at, notes, created_at) FROM stdin;
period-2026-08	August 2026	2026-08-01	2026-08-31	26	8	Paid	usr-admin	2026-08-31 17:00:00	usr-admin	2026-08-31 17:00:00	August 2026 factory payroll finalized and paid	2026-08-01 08:00:00
period-2026-09	September 2026	2026-09-01	2026-09-30	26	8	Locked	usr-admin	2026-09-30 18:00:00	usr-admin	2026-09-30 18:00:00	September 2026 payroll locked after audit review	2026-09-01 08:00:00
period-2026-10	October 2026	2026-10-01	2026-10-31	26	8	Processing	\N	\N	\N	\N	Current working payroll cycle	2026-10-01 08:00:00
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.payrolls (id, employee_id, pay_period, payment_date, base_salary, allowances, bonuses, tax_deduction, insurance_deduction, other_deductions, net_salary, status, payment_method, created_at, working_days, absent_days, unpaid_days, basic_working_salary, seniority_bonus, position_allowance, sewing_skill_matrix, skill_allowance, transport_housing, attendance_allowance, food_allowance, overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus, annual_leave, salary_adjustment, gross_salary, non_taxable_amount, taxable_salary_usd, taxable_salary_khr, pension_usd, pension_khr, dependents_count, taxable_base_khr, tax_rate, tax_khr, tax_usd, after_tax_salary, first_paid, target_bonus, severance_pay, seniority_payback, paid_final_salary, second_paid, total_paid, labor_type, exchange_rate_khr, nssf_rate_khr, calculation_trace, period_id, locked_at) FROM stdin;
PAY-period-2026-08-EMP-2026-002	EMP-2026-002	August 2026	2026-10-09	3500	26	15	400.9	5.93	0	3134.17	Processing	Direct Deposit	2026-10-09T08:59:03.965Z	26	0	0	3500	0	0	0	0	16	15	10	0	0	0	0	0	0	3541	3525	3519.07	1.4231119e+07	5.93	24000	0	1.4231119e+07	20%	1.621224e+06	400.9	3134.17	0	0	0	0	0	3134.17	3134.17	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$3500 - ($3500 / 26 × 0 unpaid days)","result":"$3500.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $134.62/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $134.62/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($16.8269) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $3500 / 26 / 8 = $16.8269/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $3500 / ២៦ / ៨ = $16.8269/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$3541.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($3541.00) - Transport/Housing ($16.00)","result":"$3525.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (14,337,509 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($3525.00 - $5.93) × 4044 GDT Rate","result":"14,231,119 KHR ($3519.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 14,231,119 KHR → 20% bracket","result":"1,621,224 KHR ($400.90)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$3541.00 - $400.90 tax - $5.93 pension","result":"$3134.17","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($3134.17) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$3134.17 (Total: $3134.17)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-003	EMP-2026-003	August 2026	2026-10-09	5000	26	15	700.9	5.93	0	4334.17	Processing	Direct Deposit	2026-10-09T08:59:04.031Z	26	0	0	5000	0	0	0	0	16	15	10	0	0	0	0	0	0	5041	5025	5019.07	2.029712e+07	5.93	24000	0	2.029712e+07	20%	2.834424e+06	700.9	4334.17	0	0	0	0	0	4334.17	4334.17	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$5000 - ($5000 / 26 × 0 unpaid days)","result":"$5000.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $192.31/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $192.31/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($24.0385) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $5000 / 26 / 8 = $24.0385/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $5000 / ២៦ / ៨ = $24.0385/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$5041.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($5041.00) - Transport/Housing ($16.00)","result":"$5025.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (20,411,009 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($5025.00 - $5.93) × 4044 GDT Rate","result":"20,297,119 KHR ($5019.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 20,297,119 KHR → 20% bracket","result":"2,834,424 KHR ($700.90)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$5041.00 - $700.90 tax - $5.93 pension","result":"$4334.17","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($4334.17) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$4334.17 (Total: $4334.17)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-004	EMP-2026-004	August 2026	2026-10-09	300	26	15	0	5.93	0	335.07	Processing	Direct Deposit	2026-10-09T08:59:04.034Z	26	0	0	300	0	0	0	0	16	15	10	0	0	0	0	0	0	341	325	319.07	1.290319e+06	5.93	24000	0	1.290319e+06	0%	0	0	335.07	0	0	0	0	0	335.07	335.07	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$300 - ($300 / 26 × 0 unpaid days)","result":"$300.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $11.54/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $11.54/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($1.4423) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $300 / 26 / 8 = $1.4423/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $300 / ២៦ / ៨ = $1.4423/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$341.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($341.00) - Transport/Housing ($16.00)","result":"$325.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (1,380,709 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($325.00 - $5.93) × 4044 GDT Rate","result":"1,290,319 KHR ($319.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 1,290,319 KHR → 0% bracket","result":"0 KHR ($0.00)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$341.00 - $0.00 tax - $5.93 pension","result":"$335.07","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($335.07) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$335.07 (Total: $335.07)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-005	EMP-2026-005	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.042Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-006	EMP-2026-006	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.045Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-007	EMP-2026-007	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.050Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-008	EMP-2026-008	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.054Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-009	EMP-2026-009	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.058Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-010	EMP-2026-010	August 2026	2026-10-09	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-09T08:59:04.062Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Indirect Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
PAY-period-2026-08-EMP-2026-807	EMP-2026-807	August 2026	2026-10-10	600	26	15	18.63	5.93	0	616.44	Processing	Direct Deposit	2026-10-10T01:59:29.752Z	26	0	0	600	0	0	0	0	16	15	10	0	0	0	0	0	0	641	625	619.07	2.503519e+06	5.93	24000	0	2.503519e+06	10%	75352	18.63	616.44	0	0	0	0	0	616.44	616.44	Direct Labour	4044	4049	{"steps":[{"title":"Basic Working Salary","title_km":"ប្រាក់ខែគោលបំពេញការងារ","formula":"$600 - ($600 / 26 × 0 unpaid days)","result":"$600.00","explanation":"Calculated by deducting unpaid absences from the monthly basic wage based on 26 scheduled working days. Daily rate is $23.08/day.","explanation_km":"គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ 26 ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $23.08/ថ្ងៃ។","legal_reference":"Labor Law Standard Base (26 days/mo)"},{"title":"Seniority Bonus","title_km":"ប្រាក់រង្វាន់អតីតភាពការងារ","formula":"0 complete years worked → scale lookup","result":"$0.00","explanation":"Awarded for continuous tenure: $0 (<1 yr), $2 (1-2 yrs), increasing by $1/yr up to the statutory cap of $11/mo (10+ yrs).","explanation_km":"ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $២ (១-២ ឆ្នាំ), កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ (១០ ឆ្នាំឡើង)។","legal_reference":"Prakas No. 017/00 & Art. 89"},{"title":"Position & Skill Allowances","title_km":"ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ","formula":"Pos: $0 + Matrix: $0 + Skill: $0","result":"$0.00","explanation":"Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.","explanation_km":"សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។","legal_reference":"Factory Technical Scale"},{"title":"Transport / Housing Allowance","title_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ","formula":"Standard factory allowance (Non-taxable fringe benefit)","result":"$16.00","explanation":"Statutory non-taxable fringe benefit to assist workers with daily commuting and accommodation. Excluded from taxable salary.","explanation_km":"ប្រាក់ឧបត្ថម្ភស្របច្បាប់មិនជាប់ពន្ធ ដើម្បីជួយសម្រួលការធ្វើដំណើរ និងការស្នាក់នៅរបស់កម្មករនិយោជិត។","legal_reference":"GDT Circular No. 011 & Minimum Wage Prakas"},{"title":"Non-Absent Bonus (Attendance Allowance)","title_km":"ប្រាក់ឧបត្ថម្ភការមកធ្វើការទៀងទាត់ (Non-Absent)","formula":"Absent Days (0) = 0 & Unpaid = 0 → Eligible","result":"$15.00","explanation":"Full $15 monthly incentive granted strictly when the employee has 0 unauthorized absent days and 0 unpaid days.","explanation_km":"ប្រាក់លើកទឹកចិត្ត $១៥ ប្រចាំខែ ផ្ដល់ជូនចំពោះបុគ្គលិកដែលមានវត្តមាន ១០០% ដោយគ្មានការអវត្តមានឥតច្បាប់ ឬថ្ងៃកាត់ប្រាក់ឡើយ។","legal_reference":"Factory Attendance Policy ($15.00)"},{"title":"Food Allowance","title_km":"ប្រាក់ឧបត្ថម្ភអាហារ","formula":"Factory monthly meal subsidy","result":"$10.00","explanation":"Regular monthly nutritional food subsidy provided to factory operations staff.","explanation_km":"ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែសម្រាប់ទ្រទ្រង់សុខភាព និងអាហារូបត្ថម្ភរបស់បុគ្គលិក។","legal_reference":"Factory Meal Policy"},{"title":"Overtime Pay & Meal Allowance","title_km":"ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង","formula":"Base Hourly ($2.8846) × 1.5 × 0h + OT Food ($0)","result":"$0.00","explanation":"Base hourly rate = $600 / 26 / 8 = $2.8846/h. Overtime calculated at 1.5x multiplier plus $1.50 meal allowance per 2h of overtime.","explanation_km":"អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $600 / ២៦ / ៨ = $2.8846/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង 1.5 ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។","legal_reference":"Labor Law Article 139 (150% / 200%)"},{"title":"Sewing Production Target Bonus","title_km":"ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)","formula":"Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)","result":"$0.00","explanation":"Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).","explanation_km":"ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។","legal_reference":"Factory Production Target Matrix"},{"title":"Total Gross Salary","title_km":"ប្រាក់បៀវត្សរ៍សរុប (Gross)","formula":"Sum of all basic, bonuses, allowances, and OT","result":"$641.00","explanation":"Sum total of all earnings before statutory deductions, insurance, and government taxes.","explanation_km":"ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។","legal_reference":"Gross Remuneration"},{"title":"Non-Taxable Amount (Fringe Benefit Exemption)","title_km":"ប្រាក់បន្ទុកមិនជាប់ពន្ធ","formula":"Gross ($641.00) - Transport/Housing ($16.00)","result":"$625.00","explanation":"Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.","explanation_km":"ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។","legal_reference":"Law on Taxation Art. 42"},{"title":"NSSF Pension Contribution","title_km":"បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)","formula":"Wage (2,595,409 KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ 4049 KHR/USD = $5.93","result":"-$5.93 (24,000 KHR)","explanation":"Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($5.93 USD).","explanation_km":"ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($5.93) ក្នុងមួយខែ។","legal_reference":"Prakas No. 249 & Sub-Decree No. 32"},{"title":"Taxable Salary (USD & KHR)","title_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)","formula":"($625.00 - $5.93) × 4044 GDT Rate","result":"2,503,519 KHR ($619.07)","explanation":"Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (4044 KHR/USD).","explanation_km":"ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (4044 រៀល/ដុល្លារ)។","legal_reference":"GDT Monthly Official Rate"},{"title":"Family Dependent Deductions","title_km":"ការកាត់បន្ថយបន្ទុកគ្រួសារ","formula":"0 dependent(s) × 150,000 KHR","result":"-0 KHR","explanation":"Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.","explanation_km":"ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។","legal_reference":"Law on Taxation Art. 47"},{"title":"Tax on Salary (GDT Progressive)","title_km":"ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)","formula":"Base: 2,503,519 KHR → 10% bracket","result":"75,352 KHR ($18.63)","explanation":"Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).","explanation_km":"គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។","legal_reference":"Sub-Decree on Tax on Salary"},{"title":"After-Tax Net Salary","title_km":"ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.","formula":"$641.00 - $18.63 tax - $5.93 pension","result":"$616.44","explanation":"The legal take-home pay remaining after settling all statutory tax and social security obligations.","explanation_km":"ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។","legal_reference":"Net Remuneration"},{"title":"Final Disbursement (Second Paid)","title_km":"ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)","formula":"After-Tax ($616.44) - 1st Paid ($0) - Target Bonus ($0) - Food ($0)","result":"$616.44 (Total: $616.44)","explanation":"Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.","explanation_km":"ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។","legal_reference":"Factory Bi-Monthly Payment Schedule"}],"formula_definitions":{"basic_working_salary":"Basic Salary - (Basic Salary / Working Days * Unpaid Days)","hourly_rate":"Basic Salary / Working Days / Daily Hours","overtime_pay":"Hourly Rate * OT Multiplier * OT Hours","non_taxable":"Gross Salary - Transport Allowance ($16)","taxable_khr":"(Non Taxable - NSSF Pension) * GDT Exchange Rate","after_tax":"Total Gross - Tax USD - NSSF Pension USD","second_paid":"After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee"}}	period-2026-08	\N
\.


--
-- Data for Name: performance_reviews; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.performance_reviews (id, employee_id, reviewer_id, review_period, rating, goals_achievement, strengths, areas_for_growth, status, created_at) FROM stdin;
\.


--
-- Data for Name: salary_adjustments; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.salary_adjustments (id, employee_id, previous_salary, new_salary, increase_amount, increase_percentage, effective_date, adjustment_type, currency, reason, approved_by, created_at) FROM stdin;
adj-1791475181585-zhih	EMP-2026-003	5000	5000	0	0	2026-10-08	ដំឡើងប្រចាំឆ្នាំ (Annual Merit Increase)	USD ($)	Compensation review and structure update	Sitha Sim	2026-10-08T15:59:41.586Z
\.


--
-- Data for Name: sewing_bonus_rules; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.sewing_bonus_rules (id, group_name, weekly_target_qty, base_bonus, tier_1_min_pct, tier_1_bonus, tier_2_min_pct, tier_2_bonus, tier_3_min_pct, tier_3_bonus, is_active) FROM stdin;
sbr-default	All Sewing Lines	1200	5	100	10	110	15	120	20	1
\.


--
-- Data for Name: sewing_production_weekly; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.sewing_production_weekly (id, week_number, week_start, week_end, month, employee_id, group_name, mon_qty, tue_qty, wed_qty, thu_qty, fri_qty, sat_qty, total_qty, target_qty, achievement_pct, bonus_amount, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: system_meta; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.system_meta (key, value) FROM stdin;
initialized	true
overtime_settings	{"standardMonthlyHours":208,"rates":{"normal_day_150":{"id":"normal_day_150","multiplier":1.5,"label_km":"ថ្ងៃធ្វើការធម្មតា (150%)","label_en":"Normal Working Day (150%)","short_label":"150% ធម្មតា","badgeBg":"bg-blue-50 dark:bg-blue-950/40","badgeText":"text-blue-700 dark:text-blue-300","badgeBorder":"border-blue-200 dark:border-blue-800/60","law_reference":"មាត្រា ១៣៩ ច្បាប់ការងារ","description_km":"ការងារលើស ៨ ម៉ោង/ថ្ងៃ នៅថ្ងៃធ្វើការធម្មតា គិតប្រាក់ឈ្នួល ១៥០% (១.៥ ដង)។","description_en":"Hours worked beyond 8 hours on a regular working day paid at 150% (1.5x)."},"night_200":{"id":"night_200","multiplier":2,"label_km":"ថែមម៉ោងពេលយប់ (200%)","label_en":"Night Overtime 22:00-06:00 (200%)","short_label":"200% ពេលយប់","badgeBg":"bg-indigo-50 dark:bg-indigo-950/40","badgeText":"text-indigo-700 dark:text-indigo-300","badgeBorder":"border-indigo-200 dark:border-indigo-800/60","law_reference":"មាត្រា ១៣៩ & ១៤៤ ច្បាប់ការងារ","description_km":"ការងារថែមម៉ោងចន្លោះម៉ោង ២២:០០ ដល់ ០៦:០០ ព្រឹក គិតប្រាក់ឈ្នួល ២០០% (២ ដង)។","description_en":"Overtime between 22:00 and 06:00 paid at 200% (2.0x normal wage)."},"weekend_200":{"id":"weekend_200","multiplier":2,"label_km":"ថ្ងៃសម្រាកប្រចាំសប្ដាហ៍ / អាទិត្យ (200%)","label_en":"Weekly Rest Day / Sunday (200%)","short_label":"200% ថ្ងៃសម្រាក","badgeBg":"bg-amber-50 dark:bg-amber-950/40","badgeText":"text-amber-700 dark:text-amber-300","badgeBorder":"border-amber-200 dark:border-amber-800/60","law_reference":"មាត្រា ១៤៧ ច្បាប់ការងារ","description_km":"ការងារនៅថ្ងៃសម្រាកប្រចាំសប្ដាហ៍ (ថ្ងៃអាទិត្យ ឬថ្ងៃកំណត់) គិតប្រាក់ឈ្នួល ២០០% (២ ដង)។","description_en":"Work performed on mandatory weekly rest day paid at 200% (2.0x normal wage)."},"holiday_200":{"id":"holiday_200","multiplier":2,"label_km":"ថ្ងៃបុណ្យជាតិផ្លូវការ (200%)","label_en":"Official Public Holiday (200%)","short_label":"200% បុណ្យជាតិ","badgeBg":"bg-rose-50 dark:bg-rose-950/40","badgeText":"text-rose-700 dark:text-rose-300","badgeBorder":"border-rose-200 dark:border-rose-800/60","law_reference":"មាត្រា ១៦២ ច្បាប់ការងារ & ប្រកាសក្រសួង","description_km":"ការងារនៅថ្ងៃបុណ្យជាតិផ្លូវការដែលមានប្រាក់ឈ្នួល គិតបន្ថែម ២០០% (២ ដង)។","description_en":"Work performed on official paid public holidays paid at 200% (2.0x normal wage)."}},"isCustomized":false}
groups_initialized	true
payroll_rules_config	{"working_days_per_month":26,"daily_working_hours":8,"ot_multiplier_normal":1.5,"ot_multiplier_night":2,"ot_multiplier_weekend":1.5,"ot_multiplier_holiday":2,"non_absent_bonus_amount":15,"non_absent_bonus_allowed_leaves":["AL","HL","OFF"],"seniority_tiers":[{"years":1,"amount":2},{"years":2,"amount":3},{"years":3,"amount":4},{"years":4,"amount":5},{"years":5,"amount":6},{"years":6,"amount":7},{"years":7,"amount":8},{"years":8,"amount":9},{"years":9,"amount":10},{"years":10,"amount":11}],"nssf_employee_rate":0.02,"nssf_employer_rate":0.02,"nssf_cap_khr":1200000,"nssf_rate_khr":4049,"gdt_rate_khr":4044,"tax_relief_per_dependent_khr":150000}
company_name	HESTRA-GLOVES HRM (Cambodia) Ltd
company_settings	{"name": "HESTRA-GLOVES HRM (Cambodia) Ltd", "address": "Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia", "currency": "USD ($) & KHR (៛)", "timezone": "Asia/Phnom_Penh (GMT+7)", "workHours": "8.0", "fiscalYearStart": "January 1st"}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hrm_user
--

COPY public.users (id, username, name, email, role, status, employee_id, department_name, avatar, two_factor_enabled, permissions, password, last_login, created_at) FROM stdin;
usr-8710706	sorann	Sorann Phorn	\N	Manager	Active	EMP-2026-007	ផ្នែកផលិតកម្ម (Production)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710603	sitha	Sitha Sim	\N	Admin	Active	EMP-2026-004	បច្ចេកវិទ្យាព័ត៌មាន (Information Technology)	data:image/jpeg;base64,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	0	self_service,clock_in,request_leave,view_payslips,approve_leaves,manage_team_attendance,evaluate_performance,manage_payroll,manage_nssf,manage_employees,manage_users,system_settings,view_analytics	@9218njo0(TWp<3q"(3{	2026-10-09 10:26 AM	2026-10-08
usr-8710510	magnusson	Magnusson Anton Martin	\N	Employee	Active	EMP-2026-001	Board of Directors		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710737	khemara	Khemara Chan	\N	Manager	Active	EMP-2026-008	ភស្តុភារកម្ម (Logistics)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710685	sophath	Sophath Phon	\N	Manager	Active	EMP-2026-006	លទ្ធកម្ម (Procurement)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710829	sophy	Sophy Lov	\N	Employee	Active	EMP-2026-010	ធនធានមនុស្ស និងរដ្ឋបាល (Human Resources & Administration)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710758	chantheoun	Chantheoun Ben	\N	Manager	Active	EMP-2026-009	ឃ្លាំង និងចែកចាយ (Warehouse & Distribution)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710551	hamamoto	Hamamoto Tomoyuki	\N	Manager	Active	EMP-2026-002	អគ្គនាយកដ្ឋាន (General Management)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-EMP-2026-807	keochenda	Keochenda Bou	\N	Employee	Active	EMP-2026-807	ធនធានមនុស្ស និងរដ្ឋបាល (Human Resources & Administration)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Just now	2026-10-09
usr-8710572	sarath	Sarath Te	\N	Manager	Active	EMP-2026-003	ធនធានមនុស្ស និងរដ្ឋបាល (Human Resources & Administration)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-8710624	dara	Dara Met	\N	Manager	Active	EMP-2026-005	ហិរញ្ញវត្ថុ និងគណនេយ្យ (Finance & Accounting)		0	self_service,clock_in,request_leave,view_payslips	@9218njo0(TWp<3q"(3{	Imported	2026-10-08
usr-admin	admin	Administrator	admin@outlook.com	Admin	Active	\N	ថ្នាក់ដឹកនាំជាន់ខ្ពស់ (Top Management)		0	all,manage_users,manage_payroll,approve_leaves,system_settings,export_data	@9218njo0(TWp<3q"(3{	2026-10-11 03:35 AM	2026-10-08T14:38:06.828Z
\.


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: attendance_corrections attendance_corrections_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_corrections
    ADD CONSTRAINT attendance_corrections_pkey PRIMARY KEY (id);


--
-- Name: attendance_device_commands attendance_device_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_device_commands
    ADD CONSTRAINT attendance_device_commands_pkey PRIMARY KEY (id);


--
-- Name: attendance_device_users attendance_device_users_device_id_device_user_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_device_users
    ADD CONSTRAINT attendance_device_users_device_id_device_user_id_key UNIQUE (device_id, device_user_id);


--
-- Name: attendance_device_users attendance_device_users_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_device_users
    ADD CONSTRAINT attendance_device_users_pkey PRIMARY KEY (id);


--
-- Name: attendance_devices attendance_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_devices
    ADD CONSTRAINT attendance_devices_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_date_key UNIQUE (employee_id, date);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance_raw_transactions attendance_raw_transactions_device_id_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_raw_transactions
    ADD CONSTRAINT attendance_raw_transactions_device_id_transaction_id_key UNIQUE (device_id, transaction_id);


--
-- Name: attendance_raw_transactions attendance_raw_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_raw_transactions
    ADD CONSTRAINT attendance_raw_transactions_pkey PRIMARY KEY (id);


--
-- Name: attendance_status_codes attendance_status_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_status_codes
    ADD CONSTRAINT attendance_status_codes_pkey PRIMARY KEY (code);


--
-- Name: attendance_sync_jobs attendance_sync_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_sync_jobs
    ADD CONSTRAINT attendance_sync_jobs_pkey PRIMARY KEY (id);


--
-- Name: attendance_sync_logs attendance_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.attendance_sync_logs
    ADD CONSTRAINT attendance_sync_logs_pkey PRIMARY KEY (id);


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
-- Name: duty_roster duty_roster_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.duty_roster
    ADD CONSTRAINT duty_roster_employee_id_date_key UNIQUE (employee_id, date);


--
-- Name: duty_roster duty_roster_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.duty_roster
    ADD CONSTRAINT duty_roster_pkey PRIMARY KEY (id);


--
-- Name: employee_groups employee_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_groups
    ADD CONSTRAINT employee_groups_name_key UNIQUE (name);


--
-- Name: employee_groups employee_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_groups
    ADD CONSTRAINT employee_groups_pkey PRIMARY KEY (id);


--
-- Name: employee_medical_records employee_medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_medical_records
    ADD CONSTRAINT employee_medical_records_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: it_asset_logs it_asset_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.it_asset_logs
    ADD CONSTRAINT it_asset_logs_pkey PRIMARY KEY (id);


--
-- Name: it_assets it_assets_asset_tag_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.it_assets
    ADD CONSTRAINT it_assets_asset_tag_key UNIQUE (asset_tag);


--
-- Name: it_assets it_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.it_assets
    ADD CONSTRAINT it_assets_pkey PRIMARY KEY (id);


--
-- Name: it_m365_accounts it_m365_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.it_m365_accounts
    ADD CONSTRAINT it_m365_accounts_email_key UNIQUE (email);


--
-- Name: it_m365_accounts it_m365_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.it_m365_accounts
    ADD CONSTRAINT it_m365_accounts_pkey PRIMARY KEY (id);


--
-- Name: job_candidates job_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.job_candidates
    ADD CONSTRAINT job_candidates_pkey PRIMARY KEY (id);


--
-- Name: job_postings job_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_key UNIQUE (employee_id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: medicine_issuances medicine_issuances_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicine_issuances
    ADD CONSTRAINT medicine_issuances_pkey PRIMARY KEY (id);


--
-- Name: medicine_stock_transactions medicine_stock_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicine_stock_transactions
    ADD CONSTRAINT medicine_stock_transactions_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: overtime_requests overtime_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_name_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_name_key UNIQUE (name);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: salary_adjustments salary_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.salary_adjustments
    ADD CONSTRAINT salary_adjustments_pkey PRIMARY KEY (id);


--
-- Name: sewing_bonus_rules sewing_bonus_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.sewing_bonus_rules
    ADD CONSTRAINT sewing_bonus_rules_pkey PRIMARY KEY (id);


--
-- Name: sewing_production_weekly sewing_production_weekly_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.sewing_production_weekly
    ADD CONSTRAINT sewing_production_weekly_pkey PRIMARY KEY (id);


--
-- Name: sewing_production_weekly sewing_production_weekly_week_start_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.sewing_production_weekly
    ADD CONSTRAINT sewing_production_weekly_week_start_employee_id_key UNIQUE (week_start, employee_id);


--
-- Name: system_meta system_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.system_meta
    ADD CONSTRAINT system_meta_pkey PRIMARY KEY (key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_attendance_emp_date; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_attendance_emp_date ON public.attendance USING btree (employee_id, date);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_audit_created ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_iss_date; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_iss_date ON public.medicine_issuances USING btree (issued_at DESC);


--
-- Name: idx_iss_emp; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_iss_emp ON public.medicine_issuances USING btree (employee_id);


--
-- Name: idx_iss_med; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_iss_med ON public.medicine_issuances USING btree (medicine_id);


--
-- Name: idx_it_asset_logs_asset; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_it_asset_logs_asset ON public.it_asset_logs USING btree (asset_id);


--
-- Name: idx_it_assets_assigned; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_it_assets_assigned ON public.it_assets USING btree (assigned_to);


--
-- Name: idx_it_assets_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_it_assets_status ON public.it_assets USING btree (status);


--
-- Name: idx_it_assets_tag; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_it_assets_tag ON public.it_assets USING btree (asset_tag);


--
-- Name: idx_m365_assigned; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_m365_assigned ON public.it_m365_accounts USING btree (assigned_to);


--
-- Name: idx_m365_email; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_m365_email ON public.it_m365_accounts USING btree (email);


--
-- Name: idx_m365_plan; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_m365_plan ON public.it_m365_accounts USING btree (license_plan);


--
-- Name: idx_med_category; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_category ON public.medicines USING btree (category);


--
-- Name: idx_med_expiry; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_expiry ON public.medicines USING btree (expiry_date);


--
-- Name: idx_med_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_status ON public.medicines USING btree (status);


--
-- Name: idx_med_tx_date; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_tx_date ON public.medicine_stock_transactions USING btree (created_at DESC);


--
-- Name: idx_med_tx_med; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_tx_med ON public.medicine_stock_transactions USING btree (medicine_id);


--
-- Name: idx_med_tx_type; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_med_tx_type ON public.medicine_stock_transactions USING btree (transaction_type);


--
-- Name: idx_medrec_date; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_medrec_date ON public.employee_medical_records USING btree (visit_date DESC);


--
-- Name: idx_medrec_emp; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_medrec_emp ON public.employee_medical_records USING btree (employee_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_role; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_notifications_user_role ON public.notifications USING btree (user_id, role, is_read);


--
-- Name: idx_sewing_emp_week; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_sewing_emp_week ON public.sewing_production_weekly USING btree (employee_id, week_start);


--
-- Name: idx_zk_dev_cmds_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_dev_cmds_status ON public.attendance_device_commands USING btree (status, target_key);


--
-- Name: idx_zk_dev_users_dev; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_dev_users_dev ON public.attendance_device_users USING btree (device_id);


--
-- Name: idx_zk_dev_users_emp; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_dev_users_emp ON public.attendance_device_users USING btree (employee_id);


--
-- Name: idx_zk_devices_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_devices_status ON public.attendance_devices USING btree (status);


--
-- Name: idx_zk_raw_trans_date; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_raw_trans_date ON public.attendance_raw_transactions USING btree (punch_date, employee_id);


--
-- Name: idx_zk_raw_trans_proc; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_raw_trans_proc ON public.attendance_raw_transactions USING btree (is_processed);


--
-- Name: idx_zk_sync_jobs_status; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_sync_jobs_status ON public.attendance_sync_jobs USING btree (status, job_type);


--
-- Name: idx_zk_sync_logs_time; Type: INDEX; Schema: public; Owner: hrm_user
--

CREATE INDEX idx_zk_sync_logs_time ON public.attendance_sync_logs USING btree (created_at DESC);


--
-- Name: employee_medical_records employee_medical_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.employee_medical_records
    ADD CONSTRAINT employee_medical_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: medicine_issuances medicine_issuances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicine_issuances
    ADD CONSTRAINT medicine_issuances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: medicine_issuances medicine_issuances_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicine_issuances
    ADD CONSTRAINT medicine_issuances_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id);


--
-- Name: medicine_stock_transactions medicine_stock_transactions_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrm_user
--

ALTER TABLE ONLY public.medicine_stock_transactions
    ADD CONSTRAINT medicine_stock_transactions_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: hrm_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict cY4tCH0Udqxlu5yqQReWajkahHgqmOxzLW8e2AHkcIM3SXGxzYKS76nlajSYcxA

