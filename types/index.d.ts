import { ReactNode, FC, Context } from 'react';

/**
 * Data point structure for chart data
 * Use 'timestamp' key by default, or configure via timestampKey prop
 */
export interface DataPoint {
  /** ISO-8601 datetime string - key name is configurable via timestampKey prop */
  timestamp?: string;
  /** Legacy: ISO-8601 datetime string (use 'timestamp' for new projects) */
  received_at?: string;
  /** Dynamic trace values - keys match trace.parameter */
  [key: string]: number | string | undefined;
}

/**
 * Secondary field configuration for tooltip display
 */
export interface SecondaryField {
  /** Key in DataPoint to access the value */
  key: string;
  /** Display label in tooltip */
  label: string;
  /** Optional unit string to display after value */
  unit?: string;
  /** Optional custom formatter function */
  format?: (value: any) => string;
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
  /** Fixed domain [min, max] for this trace. If omitted, auto-calculated */
  domain?: [number, number];
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
export interface TraceMinMax {
  minAndMaxList: Array<{
    [parameter: string]: {
      min: number;
      max: number;
    };
  }>;
}

/** @deprecated Use TraceMinMax instead */
export type WorkerMinMaxListScaled = TraceMinMax;

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
 * Grid configuration for chart grid lines
 */
export interface GridConfig {
  /** Show or hide grid (default: true) */
  show?: boolean;
  /** Number of vertical grid lines/columns (default: 10) */
  columns?: number;
  /** Number of horizontal grid lines/rows, or 'auto' (default: 'auto') */
  rows?: number | 'auto';
  /** Line style: 'solid', 'dashed', or 'dotted' (default: 'dashed') */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Grid line width in pixels (default: 0.5) */
  lineWidth?: number;
  /** Grid line color (default: uses theme gridColor) */
  color?: string;
}

/**
 * Axis configuration for chart axis lines
 */
export interface AxisConfig {
  /** Show or hide axis lines (default: false) */
  show?: boolean;
  /** Axis line width in pixels (default: 1) */
  lineWidth?: number;
  /** Axis line color (default: uses theme textColor) */
  color?: string;
  /** Tick mark size in pixels, 0 to hide (default: 5) */
  tickSize?: number;
}

/**
 * Crosshair configuration for hover indicator
 */
export interface CrosshairConfig {
  /** Show or hide crosshair line (default: true) */
  show?: boolean;
  /** Crosshair line color (default: 'red') */
  color?: string;
  /** Crosshair line width in pixels (default: 1) */
  lineWidth?: number;
  /** Line style: 'solid' or 'dashed' (default: 'solid') */
  style?: 'solid' | 'dashed';
}

/**
 * Visible range callback parameter
 */
export interface VisibleRangeParams {
  firstVisibleDatetime: string;
  lastVisibleDatetime: string;
}

/**
 * Props for TimeChart component (generic names)
 */
export interface TimeChartProps {
  // Required data props
  /** Array of time-series data points */
  data: DataPoint[];
  /** Array of trace configurations */
  traces: Trace[];
  
  // Optional data configuration
  /** Key for timestamp field in data (default: 'timestamp') */
  timestampKey?: string;
  /** Secondary field to display in tooltip (e.g., depth, index) */
  secondaryField?: SecondaryField;
  /** Domain mode for trace scaling: 'independent' (each trace own scale) or 'shared' (global min/max) */
  domainMode?: 'independent' | 'shared';
  /** Pre-calculated min/max values per trace */
  traceMinMax?: TraceMinMax;
  /** Chart annotations */
  annotations?: Annotation[];
  /** Time markers for horizontal lines */
  timeMarkers?: string[];
  /** Last historical data timestamp (for live mode divider) */
  liveDataBoundary?: string;
  
  // Callbacks
  /** Called when visible range changes (for data fetching) */
  onVisibleRangeChange?: (params: VisibleRangeParams) => void;
  
