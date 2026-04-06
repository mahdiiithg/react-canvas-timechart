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

```jsx
import { CostumeLineChart, ChartProvider } from 'react-canvas-timechart';

function App() {
  const data = [
    { received_at: '2024-01-01T10:00:00Z', temperature: 25.5, pressure: 101.3 },
    { received_at: '2024-01-01T10:01:00Z', temperature: 25.7, pressure: 101.2 },
    { received_at: '2024-01-01T10:02:00Z', temperature: 26.1, pressure: 101.0 },
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
        <CostumeLineChart
          receivedData={data}
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
import { CostumeLineChart, ChartProvider } from 'react-canvas-timechart';

function Dashboard() {
  return (
    <ChartProvider>
      {/* All charts inside ChartProvider stay in sync */}
      <div style={{ height: 300 }}>
        <CostumeLineChart
          receivedData={temperatureData}
          traces={temperatureTraces}
          chartNum="chart_1"
          hasZoom
        />
      </div>
      <div style={{ height: 300 }}>
        <CostumeLineChart
          receivedData={pressureData}
          traces={pressureTraces}
          chartNum="chart_2"
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

## API Reference

### CostumeLineChart Props

#### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `receivedData` | `DataPoint[]` | Array of time-series data points |
| `traces` | `Trace[]` | Array of trace configurations |

#### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hasTooltip` | `boolean` | `true` | Enable tooltip on hover |
| `hasZoom` | `boolean` | `true` | Enable zoom interactions |
| `isDarkMode` | `boolean` | `false` | Enable dark theme |
| `inLiveMode` | `boolean` | `false` | Auto-scroll to latest data |
| `isReportChart` | `boolean` | `false` | Static mode (disables interactions) |
| `chartNum` | `string` | `''` | Unique chart identifier |
| `annotations` | `Annotation[]` | `[]` | Markers to display on chart |
| `timesList` | `string[]` | `[]` | Time labels for horizontal lines |
| `fixedTopZoom` | `boolean` | `false` | Anchor zoom at top |
| `fixedBottomZoom` | `boolean` | `false` | Anchor zoom at bottom |
| `shouldDrawTimeLines` | `boolean` | `false` | Render time labels on left |
| `convertToCurrentUnit` | `function` | - | Unit conversion callback |
| `funcPromises` | `function` | - | Visible range change callback |
| `workerMinMaxListScaled` | `object` | - | Pre-calculated axis bounds |
| `theme` | `ThemeConfig` | - | Custom theme colors |

### Data Types

#### DataPoint

```typescript
interface DataPoint {
  received_at: string;  // ISO-8601 datetime
  depth?: number;       // Optional depth value
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
}
```

#### Annotation

```typescript
interface Annotation {
  time: string;         // ISO-8601 datetime
  description: string;  // Annotation text
  chart?: string;       // Filter to specific chart
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
<CostumeLineChart
  isDarkMode={true}
  // ... other props
/>
```

### Custom Theme

```jsx
<CostumeLineChart
  theme={{
    background: '#1a1a2e',
    gridColor: '#333355',
    textColor: '#ffffff',
    annotationText: '#ffcc00',
  }}
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

<CostumeLineChart
  convertToCurrentUnit={convertToCurrentUnit}
  // ... other props
/>
```

## Live Mode

For real-time data, enable live mode to auto-scroll:

```jsx
<CostumeLineChart
  receivedData={realtimeData}
  traces={traces}
  inLiveMode={true}
  hasZoom
/>
```

## Performance Tips

1. **Use `workerMinMaxListScaled`** - Pre-calculate bounds to avoid recalculation on each render
2. **Limit visible data** - Filter data to visible time range when possible
3. **Debounce updates** - For high-frequency data, batch updates
4. **Memoize traces** - Use `useMemo` for trace configurations

```jsx
const workerMinMaxListScaled = useMemo(() => ({
  minAndMaxList: [{
    temperature: { min: 0, max: 100 },
    pressure: { min: 95, max: 105 },
  }],
}), []);
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
