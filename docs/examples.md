# Examples

Practical examples for using costume-line-chart in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Multiple Traces](#multiple-traces)
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
import { CostumeLineChart, ChartProvider } from 'costume-line-chart';

function TemperatureChart() {
  const data = [
    { received_at: '2024-01-01T10:00:00Z', temp: 22.5 },
    { received_at: '2024-01-01T10:01:00Z', temp: 23.1 },
    { received_at: '2024-01-01T10:02:00Z', temp: 22.8 },
    { received_at: '2024-01-01T10:03:00Z', temp: 23.5 },
    { received_at: '2024-01-01T10:04:00Z', temp: 24.2 },
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

---

## Multiple Traces

Display multiple data series on a single chart:

```jsx
function MultiTraceChart() {
  const data = [
    { received_at: '2024-01-01T10:00:00Z', temp: 22.5, humidity: 45, pressure: 1013 },
    { received_at: '2024-01-01T10:01:00Z', temp: 23.1, humidity: 44, pressure: 1012 },
    { received_at: '2024-01-01T10:02:00Z', temp: 22.8, humidity: 46, pressure: 1013 },
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
    <ChartProvider>
      <div style={{ height: 400 }}>
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

---

## Multi-Chart Dashboard

Synchronized charts for comparing different metrics:

```jsx
function Dashboard() {
  const data = generateData(); // Your data source

  return (
    <ChartProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Left - Temperature */}
        <div style={{ height: 250 }}>
          <h3>Temperature</h3>
          <CostumeLineChart
            receivedData={data}
            traces={[{
              name: 'Temp',
              parameter: 'temperature',
              color: { code: '#ff6384' },
              unit: { symbol: '°C' },
            }]}
            chartNum="temp_chart"
            shouldDrawTimeLines
            hasZoom
          />
        </div>

        {/* Top Right - Pressure */}
        <div style={{ height: 250 }}>
          <h3>Pressure</h3>
          <CostumeLineChart
            receivedData={data}
            traces={[{
              name: 'Pressure',
              parameter: 'pressure',
              color: { code: '#36a2eb' },
              unit: { symbol: 'bar' },
            }]}
            chartNum="pressure_chart"
            hasZoom
          />
        </div>

        {/* Bottom - Combined View */}
        <div style={{ height: 250, gridColumn: '1 / -1' }}>
          <h3>Combined View</h3>
          <CostumeLineChart
            receivedData={data}
            traces={[
              { name: 'Temp', parameter: 'temperature', color: { code: '#ff6384' } },
              { name: 'Flow', parameter: 'flow', color: { code: '#4bc0c0' } },
            ]}
            chartNum="combined_chart"
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

function LiveChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [
        ...prev.slice(-100), // Keep last 100 points
        {
          received_at: new Date().toISOString(),
          value: Math.random() * 100,
        },
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ChartProvider>
      <div style={{ height: 400 }}>
        <CostumeLineChart
          receivedData={data}
          traces={[{
            name: 'Live Value',
            parameter: 'value',
            color: { code: '#00ff88' },
            width: 2,
          }]}
          inLiveMode={true}
          hasZoom
          hasTooltip
        />
      </div>
    </ChartProvider>
  );
}
```

---

## Custom Theming

Dark mode with custom colors:

```jsx
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
    <ChartProvider>
      <div style={{ height: 400, background: theme.background }}>
        <CostumeLineChart
          receivedData={data}
          traces={traces}
          isDarkMode={isDark}
          theme={theme}
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

---

## Unit Conversion

Converting between metric and imperial:

```jsx
function UnitConvertingChart() {
  const [useImperial, setUseImperial] = useState(false);

  const convertToCurrentUnit = (value, unit) => {
    if (!unit) return value;
    
    if (useImperial) {
      switch (unit.id) {
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
    <ChartProvider>
      <button onClick={() => setUseImperial(!useImperial)}>
        Toggle Units
      </button>
      <div style={{ height: 400 }}>
        <CostumeLineChart
          receivedData={data}
          traces={traces}
          convertToCurrentUnit={convertToCurrentUnit}
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

---

## Annotations

Displaying events on the chart:

```jsx
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
    <ChartProvider>
      <div style={{ height: 400 }}>
        <CostumeLineChart
          receivedData={data}
          traces={traces}
          annotations={annotations}
          chartNum="main_chart"
          hasZoom
          hasTooltip
        />
      </div>
    </ChartProvider>
  );
}
```

---

## Report/Static Mode

Non-interactive chart for reports:

```jsx
function ReportChart() {
  return (
    <ChartProvider>
      <div style={{ height: 300 }}>
        <CostumeLineChart
          receivedData={historicalData}
          traces={traces}
          isReportChart={true}
          shouldDrawTimeLines
        />
      </div>
    </ChartProvider>
  );
}
```

---

## Performance Optimization

Pre-calculating bounds for large datasets:

```jsx
import { useMemo } from 'react';

function OptimizedChart({ data, traces }) {
  // Pre-calculate min/max for each trace
  const workerMinMaxListScaled = useMemo(() => {
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
    <ChartProvider>
      <div style={{ height: 400 }}>
        <CostumeLineChart
          receivedData={data}
          traces={memoizedTraces}
          workerMinMaxListScaled={workerMinMaxListScaled}
          hasZoom
        />
      </div>
    </ChartProvider>
  );
}
```

---

## See Also

- [API Reference](./API.md) - Complete API documentation
- [README](../README.md) - Getting started
