/**
 * costume-line-chart
 * A high-performance canvas-based line chart component for React
 */

// Main component
export { default as CostumeLineChart } from './CostumeLineChart';
export { default } from './CostumeLineChart';

// Context for multi-chart sync
export { default as CostumeLineChartContext, ChartProvider } from './CostumeLineChartContext';

// Utilities (for advanced users)
export { minGraph, maxGraph } from './utils/graphBounds';
