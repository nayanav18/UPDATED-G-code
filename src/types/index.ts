export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'developer';
  isVerified: boolean;
}

export interface Business {
  business_id: string;
  business_name: string;
  description: string;
  data_source: string;
  created_at: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  focus_areas: string[];
  allowed_areas: string[];
  default_questions: string[];
  role_visibility: string;
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

export interface Dataset {
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

export interface DatasetFullMetadata extends Dataset {
  tables: any[]; // TableMetadata[]
}

export interface KPIItem {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface VisualConfig {
  visual_id: string;
  type: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'stacked_bar' | 'stacked_column' | 'table' | 'kpi_card';
  title: string;
  dimension?: string;
  measure?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  table?: string;
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
  data?: any[];
}

export interface Message {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: 'conversation' | 'analysis' | 'visualization' | 'dashboard';
  kpis?: KPIItem[];
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

export interface Conversation {
  conversation_id: string;
  user_id: string;
  title: string;
  business_id: string;
  persona_id: string;
  dataset_id: string;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  dashboard_id: string;
  user_id: string;
  business_id: string;
  persona_id: string;
  dataset_id: string;
  name: string;
  description: string;
  layout: 'grid' | 'fluid';
  visuals: VisualConfig[];
  filters: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_permission?: 'owner' | 'editor' | 'viewer';
  shares?: Array<{ share_id: string; email: string; permission: string; created_at: string }>;
}

export interface PipelineItem {
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
