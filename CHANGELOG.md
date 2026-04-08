# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-04-08

### Fixed

- **Tooltip Overflow**: Fixed tooltips being clipped by container
  - Changed container `overflow: hidden` to `overflow: visible`
  - Increased tooltip z-index from 1000 to 9999
  - Improved positioning logic with better boundary checking
  - Better fallback values when tooltip dimensions aren't available
  - Tooltips now properly visible at all chart positions

## [1.1.2] - 2026-04-08

### Fixed

- **Tooltip Visibility**: Increased tooltip opacity and contrast for better visibility
  - Dark mode: Now uses `rgba(30, 30, 30, 0.95)` background (was nearly transparent)
  - Light mode: Now uses `rgba(255, 255, 255, 0.95)` background
  - Increased font size from 7-10px to 13px for better readability
  - Increased padding and border-radius for better appearance
  - Added `timechart-tooltip` class for new component name

## [1.1.1] - 2026-04-08

### Fixed

- **Standalone Chart Support**: Fixed crash when using `TimeChart` without `ChartProvider`
  - Added optional chaining to all context access (`setSharedZoom?.()`, `setSharedTooltip?.()`)
  - Charts now work independently or synced

## [1.1.0] - 2026-04-08

### Added

- **Domain Modes**: New `domainMode` prop with 'independent' (each trace own scale) and 'shared' (global min/max)
- **Per-Trace Domain**: `domain` property on traces for fixed min/max bounds
- **Grid Configuration**: `showGrid` and `gridConfig` props for customizable grid (columns, rows, lineStyle, lineWidth, color)
- **Axis Configuration**: `showAxis` and `axisConfig` props for axis lines and tick marks
- **Crosshair Configuration**: `crosshairConfig` prop for custom crosshair styling (color, lineWidth, style)
- **Background Override**: `backgroundColor` prop to override theme background
- **Time Format**: `timeFormat` prop using dayjs format strings
- **Secondary Field**: `secondaryField` prop to show additional data in tooltip (e.g., depth, index)
- **Configurable Timestamp**: `timestampKey` prop to use custom timestamp field names

### Changed

- Renamed components for clarity:
  - `CostumeLineChart` → `TimeChart` (old name still works)
  - `CostumeLineChartContext` → `ChartContext` (old name still works)
- Renamed props (old names still work but deprecated):
  - `receivedData` → `data`
  - `funcPromises` → `onVisibleRangeChange`
  - `isReportChart` → `readOnly`
  - `inLiveMode` → `liveMode`
  - `shouldDrawTimeLines` → `showTimeLabels`
  - `timesList` → `timeMarkers`
  - `chartNum` → `chartId`
  - `workerMinMaxListScaled` → `traceMinMax`
  - `receivedDataLastHistoricaldate` → `liveDataBoundary`
- Default timestamp key changed from `received_at` to `timestamp`

### Documentation

- Complete documentation rewrite with new prop names
- Added examples for all new features
- Added "Single Chart vs Synced Charts" guide

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of react-canvas-timechart
- High-performance canvas-based line chart rendering
- Mouse wheel zoom with configurable anchors (top/bottom/center)
- Pan support via shift+wheel and touch gestures
- Multi-chart synchronization via `ChartProvider`
  - Shared zoom level across charts
  - Shared pan position
  - Synchronized tooltip display
- Dark/light mode theming
- Customizable trace styling (color, width, units)
- Annotations support with timestamps
- Live mode with auto-scroll to latest data
- Touch gesture support (pinch-to-zoom, swipe-to-pan)
- TypeScript type definitions
- Time labels rendering option

### Technical Features

- Efficient canvas rendering for large datasets
- Configurable Y-axis bounds calculation
- Unit conversion support via callback prop
- Annotation filtering by chart identifier
- Responsive canvas resizing

## [Unreleased]

### Planned

- WebGL rendering option for even larger datasets
- Export chart as image
- Custom axis formatters
- Animation transitions
- Legend component
