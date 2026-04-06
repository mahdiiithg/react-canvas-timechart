# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of costume-line-chart
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
