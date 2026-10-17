import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface OrgNode {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  khmer_name?: string | null;
  role: string;
  department_id: string;
  department_name?: string;
  department_color?: string;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  pay_grade?: string | null;
  group_name?: string | null;
  status: string;
  direct_reports_count: number;
  total_subordinates_count: number;
  children: OrgNode[];
}

export interface CompanyHierarchyNode {
  id: string;
  name: string;
  name_km: string;
  role: string;
  role_km: string;
  level: 'board' | 'chairman' | 'executive' | 'department' | 'manager' | 'section' | 'line';
  level_label: string;
  level_label_km: string;
  tier: number;
  department_id?: string;
  department_name?: string;
  department_color?: string;
  group_id?: string;
  group_name?: string;
  description?: string;
  description_km?: string;
  employee_count: number;
  assigned_employees: Array<{
    id: string;
    name: string;
    khmer_name?: string;
    role: string;
    avatar?: string;
  }>;
  children: CompanyHierarchyNode[];
}

function buildCompanyHierarchy(employees: any[], departments: any[] = []): CompanyHierarchyNode | null {
  if (!departments || departments.length === 0) {
    return null;
  }
  // Helper to find employees matching a role, department, or group
  const findMatches = (matcher: (e: any) => boolean) => {
    return employees.filter(matcher).map((e) => ({
      id: e.id,
      name: e.name || `${e.first_name} ${e.last_name}`,
      khmer_name: e.khmer_name,
      role: e.role,
      avatar: e.avatar,
    }));
  };

  // Node generator helper
  const createNode = (data: {
    id: string;
    name: string;
    name_km: string;
    role: string;
    role_km: string;
    level: CompanyHierarchyNode['level'];
    level_label: string;
    level_label_km: string;
    tier: number;
    department_id?: string;
    department_name?: string;
    department_color?: string;
    group_id?: string;
    group_name?: string;
    description?: string;
    description_km?: string;
    matchFilter?: (e: any) => boolean;
    children?: CompanyHierarchyNode[];
  }): CompanyHierarchyNode => {
    const assigned = data.matchFilter ? findMatches(data.matchFilter) : [];
    const childNodes = data.children || [];
    const directCount = assigned.length;
    const totalChildCount = childNodes.reduce((acc, c) => acc + c.employee_count, 0);

    return {
      id: data.id,
      name: data.name,
      name_km: data.name_km,
      role: data.role,
      role_km: data.role_km,
      level: data.level,
      level_label: data.level_label,
      level_label_km: data.level_label_km,
      tier: data.tier,
      department_id: data.department_id,
      department_name: data.department_name,
      department_color: data.department_color,
      group_id: data.group_id,
      group_name: data.group_name,
      description: data.description,
      description_km: data.description_km,
      employee_count: directCount + totalChildCount,
      assigned_employees: assigned,
      children: childNodes,
    };
  };

  // 1. Human Resources & Administration Children
  const hrChildren: CompanyHierarchyNode[] = [
    createNode({
      id: 'org-hr-unit',
      name: 'Human Resources',
      name_km: 'ធនធានមនុស្ស',
      role: 'Human Resources Operations',
      role_km: 'គ្រប់គ្រងបុគ្គលិក អនុលោមភាពច្បាប់ និងទំនាក់ទំនងការងារ',
      level: 'section',
      level_label: 'Unit / Section',
      level_label_km: 'ផ្នែកធនធានមនុស្ស',
      tier: 4,
      department_id: 'dept-hr',
      department_name: 'Human Resources & Administration',
      department_color: '#3b82f6',
      group_id: 'grp-hr',
      group_name: 'Human Resources',
      matchFilter: (e) =>
        e.group_id === 'grp-hr' ||
        e.group_name === 'Human Resources' ||
        (e.department_id === 'dept-hr' &&
          !(e.role || '').toLowerCase().includes('medical') &&
          !(e.role || '').toLowerCase().includes('nurse')),
    }),
    createNode({
      id: 'org-medical',
      name: 'Health & Medical Services',
      name_km: 'សេវាសុខាភិបាល និងសុខភាព',
      role: 'Health & Medical Services',
      role_km: 'បន្ទប់សង្គ្រោះបឋម ពិនិត្យសុខភាព និងថែទាំវេជ្ជសាស្ត្រ',
      level: 'section',
      level_label: 'Unit / Service',
      level_label_km: 'សេវាសុខាភិបាល',
      tier: 4,
      department_id: 'dept-hr',
      department_name: 'Human Resources & Administration',
      department_color: '#3b82f6',
      group_id: 'grp-med',
      group_name: 'Health & Medical Services',
      matchFilter: (e) =>
        e.group_id === 'grp-med' ||
        e.group_name === 'Health & Medical Services' ||
        (e.role || '').toLowerCase().includes('nurse') ||
        (e.role || '').toLowerCase().includes('doctor') ||
        (e.role || '').toLowerCase().includes('medical'),
    }),
  ];

  // 2. Production Children (Sewing lines nested)
  const sewingLines: CompanyHierarchyNode[] = [
    createNode({
      id: 'org-sew-line1',
      name: 'Sewing Line 1',
      name_km: 'ខ្សែដេរទី ១ (Sewing Line 1)',
      role: 'Production Sewing Line 1',
      role_km: 'ប្រតិបត្តិការដេរខ្សែសង្វាក់ផលិតកម្មទី ១',
      level: 'line',
      level_label: 'Production Line',
      level_label_km: 'ខ្សែសង្វាក់ផលិត',
      tier: 5,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-sew1',
      group_name: 'Sewing Line 1',
      matchFilter: (e) =>
        e.group_id === 'grp-sew1' ||
        e.group_name === 'Sewing Line 1' ||
        e.group_name === 'Sew-L.1',
    }),
    createNode({
      id: 'org-sew-line2',
      name: 'Sewing Line 2',
      name_km: 'ខ្សែដេរទី ២ (Sewing Line 2)',
      role: 'Production Sewing Line 2',
      role_km: 'ប្រតិបត្តិការដេរខ្សែសង្វាក់ផលិតកម្មទី ២',
      level: 'line',
      level_label: 'Production Line',
      level_label_km: 'ខ្សែសង្វាក់ផលិត',
      tier: 5,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-sew2',
      group_name: 'Sewing Line 2',
      matchFilter: (e) =>
        e.group_id === 'grp-sew2' ||
        e.group_name === 'Sewing Line 2' ||
        e.group_name === 'Sew-L.2',
    }),
  ];

  const prodChildren: CompanyHierarchyNode[] = [
    createNode({
      id: 'org-pattern',
      name: 'Pattern Making',
      name_km: 'ផ្នែកគំរូ និងម៉ូដ (Pattern Making)',
      role: 'Pattern Making Section',
      role_km: 'រចនាម៉ូដ ពុម្ពគំរូ និងគំរូតេស្តបច្ចេកទេស',
      level: 'section',
      level_label: 'Technical Section',
      level_label_km: 'ផ្នែកបច្ចេកទេស',
      tier: 4,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-pat',
      group_name: 'Pattern Making',
      matchFilter: (e) =>
        e.group_id === 'grp-pat' ||
        e.group_name === 'Pattern Making' ||
        e.group_name === 'Pattern' ||
        (e.role || '').toLowerCase().includes('pattern'),
    }),
    createNode({
      id: 'org-packing',
      name: 'Packing',
      name_km: 'ផ្នែកវេចខ្ចប់ (Packing)',
      role: 'Packing Section',
      role_km: 'វេចខ្ចប់ ដាក់ស្លាកសញ្ញា និងរៀបចំប្រអប់',
      level: 'section',
      level_label: 'Section / Team',
      level_label_km: 'ផ្នែកវេចខ្ចប់',
      tier: 4,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-pak',
      group_name: 'Packing',
      matchFilter: (e) =>
        e.group_id === 'grp-pak' ||
        e.group_name === 'Packing' ||
        e.group_name === 'Pak' ||
        (e.role || '').toLowerCase().includes('pack'),
    }),
    createNode({
      id: 'org-sewing',
      name: 'Sewing',
      name_km: 'ផ្នែកដេរ (Sewing)',
      role: 'Sewing Assembly Lines',
      role_km: 'ខ្សែសង្វាក់ដេរស្រោមដៃ និងដំឡើងផលិតផល',
      level: 'section',
      level_label: 'Main Production Section',
      level_label_km: 'ផ្នែកដេរចម្បង',
      tier: 4,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      children: sewingLines,
    }),
    createNode({
      id: 'org-cutting',
      name: 'Cutting',
      name_km: 'ផ្នែកកាត់ (Cutting)',
      role: 'Cutting Section',
      role_km: 'កាត់ស្បែក និងសាច់ក្រណាត់តាមពុម្ពបច្ចេកទេស',
      level: 'section',
      level_label: 'Section / Team',
      level_label_km: 'ផ្នែកកាត់',
      tier: 4,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-cut',
      group_name: 'Cutting',
      matchFilter: (e) =>
        e.group_id === 'grp-cut' ||
        e.group_name === 'Cutting' ||
        e.group_name === 'Cut' ||
        (e.role || '').toLowerCase().includes('cut'),
    }),
    createNode({
      id: 'org-qc',
      name: 'Quality Control',
      name_km: 'ផ្នែកត្រួតពិនិត្យគុណភាព (Quality Control)',
      role: 'Quality Control Section',
      role_km: 'ត្រួតពិនិត្យស្តង់ដារគុណភាព និងសវនកម្ម',
      level: 'section',
      level_label: 'Quality Assurance',
      level_label_km: 'ផ្នែកត្រួតពិនិត្យគុណភាព',
      tier: 4,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      group_id: 'grp-qc',
      group_name: 'Quality Control',
      matchFilter: (e) =>
        e.group_id === 'grp-qc' ||
        e.group_name === 'Quality Control' ||
        e.group_name === 'QC' ||
        (e.role || '').toLowerCase().includes('qc') ||
        (e.role || '').toLowerCase().includes('quality'),
    }),
  ];

  // 3. Facilities & Maintenance Children
  const facChildren: CompanyHierarchyNode[] = [
    createNode({
      id: 'org-clean',
      name: 'Cleaning Services',
      name_km: 'សេវាអនាម័យ និងសំអាត (Cleaning Services)',
      role: 'Cleaning Services',
      role_km: 'អនាម័យបរិស្ថានរោងចក្រ និងការសំអាតទូទៅ',
      level: 'section',
      level_label: 'Services / Janitorial',
      level_label_km: 'សេវាអនាម័យ',
      tier: 4,
      department_id: 'dept-fac',
      department_name: 'Facilities & Maintenance',
      department_color: '#14b8a6',
      group_id: 'grp-clean',
      group_name: 'Cleaning Services',
      matchFilter: (e) =>
        e.group_id === 'grp-clean' ||
        e.group_name === 'Cleaning Services' ||
        (e.role || '').toLowerCase().includes('clean'),
    }),
    createNode({
      id: 'org-maint',
      name: 'Maintenance & Repair',
      name_km: 'ជួសជុល និងថែទាំ (Maintenance & Repair)',
      role: 'Maintenance & Repair',
      role_km: 'ជាងម៉ាស៊ីនដេរ អគ្គិសនី និងប្រព័ន្ធទ្រទ្រង់រោងចក្រ',
      level: 'section',
      level_label: 'Technical Maintenance',
      level_label_km: 'ជួសជុល & ថែទាំ',
      tier: 4,
      department_id: 'dept-fac',
      department_name: 'Facilities & Maintenance',
      department_color: '#14b8a6',
      group_id: 'grp-maint',
      group_name: 'Maintenance & Repair',
      matchFilter: (e) =>
        e.group_id === 'grp-maint' ||
        e.group_name === 'Maintenance & Repair' ||
        e.group_name === 'Maint' ||
        (e.role || '').toLowerCase().includes('repair') ||
        (e.role || '').toLowerCase().includes('maint'),
    }),
  ];

  // 8 Functional Department Level Nodes (Tier 3)
  const departmentNodes: CompanyHierarchyNode[] = [
    createNode({
      id: 'org-dept-hr',
      name: 'Human Resources & Administration',
      name_km: 'ធនធានមនុស្ស និងរដ្ឋបាល',
      role: 'Human Resources & Administration Division',
      role_km: 'ការិយាល័យធនធានមនុស្ស និងរដ្ឋបាលទូទៅ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-hr',
      department_name: 'Human Resources & Administration',
      department_color: '#3b82f6',
      children: hrChildren,
      matchFilter: (e) => e.department_id === 'dept-hr',
    }),
    createNode({
      id: 'org-dept-it',
      name: 'Information Technology',
      name_km: 'បច្ចេកវិទ្យាព័ត៌មាន (IT)',
      role: 'Information Technology Division',
      role_km: 'ការិយាល័យបច្ចេកវិទ្យាព័ត៌មាន និងប្រព័ន្ធកុំព្យូទ័រ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-it',
      department_name: 'Information Technology',
      department_color: '#06b6d4',
      matchFilter: (e) =>
        e.department_id === 'dept-it' || (e.role || '').toLowerCase().includes('it'),
    }),
    createNode({
      id: 'org-dept-fin',
      name: 'Finance & Accounting',
      name_km: 'ហិរញ្ញវត្ថុ និងគណនេយ្យ',
      role: 'Finance & Accounting Division',
      role_km: 'ការិយាល័យហិរញ្ញវត្ថុ គណនេយ្យ និងបើកប្រាក់បៀវត្សរ៍',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-fin',
      department_name: 'Finance & Accounting',
      department_color: '#10b981',
      matchFilter: (e) =>
        e.department_id === 'dept-fin' ||
        (e.role || '').toLowerCase().includes('finance') ||
        (e.role || '').toLowerCase().includes('account'),
    }),
    createNode({
      id: 'org-dept-proc',
      name: 'Procurement',
      name_km: 'លទ្ធកម្ម (Procurement)',
      role: 'Procurement Division',
      role_km: 'ការិយាល័យលទ្ធកម្ម និងផ្គត់ផ្គង់សម្ភារ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-proc',
      department_name: 'Procurement',
      department_color: '#f59e0b',
      matchFilter: (e) =>
        e.department_id === 'dept-proc' ||
        (e.role || '').toLowerCase().includes('procurement'),
    }),
    createNode({
      id: 'org-dept-prod',
      name: 'Production',
      name_km: 'ផ្នែកផលិតកម្ម (Manufacturing)',
      role: 'Manufacturing & Production Division',
      role_km: 'រោងចក្រផលិតកម្មដេរ និងកែច្នៃស្រោមដៃ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-prod',
      department_name: 'Production',
      department_color: '#6366f1',
      children: prodChildren,
      matchFilter: (e) => e.department_id === 'dept-prod',
    }),
    createNode({
      id: 'org-dept-log',
      name: 'Logistics',
      name_km: 'ភស្តុភារកម្ម (Logistics)',
      role: 'Logistics & Transportation Division',
      role_km: 'ការិយាល័យភស្តុភារកម្ម និងដឹកជញ្ជូនទំនិញ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-log',
      department_name: 'Logistics',
      department_color: '#8b5cf6',
      matchFilter: (e) =>
        e.department_id === 'dept-log' ||
        (e.role || '').toLowerCase().includes('logistics'),
    }),
    createNode({
      id: 'org-dept-wh',
      name: 'Warehouse & Distribution',
      name_km: 'ឃ្លាំង និងចែកចាយ',
      role: 'Warehouse & Materials Division',
      role_km: 'ការិយាល័យឃ្លាំងស្តុក និងចែកចាយវត្ថុធាតុដើម',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-wh',
      department_name: 'Warehouse & Distribution',
      department_color: '#f97316',
      matchFilter: (e) =>
        e.department_id === 'dept-wh' ||
        (e.role || '').toLowerCase().includes('warehouse'),
    }),
    createNode({
      id: 'org-dept-fac',
      name: 'Facilities & Maintenance',
      name_km: 'គ្រឿងបរិក្ខារ និងជួសជុលថែទាំ',
      role: 'Facilities & Maintenance Division',
      role_km: 'ការិយាល័យគ្រឿងបរិក្ខារ ជួសជុលម៉ាស៊ីន និងអនាម័យ',
      level: 'department',
      level_label: 'Department',
      level_label_km: 'នាយកដ្ឋាន',
      tier: 3,
      department_id: 'dept-fac',
      department_name: 'Facilities & Maintenance',
      department_color: '#14b8a6',
      children: facChildren,
      matchFilter: (e) => e.department_id === 'dept-fac',
    }),
  ];

  // Tier 2: General Management
  const gmNode = createNode({
    id: 'org-gm',
    name: 'General Management',
    name_km: 'អគ្គនាយកដ្ឋាន (General Management)',
    role: 'General Management / Executive Leadership',
    role_km: 'អគ្គនាយកគ្រប់គ្រងទូទៅរោងចក្រ',
    level: 'executive',
    level_label: 'Executive Leadership',
    level_label_km: 'ថ្នាក់ដឹកនាំជាន់ខ្ពស់',
    tier: 2,
    department_id: 'dept-gm',
    department_name: 'General Management',
    department_color: '#7c3aed',
    matchFilter: (e) =>
      e.department_id === 'dept-gm' ||
      (e.role || '').toLowerCase().includes('general manager') ||
      (e.role || '').toLowerCase().includes('managing director'),
    children: departmentNodes,
  });

  // Tier 1: Board of Directors (Root)
  const bodNode = createNode({
    id: 'org-bod',
    name: 'Board of Directors',
    name_km: 'ក្រុមប្រឹក្សាភិបាល',
    role: 'Board of Directors (Governance & Strategic Oversight)',
    role_km: 'ក្រុមប្រឹក្សាភិបាលក្រុមហ៊ុន (អភិបាលកិច្ច និងយុទ្ធសាស្ត្រ)',
    level: 'board',
    level_label: 'Board of Directors',
    level_label_km: 'ថ្នាក់ក្រុមប្រឹក្សាភិបាល',
    tier: 1,
    department_id: 'dept-gm',
    department_name: 'General Management',
    department_color: '#7c3aed',
    children: [gmNode],
  });

  return bodNode;
}

