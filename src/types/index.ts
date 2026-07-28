// ==========================================
// GrowMatrix Enterprise Platform Types (v2.0)
// ==========================================

export type DataType = 'string' | 'number' | 'date' | 'boolean';
export type FieldCategory = 'dimension' | 'measure' | 'temporal' | 'geographic';

// 1. Semantic Layer Field
export interface SemanticField {
  id: string;             // logical unique ID, e.g. "farmerName"
  physicalColumn: string; // e.g. "FK_FARMER_NAME"
  displayName: string;    // e.g. "Farmer Name"
  description: string;    // Tooltip info
  dataType: DataType;
  category: FieldCategory;
  isHidden: boolean;
  isSearchable: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  localizationKey: string; // e.g. "fields.farmer_name"
}

// 2. Dataset Engine
export interface Dataset {
  id: string;
  version: string;
  displayName: string;
  description: string;
  ownerId: string;
  status: 'draft' | 'published' | 'deprecated';
  primaryKey: string[];
  fields: SemanticField[];
  relationships: string[]; // references to relationship IDs
  permissions: {
    roles: string[];       // roles allowed to query this dataset
    departments: string[];
  };
  physicalName?: string;
  businessName?: string;
  rowCount?: number;
  category?: string;
  businessModule?: string;
  defaultConfig?: {
    sorting?: { fieldId: string; direction: 'asc' | 'desc' }[];
    filters?: FilterGroup;
  };
}

// 3. Relationship Engine
export interface Relationship {
  id: string;
  fromDatasetId: string;
  fromFields: string[];   // Join keys
  toDatasetId: string;
  toFields: string[];
  cardinality: '1:1' | '1:N' | 'N:1' | 'M:N';
  joinType: 'inner' | 'left' | 'right' | 'full';
}

// 4. Abstract Query Notation (AQN) & Filter Engine
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'lt'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface FilterRule {
  field: string; // logical semantic field ID
  operator: FilterOperator;
  value: string | number | boolean | null | (string | number)[]; // scalar, array of values, or [start, end] bounds
}

export interface FilterGroup {
  condition: 'AND' | 'OR';
  rules: (FilterRule | FilterGroup)[];
}

export interface AggregationConfig {
  field: string;
  type: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AQNQuery {
  datasetId: string;
  fields: string[];       // Array of active semantic field IDs
  filters: FilterGroup;
  grouping?: string[];    // Dimension fields to group by
  aggregations?: AggregationConfig[];
  sorting?: SortConfig[];
  limit?: number;
  offset?: number;
}

// 5. Calculated Fields / Formula Engine
export interface CalculatedField {
  id: string;
  displayName: string;
  expression: string;     // e.g. "([revenue] - [cogs]) / [revenue]"
  dataType: 'number' | 'percentage';
  description?: string;
}

// 6. Report Engine
export interface GrowMatrixReport {
  id: string;
  version: string;
  metadata: {
    name: string;
    description: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
    favorite?: boolean;
    tags?: string[];
  };
  query: AQNQuery;
  presentation: {
    displayType: 'table' | 'chart' | 'chart_and_table';
    layout?: 'split_horizontal' | 'split_vertical';
    chartOptions?: {
      type: ChartType;
      theme?: string;
      showLegend?: boolean;
      colors?: string[];
    };
    tableOptions?: {
      density?: 'compact' | 'standard' | 'relaxed';
      virtualized?: boolean;
      pinnedColumns?: string[];
    };
  };
}

// 7. Widget Engine
export type WidgetType = 'kpi' | 'chart' | 'table' | 'text' | 'image' | 'divider';
export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'treemap'
  | 'heatmap'
  | 'scatter'
  | 'radar'
  | 'gauge'
  | 'funnel'
  | 'sunburst'
  | 'sankey';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  linkedReportId?: string; // Loaded dynamically
  config: {
    chartType?: ChartType;
    kpiField?: string;
    kpiAgg?: 'sum' | 'avg' | 'count';
    kpiTarget?: number;
    kpiCompareField?: string; // for period-over-period or target comparisons
    textMarkdown?: string;
    imageUrl?: string;
    showBorder?: boolean;
    customStyles?: React.CSSProperties;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  layouts: {
    lg: WidgetLayout[];
    md: WidgetLayout[];
    sm: WidgetLayout[];
  };
  widgets: {
    [widgetId: string]: WidgetConfig;
  };
  interWidgetCommunication: {
    enableBroadcasting: boolean;
  };
}

// 8. User Management & Permission Engine (ABAC)
export type SystemRole = 'Admin' | 'Analyst' | 'Viewer';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  avatar?: string;
  password?: string;
  attributes: {
    region: string[];      // e.g. ["Midwest", "West"] -> for row-level security (RLS)
    department: string;    // e.g. "Agronomy", "Sales", "Finance"
  };
}

export interface FeaturePermission {
  id: string;
  featureName: string;
  read: boolean;
  write: boolean;
  admin: boolean;
}

// Matrix mapping of Role -> feature permissions
export interface RolePermissions {
  role: SystemRole;
  permissions: {
    [featureId: string]: {
      read: boolean;
      write: boolean;
      admin: boolean;
    };
  };
}
