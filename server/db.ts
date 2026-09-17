import fs from 'fs';
import path from 'path';

// Types for backend persistence
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isVerified: boolean;
  verificationCode?: string;
  role: 'admin' | 'user' | 'developer';
  createdAt: string;
}

export interface BusinessRecord {
  business_id: string;
  business_name: string;
  description: string;
  data_source: string;
  created_at: string;
}

export interface PersonaRecord {
  id: string;
  name: string;
  description: string;
  focus_areas: string[];
  allowed_areas: string[];
  default_questions: string[];
  role_visibility: 'broad_executive' | 'marketing' | 'product' | 'operations' | 'analytical' | 'technical_developer';
}

export interface DatasetRecord {
  dataset_id: string;
  name: string;
  description: string;
  project_id: string;
  location: string;
  source: string;
  rows: number;
  columns: number;
  last_updated: string;
  tables: string[];
}

export interface ColumnMetadata {
  column: string;
  data_type: 'STRING' | 'INTEGER' | 'FLOAT' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN';
  description: string;
  nullable: boolean;
  is_dimension: boolean;
  is_measure: boolean;
  is_date: boolean;
}

export interface TableMetadata {
  table_id: string;
  table_name: string;
  description: string;
  row_count: number;
  columns: ColumnMetadata[];
  sample_rows: Record<string, any>[];
}

export interface MessageRecord {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: 'conversation' | 'analysis' | 'visualization' | 'dashboard';
  kpis?: Array<{ label: string; value: string; change?: string; trend?: 'up' | 'down' | 'neutral' }>;
  visualization?: {
    visual_id: string;
    type: string;
    title: string;
    dimension: string;
    measure: string;
    aggregation: string;
    data: any[];
  };
  sql?: string;
  query_result?: any[];
  suggested_followups?: string[];
  provider: 'gemini' | 'development_fallback';
  created_at: string;
}

export interface ConversationRecord {
  conversation_id: string;
  user_id: string;
  title: string;
  business_id: string;
  persona_id: string;
  dataset_id: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardVisual {
  visual_id: string;
  type: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'stacked_bar' | 'stacked_column' | 'table' | 'kpi_card';
  title: string;
  dimension?: string;
  measure?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters?: Record<string, any>;
  position: { x: number; y: number };
  width: number;
  height: number;
  formatting?: {
    colorTheme?: string;
    showLegend?: boolean;
    showDataLabels?: boolean;
    prefix?: string;
    suffix?: string;
  };
}

export interface DashboardRecord {
  dashboard_id: string;
  user_id: string;
  business_id: string;
  persona_id: string;
  dataset_id: string;
  name: string;
  description: string;
  layout: 'grid' | 'fluid';
  visuals: DashboardVisual[];
  filters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DashboardShare {
  share_id: string;
  dashboard_id: string;
  email: string;
  permission: 'viewer' | 'editor';
  shared_by: string;
  created_at: string;
}

export interface PipelineRecord {
  id: string;
  name: string;
  persona: string;
  business_area: string;
  dataset_id: string;
  status: 'active' | 'in_review' | 'planned' | 'completed';
  date: string;
  metric_target: string;
  metric_current: string;
  details: string;
}

// Memory database with auto-file-backup
class DatabaseStore {
  public users: Map<string, UserRecord> = new Map();
  public businesses: Map<string, BusinessRecord> = new Map();
  public personas: Map<string, PersonaRecord> = new Map();
  public datasets: Map<string, DatasetRecord> = new Map();
  public tableMetadata: Map<string, TableMetadata> = new Map();
  public conversations: Map<string, ConversationRecord> = new Map();
  public messages: Map<string, MessageRecord> = new Map();
  public dashboards: Map<string, DashboardRecord> = new Map();
  public shares: Map<string, DashboardShare> = new Map();
  public pipeline: Map<string, PipelineRecord> = new Map();

