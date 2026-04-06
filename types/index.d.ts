import { ReactNode, FC, Context } from 'react';

/**
 * Data point structure for chart data
 */
export interface DataPoint {
  /** ISO-8601 datetime string */
  received_at: string;
  /** Depth value (optional) */
  depth?: number;
  /** Dynamic trace values - keys match trace.parameter */
  [key: string]: number | string | undefined;
}

/**
 * Trace configuration for each line in the chart
 */
export interface Trace {
  /** Unique identifier for the trace */
  id?: string | number;
  /** Display name for the trace */
  name: string;
  /** Key in DataPoint to access the value */
  parameter: string;
  /** Line color */
  color: {
    code: string;
  };
  /** Line width in pixels */
  width?: number;
  /** Unit configuration for value formatting */
  unit?: {
    id: string;
    symbol: string;
    to_fixed?: number;
  };
}

/**
 * Annotation to display on the chart
 */
export interface Annotation {
  /** ISO-8601 datetime string for annotation position */
  time: string;
  /** Text to display */
  description: string;
  /** Optional chart filter (e.g., 'chart_1') */
  chart?: string;
}

/**
 * Pre-calculated min/max values for traces
 */
export interface WorkerMinMaxListScaled {
  minAndMaxList: Array<{
    [parameter: string]: {
      min: number;
      max: number;
    };
  }>;
}

/**
 * Theme configuration for chart colors
 */
export interface ThemeConfig {
  /** Background color */
  background?: string;
  /** Grid line color */
  gridColor?: string;
  /** Text color for labels */
  textColor?: string;
  /** Annotation text color */
  annotationText?: string;
}

/**
 * Visible range callback parameter
 */
export interface VisibleRangeParams {
  firstVisibleDatetime: string;
  lastVisibleDatetime: string;
}

/**
 * Props for CostumeLineChart component
 */
export interface CostumeLineChartProps {
  // Required data props
  /** Array of time-series data points */
  receivedData: DataPoint[];
  /** Array of trace configurations */
  traces: Trace[];
  
  // Optional data props
  /** Pre-calculated min/max values per trace */
  workerMinMaxListScaled?: WorkerMinMaxListScaled;
  /** Chart annotations */
  annotations?: Annotation[];
  /** Time markers for horizontal lines */
  timesList?: string[];
  /** Last historical data timestamp (for live mode divider) */
  receivedDataLastHistoricaldate?: string;
  
  // Callbacks
  /** Called when visible range changes (for data fetching) */
  funcPromises?: (params: VisibleRangeParams) => void;
  
  // Configuration flags
  /** Enable tooltip display (default: true) */
  hasTooltip?: boolean;
  /** Enable zoom interactions (default: true) */
  hasZoom?: boolean;
  /** Static mode - disables all interactions (default: false) */
  isReportChart?: boolean;
  /** Focus mode styling */
  focusMode?: boolean;
  /** Auto-scroll to latest data (default: false) */
  inLiveMode?: boolean;
  /** Draw time labels on left side (default: false) */
  shouldDrawTimeLines?: boolean;
  /** Anchor zoom at top of chart (default: false) */
  fixedTopZoom?: boolean;
  /** Anchor zoom at bottom of chart (default: false) */
  fixedBottomZoom?: boolean;
  /** Chart identifier for multi-chart setups */
  chartNum?: string;
  
  // Theme props (NEW - externalized from hooks)
  /** Dark mode flag (default: false) */
  isDarkMode?: boolean;
  /** Unit conversion function */
  convertToCurrentUnit?: (value: number, unitId?: string, context?: string) => number;
  /** Custom theme colors */
  theme?: ThemeConfig;
}

/**
 * High-performance canvas-based line chart component
 */
export const CostumeLineChart: FC<CostumeLineChartProps>;
export default CostumeLineChart;

/**
 * Context value for chart synchronization
 */
export interface CostumeLineChartContextValue {
  sharedZoom: [number, number] | null;
  setSharedZoom: (zoom: [number, number] | null) => void;
  sharedTooltip: any | null;
  setSharedTooltip: (tooltip: any | null) => void;
  sharedPan: number;
  setSharedPan: (pan: number) => void;
}

/**
 * Context for synchronizing zoom, pan, and tooltip across multiple charts
 */
export const CostumeLineChartContext: Context<CostumeLineChartContextValue | null>;

/**
 * Props for ChartProvider
 */
export interface ChartProviderProps {
  children: ReactNode;
}

/**
 * Provider component for multi-chart synchronization
 */
export const ChartProvider: FC<ChartProviderProps>;

/**
 * Calculate a "nice" maximum value for chart axis bounds
 * @param max - The raw maximum value
 * @returns A rounded-up "nice" maximum (minimum 10)
 */
export function maxGraph(max: number): number;

/**
 * Calculate a "nice" minimum value for chart axis bounds
 * @param min - The raw minimum value
 * @returns A rounded-down "nice" minimum (maximum 0)
 */
export function minGraph(min: number): number;
