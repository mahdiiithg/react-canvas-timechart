/**
 * react-canvas-timechart
 * A high-performance canvas-based time-series chart component for React
 */

// Main component - new generic name
export { default as TimeChart } from './TimeChart';
export { default } from './TimeChart';

// Legacy exports for backwards compatibility
export { CostumeLineChart } from './TimeChart';

// Context for multi-chart sync - new generic name
export { default as ChartContext, ChartProvider } from './ChartContext';

// Legacy context export for backwards compatibility
export { CostumeLineChartContext } from './ChartContext';

// Utilities (for advanced users)
export { minGraph, maxGraph } from './utils/graphBounds';
