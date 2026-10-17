export type Language = 'km' | 'en';

export const TRANSLATIONS = {
  km: {
    // Brand
    brand_name: 'HESTRA HRM កម្ពុជា',
    brand_tagline: 'គ្រប់គ្រងធនធានមនុស្ស',

    // Language
    lang_switch: 'ប្តូរភាសា',
    lang_khmer: 'ភាសាខ្មែរ',
    lang_english: 'English',

    // Nav
    nav_dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    nav_employees: 'បញ្ជីបុគ្គលិក',
    nav_departments: 'នាយកដ្ឋាន',
    nav_structure: 'រចនាសម្ព័ន្ធក្រុមហ៊ុន',
    nav_attendance: 'វត្តមាន & ម៉ោងការងារ',
    nav_roster: 'កាលវិភាគ & វេនការងារ',
    nav_overtime: 'ម៉ោងបន្ថែម (Overtime)',
    nav_leaves: 'ច្បាប់ឈប់សម្រាក',
    nav_requests: 'សំណើ & ការអនុម័ត',
    nav_zkteco: 'ការគ្រប់គ្រង ZKTeco',
    overtime_title: 'គ្រប់គ្រងការងារថែមម៉ោង (Overtime)',
    overtime_subtitle: 'ការស្នើសុំ ការអនុម័ត និងគណនាប្រាក់ថែមម៉ោងស្របតាមច្បាប់ការងារកម្ពុជា',
    overtime_new_request: 'ស្នើសុំថែមម៉ោងថ្មី',
    overtime_calc_button: 'គណនាប្រាក់ថែមម៉ោង',
    overtime_print_auth: 'បោះពុម្ពលិខិតអនុញ្ញាត',
    roster_title: 'កាលវិភាគការងារ & វេនប្រចាំការ',
    roster_subtitle: 'ការរៀបចំវេនការងារ វេនប្រចាំការចុងសប្ដាហ៍ និងអនុលោមភាពច្បាប់ការងារកម្ពុជា',
    roster_week_view: 'កាលវិភាគប្រចាំសប្ដាហ៍',
    roster_month_view: 'ទិដ្ឋភាពប្រចាំខែ',
    roster_my_shifts: 'វេនការងាររបស់ខ្ញុំ',
    roster_auto_schedule: 'បង្កើតកាលវិភាគស្វ័យប្រវត្តិ',
    roster_print: 'បោះពុម្ពកាលវិភាគផ្លូវការ',
    roster_export_csv: 'ទាញយកទិន្នន័យ (CSV)',
    roster_total_hours: 'ម៉ោងសរុបសប្ដាហ៍នេះ',
    roster_on_duty_today: 'បុគ្គលិកកំពុងបំពេញការងារថ្ងៃនេះ',
    roster_weekend_duty: 'វេនប្រចាំការចុងសប្ដាហ៍',
    roster_rest_days: 'ថ្ងៃសម្រាក (OFF)',
    roster_labor_compliance: 'អនុលោមភាពច្បាប់ការងារ (មាត្រា ១៤៧)',
    roster_labor_compliance_sub: 'សម្រាកយ៉ាងតិច ២៤ ម៉ោងជាប់គ្នា/សប្ដាហ៍ និងមិនលើស ៤៨ ម៉ោង/សប្ដាហ៍',
    roster_assign_shift: 'កំណត់វេនការងារ',
    nav_salary: 'គ្រប់គ្រងប្រាក់បៀវត្សរ៍',
    nav_payroll: 'បៀវត្សរ៍ & ប.ស.ស',
    nav_recruitment: 'ជ្រើសរើសបុគ្គលិក',
    nav_performance: 'វាយតម្លៃការងារ',
    nav_announcements: 'សេចក្តីជូនដំណឹង',
    nav_tools: 'ឧបករណ៍ & ច្បាប់ការងារ',
    nav_staff_portal: 'ផតថលបុគ្គលិក',
    nav_manager_portal: 'ផតថលគណៈគ្រប់គ្រង',
    nav_reports: 'របាយការណ៍ & ស្ថិតិ HR',
    nav_users: 'គ្រប់គ្រងគណនី',
    nav_security: 'សន្តិសុខ & កំផែងការពារ',
    nav_settings: 'ការកំណត់ប្រព័ន្ធ',
    nav_it_inventory: 'សារពើភ័ណ្ឌ IT & ឧបករណ៍',
    nav_medical: 'សុខភាព & វេជ្ជសាស្ត្រ',
    it_m365_accounts: 'គណនី Microsoft 365 & អាជ្ញាប័ណ្ណ',
    nav_sec_overview: 'ទិដ្ឋភាពទូទៅ',
    nav_sec_workforce: 'កម្លាំងពលកម្ម',
    nav_sec_attendance: 'វត្តមាន & ម៉ោងការងារ',
    nav_sec_compensation: 'បៀវត្សរ៍ & ជ្រើសរើស',
    nav_sec_admin: 'ប្រព័ន្ធ & របាយការណ៍',
    sec_title: 'មជ្ឈមណ្ឌលសន្តិសុខ & កំផែងការពារ (Security & Firewall)',
    sec_subtitle: 'ត្រួតពិនិត្យ UFW Firewall, Fail2ban Intrusion Defense, SSL Let\'s Encrypt និង បញ្ជីអនុញ្ញាតបណ្តាញ (Trusted Whitelist)',
    sec_firewall_status: 'ស្ថានភាព Firewall (UFW)',
    sec_fail2ban_status: 'ប្រព័ន្ធទប់ស្កាត់ការវាយប្រហារ (Fail2ban)',
    sec_ai_protection: 'បណ្តាញទុកចិត្ត & ការពារ (Trusted Networks)',
    sec_ssl_status: 'វិញ្ញាបនបត្រ SSL / TLS',
    sec_tab_ufw: 'ច្បាប់ UFW Firewall',
    sec_tab_fail2ban: 'Fail2ban Jails & Banned IPs',
    sec_tab_whitelist: 'បញ្ជីអនុញ្ញាតបណ្តាញ (Trusted Whitelist)',
    sec_tab_logs: 'កំណត់ហេតុសន្តិសុខ (Live Logs)',

    // Tools & Calculators
    action_hr_letter: 'បង្កើតលិខិតផ្លូវការ',
    action_hr_letter_sub: 'លិខិតបញ្ជាក់ការងារ, ប្រាក់ខែ, សាកល្បង',
    action_calculator: 'គណនាច្បាប់ការងារ & ប.ស.ស',
    action_calculator_sub: 'អតីតភាពការងារ, ពន្ធលើប្រាក់ខែ, ប.ស.ស',
    action_holidays: 'ប្រតិទិនបុណ្យជាតិកម្ពុជា',
    action_holidays_sub: 'កាលវិភាគឈប់សម្រាកប្រចាំឆ្នាំផ្លូវការ',
    upcoming_holiday_badge: 'បុណ្យជាតិបន្ទាប់',
    days_left: 'ថ្ងៃទៀត',
    seniority_due: 'ប្រាក់បំណាច់អតីតភាព',
    seniority_desc: 'ជុំទី ២ (ខែធ្នូ): ៧.៥ ថ្ងៃ គិតតាមច្បាប់ការងារ',
    tax_deadline: 'កាលបរិច្ឆេទពន្ធ & ប.ស.ស',
    tax_deadline_desc: 'ថ្ងៃទី ២៥ រៀងរាល់ខែ (អគ្គនាយកដ្ឋានពន្ធដារ GDT)',

    // Header
    search_placeholder: 'ស្វែងរកបុគ្គលិក, ផ្នែកការងារ...',
    clock_in: 'កត់ត្រាចូល (Clock In)',
    clock_out: 'កត់ត្រាចេញ (Clock Out)',
    clocked_in: 'បានកត់ត្រាចូល',
    face_in: 'ស្កេនមុខចូល (Face In)',
    face_out: 'ស្កេនមុខចេញ (Face Out)',
    faced_in: 'បានស្កេនមុខចូល',
    face_in_modal_title: 'ស្កេនផ្ទៃមុខកត់ត្រាវត្តមាន (ZKTeco SpeedFace)',
    face_in_modal_sub: 'ការផ្ទៀងផ្ទាត់ជីវមាត្រផ្ទៃមុខដោយផ្ទាល់ជាមួយកាមេរ៉ា ZKTeco SpeedFace-V5L',
    face_in_scan_btn: 'ស្កេនមុខចូល (Face In)',
    face_out_scan_btn: 'ស្កេនមុខចេញ (Face Out)',
    face_in_camera_active: 'កាមេរ៉ា ZKTeco SpeedFace កំពុងដំណើរការ',
    face_in_align_prompt: 'សូមដាក់ផ្ទៃមុខចំកណ្តាលរង្វង់ស្កេនជីវមាត្រ',
    quick_action: 'សកម្មភាពរហ័ស',
    quick_actions_title: 'បង្កើត & ស្នើសុំ',
    action_add_employee: 'បញ្ចូលបុគ្គលិកថ្មី',
    action_add_employee_sub: 'ចុះឈ្មោះ & កំណត់ប្រាក់ខែ',
    action_request_leave: 'សុំច្បាប់ឈប់សម្រាក',
    action_request_leave_sub: 'ច្បាប់ប្រចាំឆ្នាំ, ឈឺ ឬធុរៈ',
    action_post_job: 'ប្រកាសជ្រើសរើសបុគ្គលិក',
    action_post_job_sub: 'ផ្សាយដំណឹងការងារថ្មី (ATS)',
    action_run_payroll: 'បើកប្រាក់បៀវត្សរ៍',
    action_run_payroll_sub: 'គណនាបៀវត្សរ៍ & ប.ស.ស (NSSF)',
    action_announcement: 'សេចក្តីជូនដំណឹង',
    action_announcement_sub: 'ផ្សព្វផ្សាយដំណឹងក្នុងក្រុមហ៊ុន',
    action_add_department: 'បង្កើតនាយកដ្ឋានថ្មី',
    action_add_department_sub: 'បន្ថែមផ្នែកការងារ & កំណត់ប្រធានផ្នែក',
    action_rename_department: 'ប្តូរឈ្មោះនាយកដ្ឋាន',
    action_delete_department: 'លុបនាយកដ្ឋាន',
    notifications: 'ការជូនដំណឹង',
    mark_all_read: 'សម្គាល់ថាបានអានទាំងអស់',
    mark_as_read: 'សម្គាល់ថាបានអាន',
    mark_as_unread: 'សម្គាល់ថាមិនទាន់អាន',
    delete_notification: 'លុបការជូនដំណឹង',
    no_notifications: 'មិនមានការជូនដំណឹងទេ',
    all_notifications: 'ទាំងអស់',
    unread_notifications: 'មិនទាន់អាន',
    clear_all_notifications: 'សម្អាតទាំងអស់',
    caught_up_message: 'អ្នកបានអានការជូនដំណឹងទាំងអស់រួចរាល់ហើយ!',
    switch_persona: 'ប្តូរតួនាទី / ទិដ្ឋភាព',
    change_password: 'ប្តូរពាក្យសម្ងាត់',
    current_password: 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
    new_password: 'ពាក្យសម្ងាត់ថ្មី',
    confirm_new_password: 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី',

    // Dashboard
    good_morning: 'សួស្តីពេលព្រឹក',
    good_afternoon: 'សួស្តីពេលរសៀល',
    good_evening: 'សួស្តីពេលល្ងាច',
    cambodia_time: 'ម៉ោងនៅកម្ពុជា',
    all_systems_operational: 'ប្រព័ន្ធដំណើរការប្រក្រតី',
    q4_fiscal: 'ត្រីមាសទី ៤ ឆ្នាំ២០២៦',
    theme_label: 'រចនាប័ទ្មផ្ទាំង',
    theme_light: 'ពន្លឺធម្មជាតិ (Nordic Light)',
    theme_dark: 'ងងឹត (Midnight Dark)',
    theme_indigo: 'ខៀវចាស់ (Indigo)',
    fullscreen_enter: 'ពង្រីកពេញអេក្រង់ (Full Screen)',
    fullscreen_exit: 'ចាកចេញពីអេក្រង់ពេញ (Exit Fullscreen)',
    active_view: 'ទិដ្ឋភាពបច្ចុប្បន្ន',

    // Dashboard Metrics
    workforce_total: 'ចំនួនបុគ្គលិកសរុប',
    colleagues_unit: 'នាក់',
    active_staff: 'កំពុងបម្រើការ',
    on_leave_staff: 'កំពុងសុំច្បាប់',
    open_directory: 'មើលបញ្ជីបុគ្គលិកទាំងអស់',
    attendance_today: 'វត្តមានថ្ងៃនេះ',
    in_office: 'មកការិយាល័យ',
    remote_wfh: 'ធ្វើការពីផ្ទះ',
    punch_timesheets: 'ពិនិត្យតារាងវត្តមាន',
    pending_leaves: 'សំណើសុំច្បាប់រង់ចាំ',
    requests_unit: 'សំណើ',
    sla_24h: 'ស្តង់ដារអនុម័តពីប្រធានផ្នែក < ២៤ ម៉ោង',
    review_queue: 'ពិនិត្យសំណើសុំច្បាប់',
    monthly_payroll: 'បៀវត្សរ៍ប្រចាំខែ',
    riel_equivalent: 'រៀល (KHR) + កាត់ ប.ស.ស',
    ledger_payslips: 'បញ្ជីបៀវត្សរ៍ & ប័ណ្ណបើកប្រាក់',

    // Dashboard Hubs
    ai_copilot_title: 'HESTRA Automation - ស្វ័យប្រវត្តិកម្មធនធានមនុស្ស',
    ai_copilot_sub: 'វិភាគទិន្នន័យបុគ្គលិកស្វ័យប្រវត្តិ អនុលោមភាពច្បាប់ការងារ និង ប.ស.ស',
    ai_monitoring_leave: 'តាមដានការអនុម័តច្បាប់ឈប់សម្រាក',
    ai_monitoring_ats: 'ស្ថានភាពជ្រើសរើសបុគ្គលិក (ATS)',
    ai_monitoring_payroll: 'សវនកម្មបៀវត្សរ៍ & ប.ស.ស (NSSF)',
    department_allocation: 'ការបែងចែកបុគ្គលិកតាមដេប៉ាតឺម៉ង់',
    department_allocation_sub: 'សមាមាត្រកម្លាំងពលកម្មតាមបណ្តាផ្នែកនីមួយៗក្នុងក្រុមហ៊ុន',
    divisions_tab: 'ផ្នែកការងារ',
    weekly_trend_tab: 'និន្នាការប្រចាំសប្តាហ៍',
    workforce_radar: 'រ៉ាដាវត្តមានបុគ្គលិក',
    workforce_radar_sub: 'ស្ថានភាពវត្តមាន និងទីតាំងការងាររបស់បុគ្គលិកទាំងអស់',
    late_arrivals: 'មកយឺត',
    on_authorized_leave: 'ឈប់សម្រាកមានច្បាប់',
    operations_stream: 'បច្ចុប្បន្នភាពសកម្មភាពការងារ',
    operations_stream_sub: 'កំណត់ត្រាសកម្មភាពថ្មីៗ៖ ការសុំច្បាប់, បុគ្គលិកថ្មី និងការបើកបៀវត្សរ៍',
    team_celebrations: 'កម្មវិធីអបអរ & ខួបកំណើត',
    team_celebrations_sub: 'ផ្ញើសារអបអរសាទរ និងបាញ់កាំជ្រួចឌីជីថលជូនសមាជិកក្រុម!',
    bulletin_link: 'ព្រឹត្តិបត្រសេចក្តីជូនដំណឹងក្រុមហ៊ុន',

    // Common Buttons & Modals
    cancel: 'បោះបង់',
    submit: 'បញ្ជូន',
    save: 'រក្សាទុក',
    clear_all: 'សម្អាតបញ្ជី',
    export_csv: 'ទាញយក CSV',
    add_employee: 'បញ្ចូលបុគ្គលិក',
    request_leave: 'សុំច្បាប់សម្រាក',
    run_payroll: 'បើកប្រាក់ខែ',
    post_job: 'ប្រកាសការងារ',
    post_announcement: 'ផ្សាយដំណឹង',
    status: 'ស្ថានភាព',
    action: 'សកម្មភាព',
    department: 'នាយកដ្ឋាន / ផ្នែក',
    location: 'ទីតាំងការងារ',
    role: 'មុខតំណែង',
    salary: 'ប្រាក់បៀវត្សរ៍',

    // Employee Directory & Drawer
    emp_directory_title: 'បញ្ជីបុគ្គលិក & ធនធានមនុស្ស',
    emp_directory_sub: 'ស្វែងរក, ច្រោះតាមផ្នែក, គ្រប់គ្រងប្រវត្តិរូប, ប្រាក់បៀវត្សរ៍, វត្តមាន និងច្បាប់ឈប់សម្រាក',
    emp_clear_btn: 'សម្អាតបញ្ជី',
    emp_export_csv: 'ទាញយក CSV',
    emp_import_csv: 'នាំចូល CSV/Excel',
    emp_print_roster: 'បោះពុម្ពបញ្ជី',
    emp_print_profile: 'បោះពុម្ពប្រវត្តិរូប (A4)',
    emp_add_staff: 'បញ្ចូលបុគ្គលិក',
    emp_import_modal_title: 'នាំចូលបញ្ជីបុគ្គលិក (Import Employees)',
    emp_import_modal_sub: 'បញ្ចូលទិន្នន័យបុគ្គលិកជាកញ្ចប់តាមរយៈឯកសារ CSV/Excel ឬបិទភ្ជាប់ទិន្នន័យ',
    emp_import_upload_tab: 'ផ្ទុកឡើងឯកសារ CSV',
    emp_import_paste_tab: 'បិទភ្ជាប់ទិន្នន័យ CSV',
    emp_import_template_btn: 'ទាញយកគំរូ CSV (Template)',
    emp_import_dropzone: 'ចុចដើម្បីជ្រើសរើស ឬទាញទម្លាក់ឯកសារ CSV មកទីនេះ',
    emp_import_preview_title: 'ការផ្ទៀងផ្ទាត់ & មើលទិន្នន័យជាមុន',
    emp_import_btn: 'នាំចូលបុគ្គលិក',
    emp_search_placeholder: 'ស្វែងរកតាមឈ្មោះ, អ៊ីមែល, មុខតំណែង...',
    emp_all_departments: 'គ្រប់ដេប៉ាតឺម៉ង់',
    emp_all_positions: 'គ្រប់មុខតំណែង (All Positions)',
    emp_position_col: 'មុខតំណែង (Position)',
    emp_all_types: 'គ្រប់ប្រភេទការងារ',
    emp_type_fulltime: 'ពេញម៉ោង',
    emp_type_parttime: 'ក្រៅម៉ោង',
    emp_type_contract: 'កិច្ចសន្យា',
    emp_type_intern: 'កម្មសិក្សា',
    emp_official_letter: 'ចេញលិខិតផ្លូវការ',
    emp_hr_profile_tab: 'HR Profile (៧ ផ្នែក)',
    emp_view_7_sections: 'មើលព័ត៌មានលម្អិតទាំង ៧ ផ្នែក →',
  },

  en: {
    // Brand
    brand_name: 'HESTRA HRM',
    brand_tagline: 'Human Resource Management',

    // Language
    lang_switch: 'Switch Language',
    lang_khmer: 'Khmer',
    lang_english: 'English',

    // Nav
    nav_dashboard: 'Dashboard',
    nav_employees: 'Employees',
    nav_departments: 'Departments',
    nav_structure: 'Company Structure',
    nav_attendance: 'Attendance',
    nav_roster: 'Duty Roster & Shifts',
    nav_overtime: 'Overtime (OT)',
    nav_leaves: 'Time Off & Leaves',
    nav_requests: 'Requests & Approvals',
    nav_zkteco: 'ZKTeco Management',
    overtime_title: 'Overtime Management (OT)',
    overtime_subtitle: 'Overtime requests, dual-tier approvals, and Cambodian labor rate calculations',
    overtime_new_request: 'New Overtime Request',
    overtime_calc_button: 'OT Pay Calculator',
    overtime_print_auth: 'Print OT Authorization',
    roster_title: 'Work & Duty Roster',
    roster_subtitle: 'Shift scheduling, weekend duty allocation, and Cambodian labor compliance',
    roster_week_view: 'Weekly Matrix View',
    roster_month_view: 'Monthly View',
    roster_my_shifts: 'My Assigned Shifts',
    roster_auto_schedule: 'Auto-Schedule Shifts',
    roster_print: 'Print Official Roster',
    roster_export_csv: 'Export CSV',
    roster_total_hours: 'Total Weekly Scheduled Hours',
    roster_on_duty_today: 'Staff On Duty Today',
    roster_weekend_duty: 'Weekend Duty Staff',
    roster_rest_days: 'Rest Days (OFF)',
    roster_labor_compliance: 'Labor Law Compliance (Article 147)',
    roster_labor_compliance_sub: 'Min 24h consecutive weekly rest & max 48h regular hours/week',
    roster_assign_shift: 'Assign Shift',
    nav_salary: 'Salary Management',
    nav_payroll: 'Payroll & NSSF',
    nav_recruitment: 'Recruitment',
    nav_performance: 'Performance',
    nav_announcements: 'Announcements',
    nav_tools: 'HR Tools & Legal',
    nav_staff_portal: 'Staff Portal',
    nav_manager_portal: 'Manager Portal',
    nav_reports: 'Reports & Analytics',
    nav_users: 'User Management',
    nav_security: 'Security & Firewall',
    nav_settings: 'System Settings',
    nav_it_inventory: 'IT Inventory & Assets',
    nav_medical: 'Health & Medical',
    it_m365_accounts: 'Microsoft 365 & Cloud Accounts',
    nav_sec_overview: 'Overview',
    nav_sec_workforce: 'Workforce',
    nav_sec_attendance: 'Time & Attendance',
    nav_sec_compensation: 'Compensation & ATS',
    nav_sec_admin: 'Administration',
    sec_title: 'Security & Firewall Center',
    sec_subtitle: 'Enterprise management for UFW firewall, Fail2ban intrusion defense, Let\'s Encrypt SSL, and trusted IP whitelist',
    sec_firewall_status: 'Firewall Status (UFW)',
    sec_fail2ban_status: 'Intrusion Defense (Fail2ban)',
    sec_ai_protection: 'Trusted Networks & Access',
    sec_ssl_status: 'SSL / TLS Certificate',
    sec_tab_ufw: 'UFW Firewall Rules',
    sec_tab_fail2ban: 'Fail2ban Jails & Bans',
    sec_tab_whitelist: 'Trusted Networks Whitelist',
    sec_tab_logs: 'Security Event Logs',

    // Tools & Calculators
    action_hr_letter: 'Generate HR Letter',
    action_hr_letter_sub: 'Employment, salary & probation letters',
    action_calculator: 'Labor Law & Tax Calc',
    action_calculator_sub: 'Seniority, salary tax & NSSF breakdown',
    action_holidays: 'Cambodia Public Holidays',
    action_holidays_sub: 'Official MLVT national holiday calendar',
    upcoming_holiday_badge: 'Next Public Holiday',
    days_left: 'days left',
    seniority_due: 'Seniority Indemnity',
    seniority_desc: 'Cycle 2 (Dec): 7.5 days pay under Labor Law',
    tax_deadline: 'Tax & NSSF Deadline',
    tax_deadline_desc: '25th of each month (GDT / MLVT e-Filing)',

    // Header
    search_placeholder: 'Search employees, departments, jobs...',
    clock_in: 'Clock In',
    clock_out: 'Clock Out',
    clocked_in: 'Clocked In',
    face_in: 'Face In',
    face_out: 'Face Out',
    faced_in: 'Faced In',
    face_in_modal_title: 'Biometric Face Attendance (ZKTeco SpeedFace)',
    face_in_modal_sub: 'Live visible light facial recognition connected to ZKTeco SpeedFace-V5L',
    face_in_scan_btn: 'Scan Face & Check In',
    face_out_scan_btn: 'Scan Face & Check Out',
    face_in_camera_active: 'ZKTeco SpeedFace Camera Online',
    face_in_align_prompt: 'Position your face within the biometric reticle',
    quick_action: 'Quick Action',
    quick_actions_title: 'Create & Request',
    action_add_employee: 'Add New Employee',
    action_add_employee_sub: 'Onboard hire & set compensation',
    action_request_leave: 'Request Time Off',
    action_request_leave_sub: 'Annual, sick, or casual leave',
    action_post_job: 'Post Job Opening',
    action_post_job_sub: 'Publish to recruitment pipeline',
    action_run_payroll: 'Run Monthly Payroll',
    action_run_payroll_sub: 'Process batch payslips & NSSF',
    action_announcement: 'New Announcement',
    action_announcement_sub: 'Broadcast to company bulletin',
    action_add_department: 'Add Department',
    action_add_department_sub: 'Create division & assign manager',
    action_rename_department: 'Rename Department',
    action_delete_department: 'Delete Department',
    notifications: 'Notifications',
    mark_all_read: 'Mark all as read',
    mark_as_read: 'Mark as read',
    mark_as_unread: 'Mark as unread',
    delete_notification: 'Delete notification',
    no_notifications: 'No notifications',
    all_notifications: 'All',
    unread_notifications: 'Unread',
    clear_all_notifications: 'Clear all',
    caught_up_message: "You're all caught up! No unread notifications.",
    switch_persona: 'Switch Persona View',
    change_password: 'Change Password',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_new_password: 'Confirm New Password',

    // Dashboard
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    cambodia_time: 'Cambodia Time',
    all_systems_operational: 'All Systems Operational',
    q4_fiscal: 'Q4 Fiscal 2026',
    theme_label: 'Dashboard Theme',
    theme_light: 'Nordic Minimal (Light)',
    theme_dark: 'Midnight Obsidian (Dark)',
    theme_indigo: 'Indigo Electric',
    fullscreen_enter: 'Full Screen View',
    fullscreen_exit: 'Exit Fullscreen',
    active_view: 'Active View',

    // Dashboard Metrics
    workforce_total: 'Total Workforce',
    colleagues_unit: 'colleagues',
    active_staff: 'active staff',
    on_leave_staff: 'on leave',
    open_directory: 'Open Employee Directory',
    attendance_today: 'Attendance Today',
    in_office: 'In Office',
    remote_wfh: 'Remote (WFH)',
    punch_timesheets: 'Punch Timesheets',
    pending_leaves: 'Pending Time-Off',
    requests_unit: 'requests',
    sla_24h: 'Manager review SLA: < 24h',
    review_queue: 'Review Approval Queue',
    monthly_payroll: 'Monthly Payroll',
    riel_equivalent: 'KHR equivalent + NSSF deducted',
    ledger_payslips: 'Ledger & Digital Payslips',

    // Dashboard Hubs
    ai_copilot_title: 'HESTRA Automation',
    ai_copilot_sub: 'Autonomous HR intelligence & proactive Cambodian labor compliance',
    ai_monitoring_leave: 'Leave Approval Monitoring',
    ai_monitoring_ats: 'Recruitment SLA Status',
    ai_monitoring_payroll: 'Compensation & NSSF Audit',
    department_allocation: 'Department Allocation',
    department_allocation_sub: 'Workforce distribution across all business divisions',
    divisions_tab: 'Divisions',
    weekly_trend_tab: 'Weekly Trend',
    workforce_radar: 'Workforce Presence Radar',
    workforce_radar_sub: 'Real-time telemetry and shift locations for all staff',
    late_arrivals: 'Late Arrivals',
    on_authorized_leave: 'On Authorized Leave',
    operations_stream: 'Live Operations Stream',
    operations_stream_sub: 'Chronological event stream of approvals, hires, and payroll',
    team_celebrations: 'Team Celebrations',
    team_celebrations_sub: 'Send congratulations and fire confetti cannons!',
    bulletin_link: 'Company Announcements Bulletin',

    // Common Buttons & Modals
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save Changes',
    clear_all: 'Clear All',
    export_csv: 'Export CSV',
    add_employee: 'Add Staff',
    request_leave: 'Request Time Off',
    run_payroll: 'Run Payroll',
    post_job: 'Post Job',
    post_announcement: 'Post Bulletin',
    status: 'Status',
    action: 'Action',
    department: 'Department',
    location: 'Location',
    role: 'Job Role / Title',
    salary: 'Base Salary',

    // Employee Directory & Drawer
    emp_directory_title: 'Employee Directory & Workforce',
    emp_directory_sub: 'Search, filter by department, manage profiles, compensation, attendance and leaves',
    emp_clear_btn: 'Clear Directory',
    emp_export_csv: 'Export CSV',
    emp_import_csv: 'Import CSV/Excel',
    emp_print_roster: 'Print Roster',
    emp_print_profile: 'Print Dossier (A4)',
    emp_add_staff: 'Add Staff',
    emp_import_modal_title: 'Import Workforce Roster',
    emp_import_modal_sub: 'Batch onboard staff members via CSV/Excel file or paste spreadsheet data',
    emp_import_upload_tab: 'Upload CSV File',
    emp_import_paste_tab: 'Paste CSV Text',
    emp_import_template_btn: 'Download CSV Template',
    emp_import_dropzone: 'Click to browse or drag & drop CSV file here',
    emp_import_preview_title: 'Validation & Live Preview',
    emp_import_btn: 'Import Employees',
    emp_search_placeholder: 'Search by name, email, position...',
    emp_all_departments: 'All Departments',
    emp_all_positions: 'All Positions',
    emp_position_col: 'Position',
    emp_all_types: 'All Types',
    emp_type_fulltime: 'Full-Time',
    emp_type_parttime: 'Part-Time',
    emp_type_contract: 'Contract',
    emp_type_intern: 'Intern',
    emp_official_letter: 'Issue Official Letter',
    emp_hr_profile_tab: 'HR Profile (7 Sections)',
    emp_view_7_sections: 'View Full 7-Section Profile →',
  },
};