export async function GET() {
  try {
    const db = getDb();

    // 1. Fetch active employees with department and manager info
    const employees = db.prepare(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.first_name || ' ' || e.last_name as name,
        e.khmer_name,
        e.role,
        e.department_id,
        d.name as department_name,
        COALESCE(d.color, '#6366f1') as department_color,
        e.avatar,
        e.email,
        e.phone,
        e.manager_id,
        m.first_name || ' ' || m.last_name as manager_name,
        e.pay_grade,
        e.group_name,
        e.salary,
        e.status,
        e.join_date
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE e.status != 'Terminated'
      ORDER BY e.salary DESC, e.id ASC
    `).all() as any[];

    // 2. Fetch departments with their groups
    const departments = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        m.khmer_name as manager_khmer_name,
        m.role as manager_role,
        m.avatar as manager_avatar,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      LEFT JOIN employees e ON e.department_id = d.id AND e.status != 'Terminated'
      GROUP BY d.id, m.first_name, m.last_name, m.khmer_name, m.role, m.avatar
      ORDER BY d.id ASC
    `).all() as any[];

    // Fetch groups for each department
    const allGroups = db.prepare(`
      SELECT eg.*, COUNT(e.id) as employee_count
      FROM employee_groups eg
      LEFT JOIN employees e ON (e.group_id = eg.id OR e.group_name = eg.name) AND e.status != 'Terminated'
      GROUP BY eg.id, eg.name, eg.department_id, eg.description, eg.created_at
      ORDER BY eg.name ASC
    `).all() as any[];

    const groupsByDept = new Map<string, any[]>();
    for (const g of allGroups) {
      if (g.department_id) {
        if (!groupsByDept.has(g.department_id)) {
          groupsByDept.set(g.department_id, []);
        }
        groupsByDept.get(g.department_id)!.push(g);
      }
    }

    const enhancedDepartments = departments.map((d) => ({
      ...d,
      groups: groupsByDept.get(d.id) || [],
      group_count: (groupsByDept.get(d.id) || []).length,
    }));

    // 3. Build adjacency maps for actual employees
    const nodeMap: Record<string, OrgNode> = {};
    const childrenMap: Record<string, string[]> = {};

    employees.forEach((emp) => {
      nodeMap[emp.id] = {
        ...emp,
        direct_reports_count: 0,
        total_subordinates_count: 0,
        children: [],
      };
      childrenMap[emp.id] = [];
    });

    const rootIds: string[] = [];

    employees.forEach((emp) => {
      if (emp.manager_id && nodeMap[emp.manager_id]) {
        childrenMap[emp.manager_id].push(emp.id);
      } else {
        rootIds.push(emp.id);
      }
    });

    // Helper to calculate total descendants and attach children
    function buildSubtree(id: string): OrgNode {
      const node = nodeMap[id];
      const childIds = childrenMap[id] || [];
      node.direct_reports_count = childIds.length;

      let totalDescendants = 0;
      node.children = childIds.map((cid) => {
        const childNode = buildSubtree(cid);
        totalDescendants += 1 + childNode.total_subordinates_count;
        return childNode;
      });
      node.total_subordinates_count = totalDescendants;
      return node;
    }

    const tree = rootIds.map((rid) => buildSubtree(rid));

    // Build the official company hierarchy tree (Board -> Chairman -> GM -> Departments -> Units)
    const companyHierarchy = buildCompanyHierarchy(employees, enhancedDepartments);

    // Summary statistics
    const leadershipCount = employees.filter((e) => {
      const r = (e.role || '').toLowerCase();
      return (
        r.includes('director') ||
        r.includes('head') ||
        r.includes('chief') ||
        r.includes('leader') ||
        r.includes('admin') ||
        r.includes('officer') ||
        r.includes('manager')
      );
    }).length;

    // Calculate maximum depth
    function getDepth(node: OrgNode): number {
      if (!node.children || node.children.length === 0) return 1;
      return 1 + Math.max(...node.children.map(getDepth));
    }
    const maxDepth = tree.length > 0 ? Math.max(...tree.map(getDepth)) : 6;

    return NextResponse.json({
      success: true,
      tree,
      companyHierarchy,
      rootIds,
      departments: enhancedDepartments,
      flatEmployees: employees,
      summary: {
        total_employees: employees.length,
        total_departments: enhancedDepartments.length,
        leadership_count: leadershipCount,
        max_depth: maxDepth,
      },
    });
  } catch (error: any) {
    console.error('Error generating organization structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { employee_id, manager_id } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    if (employee_id === manager_id) {
      return NextResponse.json({ error: 'An employee cannot be their own manager' }, { status: 400 });
    }

    // Verify employee exists
    const emp = db.prepare('SELECT id, manager_id, first_name, last_name FROM employees WHERE id = ?').get(employee_id) as any;
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check for cycles if assigning a new manager
    if (manager_id) {
      let curr = manager_id;
      const visited = new Set<string>([employee_id]);
      while (curr) {
        if (visited.has(curr)) {
          return NextResponse.json({ error: 'Cycle detected: this manager assignment would create a circular reporting loop' }, { status: 400 });
        }
        visited.add(curr);
        const parent = db.prepare('SELECT manager_id FROM employees WHERE id = ?').get(curr) as any;
        curr = parent ? parent.manager_id : null;
      }
    }

    const prevManager = emp.manager_id;
    db.prepare('UPDATE employees SET manager_id = ? WHERE id = ?').run(manager_id || null, employee_id);

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_REPORTING_LINE',
      module: 'Company Structure',
      record_id: employee_id,
      old_value: JSON.stringify({ manager_id: prevManager }),
      new_value: JSON.stringify({ manager_id: manager_id || null }),
    });

    return NextResponse.json({
      success: true,
      employee_id,
      manager_id: manager_id || null,
      prev_manager_id: prevManager,
    });
  } catch (error: any) {
    console.error('Error updating reporting line:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
