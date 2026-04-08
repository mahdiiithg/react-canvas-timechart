# react-canvas-timechart

[![npm version](https://img.shields.io/npm/v/react-canvas-timechart.svg)](https://www.npmjs.com/package/react-canvas-timechart)
[![npm downloads](https://img.shields.io/npm/dm/react-canvas-timechart.svg)](https://www.npmjs.com/package/react-canvas-timechart)
[![license](https://img.shields.io/npm/l/react-canvas-timechart.svg)](https://github.com/mahdiiithg/react-canvas-timechart/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mahdiiithg/react-canvas-timechart.svg)](https://github.com/mahdiiithg/react-canvas-timechart)

High-performance canvas-based time-series chart for React with synchronized zoom, pan, and multi-chart tooltip support. Perfect for real-time data visualization, time-series analysis, and dashboards requiring synchronized charts.

<p align="center">
  <img src="https://raw.githubusercontent.com/mahdiiithg/react-canvas-timechart/main/docs/assets/demo.gif" alt="react-canvas-timechart demo" width="600" />
</p>

## Features

- **High Performance** - Canvas-based rendering handles thousands of data points smoothly
- **Zoom & Pan** - Mouse wheel zoom, shift+wheel pan, configurable anchor points
- **Multi-Chart Sync** - Synchronized zoom, pan, and tooltip across multiple charts
- **Touch Support** - Full touch gesture support (pinch-to-zoom, swipe-to-pan)
- **Theming** - Built-in dark/light mode with customizable colors
- **Annotations** - Display markers at specific timestamps
- **Live Mode** - Auto-scroll to follow real-time data
- **TypeScript** - Full TypeScript support with comprehensive type definitions

## Installation

```bash
# npm
npm install react-canvas-timechart

# yarn
yarn add react-canvas-timechart

# pnpm
pnpm add react-canvas-timechart
```

### Peer Dependencies

Ensure you have these peer dependencies installed:

```bash
npm install react dayjs lodash
```

## Quick Start

### Single Chart (Standalone)

Use `TimeChart` directly without any wrapper for a standalone chart:

```jsx
import { TimeChart } from 'react-canvas-timechart';

function App() {
  return (
    <div style={{ height: 400 }}>
      <TimeChart data={data} traces={traces} hasTooltip hasZoom />
    </div>
  );
}
```

### Multiple Synced Charts

Wrap charts in `ChartProvider` to synchronize hover, zoom, and pan across all charts:

```jsx
import { TimeChart, ChartProvider } from 'react-canvas-timechart';

function App() {
  const data = [
    { timestamp: '2024-01-01T10:00:00Z', temperature: 25.5, pressure: 101.3 },
    { timestamp: '2024-01-01T10:01:00Z', temperature: 25.7, pressure: 101.2 },
    { timestamp: '2024-01-01T10:02:00Z', temperature: 26.1, pressure: 101.0 },
  ];

  const traces = [
    {
      name: 'Temperature',
      parameter: 'temperature',
      color: { code: '#ff6384' },
      width: 2,
      unit: { symbol: '°C', to_fixed: 1 },
    },
  ];

  return (
    <ChartProvider>
      <div style={{ height: 400, width: '100%' }}>
        <TimeChart
          data={data}
          traces={traces}
          hasTooltip
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

## Multi-Chart Synchronization

One of the key features is synchronizing zoom, pan, and tooltips across multiple charts:

```jsx
import { TimeChart, ChartProvider } from 'react-canvas-timechart';

function Dashboard() {
  return (
    <ChartProvider>
      {/* All charts inside ChartProvider stay in sync */}
      <div style={{ height: 300 }}>
        <TimeChart
          data={temperatureData}
          traces={temperatureTraces}
          chartId="chart_1"
          hasZoom
        />
      </div>
      <div style={{ height: 300 }}>
        <TimeChart
          data={pressureData}
          traces={pressureTraces}
          chartId="chart_2"
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

## API Reference

### TimeChart Props

#### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `DataPoint[]` | Array of time-series data points |
| `traces` | `Trace[]` | Array of trace configurations |

#### Data Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `timestampKey` | `string` | `'timestamp'` | Key for timestamp field in data |
| `secondaryField` | `object` | - | Secondary field to show in tooltip `{ key, label, unit?, format? }` |
| `traceMinMax` | `object` | - | Pre-calculated axis bounds |
| `domainMode` | `'independent' \| 'shared'` | `'independent'` | How trace scales are calculated |

#### Display Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showGrid` | `boolean \| GridConfig` | `true` | Show/hide grid or pass config object |
| `gridConfig` | `GridConfig` | - | Grid settings (columns, rows, lineStyle, etc.) |
| `showAxis` | `boolean \| AxisConfig` | `false` | Show/hide axis lines or pass config object |
| `axisConfig` | `AxisConfig` | - | Axis settings (lineWidth, color, tickSize) |
| `crosshairConfig` | `CrosshairConfig` | - | Crosshair/hover line settings |
| `backgroundColor` | `string` | - | Override background color |
| `timeFormat` | `string` | `'HH:mm:ss'` | Time format for labels (dayjs format) |
| `showTimeLabels` | `boolean` | `false` | Show time labels on left side |

#### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hasTooltip` | `boolean` | `true` | Enable tooltip on hover |
| `hasZoom` | `boolean` | `true` | Enable zoom interactions |
| `readOnly` | `boolean` | `false` | Static mode (disables interactions) |
| `liveMode` | `boolean` | `false` | Auto-scroll to latest data |
| `fixedTopZoom` | `boolean` | `false` | Anchor zoom at top |
| `fixedBottomZoom` | `boolean` | `false` | Anchor zoom at bottom |

#### Theme Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isDarkMode` | `boolean` | `false` | Enable dark theme |
| `theme` | `ThemeConfig` | - | Custom theme colors |
| `convertToCurrentUnit` | `function` | - | Unit conversion callback |

#### Other Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `chartId` | `string` | `''` | Unique chart identifier |
| `annotations` | `Annotation[]` | `[]` | Markers to display on chart |
| `timeMarkers` | `string[]` | `[]` | Time labels for horizontal lines |
| `liveDataBoundary` | `string` | - | Timestamp dividing historical/live data |
| `onVisibleRangeChange` | `function` | - | Called when visible range changes |

### Configuration Objects

#### GridConfig

```typescript
interface GridConfig {
  show?: boolean;           // Show grid (default: true)
  columns?: number;         // Vertical lines (default: 10)
  rows?: number | 'auto';   // Horizontal lines (default: 'auto')
  lineStyle?: 'solid' | 'dashed' | 'dotted';  // Default: 'dashed'
  lineWidth?: number;       // Default: 0.5
  color?: string;           // Override theme color
}
```

#### AxisConfig

```typescript
interface AxisConfig {
  show?: boolean;      // Show axis (default: false)
  lineWidth?: number;  // Default: 1
  color?: string;      // Override theme color
  tickSize?: number;   // Tick mark size, 0 to hide (default: 5)
}
```

#### CrosshairConfig

```typescript
interface CrosshairConfig {
  show?: boolean;                    // Show crosshair (default: true)
  color?: string;                    // Default: 'red'
  lineWidth?: number;                // Default: 1
  style?: 'solid' | 'dashed';        // Default: 'solid'
}
```

### Data Types

#### DataPoint

```typescript
interface DataPoint {
  timestamp: string;    // ISO-8601 datetime (key is configurable)
  [key: string]: number | string | undefined;  // Trace values
}
```

#### Trace

```typescript
interface Trace {
  name: string;           // Display name
  parameter: string;      // Key in DataPoint
  color: { code: string }; // Line color (hex)
  width?: number;         // Line width (pixels)
  unit?: {
    symbol: string;       // Unit symbol (e.g., '°C')
    to_fixed?: number;    // Decimal places
  };
  domain?: [number, number]; // Fixed min/max bounds for this trace
}
```

#### SecondaryField

```typescript
interface SecondaryField {
  key: string;              // Key in DataPoint
  label: string;            // Display label
  unit?: string;            // Unit string
  format?: (value) => string; // Custom formatter
}
```

### ChartProvider

Wrap your charts with `ChartProvider` to enable synchronization:

```jsx
import { ChartProvider } from 'react-canvas-timechart';

<ChartProvider>
  {/* Your charts here */}
</ChartProvider>
```

### Utility Functions

```javascript
import { minGraph, maxGraph } from 'react-canvas-timechart';

// Calculate rounded axis bounds
const yMin = minGraph(-3.2);  // Returns -4
const yMax = maxGraph(97.5);  // Returns 98
```

## Examples

### Custom Grid Configuration

```jsx
<TimeChart
  data={data}
  traces={traces}
  showGrid={{
    columns: 8,
    rows: 6,
    lineStyle: 'dotted',
    lineWidth: 1,
    color: '#cccccc'
  }}
/>
```

### With Axis and Custom Time Format

```jsx
<TimeChart
  data={data}
  traces={traces}
  showAxis={true}
  axisConfig={{
    lineWidth: 2,
    color: '#333',
    tickSize: 8
  }}
  showTimeLabels={true}
  timeFormat="MMM DD HH:mm"
/>
```

### Secondary Field (e.g., showing index or depth)

```jsx
<TimeChart
  data={data}
  traces={traces}
  secondaryField={{
    key: 'index',
    label: 'Index',
    format: (val) => val.toFixed(0)
  }}
/>
```

### Custom Crosshair

```jsx
<TimeChart
  data={data}
  traces={traces}
  crosshairConfig={{
    color: '#00ff00',
    lineWidth: 2,
    style: 'dashed'
  }}
/>
```

### Domain Mode (Trace Scaling)

Control how each trace's Y-axis domain is calculated:

**Independent Mode (default)** - Each trace uses its own min/max for scaling:

```jsx
<TimeChart
  data={data}
  traces={traces}
  domainMode="independent"  // Each trace fills the chart height
/>
```

**Shared Mode** - All traces share the same global min/max scale:

```jsx
<TimeChart
  data={data}
  traces={traces}
  domainMode="shared"  // All traces use same scale for comparison
/>
```

**Fixed Domain Per Trace** - Set explicit bounds for specific traces:

```jsx
const traces = [
  {
    name: 'Temperature',
    parameter: 'temp',
    color: { code: '#ff6384' },
    domain: [0, 100],  // Fixed scale 0-100
  },
  {
    name: 'Humidity',
    parameter: 'humidity',
    color: { code: '#36a2eb' },
    // No domain = auto-calculated based on domainMode
  },
];
```

## Interactions

| Interaction | Desktop | Mobile |
|------------|---------|--------|
| Zoom In | Mouse wheel up | Pinch out |
| Zoom Out | Mouse wheel down | Pinch in |
| Pan | Shift + Mouse wheel | Swipe |
| Tooltip | Hover | Touch |

## Theming

### Dark/Light Mode

```jsx
<TimeChart
  isDarkMode={true}
  // ... other props
/>
```

### Custom Theme

```jsx
<TimeChart
  theme={{
    background: '#1a1a2e',
    gridColor: '#333355',
    textColor: '#ffffff',
    annotationText: '#ffcc00',
  }}
  // ... other props
/>
```

### Direct Background Override

```jsx
<TimeChart
  backgroundColor="#f5f5f5"
  // ... other props
/>
```

## Unit Conversion

Pass a conversion function to dynamically convert values:

```jsx
const convertToCurrentUnit = (value, unit) => {
  if (unit?.id === 'celsius') {
    // Convert to Fahrenheit if user preference
    return (value * 9/5) + 32;
  }
  return value;
};

<TimeChart
  convertToCurrentUnit={convertToCurrentUnit}
  // ... other props
/>
```

## Live Mode

For real-time data, enable live mode to auto-scroll:

```jsx
<TimeChart
  data={realtimeData}
  traces={traces}
  liveMode={true}
  hasZoom
/>
```

## Performance Tips

1. **Use `traceMinMax`** - Pre-calculate bounds to avoid recalculation on each render
2. **Limit visible data** - Filter data to visible time range when possible
3. **Debounce updates** - For high-frequency data, batch updates
4. **Memoize traces** - Use `useMemo` for trace configurations

```jsx
const traceMinMax = useMemo(() => ({
  minAndMaxList: [{
    temperature: { min: 0, max: 100 },
    pressure: { min: 95, max: 105 },
  }],
}), []);
```

## Migration from v0.x

If you're upgrading from an older version, note the renamed props (old names still work but are deprecated):

| Old Name | New Name |
|----------|----------|
| `receivedData` | `data` |
| `funcPromises` | `onVisibleRangeChange` |
| `isReportChart` | `readOnly` |
| `inLiveMode` | `liveMode` |
| `shouldDrawTimeLines` | `showTimeLabels` |
| `timesList` | `timeMarkers` |
| `chartNum` | `chartId` |
| `workerMinMaxListScaled` | `traceMinMax` |
| `receivedDataLastHistoricaldate` | `liveDataBoundary` |
| `received_at` (in data) | `timestamp` (configurable via `timestampKey`) |
| `CostumeLineChart` | `TimeChart` |
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © [Mahdi Tahavorgar](https://github.com/mahdiiithg)

## Links

- [GitHub Repository](https://github.com/mahdiiithg/react-canvas-timechart)
- [npm Package](https://www.npmjs.com/package/react-canvas-timechart)
- [Issue Tracker](https://github.com/mahdiiithg/react-canvas-timechart/issues)
- [Changelog](CHANGELOG.md)

## Author

**Mahdi Tahavorgar**

- GitHub: [@mahdiiithg](https://github.com/mahdiiithg)
- LinkedIn: [Mahdi Tahavorgar](https://www.linkedin.com/in/mahdi-thg/)

---

If you find this package useful, please consider giving it a ⭐ on [GitHub](https://github.com/mahdiiithg/react-canvas-timechart)!