const KHMER_TO_EN_NAMES: Record<string, string> = {
  'វ៉ាន់': 'Van', 'សុភ័ក្ត្រ': 'Sopheak', 'ចាន់': 'Chan', 'ធីតា': 'Thida',
  'សួន': 'Suon', 'វិសាល': 'Visal', 'គង់': 'Kong', 'ចិន្តា': 'Chenda',
  'សេង': 'Seng', 'វណ្ណា': 'Vanna', 'លី': 'Ly', 'សុខា': 'Sokha',
  'ឃឹម': 'Khim', 'ដារ៉ា': 'Dara', 'រ័ត្ន': 'Rath', 'សុភាព': 'Sopheap',
  'ហេង': 'Heng', 'កុសល': 'Kosal', 'អ៊ុក': 'Ouk', 'ប៊ុនធឿន': 'Bunthoeun',
  'ម៉ៅ': 'Mao', 'សុលីតា': 'Solita', 'ជា': 'Chea', 'បុប្ផា': 'Bopha',
  'សារ៉ាត់': 'Sarath', 'ព្រំ': 'Prom', 'វាសនា': 'Veasna', 'យឹម': 'Yim',
  'កុលាប': 'Kolab', 'តាំង': 'Tang', 'សុគន្ធ': 'Sokun', 'ស៊ុន': 'Sun',
  'កក្កដា': 'Kakkada', 'ស៊ឹម': 'Sim', 'ឌី': 'Dy', 'វុទ្ធី': 'Vuthey',
  'ពិសិដ្ឋ': 'Piseth', 'សុធា': 'Sothea', 'ចា': 'Cha', 'កែវ': 'Keo',
  'សុខ': 'Sok', 'ចន្ទ': 'Chan', 'ម៉ាលីស': 'Malis',
};