  // Configuration flags
  /** Enable tooltip display (default: true) */
  hasTooltip?: boolean;
  /** Enable zoom interactions (default: true) */
  hasZoom?: boolean;
  /** Static/read-only mode - disables all interactions (default: false) */
  readOnly?: boolean;
  /** Focus mode styling */
  focusMode?: boolean;
  /** Auto-scroll to latest data (default: false) */
  liveMode?: boolean;
  /** Draw time labels on left side (default: false) */
  showTimeLabels?: boolean;
  /** Anchor zoom at top of chart (default: false) */
  fixedTopZoom?: boolean;
  /** Anchor zoom at bottom of chart (default: false) */
  fixedBottomZoom?: boolean;
  /** Chart identifier for multi-chart setups */
  chartId?: string;
  
  // Theme props
  /** Dark mode flag (default: false) */
  isDarkMode?: boolean;
  /** Unit conversion function */
  convertToCurrentUnit?: (value: number, unitId?: string, context?: string) => number;
  /** Custom theme colors */
  theme?: ThemeConfig;
  /** Override background color directly */
  backgroundColor?: string;

  // Display configuration
  /** Show grid lines (default: true). Can be boolean or GridConfig object */
  showGrid?: boolean | GridConfig;
  /** Grid configuration (columns, rows, lineStyle, etc.) */
  gridConfig?: GridConfig;
  /** Show axis lines (default: false). Can be boolean or AxisConfig object */
  showAxis?: boolean | AxisConfig;
  /** Axis configuration (lineWidth, color, tickSize) */
  axisConfig?: AxisConfig;
  /** Crosshair/hover line configuration */
  crosshairConfig?: CrosshairConfig;
  /** Time format string for labels (default: 'HH:mm:ss') - uses dayjs format */
  timeFormat?: string;

  // Legacy props (deprecated - use new names above)
  /** @deprecated Use 'data' instead */
  receivedData?: DataPoint[];
  /** @deprecated Use 'traceMinMax' instead */
  workerMinMaxListScaled?: TraceMinMax;
  /** @deprecated Use 'onVisibleRangeChange' instead */
  funcPromises?: (params: VisibleRangeParams) => void;
  /** @deprecated Use 'readOnly' instead */
  isReportChart?: boolean;
  /** @deprecated Use 'liveMode' instead */
  inLiveMode?: boolean;
  /** @deprecated Use 'showTimeLabels' instead */
  shouldDrawTimeLines?: boolean;
  /** @deprecated Use 'timeMarkers' instead */
  timesList?: string[];
  /** @deprecated Use 'chartId' instead */
  chartNum?: string;
  /** @deprecated Use 'liveDataBoundary' instead */
  receivedDataLastHistoricaldate?: string;
}

/** @deprecated Use TimeChartProps instead */
export type CostumeLineChartProps = TimeChartProps;

/**
 * High-performance canvas-based time-series chart component
 */
export const TimeChart: FC<TimeChartProps>;

/** @deprecated Use TimeChart instead */
export const CostumeLineChart: FC<TimeChartProps>;

export default TimeChart;

/**
 * Context value for chart synchronization
 */
export interface ChartContextValue {
  sharedZoom: [number, number] | null;
  setSharedZoom: (zoom: [number, number] | null) => void;
  sharedTooltip: any | null;
  setSharedTooltip: (tooltip: any | null) => void;
  sharedPan: number;
  setSharedPan: (pan: number) => void;
}

/** @deprecated Use ChartContextValue instead */
export type CostumeLineChartContextValue = ChartContextValue;

/**
 * Context for synchronizing zoom, pan, and tooltip across multiple charts
 */
export const ChartContext: Context<ChartContextValue | null>;

/** @deprecated Use ChartContext instead */
export const CostumeLineChartContext: Context<ChartContextValue | null>;

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
 * Calculate a "nice" minimum value for chart axis bounds
 * @param min - The raw minimum value
 * @returns A rounded-down "nice" minimum (maximum 0)
 */
export function minGraph(min: number): number;
