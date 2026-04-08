# Examples

Practical examples for using react-canvas-timechart in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Single Chart vs Synced Charts](#single-chart-vs-synced-charts)
- [Multiple Traces](#multiple-traces)
- [Domain Modes](#domain-modes)
- [Grid and Axis Configuration](#grid-and-axis-configuration)
- [Multi-Chart Dashboard](#multi-chart-dashboard)
- [Real-Time Data](#real-time-data)
- [Custom Theming](#custom-theming)
- [Unit Conversion](#unit-conversion)
- [Annotations](#annotations)
- [Report/Static Mode](#reportstatic-mode)

---

## Basic Usage

Simple single-trace chart:

```jsx
import { TimeChart } from 'react-canvas-timechart';

function TemperatureChart() {
  const data = [
    { timestamp: '2024-01-01T10:00:00Z', temp: 22.5 },
    { timestamp: '2024-01-01T10:01:00Z', temp: 23.1 },
    { timestamp: '2024-01-01T10:02:00Z', temp: 22.8 },
    { timestamp: '2024-01-01T10:03:00Z', temp: 23.5 },
    { timestamp: '2024-01-01T10:04:00Z', temp: 24.2 },
  ];

  const traces = [
    {
      name: 'Temperature',
      parameter: 'temp',
      color: { code: '#ff6384' },
      width: 2,
      unit: { symbol: '°C', to_fixed: 1 },
    },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <TimeChart
        data={data}
        traces={traces}
        hasTooltip
        hasZoom
      />
    </div>
  );
}
```

---

## Single Chart vs Synced Charts

**Single Chart** - Use `TimeChart` directly for standalone charts:

```jsx
import { TimeChart } from 'react-canvas-timechart';

// Works independently - no wrapper needed
<TimeChart data={data} traces={traces} hasZoom />
```

**Multiple Synced Charts** - Wrap with `ChartProvider` to sync hover, zoom, and pan:

```jsx
import { TimeChart, ChartProvider } from 'react-canvas-timechart';

<ChartProvider>
  {/* All charts stay synchronized */}
  <TimeChart chartId="chart1" data={data1} traces={traces1} />
  <TimeChart chartId="chart2" data={data2} traces={traces2} />
  <TimeChart chartId="chart3" data={data3} traces={traces3} />
</ChartProvider>
```

When charts are inside `ChartProvider`:
- Hovering shows crosshair at same timestamp on all charts
- Zooming affects all charts equally
- Panning keeps all charts aligned

---

## Multiple Traces

Display multiple data series on a single chart:

```jsx
function MultiTraceChart() {
  const data = [
    { timestamp: '2024-01-01T10:00:00Z', temp: 22.5, humidity: 45, pressure: 1013 },
    { timestamp: '2024-01-01T10:01:00Z', temp: 23.1, humidity: 44, pressure: 1012 },
    { timestamp: '2024-01-01T10:02:00Z', temp: 22.8, humidity: 46, pressure: 1013 },
  ];

  const traces = [
    {
      name: 'Temperature',
      parameter: 'temp',
      color: { code: '#ff6384' },
      width: 2,
      unit: { symbol: '°C', to_fixed: 1 },
    },
    {
      name: 'Humidity',
      parameter: 'humidity',
      color: { code: '#36a2eb' },
      width: 2,
      unit: { symbol: '%', to_fixed: 0 },
    },
    {
      name: 'Pressure',
      parameter: 'pressure',
      color: { code: '#4bc0c0' },
      width: 1.5,
      unit: { symbol: 'hPa', to_fixed: 0 },
    },
  ];

  return (
    <div style={{ height: 400 }}>
      <TimeChart
        data={data}
        traces={traces}
        hasTooltip
        hasZoom
      />
    </div>
  );
}
```

---

## Domain Modes

Control how each trace's Y-axis scale is calculated:

**Independent Mode** (default) - Each trace uses its own min/max, filling the chart height:

```jsx
<TimeChart
  data={data}
  traces={[
    { name: 'Temp', parameter: 'temp', color: { code: '#ff6384' } },      // 20-30°C
    { name: 'Pressure', parameter: 'pressure', color: { code: '#36a2eb' } }, // 1000-1020 hPa
  ]}
  domainMode="independent"  // Each trace scaled independently
/>
```

**Shared Mode** - All traces share the same global min/max scale:

```jsx
<TimeChart
  data={data}
  traces={traces}
  domainMode="shared"  // All use same scale - good for comparison
/>
```

**Fixed Domain Per Trace** - Set explicit bounds:

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
    // Auto-calculated based on domainMode
  },
];
```

---

## Grid and Axis Configuration

Customize grid appearance:

```jsx
<TimeChart
  data={data}
  traces={traces}
  showGrid={{
    columns: 8,
    rows: 6,
    lineStyle: 'dotted',
    lineWidth: 1,
    color: '#cccccc',
  }}
/>
```

Add axis lines with custom styling:

```jsx
<TimeChart
  data={data}
  traces={traces}
  showAxis={true}
  axisConfig={{
    lineWidth: 2,
    color: '#333',
    tickSize: 8,
  }}
  showTimeLabels={true}
  timeFormat="MMM DD HH:mm"
/>
```

Custom crosshair:

```jsx
<TimeChart
  data={data}
  traces={traces}
  crosshairConfig={{
    color: '#00ff00',
    lineWidth: 2,
    style: 'dashed',
  }}
/>
```

---

## Multi-Chart Dashboard

Synchronized charts for comparing different metrics:

```jsx
import { TimeChart, ChartProvider } from 'react-canvas-timechart';

function Dashboard() {
  const data = generateData(); // Your data source

  return (
    <ChartProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Left - Temperature */}
        <div style={{ height: 250 }}>
          <h3>Temperature</h3>
          <TimeChart
            data={data}
            traces={[{
              name: 'Temp',
              parameter: 'temperature',
              color: { code: '#ff6384' },
              unit: { symbol: '°C' },
            }]}
            chartId="temp_chart"
            showTimeLabels
            hasZoom
          />
        </div>

        {/* Top Right - Pressure */}
        <div style={{ height: 250 }}>
          <h3>Pressure</h3>
          <TimeChart
            data={data}
            traces={[{
              name: 'Pressure',
              parameter: 'pressure',
              color: { code: '#36a2eb' },
              unit: { symbol: 'bar' },
            }]}
            chartId="pressure_chart"
            hasZoom
          />
        </div>

        {/* Bottom - Combined View */}
        <div style={{ height: 250, gridColumn: '1 / -1' }}>
          <h3>Combined View</h3>
          <TimeChart
            data={data}
            traces={[
              { name: 'Temp', parameter: 'temperature', color: { code: '#ff6384' } },
              { name: 'Flow', parameter: 'flow', color: { code: '#4bc0c0' } },
            ]}
            chartId="combined_chart"
            domainMode="shared"
            hasZoom
          />
        </div>
      </div>
    </ChartProvider>
  );
}
```

---

## Real-Time Data

Auto-scrolling chart for live data:

```jsx
import { useState, useEffect } from 'react';
import { TimeChart } from 'react-canvas-timechart';

function LiveChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [
        ...prev.slice(-100), // Keep last 100 points
        {
          timestamp: new Date().toISOString(),
          value: Math.random() * 100,
        },
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <TimeChart
        data={data}
        traces={[{
          name: 'Live Value',
          parameter: 'value',
          color: { code: '#00ff88' },
          width: 2,
        }]}
        liveMode={true}
        hasZoom
        hasTooltip
      />
    </div>
  );
}
```

---

## Custom Theming

Dark mode with custom colors:

```jsx
import { TimeChart } from 'react-canvas-timechart';

function ThemedChart({ isDark }) {
  const theme = isDark ? {
    background: '#1a1a2e',
    gridColor: '#2d2d44',
    textColor: '#e0e0e0',
    annotationText: '#ffcc00',
  } : {
    background: '#ffffff',
    gridColor: '#e0e0e0',
    textColor: '#333333',
    annotationText: '#0066cc',
  };

  return (
    <div style={{ height: 400, background: theme.background }}>
      <TimeChart
        data={data}
        traces={traces}
        isDarkMode={isDark}
        theme={theme}
        hasZoom
      />
    </div>
  );
}
```

Or simply override the background:

```jsx
<TimeChart
  data={data}
  traces={traces}
  backgroundColor="#f5f5f5"
/>
```

---

## Unit Conversion

Converting between metric and imperial:

```jsx
import { useState } from 'react';
import { TimeChart } from 'react-canvas-timechart';

function UnitConvertingChart() {
  const [useImperial, setUseImperial] = useState(false);

  const convertToCurrentUnit = (value, unitId) => {
    if (!unitId) return value;
    
    if (useImperial) {
      switch (unitId) {
        case 'celsius':
          return (value * 9/5) + 32; // Fahrenheit
        case 'meters':
          return value * 3.28084; // Feet
        case 'liters':
          return value * 0.264172; // Gallons
        default:
          return value;
      }
    }
    return value;
  };

  const traces = [
    {
      name: 'Temperature',
      parameter: 'temp',
      color: { code: '#ff6384' },
      unit: {
        id: 'celsius',
        symbol: useImperial ? '°F' : '°C',
        to_fixed: 1,
      },
    },
  ];

  return (
    <div>
      <button onClick={() => setUseImperial(!useImperial)}>
        Toggle Units
      </button>
      <div style={{ height: 400 }}>
        <TimeChart
          data={data}
          traces={traces}
          convertToCurrentUnit={convertToCurrentUnit}
          hasZoom
        />
      </div>
    </div>
  );
}
```
```

---

## Annotations

Displaying events on the chart:

```jsx
import { TimeChart } from 'react-canvas-timechart';

function AnnotatedChart() {
  const annotations = [
    {
      time: '2024-01-01T10:05:00Z',
      description: 'Pump started',
      chart: 'main_chart',
    },
    {
      time: '2024-01-01T10:15:00Z',
      description: 'Peak pressure',
      chart: 'main_chart',
    },
    {
      time: '2024-01-01T10:25:00Z',
      description: 'Maintenance stop',
    },
  ];

  return (
    <div style={{ height: 400 }}>
      <TimeChart
        data={data}
        traces={traces}
        annotations={annotations}
        chartId="main_chart"
        hasZoom
        hasTooltip
      />
    </div>
  );
}
```

---

## Report/Static Mode

Non-interactive chart for reports:

```jsx
import { TimeChart } from 'react-canvas-timechart';

function ReportChart() {
  return (
    <div style={{ height: 300 }}>
      <TimeChart
        data={historicalData}
        traces={traces}
        readOnly={true}
        showTimeLabels
        showAxis
      />
    </div>
  );
}
```

---

## Performance Optimization

Pre-calculating bounds for large datasets:

```jsx
import { useMemo } from 'react';
import { TimeChart } from 'react-canvas-timechart';

function OptimizedChart({ data, traces }) {
  // Pre-calculate min/max for each trace
  const traceMinMax = useMemo(() => {
    const bounds = {};
    
    traces.forEach(trace => {
      const values = data
        .map(d => d[trace.parameter])
        .filter(v => v !== undefined && v !== null);
      
      bounds[trace.parameter] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
    
    return { minAndMaxList: [bounds] };
  }, [data, traces]);

  // Memoize traces to prevent unnecessary re-renders
  const memoizedTraces = useMemo(() => traces, [JSON.stringify(traces)]);

  return (
    <div style={{ height: 400 }}>
      <TimeChart
        data={data}
        traces={memoizedTraces}
        traceMinMax={traceMinMax}
        hasZoom
      />
    </div>
  );
}
```

---

## Custom Timestamp Field

If your data uses a different timestamp key:

```jsx
// Data with custom timestamp field
const data = [
  { datetime: '2024-01-01T10:00:00Z', value: 25 },
  { datetime: '2024-01-01T10:01:00Z', value: 26 },
];

<TimeChart
  data={data}
  traces={traces}
  timestampKey="datetime"  // Use 'datetime' instead of 'timestamp'
/>
```

---

## Secondary Field (Show Additional Data)

Display a secondary value in tooltip (e.g., depth, index):

```jsx
const data = [
  { timestamp: '2024-01-01T10:00:00Z', value: 25, depth: 100 },
  { timestamp: '2024-01-01T10:01:00Z', value: 26, depth: 150 },
];

<TimeChart
  data={data}
  traces={traces}
  secondaryField={{
    key: 'depth',
    label: 'Depth',
    unit: 'm',
    format: (val) => val.toFixed(1),
  }}
/>
```

---

## See Also

- [API Reference](./API.md) - Complete API documentation
- [README](../README.md) - Getting started