const KHMER_TO_EN_PHRASES: Record<string, string> = {
  'ផ្នែកបច្ចេកវិទ្យា & វិស្វកម្ម': 'Engineering & Tech',
  'ផ្នែកបច្ចេកវិទ្យា': 'Engineering',
  'ផ្នែករចនា & ផលិតផល': 'Product & Design',
  'ផ្នែកទីផ្សារ & ប្រព័ន្ធផ្សព្វផ្សាយ': 'Marketing & PR',
  'ផ្នែកលក់ & អភិវឌ្ឍន៍អាជីវកម្ម': 'Sales & Enterprise',
  'ផ្នែកធនធានមនុស្ស & វប្បធម៌': 'People & Culture',
  'ផ្នែកគណនេយ្យ & ហិរញ្ញវត្ថុ': 'Finance & Legal',
  'នាយកផ្នែកបច្ចេកវិទ្យា': 'VP of Engineering',
  'វិស្វករកម្មវិធីជាន់ខ្ពស់': 'Lead Full-Stack Engineer',
  'វិស្វករ DevOps & Cloud Security': 'DevOps & Cloud Security Engineer',
  'ប្រធានផ្នែករចនា': 'Head of Product Design',
  'អ្នកស្រាវជ្រាវផលិតផល': 'Principal UX Researcher',
  'អ្នកឯកទេសទីផ្សារឌីជីថល': 'Growth Marketing Lead',
  'អ្នកគ្រប់គ្រងទំនាក់ទំនង': 'PR & Communications Manager',
  'នាយកផ្នែកលក់': 'Enterprise Sales Director',
  'ប្រធានផ្នែកធនធានមនុស្ស': 'Head of Human Resources',
  'នាយកផ្នែកហិរញ្ញវត្ថុ': 'Chief Financial Officer',
  'ពេញម៉ោង': 'Full-Time',
  'ក្រៅម៉ោង': 'Part-Time',
  'កិច្ចសន្យា': 'Contract',
  'កម្មសិក្សា': 'Intern',
  'ប្រុស': 'Male',
  'ស្រី': 'Female',
  'នៅលីវ': 'Single',
  'រៀបការ': 'Married',
  'កម្ពុជា': 'Cambodian',
  'មាន': 'Yes',
  'គ្មាន': 'No',
  'សកម្ម': 'Active',
  'សាកល្បង': 'Probation',
  'រាជធានីភ្នំពេញ': 'Phnom Penh',
  'ភ្នំពេញ': 'Phnom Penh',
  'សៀមរាប': 'Siem Reap',
  'បាត់ដំបង': 'Battambang',
  'កណ្តាល': 'Kandal',
  'ព្រះសីហនុ': 'Preah Sihanouk',
  'ការិយាល័យកណ្តាល': 'Head Office',
  'ប្រចាំខែ': 'Monthly',
  'ប្តី': 'Spouse',
  'ប្រពន្ធ': 'Spouse',
  'ស្វាមី': 'Spouse',
  'ភរិយា': 'Spouse',
  'ឪពុក': 'Parent',
  'ម្តាយ': 'Parent',
  'បងប្អូន': 'Sibling',
  'បងប្រុស': 'Brother',
  'ប្អូនស្រី': 'Sister',
  'ថ្ងៃ': 'days',
  'នាក់': 'staff',
  'ម៉ោង': 'hours',
  'ខែ': 'month',
  'ឆ្នាំ': 'years',
  '៛': 'KHR',
  'រៀល': 'KHR',
  'ច្បាប់ប្រចាំឆ្នាំ': 'Annual Leave',
  'ច្បាប់ឈឺ': 'Sick Leave',
  'ច្បាប់ធុរៈ': 'Casual Leave',
  'ច្បាប់ធុរៈគ្រួសារ': 'Casual Leave',
  'ច្បាប់លំហែមាតុភាព/បិតុភាព': 'Maternity/Paternity Leave',
  'ឈប់សម្រាកគ្មានប្រាក់ឈ្នួល': 'Unpaid Leave',
  'វត្តមាន': 'Present',
  'ធ្វើការពីផ្ទះ': 'Remote (WFH)',
  'មកយឺត': 'Late',
  'អវត្តមាន': 'Absent',
  'អនុម័ត': 'Approved',
  'បដិសេធ': 'Rejected',
  'រង់ចាំ': 'Pending',
  'បុគ្គលិកពេញសិទ្ធិ': 'Regular / Permanent',
  'បុគ្គលិកកិច្ចសន្យា': 'Contractual',
  'បុគ្គលិកសាកល្បង': 'Probationary',
  'កម្មសិក្សាការី': 'Internship',
};