  private storageFile: string;

  constructor() {
    this.storageFile = path.resolve(process.cwd(), 'data_storage.json');
    this.initDefaultData();
    this.loadFromDisk();
  }

  private initDefaultData() {
    // Default business: Vodafone Ireland
    this.businesses.set('vf-ireland', {
      business_id: 'vf-ireland',
      business_name: 'Vodafone Ireland',
      description: 'Enterprise telecommunications provider in Ireland offering Mobile, Fixed Broadband, and Cloud Solutions.',
      data_source: 'Google Cloud BigQuery (vf-grp-gbissdbx-dev-1:KarthikRudrapati)',
      created_at: new Date().toISOString()
    });

    // Exactly the 6 personas specified in doc page 8, 42-43:
    // CEO, Marketing Head, Product Manager, Operations Manager, Data Analyst, Developer Team
    const personasList: PersonaRecord[] = [
      {
        id: 'ceo',
        name: 'CEO',
        description: 'Broad organizational business visibility: Revenue, Customers, Marketing, Products, Offers, Operations, Retention, and Strategy Pipeline.',
        focus_areas: ['Revenue', 'Customers', 'Marketing', 'Products', 'Offers', 'Operations', 'Retention', 'Pipeline'],
        allowed_areas: ['Executive Overview', 'Revenue', 'Customers', 'Marketing', 'Products', 'Offers', 'Operations', 'Retention', 'Pipeline'],
        default_questions: [
          'What was our total revenue this quarter?',
          'What is our customer retention rate across mobile and broadband?',
          'Compare product performance between 5G Unlimited and Fibre Extra.',
          'Show executive overview of strategic pipeline goals.'
        ],
        role_visibility: 'broad_executive'
      },
      {
        id: 'marketing_head',
        name: 'Marketing Head',
        description: 'Customer acquisition, campaign performance, channel ROI, customer inflow, conversion rates, and promotional segment growth.',
        focus_areas: ['Marketing', 'Customers', 'Offers', 'Acquisition', 'Pipeline'],
        allowed_areas: ['Marketing', 'Campaigns', 'Channels', 'Conversion', 'Acquisition', 'Segment Growth', 'Promotions'],
        default_questions: [
          'Which marketing channel drove the highest conversion last month?',
          'What is our customer acquisition cost by campaign?',
          'How did the Summer 5G Promo perform compared to target?',
          'Show inflow of new subscribers from digital channels.'
        ],
        role_visibility: 'marketing'
      },
      {
        id: 'product_manager',
        name: 'Product Manager',
        description: 'Product plans, bundle adoption, ARPU (Average Revenue Per User), product mix, feature usage, and product pipeline.',
        focus_areas: ['Products', 'Offers', 'Customers', 'Revenue', 'Pipeline'],
        allowed_areas: ['Products', 'Plans', 'Offers', 'ARPU', 'Product Adoption', 'Bundle Adoption', 'Product Mix'],
        default_questions: [
          'What is the average ARPU across unlimited mobile plans?',
          'Which broadband bundles have the highest adoption rate?',
          'Show product mix evolution over the last 6 months.',
          'How many customers upgraded to Gigabit Fibre?'
        ],
        role_visibility: 'product'
      },
      {
        id: 'operations_manager',
        name: 'Operations Manager',
        description: 'Service operations, network quality, customer churn, service ticket outflow, at-risk accounts, and SLA compliance.',
        focus_areas: ['Operations', 'Customers', 'Retention', 'Churn', 'Pipeline'],
        allowed_areas: ['Operations', 'Service Performance', 'Retention', 'Churn', 'Outflow', 'Service Quality', 'At-Risk Accounts'],
        default_questions: [
          'What happened to customer churn rate in Dublin area?',
          'How many customers are currently flagged at-risk due to latency issues?',
          'What is our mean resolution time for network outage incidents?',
          'Show operations pipeline for tower upgrades.'
        ],
        role_visibility: 'operations'
      },
      {
        id: 'data_analyst',
        name: 'Data Analyst',
        description: 'Deep analytical queries, dataset exploration, statistical distributions, multi-dimensional correlations, trends, and custom measures.',
        focus_areas: ['All analytical data', 'Metadata', 'Dimensions', 'Measures', 'Trends', 'Anomalies', 'Pipeline'],
        allowed_areas: ['All Business Areas', 'Cross-dimensional Analysis', 'Statistical Analysis', 'Custom SQL Generation', 'Anomalies'],
        default_questions: [
          'What is the correlation between tenure and ARPU in enterprise accounts?',
          'Are there seasonal anomalies in mobile data throughput?',
          'Show percentile distribution of monthly billing across contract lengths.',
          'Inspect metadata and measures for customer_churn_and_revenue table.'
        ],
        role_visibility: 'analytical'
      },
      {
        id: 'developer_team',
        name: 'Developer Team',
        description: 'Technical dataset inspection, table schemas, column types, query execution stats, analytics configuration, and data pipelines.',
        focus_areas: ['All datasets', 'Metadata', 'System', 'Analytics configuration', 'Pipeline', 'Technical visibility'],
        allowed_areas: ['All Tables', 'Schema Discovery', 'Data Types', 'Pipeline Visibility', 'Data Quality Health', 'System Info'],
        default_questions: [
          'List all available BigQuery tables and their column data types.',
          'What is the data freshness and ingestion timestamp for the dataset?',
          'Check system information, router logs, and Vertex AI latency.',
          'Inspect data pipeline ingestion failure rates and schemas.'
        ],
        role_visibility: 'technical_developer'
      }
    ];

    for (const p of personasList) {
      this.personas.set(p.id, p);
    }

    // Google Cloud BigQuery dataset specified in doc page 3, 14, 50:
    // Project ID: vf-grp-gbissdbx-dev-1, Dataset: KarthikRudrapati, Location: US
    const bqDataset: DatasetRecord = {
      dataset_id: 'KarthikRudrapati',
      name: 'KarthikRudrapati (Vodafone Enterprise Analytics)',
      description: 'Official production telecommunications enterprise dataset in BigQuery containing subscribers, revenue, marketing campaigns, product ARPU, and network service quality.',
      project_id: 'vf-grp-gbissdbx-dev-1',
      location: 'US',
      source: 'Google Cloud BigQuery',
      rows: 248500,
      columns: 46,
      last_updated: '2026-09-15 08:30:00 UTC',
      tables: [
        'customer_churn_and_revenue',
        'campaign_performance',
        'product_adoption_and_arpu',
        'network_operations_quality'
      ]
    };
    this.datasets.set(bqDataset.dataset_id, bqDataset);

    // Initial table schemas with realistic BigQuery schema discovery (Page 15, 17)
    this.tableMetadata.set('customer_churn_and_revenue', {
      table_id: 'customer_churn_and_revenue',
      table_name: 'Customer Churn & Revenue',
      description: 'Monthly customer records including revenue, contract type, churn status, tenure, and payment methods.',
      row_count: 125000,
      columns: [
        { column: 'customer_id', data_type: 'STRING', description: 'Unique Vodafone subscriber identifier', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'month', data_type: 'STRING', description: 'Reporting period month (YYYY-MM)', nullable: false, is_dimension: true, is_measure: false, is_date: true },
        { column: 'region', data_type: 'STRING', description: 'Irish county or geographic cluster (e.g., Dublin, Cork, Galway)', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'customer_segment', data_type: 'STRING', description: 'Enterprise, SME, or Consumer tier', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'revenue', data_type: 'FLOAT', description: 'Total monthly recurring revenue in EUR', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'churn_flag', data_type: 'INTEGER', description: '1 if subscriber terminated service in period, 0 otherwise', nullable: false, is_dimension: true, is_measure: true, is_date: false },
        { column: 'tenure_months', data_type: 'INTEGER', description: 'Active service duration in months', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'contract_type', data_type: 'STRING', description: '12-Month, 24-Month, or Rolling Sim-Only', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'satisfaction_score', data_type: 'FLOAT', description: 'CSAT / NPS indicator from 1 to 10', nullable: true, is_dimension: false, is_measure: true, is_date: false }
      ],
      sample_rows: [
        { customer_id: 'VF-IE-98214', month: '2026-05', region: 'Dublin', customer_segment: 'Enterprise', revenue: 420.50, churn_flag: 0, tenure_months: 34, contract_type: '24-Month', satisfaction_score: 8.8 },
        { customer_id: 'VF-IE-61042', month: '2026-05', region: 'Cork', customer_segment: 'SME', revenue: 165.00, churn_flag: 0, tenure_months: 18, contract_type: '12-Month', satisfaction_score: 7.9 },
        { customer_id: 'VF-IE-77419', month: '2026-05', region: 'Galway', customer_segment: 'Consumer', revenue: 64.99, churn_flag: 1, tenure_months: 8, contract_type: 'Rolling Sim-Only', satisfaction_score: 5.2 },
        { customer_id: 'VF-IE-82910', month: '2026-06', region: 'Dublin', customer_segment: 'Enterprise', revenue: 445.00, churn_flag: 0, tenure_months: 35, contract_type: '24-Month', satisfaction_score: 9.1 },
        { customer_id: 'VF-IE-49201', month: '2026-06', region: 'Limerick', customer_segment: 'Consumer', revenue: 59.99, churn_flag: 0, tenure_months: 12, contract_type: '12-Month', satisfaction_score: 8.0 }
      ]
    });

    this.tableMetadata.set('campaign_performance', {
      table_id: 'campaign_performance',
      table_name: 'Marketing Campaign Performance',
      description: 'Marketing campaign results across digital, retail, and direct outreach channels.',
      row_count: 3200,
      columns: [
        { column: 'campaign_id', data_type: 'STRING', description: 'Campaign tracking identifier', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'campaign_name', data_type: 'STRING', description: 'Name of the marketing push (e.g. 5G Ultra Promo, Fibre Fest)', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'channel', data_type: 'STRING', description: 'Digital Ads, Social, Direct Mail, Retail Stores, TV', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'cost', data_type: 'FLOAT', description: 'Campaign expenditure in EUR', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'impressions', data_type: 'INTEGER', description: 'Total ad views delivered', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'leads', data_type: 'INTEGER', description: 'Qualified sales leads received', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'conversions', data_type: 'INTEGER', description: 'Completed contract sign-ups', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'cac', data_type: 'FLOAT', description: 'Calculated Customer Acquisition Cost (Cost / Conversions)', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'start_date', data_type: 'DATE', description: 'Campaign launch date', nullable: false, is_dimension: true, is_measure: false, is_date: true }
      ],
      sample_rows: [
        { campaign_id: 'CAMP-2026-01', campaign_name: '5G Gigacube Launch', channel: 'Digital Ads', cost: 45000, impressions: 850000, leads: 12400, conversions: 2150, cac: 20.93, start_date: '2026-04-01' },
        { campaign_id: 'CAMP-2026-02', campaign_name: 'Enterprise Cloud Flex', channel: 'Direct Mail', cost: 28000, impressions: 95000, leads: 3200, conversions: 890, cac: 31.46, start_date: '2026-04-15' },
        { campaign_id: 'CAMP-2026-03', campaign_name: 'Summer Roam Free', channel: 'Social', cost: 34000, impressions: 1200000, leads: 18500, conversions: 3420, cac: 9.94, start_date: '2026-05-01' }
      ]
    });

    this.tableMetadata.set('product_adoption_and_arpu', {
      table_id: 'product_adoption_and_arpu',
      table_name: 'Product Adoption & ARPU',
      description: 'Breakdown of plan tiers, subscriber counts, ARPU, and upgrade trends.',
      row_count: 5400,
      columns: [
        { column: 'plan_code', data_type: 'STRING', description: 'SKU code for tariff plan', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'product_name', data_type: 'STRING', description: 'Commercial product name', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'category', data_type: 'STRING', description: 'Mobile Postpaid, Mobile Prepaid, Fixed Fibre, Cloud IoT', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'active_subscribers', data_type: 'INTEGER', description: 'Total connected active SIMs/lines', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'arpu', data_type: 'FLOAT', description: 'Average Revenue Per User in EUR', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'mrr_contribution', data_type: 'FLOAT', description: 'Monthly Recurring Revenue contribution (Subs * ARPU)', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'churn_rate_pct', data_type: 'FLOAT', description: 'Annualized churn rate percentage', nullable: false, is_dimension: false, is_measure: true, is_date: false }
      ],
      sample_rows: [
        { plan_code: 'RED-UNL-5G', product_name: 'Vodafone Red 5G Unlimited', category: 'Mobile Postpaid', active_subscribers: 142000, arpu: 35.50, mrr_contribution: 5041000, churn_rate_pct: 1.8 },
        { plan_code: 'FIBRE-PRO-1G', product_name: 'Gigabit Fibre Pro', category: 'Fixed Fibre', active_subscribers: 68000, arpu: 55.00, mrr_contribution: 3740000, churn_rate_pct: 1.2 },
        { plan_code: 'BIZ-CLOUD-IOT', product_name: 'Vodafone Business Global IoT', category: 'Cloud IoT', active_subscribers: 38500, arpu: 85.20, mrr_contribution: 3280200, churn_rate_pct: 0.7 }
      ]
    });

    this.tableMetadata.set('network_operations_quality', {
      table_id: 'network_operations_quality',
      table_name: 'Network Operations & Service Quality',
      description: 'Cellular mast uptime, latency, SLA adherence, and customer ticket outflow by county.',
      row_count: 14200,
      columns: [
        { column: 'site_cluster', data_type: 'STRING', description: 'Tower cluster region', nullable: false, is_dimension: true, is_measure: false, is_date: false },
        { column: 'uptime_pct', data_type: 'FLOAT', description: 'Network radio uptime percentage', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'avg_latency_ms', data_type: 'FLOAT', description: 'Average 5G packet latency in milliseconds', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'trouble_tickets', data_type: 'INTEGER', description: 'Reported service issues in past 30 days', nullable: false, is_dimension: false, is_measure: true, is_date: false },
        { column: 'sla_compliance_pct', data_type: 'FLOAT', description: 'Service Level Agreement compliance rate', nullable: false, is_dimension: false, is_measure: true, is_date: false }
      ],
      sample_rows: [
        { site_cluster: 'Dublin Metro Core', uptime_pct: 99.98, avg_latency_ms: 12.4, trouble_tickets: 42, sla_compliance_pct: 99.4 },
        { site_cluster: 'Cork Urban & Port', uptime_pct: 99.95, avg_latency_ms: 14.1, trouble_tickets: 31, sla_compliance_pct: 98.9 },
        { site_cluster: 'Galway Innovation Corridor', uptime_pct: 99.92, avg_latency_ms: 15.8, trouble_tickets: 19, sla_compliance_pct: 99.1 }
      ]
    });

    // Default Pipeline Items (Pages 22-23, 48)
    const pipelineSeed: PipelineRecord[] = [
      {
        id: 'pipe-1',
        name: '5G Standalone Core Migration',
        persona: 'CEO',
        business_area: 'Revenue',
        dataset_id: 'KarthikRudrapati',
        status: 'active',
        date: '2026-Q3',
        metric_target: '€12.5M New Enterprise ARR',
        metric_current: '€8.2M contracted',
        details: 'Transitioning Tier 1 enterprise customers to private 5G network slicing.'
      },
      {
        id: 'pipe-2',
        name: 'Q3 Fibre Upgrade Acquisition Drive',
        persona: 'Marketing Head',
        business_area: 'Marketing',
        dataset_id: 'KarthikRudrapati',
        status: 'active',
        date: '2026-09',
        metric_target: '4,500 new consumer lines',
        metric_current: '3,820 acquired (85%)',
        details: 'Omnichannel promo pushing 1Gbps Fibre with bundled SIM for families.'
      },
      {
        id: 'pipe-3',
        name: 'Smart Business IoT Plan Modernization',
        persona: 'Product Manager',
        business_area: 'Products',
        dataset_id: 'KarthikRudrapati',
        status: 'in_review',
        date: '2026-10',
        metric_target: '€95 ARPU / connected node',
        metric_current: '€85.20 current ARPU',
        details: 'Introducing telemetry AI add-on for fleet management enterprise clients.'
      },
      {
        id: 'pipe-4',
        name: 'Proactive Churn Prevention Engine',
        persona: 'Operations Manager',
        business_area: 'Retention',
        dataset_id: 'KarthikRudrapati',
        status: 'active',
        date: '2026-09',
        metric_target: 'Reduce churn below 1.4%',
        metric_current: '1.62% current monthly churn',
        details: 'Triggering automated customer success retention offers when latency tickets exceed 2.'
      },
      {
        id: 'pipe-5',
        name: 'Regional Cell Tower Backhaul Overhaul',
        persona: 'Operations Manager',
        business_area: 'Operations',
        dataset_id: 'KarthikRudrapati',
        status: 'planned',
        date: '2026-Q4',
        metric_target: '99.99% network SLA compliance',
        metric_current: '99.4% current SLA',
        details: 'Upgrading West of Ireland optical backhaul to support increased summer tourism traffic.'
      },
      {
        id: 'pipe-6',
        name: 'BigQuery Automated Dimension Anomaly Alerts',
        persona: 'Developer Team',
        business_area: 'Pipeline',
        dataset_id: 'KarthikRudrapati',
        status: 'completed',
        date: '2026-09',
        metric_target: 'Sub-minute data quality validation',
        metric_current: '0.4s p99 validation latency',
        details: 'Cloud Pub/Sub listener verifying schema consistency across incoming CDR partitions.'
      }
    ];

    for (const item of pipelineSeed) {
      this.pipeline.set(item.id, item);
    }

    // Default pre-configured demonstration user (verified) so testing is instantaneous if desired
    this.users.set('usr-demo', {
      id: 'usr-demo',
      email: 'executive@vodafone.ie',
      name: 'Aoife Kelly',
      passwordHash: 'demo12345',
      isVerified: true,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.users) {
          for (const u of data.users) this.users.set(u.id, u);
        }
        if (data.conversations) {
          for (const c of data.conversations) this.conversations.set(c.conversation_id, c);
        }
        if (data.messages) {
          for (const m of data.messages) this.messages.set(m.message_id, m);
        }
        if (data.dashboards) {
          for (const d of data.dashboards) this.dashboards.set(d.dashboard_id, d);
        }
        if (data.shares) {
          for (const s of data.shares) this.shares.set(s.share_id, s);
        }
      }
    } catch (err) {
      console.warn('Could not read persistent storage file, starting fresh', err);
    }
  }

  public saveToDisk() {
    try {
      const payload = {
        users: Array.from(this.users.values()),
        conversations: Array.from(this.conversations.values()),
        messages: Array.from(this.messages.values()),
        dashboards: Array.from(this.dashboards.values()),
        shares: Array.from(this.shares.values()),
        pipeline: Array.from(this.pipeline.values())
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save to disk', err);
    }
  }
}

export const db = new DatabaseStore();
