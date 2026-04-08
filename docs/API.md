# API Reference

Complete API documentation for react-canvas-timechart.

## Table of Contents

- [Components](#components)
  - [TimeChart](#timechart)
  - [ChartProvider](#chartprovider)
- [Hooks](#hooks)
  - [useChartContext](#usechartcontext)
- [Utilities](#utilities)
  - [minGraph](#mingraph)
  - [maxGraph](#maxgraph)
- [Types](#types)

---

## Components

### TimeChart

The main chart component that renders a canvas-based line chart.

```jsx
import { TimeChart } from 'react-canvas-timechart';
```

#### Props

##### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `DataPoint[]` | Array of time-series data points. Each point must have a timestamp field and values for trace parameters. |
| `traces` | `Trace[]` | Array of trace configurations defining the lines to render. |

##### Data Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `timestampKey` | `string` | `'timestamp'` | Key for the timestamp field in data objects. |
| `traceMinMax` | `TraceMinMax` | - | Pre-calculated min/max values for each trace. Improves performance by avoiding runtime calculations. |
| `annotations` | `Annotation[]` | `[]` | Array of annotations to display on the chart at specific timestamps. |
| `timeMarkers` | `string[]` | `[]` | Array of ISO-8601 timestamps to draw horizontal time markers. |
| `secondaryField` | `SecondaryField` | - | Secondary field to show in tooltip (e.g., depth, index). |
| `domainMode` | `'independent' \| 'shared'` | `'independent'` | How trace Y-axis domains are calculated. |

##### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hasTooltip` | `boolean` | `true` | Enable/disable tooltip on mouse hover. |
| `hasZoom` | `boolean` | `true` | Enable/disable zoom and pan interactions. |
| `readOnly` | `boolean` | `false` | When true, disables all interactions (static chart mode). |
| `liveMode` | `boolean` | `false` | When true, auto-scrolls to keep the latest data point visible. |

##### Zoom Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fixedTopZoom` | `boolean` | `false` | Anchor zoom at the top of the chart. |
| `fixedBottomZoom` | `boolean` | `false` | Anchor zoom at the bottom of the chart. |

##### Display Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `chartId` | `string` | `''` | Unique identifier for the chart. Used for annotation filtering and multi-chart sync. |
| `showTimeLabels` | `boolean` | `false` | Render time labels on the left side of the chart. |
| `showGrid` | `boolean \| GridConfig` | `true` | Show/hide grid or pass config object. |
| `gridConfig` | `GridConfig` | - | Grid configuration (columns, rows, lineStyle, etc.). |
| `showAxis` | `boolean \| AxisConfig` | `false` | Show/hide axis lines or pass config object. |
| `axisConfig` | `AxisConfig` | - | Axis configuration (lineWidth, color, tickSize). |
| `crosshairConfig` | `CrosshairConfig` | - | Crosshair/hover line configuration. |
| `backgroundColor` | `string` | - | Override background color directly. |
| `timeFormat` | `string` | `'HH:mm:ss'` | Time format string for labels (uses dayjs format). |
| `isDarkMode` | `boolean` | `false` | Enable dark mode theme. |
| `theme` | `ThemeConfig` | - | Custom theme configuration for colors. |

##### Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `convertToCurrentUnit` | `(value: number, unitId?: string, context?: string) => number` | Function to convert values to user's preferred unit. |
| `onVisibleRangeChange` | `(params: VisibleRangeParams) => void` | Callback fired when the visible time range changes. |

#### Example

```jsx
<TimeChart
  data={data}
  traces={traces}
  annotations={annotations}
  hasTooltip
  hasZoom
  isDarkMode={isDark}
  chartId="main_chart"
  liveMode={isLive}
  domainMode="shared"
  showGrid={{ columns: 8, lineStyle: 'dotted' }}
  convertToCurrentUnit={unitConverter}
  onVisibleRangeChange={handleRangeChange}
/>
```

---

### ChartProvider

Context provider that enables multi-chart synchronization.

```jsx
import { ChartProvider } from 'react-canvas-timechart';
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Chart components to synchronize. |

#### Usage

Wrap multiple `TimeChart` components with `ChartProvider` to synchronize:
- Zoom level
- Pan position  
- Tooltip display (crosshair syncs across charts)

```jsx
<ChartProvider>
  <TimeChart chartId="chart_1" {...props1} />
  <TimeChart chartId="chart_2" {...props2} />
  <TimeChart chartId="chart_3" {...props3} />
</ChartProvider>
```

**Single Chart Usage**: You can also use `TimeChart` without `ChartProvider` for standalone charts:

```jsx
<TimeChart data={data} traces={traces} hasZoom />
```

#### Synchronization Behavior

When one chart is zoomed or panned, all sibling charts within the same `ChartProvider` will update to match:

- **Zoom**: All charts zoom to the same level
- **Pan**: All charts pan to the same time range
- **Tooltip**: Hovering over one chart shows tooltips at the same timestamp on all charts

---

## Hooks

### useChartContext

Access the chart context for custom integrations.

```jsx
import { ChartContext } from 'react-canvas-timechart';
import { useContext } from 'react';

const context = useContext(ChartContext);
```

#### Context Values

| Value | Type | Description |
|-------|------|-------------|
| `sharedZoom` | `number` | Current shared zoom level |
| `setSharedZoom` | `(zoom: number) => void` | Update shared zoom |
| `sharedPan` | `number` | Current shared pan offset |
| `setSharedPan` | `(pan: number) => void` | Update shared pan |
| `sharedTooltip` | `TooltipState` | Current shared tooltip state |
| `setSharedTooltip` | `(tooltip: TooltipState) => void` | Update shared tooltip |

---

## Utilities

### minGraph

Calculates a rounded minimum value for Y-axis.

```javascript
import { minGraph } from 'react-canvas-timechart';

const yMin = minGraph(-3.2);  // Returns -4
const yMin2 = minGraph(5.7);  // Returns 5
```

#### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `value` | `number` | The minimum data value |

#### Returns

`number` - Rounded down value suitable for axis display.

---

### maxGraph

Calculates a rounded maximum value for Y-axis.

```javascript
import { maxGraph } from 'react-canvas-timechart';

const yMax = maxGraph(97.5);  // Returns 98
const yMax2 = maxGraph(100);  // Returns 100
```

#### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `value` | `number` | The maximum data value |

#### Returns

`number` - Rounded up value suitable for axis display.

---

## Types

### DataPoint

```typescript
interface DataPoint {
  /** ISO-8601 datetime string (key is configurable via timestampKey prop) */
  timestamp: string;  // or your custom key
  
  /** Dynamic trace values - keys match trace.parameter */
  [key: string]: number | string | undefined;
}
```

### Trace

```typescript
interface Trace {
  /** Unique identifier for the trace */
  id?: string | number;
  
  /** Display name shown in tooltip */
  name: string;
  
  /** Key in DataPoint to access the value */
  parameter: string;
  
  /** Line color configuration */
  color: {
    code: string;  // Hex color (e.g., '#ff6384')
  };
  
  /** Line width in pixels */
  width?: number;
  
  /** Unit configuration for value formatting */
  unit?: {
    id?: string;       // Unit identifier
    symbol: string;   // Display symbol (e.g., '°C')
    to_fixed?: number; // Decimal places
  };
  
  /** Fixed min/max bounds for this trace (overrides auto-calculation) */
  domain?: [number, number];
}
```

### SecondaryField

```typescript
interface SecondaryField {
  /** Key in DataPoint to access the secondary value */
  key: string;
  
  /** Display label for the field */
  label: string;
  
  /** Optional unit string */
  unit?: string;
  
  /** Custom formatter function */
  format?: (value: any) => string;
}
```

### GridConfig

```typescript
interface GridConfig {
  /** Show grid (default: true) */
  show?: boolean;
  
  /** Number of vertical grid lines (default: 10) */
  columns?: number;
  
  /** Number of horizontal grid lines or 'auto' (default: 'auto') */
  rows?: number | 'auto';
  
  /** Grid line style (default: 'dashed') */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  
  /** Grid line width (default: 0.5) */
  lineWidth?: number;
  
  /** Override theme grid color */
  color?: string;
}
```

### AxisConfig

```typescript
interface AxisConfig {
  /** Show axis (default: false) */
  show?: boolean;
  
  /** Axis line width (default: 1) */
  lineWidth?: number;
  
  /** Override theme axis color */
  color?: string;
  
  /** Tick mark size, 0 to hide (default: 5) */
  tickSize?: number;
}
```

### CrosshairConfig

```typescript
interface CrosshairConfig {
  /** Show crosshair on hover (default: true) */
  show?: boolean;
  
  /** Crosshair color (default: 'red') */
  color?: string;
  
  /** Line width (default: 1) */
  lineWidth?: number;
  
  /** Line style (default: 'solid') */
  style?: 'solid' | 'dashed';
}
```

### Annotation

```typescript
interface Annotation {
  /** ISO-8601 datetime string for annotation position */
  time: string;
  
  /** Text to display */
  description: string;
  
  /** Filter to specific chart (matches chartNum prop) */
  chart?: string;
}
```

### WorkerMinMaxListScaled

```typescript
interface WorkerMinMaxListScaled {
  minAndMaxList: Array<{
    [parameter: string]: {
      min: number;
      max: number;
    };
  }>;
}
```

### ThemeConfig

```typescript
interface ThemeConfig {
  /** Canvas background color */
  background?: string;
  
  /** Grid line color */
  gridColor?: string;
  
  /** Text color for axis labels */
  textColor?: string;
  
  /** Annotation marker color */
  annotationText?: string;
}
```

### VisibleRangeParams

```typescript
interface VisibleRangeParams {
  /** ISO-8601 datetime of first visible point */
  firstVisibleDatetime: string;
  
  /** ISO-8601 datetime of last visible point */
  lastVisibleDatetime: string;
}
```

---

## Default Values

| Config | Default |
|--------|---------|
| Line width | 1.5px |
| Tooltip enabled | true |
| Zoom enabled | true |
| Dark mode | false |

---

## See Also

- [README](../README.md) - Quick start guide
- [Examples](./examples.md) - Usage examples
- [Changelog](../CHANGELOG.md) - Version history