export function formatLocalizedText(text: string | null | undefined, language: 'en' | 'km'): string {
  if (!text) return '';
  let str = String(text).trim();

  // If language is Khmer, return Khmer parts if bilingual
  if (language === 'km') {
    const parenMatch = str.match(/^(.*?)\s*\((.*?)\)$/);
    if (parenMatch) {
      const part1 = parenMatch[1].trim();
      const part2 = parenMatch[2].trim();
      if (/[\u1780-\u17FF]/.test(part1)) return part1;
      if (/[\u1780-\u17FF]/.test(part2)) return part2;
    }
    return str;
  }

  // --- LANGUAGE IS ENGLISH ---
  // 1. Check if string matches outer parenthesis: "Khmer (English)" or "English (Khmer)"
  const parenMatch = str.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    const part1 = parenMatch[1].trim();
    const part2 = parenMatch[2].trim();
    const isPart1Khmer = /[\u1780-\u17FF]/.test(part1);
    const isPart2Khmer = /[\u1780-\u17FF]/.test(part2);

    if (!isPart2Khmer && part2.length > 0) return part2;
    if (!isPart1Khmer && part1.length > 0) return part1;
  }

  // 2. Check for slash pattern: "Khmer / English" or "English / Khmer"
  if (str.includes(' / ') || str.includes(' ⁄ ')) {
    const parts = str.split(/\s*[/⁄]\s*/);
    const nonKhmer = parts.filter((p) => !/[\u1780-\u17FF]/.test(p) && p.trim().length > 0);
    if (nonKhmer.length > 0) return nonKhmer.join(' / ');
  }

  // 3. Replace known phrases and dictionary entries
  for (const [km, en] of Object.entries(KHMER_TO_EN_PHRASES)) {
    if (str.includes(km)) {
      str = str.replaceAll(km, en);
    }
  }

  // 4. Replace known Khmer names
  for (const [km, en] of Object.entries(KHMER_TO_EN_NAMES)) {
    if (str.includes(km)) {
      str = str.replaceAll(km, en);
    }
  }

  // 5. Replace currency symbol
  str = str.replaceAll('៛', 'KHR').replaceAll('រៀល', 'KHR');

  // 6. Strip any remaining Khmer Unicode characters (\u1780-\u17FF and Khmer symbols \u19E0-\u19FF)
  if (/[\u1780-\u17FF\u19E0-\u19FF]/.test(str)) {
    str = str.replace(/[\u1780-\u17FF\u19E0-\u19FF]+/g, '');
  }

  // 7. Clean up empty parentheses, brackets, double spaces, dangling colons/dashes
  str = str
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[:,\-\/\s]+|[:,\-\/\s]+$/g, '')
    .trim();

  return str;
}

export function cleanEnglishOnly(text: string | null | undefined): string {
  if (!text) return '';
  const localized = formatLocalizedText(text, 'en');
  return localized.replace(/[\u1780-\u17FF\u19E0-\u19FF]/g, '').trim();
}

export function sanitizeEnglishInput(text: string): string {
  if (!text) return '';
  if (/[\u1780-\u17FF]/.test(text) && /\(.*\)/.test(text)) {
    return cleanEnglishOnly(text);
  }
  if (/^[\u1780-\u17FF\s]+$/.test(text)) {
    return cleanEnglishOnly(text);
  }
  return text.replace(/[\u1780-\u17FF\u19E0-\u19FF]/g, '');
}

/**
 * Format any date input (YYYY-MM-DD, ISO string, DD/MM/YYYY, Date object) to DD/MM/YYYY.
 */
export function formatDateDMY(dateInput?: string | Date | null, fallback = ''): string {
  if (!dateInput) return fallback;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === '-' || trimmed === 'N/A' || trimmed === '—') {
      return fallback || trimmed;
    }

    // Already DD/MM/YYYY (e.g. 15/01/2026 or 1/2/2026)
    const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmySlash) {
      const [, d, m, y] = dmySlash;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // DD-MM-YYYY
    const dmyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dmyDash) {
      const [, d, m, y] = dmyDash;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // Parse with Date constructor
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }

    return trimmed;
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return fallback;
}

/**
 * Normalizes any date input (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, ISO string) into standard ISO YYYY-MM-DD for database storage.
 */
export function parseDateToISO(dateInput?: string | null): string {
  if (!dateInput) return '';
  const trimmed = dateInput.trim();
  if (!trimmed) return '';

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return trimmed;
}
