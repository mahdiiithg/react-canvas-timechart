/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-return-assign */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable one-var */
/* eslint-disable no-plusplus */
import React, { useRef, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import _ from 'lodash';
import './styles/chart.css';
import { maxGraph, minGraph } from './utils/graphBounds';
import ChartContext from './ChartContext';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Default theme configuration for the chart
 */
const defaultTheme = {
  light: {
    background: '#ffffff',
    gridColor: '#E5E5E5',
    textColor: 'rgba(0, 0, 0, 0.5)',
    annotationText: '#000',
  },
  dark: {
    background: '#1e1e1e',
    gridColor: '#464646',
    textColor: 'rgba(255, 255, 255, 0.5)',
    annotationText: '#fff',
  },
};

/**
 * Default identity function for unit conversion (returns value as-is)
 */
const defaultConvertToCurrentUnit = (value) => value;

/**
 * Default grid configuration
 */
const defaultGridConfig = {
  show: true,
  columns: 10,
  rows: 'auto', // 'auto' or number
  lineStyle: 'dashed', // 'solid', 'dashed', 'dotted'
  lineWidth: 0.5,
  color: null, // null = use theme color
};

/**
 * Default axis configuration
 */
const defaultAxisConfig = {
  show: false,
  lineWidth: 1,
  color: null, // null = use theme color
  tickSize: 5,
};

/**
 * Default crosshair configuration
 */
const defaultCrosshairConfig = {
  show: true,
  color: 'red',
  lineWidth: 1,
  style: 'solid', // 'solid', 'dashed'
};

/**
 * TimeChart - A high-performance canvas-based line chart component
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data points with timestamp
 * @param {Array} props.traces - Array of trace configurations
 * @param {string} props.timestampKey - Key for timestamp field in data (default: 'timestamp')
 * @param {Object} props.secondaryField - Optional secondary field to show in tooltip { key, label, format? }
 * @param {Object} props.traceMinMax - Pre-calculated min/max values per trace
 * @param {Function} props.onVisibleRangeChange - Callback when visible range changes
 * @param {boolean} props.isDarkMode - Theme mode (default: false)
 * @param {Function} props.convertToCurrentUnit - Unit conversion function
 * @param {Object} props.theme - Custom theme colors
 * @param {string} props.backgroundColor - Override background color
 * @param {boolean} props.hasTooltip - Enable tooltip (default: true)
 * @param {boolean} props.hasZoom - Enable zoom interactions (default: true)
 * @param {boolean} props.readOnly - Static mode, no interactions (default: false)
 * @param {boolean} props.focusMode - Focus mode styling
 * @param {boolean} props.liveMode - Auto-scroll to latest data
 * @param {boolean} props.showTimeLabels - Draw time labels on left
 * @param {string} props.timeFormat - Time format string for labels (default: 'HH:mm:ss')
 * @param {boolean} props.fixedTopZoom - Anchor zoom at top
 * @param {boolean} props.fixedBottomZoom - Anchor zoom at bottom
 * @param {Array} props.annotations - Chart annotations
 * @param {Array} props.timeMarkers - Time markers for horizontal lines
 * @param {string} props.chartId - Chart identifier
 * @param {string} props.liveDataBoundary - Last historical data timestamp (for live mode divider)
 * @param {boolean|Object} props.showGrid - Show grid (true/false or grid config object)
 * @param {Object} props.gridConfig - Grid configuration { columns, rows, lineStyle, lineWidth, color }
 * @param {boolean|Object} props.showAxis - Show axis lines (true/false or axis config object)
 * @param {Object} props.axisConfig - Axis configuration { lineWidth, color, tickSize }
 * @param {Object} props.crosshairConfig - Crosshair configuration { show, color, lineWidth, style }
 * @param {string} props.domainMode - Domain scaling mode: 'independent' (each trace own scale) or 'shared' (all traces same scale)
 */
const TimeChart = ({
  // New generic prop names
  data,
  timestampKey = 'timestamp',
  secondaryField = null,
  traceMinMax,
  onVisibleRangeChange,
  readOnly = false,
  liveMode = false,
  showTimeLabels = false,
  timeFormat = 'HH:mm:ss',
  timeMarkers = [],
  chartId = '',
  liveDataBoundary,
  
  // Display configuration
  backgroundColor = null,
  showGrid = true,
  gridConfig = null,
  showAxis = false,
  axisConfig = null,
  crosshairConfig = null,
  domainMode = 'independent', // 'independent' or 'shared'
  
  // Backwards compatibility aliases (deprecated)
  receivedData,
  workerMinMaxListScaled,
  funcPromises,
  isReportChart,
  inLiveMode,
  shouldDrawTimeLines,
  timesList,
  chartNum,
  receivedDataLastHistoricaldate,
  
  // Common props (unchanged)
  traces,
  hasTooltip = true,
  hasZoom = true,
  focusMode = false,
  annotations = [],
  fixedTopZoom = false,
  fixedBottomZoom = false,
  isDarkMode = false,
  convertToCurrentUnit = defaultConvertToCurrentUnit,
  theme = null,
}) => {
  // Handle backwards compatibility - prefer new names but fall back to old
  const chartData = data || receivedData;
  const tsKey = timestampKey || 'received_at'; // Support old 'received_at' default
  const axisMinMax = traceMinMax || workerMinMaxListScaled;
  const onRangeChange = onVisibleRangeChange || funcPromises;
  const isStatic = readOnly ?? isReportChart ?? false;
  const isLiveMode = liveMode ?? inLiveMode ?? false;
  const drawTimeLabels = showTimeLabels ?? shouldDrawTimeLines ?? false;
  const markers = timeMarkers?.length ? timeMarkers : (timesList || []);
  const id = chartId || chartNum || '';
  const liveBoundary = liveDataBoundary || receivedDataLastHistoricaldate;

  // Merge custom theme with defaults
  const activeTheme = useMemo(() => {
    const base = isDarkMode ? defaultTheme.dark : defaultTheme.light;
    const merged = theme ? { ...base, ...theme } : base;
    // Override background if explicitly provided
    if (backgroundColor) {
      merged.background = backgroundColor;
    }
    return merged;
  }, [isDarkMode, theme, backgroundColor]);

  // Merge grid config with defaults
  const gridSettings = useMemo(() => {
    if (showGrid === false) return { ...defaultGridConfig, show: false };
    if (typeof showGrid === 'object') return { ...defaultGridConfig, ...showGrid };
    return { ...defaultGridConfig, ...gridConfig, show: true };
  }, [showGrid, gridConfig]);

  // Merge axis config with defaults  
  const axisSettings = useMemo(() => {
    if (showAxis === false) return { ...defaultAxisConfig, show: false };
    if (typeof showAxis === 'object') return { ...defaultAxisConfig, ...showAxis, show: true };
    return { ...defaultAxisConfig, ...axisConfig, show: !!showAxis };
  }, [showAxis, axisConfig]);

  // Merge crosshair config with defaults
  const crosshairSettings = useMemo(() => {
    return { ...defaultCrosshairConfig, ...crosshairConfig };
  }, [crosshairConfig]);

  // Calculate domain for a trace (supports both independent and shared modes)
  const getTraceDomain = useCallback((trace, data, allTraces) => {
    // First check if trace has explicit domain
    if (trace.domain && Array.isArray(trace.domain) && trace.domain.length === 2) {
      return { min: trace.domain[0], max: trace.domain[1] };
    }

    // Check if domain is provided via traceMinMax/axisMinMax prop
    const domainFromProp = _.find(axisMinMax?.minAndMaxList, (item) => item?.[trace.parameter]);
    if (domainFromProp && domainFromProp[trace.parameter]) {
      return {
        min: parseFloat(domainFromProp[trace.parameter].min),
        max: parseFloat(domainFromProp[trace.parameter].max),
      };
    }

    // Auto-calculate domain
    if (domainMode === 'shared') {
      // Calculate global min/max across ALL traces
      let globalMin = Infinity;
      let globalMax = -Infinity;
      
      allTraces?.forEach((t) => {
        // Check if this trace has explicit domain
        if (t.domain && Array.isArray(t.domain) && t.domain.length === 2) {
          globalMin = Math.min(globalMin, t.domain[0]);
          globalMax = Math.max(globalMax, t.domain[1]);
        } else {
          // Calculate from data
          data.forEach((d) => {
            const val = parseFloat(d[t.parameter]);
            if (Number.isFinite(val) && val !== -12345) {
              globalMin = Math.min(globalMin, val);
              globalMax = Math.max(globalMax, val);
            }
          });
        }
      });

      if (!Number.isFinite(globalMin)) globalMin = 0;
      if (!Number.isFinite(globalMax)) globalMax = globalMin + 1;
      if (globalMin === globalMax) globalMax = globalMin + 1;

      return { min: globalMin, max: globalMax };
    }

    // Independent mode - calculate from this trace's data only
    let rawMin = Infinity;
    let rawMax = -Infinity;
    data.forEach((d) => {
      const val = parseFloat(d[trace.parameter]);
      if (Number.isFinite(val) && val !== -12345) {
        rawMin = Math.min(rawMin, val);
        rawMax = Math.max(rawMax, val);
      }
    });

    if (!Number.isFinite(rawMin)) rawMin = 0;
    if (!Number.isFinite(rawMax)) rawMax = rawMin + 1;
    if (rawMin === rawMax) rawMax = rawMin + 1;

    return { min: rawMin, max: rawMax };
  }, [axisMinMax, domainMode]);

  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(document.createElement('canvas'));
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const anchorIndexRef = useRef(null);
  const anchorFractionRef = useRef(null);
  const manualZoomRef = useRef(false);
  const [context, setContext] = useState(null);
  const [localTooltipData, setLocalTooltipData] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 10, top: 10 });

  // Handle context - works with or without ChartProvider
  const chartContext = useContext(ChartContext);
  const sharedZoom = chartContext?.sharedZoom;
  const setSharedZoom = chartContext?.setSharedZoom;
  const sharedTooltip = chartContext?.sharedTooltip;
  const setSharedTooltip = chartContext?.setSharedTooltip;

  const [visibleDataRange, setVisibleDataRange] = useState(() => {
    if (!chartData || chartData.length === 0) return [0, 0];
    return [0, Math.max(0, chartData.length - 1)];
  });

  const [zoomLevel, setZoomLevel] = useState(100);

  const getEstimatedTooltipHeight = useCallback((rowsCount = 0) => {
    const headerHeight = 40;
    const secondaryFieldHeight = secondaryField ? 24 : 0;
    const perRow = 16;
    const basePadding = 20;
    return headerHeight + secondaryFieldHeight + rowsCount * perRow + basePadding;
  }, [secondaryField]);

  const visibleData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const [start, end] = visibleDataRange;
    const safeStart = Math.max(0, Math.min(start, chartData.length - 1));
    const safeEnd = Math.max(safeStart, Math.min(end, chartData.length - 1));
    return chartData.slice(safeStart, safeEnd + 1);
  }, [chartData, visibleDataRange]);

  const currentIndex = sharedTooltip?.originalIndex;
  const dataPoint = chartData && chartData[currentIndex] ? chartData[currentIndex] : null;

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setVisibleDataRange((prev) => {
        const newLength = chartData.length;
        if (newLength === 0) return [0, 0];

        const currentRangeSize = prev[1] - prev[0] + 1;
        const isInitialLoad = prev[0] === 0 && prev[1] === 0;
        const isSignificantChange = Math.abs(newLength - currentRangeSize) > newLength * 0.1;

        if (isInitialLoad || isSignificantChange) {
          return [0, newLength - 1];
        }

        const currentRange = prev[1] - prev[0];
        if (prev[1] >= newLength) {
          const newEnd = newLength - 1;
          const newStart = Math.max(0, newEnd - currentRange);
          return [newStart, newEnd];
        }
        return prev;
      });

      setZoomLevel(100);
    }
  }, [chartData?.length]);

  useEffect(() => {
    if (!isStatic && sharedZoom && Array.isArray(sharedZoom) && sharedZoom.length === 2) {
      const [start, end] = sharedZoom;
      if (chartData && chartData.length > 0) {
        const safeStart = Math.max(0, Math.min(start, chartData.length - 1));
        const safeEnd = Math.max(safeStart, Math.min(end, chartData.length - 1));
        setVisibleDataRange([safeStart, safeEnd]);
      }
    }
  }, [sharedZoom, isStatic, chartData?.length]);

  useEffect(() => {
    if (!chartData?.length) return;
    if (manualZoomRef.current) {
      manualZoomRef.current = false;
      return;
    }
    const totalDataPoints = chartData.length;
    const minVisiblePoints = 10;
    const zoomFactor = zoomLevel / 100;
    const visiblePoints = Math.max(minVisiblePoints, Math.floor(totalDataPoints * zoomFactor));
    const [curStart, curEnd] = visibleDataRange;

    if (anchorIndexRef.current != null && anchorFractionRef.current != null) {
      const anchorIndex = Math.min(Math.max(anchorIndexRef.current, 0), totalDataPoints - 1);
      const frac = Math.min(Math.max(anchorFractionRef.current, 0), 1);
      let newStart = Math.round(anchorIndex - frac * (visiblePoints - 1));
      let newEnd = newStart + visiblePoints - 1;
      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(totalDataPoints - 1, newStart + visiblePoints - 1);
      }
      if (newEnd >= totalDataPoints) {
        newEnd = totalDataPoints - 1;
        newStart = Math.max(0, newEnd - (visiblePoints - 1));
      }
      setVisibleDataRange([newStart, newEnd]);
      setSharedZoom?.([newStart, newEnd]);
      return;
    }

    const center = Math.floor((curStart + curEnd) / 2);
    const newStart = Math.max(0, center - Math.floor(visiblePoints / 2));
    const newEnd = Math.min(totalDataPoints - 1, newStart + visiblePoints - 1);
    setVisibleDataRange([newStart, newEnd]);
    setSharedZoom?.([newStart, newEnd]);
  }, [zoomLevel, chartData?.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData?.length) return;

    const traceContainerHeight = document.getElementsByClassName('chart-toolbar')?.[0]?.clientHeight 
      || document.getElementsByClassName('containerButtonTraces')?.[0]?.clientHeight;
    const width = traceContainerHeight ? container.clientWidth - traceContainerHeight : container.clientWidth;
    const height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setContext(ctx);

    offscreenCanvasRef.current.width = Math.max(1, Math.floor(width * dpr));
    offscreenCanvasRef.current.height = Math.max(1, Math.floor(height * dpr));
    const offscreenCtx = offscreenCanvasRef.current.getContext('2d');
    offscreenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const currentData = visibleData;
    drawStaticChart(offscreenCtx, currentData, traces, annotations, width);
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    drawDynamicChart(ctx, currentData);
  }, [
    visibleDataRange,
    chartData,
    traces,
    annotations,
    axisMinMax,
    focusMode,
    drawTimeLabels,
    markers,
    isDarkMode,
    activeTheme,
  ]);

  useEffect(() => {
    if (!context) return;
    const ctx = context;
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      drawDynamicChart(ctx, visibleData);
    });
  }, [sharedTooltip, visibleData, context]);

  const updateZoom = useCallback(
    (newZoomLevel, anchorGlobalIndex = null, anchorFraction = null) => {
      if (!chartData || chartData.length === 0) return;

      const totalDataPoints = chartData.length;
      const minVisiblePoints = 10;

      newZoomLevel = Math.max(10, Math.min(100, newZoomLevel));

      if (anchorGlobalIndex != null && anchorFraction != null) {
        anchorIndexRef.current = anchorGlobalIndex;
        anchorFractionRef.current = anchorFraction;
      }

      manualZoomRef.current = true;
      setZoomLevel(newZoomLevel);

      const zoomFactor = newZoomLevel / 100;
      const visiblePoints = Math.max(minVisiblePoints, Math.floor(totalDataPoints * zoomFactor));

      if (isLiveMode && anchorGlobalIndex == null) {
        const newStart = Math.max(0, totalDataPoints - visiblePoints);
        const newEnd = totalDataPoints - 1;
        setVisibleDataRange([newStart, newEnd]);
        setSharedZoom?.([newStart, newEnd]);
        return;
      }

      let anchorIndex = anchorGlobalIndex;
      let fraction = anchorFraction;
      if (anchorIndex == null || fraction == null) {
        const [currentStart, currentEnd] = visibleDataRange;
        anchorIndex = Math.floor((currentStart + currentEnd) / 2);
        fraction = 0.5;
      }

      let newStart = Math.round(anchorIndex - fraction * (visiblePoints - 1));
      let newEnd = newStart + visiblePoints - 1;

      if (newStart < 0) {
        newStart = 0;
        newEnd = newStart + visiblePoints - 1;
      }
      if (newEnd >= totalDataPoints) {
        newEnd = totalDataPoints - 1;
        newStart = Math.max(0, newEnd - (visiblePoints - 1));
      }

      if (newEnd - newStart + 1 < minVisiblePoints) {
        newEnd = Math.min(totalDataPoints - 1, newStart + minVisiblePoints - 1);
      }

      setVisibleDataRange([newStart, newEnd]);
      setSharedZoom?.([newStart, newEnd]);

      if (onRangeChange && chartData[newStart] && chartData[newEnd]) {
        const firstVisibleDatetime = dayjs(chartData[newStart][tsKey])
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        const lastVisibleDatetime = dayjs(chartData[newEnd][tsKey])
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        onRangeChange({ firstVisibleDatetime, lastVisibleDatetime });
      }
    },
    [chartData, visibleDataRange, isLiveMode, onRangeChange, tsKey]
  );

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (isStatic || !chartData?.length) return;

      if (event.shiftKey) {
        const delta = Math.sign(event.deltaY) * 5;
        setVisibleDataRange((prevRange) => {
          const [start, end] = prevRange;
          const rangeSize = end - start;
          let newStart = start - delta;
          let newEnd = end - delta;

          if (newStart < 0) {
            newStart = 0;
            newEnd = Math.min(chartData.length - 1, rangeSize);
          }
          if (newEnd >= chartData.length) {
            newEnd = chartData.length - 1;
            newStart = Math.max(0, newEnd - rangeSize);
          }

          if (newEnd - newStart < 10) {
            if (delta > 0) newEnd = Math.min(chartData.length - 1, newStart + 10);
            else newStart = Math.max(0, newEnd - 10);
          }

          setSharedZoom?.([newStart, newEnd]);

          if (onRangeChange && chartData[newStart] && chartData[newEnd]) {
            const firstVisibleDatetime = dayjs(chartData[newStart][tsKey])
              .tz(dayjs.tz.guess())
              .format('YYYY-MM-DDTHH:mm:ssZ');
            const lastVisibleDatetime = dayjs(chartData[newEnd][tsKey])
              .tz(dayjs.tz.guess())
              .format('YYYY-MM-DDTHH:mm:ssZ');
            onRangeChange({ firstVisibleDatetime, lastVisibleDatetime });
          }

          return [newStart, newEnd];
        });
      } else {
        const delta = Math.sign(event.deltaY) * 5;
        if ((delta > 0 && zoomLevel <= 10) || (delta < 0 && zoomLevel >= 100)) return;

        if (context) {
          const { offsetY } = event.nativeEvent;
          const dpr = window.devicePixelRatio || 1;
          const canvasHeight = context.canvas.height / dpr;
          const padding = 5;
          const plotHeight = canvasHeight - padding * 2;
          let frac = Math.min(1, Math.max(0, (offsetY - padding) / plotHeight));
          const [start, end] = visibleDataRange;
          const windowSize = Math.max(1, end - start);
          let anchorIndex = start + Math.round(frac * windowSize);
          if (fixedTopZoom) {
            frac = 0;
            anchorIndex = start;
          } else if (fixedBottomZoom) {
            frac = 1;
            anchorIndex = end;
          }
          updateZoom(zoomLevel - delta, anchorIndex, frac);
        } else {
          updateZoom(zoomLevel - delta);
        }
      }
    },
    [updateZoom, zoomLevel, isStatic, chartData, context, visibleDataRange, onRangeChange, fixedTopZoom, fixedBottomZoom, tsKey]
  );

  const handleTouchMove = (event) => {
    event.preventDefault();

    if (event.touches.length === 1) {
      simulateMouseEvent(event, 'mousemove');
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches;
      const newDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const delta = newDistance - startPan;
      const threshold = 10;
      if (Math.abs(delta) > threshold) {
        setStartPan(newDistance);
        if (context) {
          const midClientY = (touch1.clientY + touch2.clientY) / 2;
          const rect = context.canvas.getBoundingClientRect();
          const offsetY = midClientY - rect.top;
          const dpr = window.devicePixelRatio || 1;
          const canvasHeight = context.canvas.height / dpr;
          const padding = 5;
          const plotHeight = canvasHeight - padding * 2;
          let frac = Math.min(1, Math.max(0, (offsetY - padding) / plotHeight));
          const [start, end] = visibleDataRange;
          const windowSize = Math.max(1, end - start);
          let anchorIndex = start + Math.round(frac * windowSize);
          if (fixedTopZoom) {
            frac = 0;
            anchorIndex = start;
          } else if (fixedBottomZoom) {
            frac = 1;
            anchorIndex = end;
          }

          const direction = delta > 0 ? 1 : -1;
          const step = 5;
          updateZoom(zoomLevel + direction * step, anchorIndex, frac);
        } else {
          const direction = delta > 0 ? 1 : -1;
          updateZoom(zoomLevel + direction * 5);
        }
      }
    }
  };

  const drawStaticChart = (ctx, data, traces, annotations) => {
    if (!ctx || !data.length) return;

    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const height = ctx.canvas.height / dpr;

    const baseFontSize = Math.max(6, Math.min(10, Math.floor(width / 25)));
    const smallFontSize = Math.max(5, Math.floor(baseFontSize * 1.2));
    const lineWidth = Math.max(1, Math.min(2, Math.floor(width / 180)));
    const padding = Math.max(3, Math.min(8, Math.floor(width / 50)));

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = activeTheme.background;
    ctx.fillRect(0, 0, width, height);

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    drawGrid(ctx, padding, plotWidth, plotHeight);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    traces?.forEach((trace) => {
      const { min: rawMin, max: rawMax } = getTraceDomain(trace, data, traces);

      const pad = 0;
      const xMin = minGraph(rawMin - pad);
      let xMax = maxGraph(rawMax + pad);
      if (xMin >= xMax) xMax = maxGraph(xMin + 1);

      const xScale = plotWidth / (xMax - xMin || 1);
      const yScale = plotHeight / (data.length - 1 || 1);

      const ts = data.map((p) => dayjs(p[tsKey]).valueOf());
      const intervals = [];
      for (let i = 1; i < ts.length; i++) {
        const diff = ts[i] - ts[i - 1];
        if (diff > 0) intervals.push(diff);
      }
      intervals.sort((a, b) => a - b);
      const median = intervals.length ? intervals[Math.floor(intervals.length / 2)] : 0;
      const gapThreshold = median > 0 ? median * 5 : 60000;
      ctx.strokeStyle = trace.color.code;
      ctx.lineWidth = trace.width || lineWidth;
      ctx.beginPath();
      let drawing = false;
      let lastTs = null;

      data.forEach((point, index) => {
        const rawVal = parseFloat(point[trace.parameter]);
        const isMissing = !Number.isFinite(rawVal) || rawVal === -12345;
        if (isMissing) {
          if (drawing) {
            ctx.stroke();
            drawing = false;
          }
          lastTs = null;
          return;
        }
        const safeVal = rawVal;
        const x = padding + (safeVal - xMin) * xScale;
        const y = padding + index * yScale;
        const curTs = ts[index];

        if (!drawing) {
          if (drawing) ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          drawing = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastTs = curTs;
      });
      if (drawing) ctx.stroke();
    });

    if (drawTimeLabels) {
      ctx.fillStyle = activeTheme.textColor;
      ctx.font = `${smallFontSize}px Arial`;
      ctx.textAlign = 'left';

      const yScale = plotHeight / (data.length - 1 || 1);
      const minLabelGapPx = Math.max(20, smallFontSize * 2.5);

      const idealLabelCount = Math.floor(plotHeight / minLabelGapPx);
      const actualStep = Math.max(1, Math.floor(data.length / idealLabelCount));

      for (let index = 0; index < data.length; index += actualStep) {
        const y = padding + index * (yScale || 0);

        if (y >= padding && y <= padding + plotHeight) {
          const timeLabel = dayjs(data[index][tsKey]).format(timeFormat);

          ctx.fillStyle = activeTheme.textColor;
          ctx.fillText(timeLabel, 5, y + 3);
        }
      }
    }

    // Draw axis lines if enabled
    if (axisSettings.show) {
      drawAxis(ctx, padding, plotWidth, plotHeight);
    }

    if (drawTimeLabels) {
      drawTimelines(ctx, data, padding, plotWidth, markers);
    }
    drawAnnotations(ctx, data, padding, plotHeight, annotations);
    if (isLiveMode) drawHistoricalLine(ctx, data, padding, plotWidth, plotHeight);
  };

  const drawDynamicChart = (ctx, data) => {
    if (!ctx || !data.length) return;
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const padding = Math.max(3, Math.min(10, Math.floor(width / 40)));
    const plotWidth = width - padding * 2;
    const plotHeight = ctx.canvas.height / dpr - padding * 2;
    drawSyncedDots(ctx, data, padding, plotWidth, plotHeight);
  };

  const drawSyncedDots = (ctx, data, padding, plotWidth, plotHeight) => {
    if (!sharedTooltip || sharedTooltip.originalIndex == null) return;
    const index = sharedTooltip.originalIndex - visibleDataRange[0];
    if (index < 0 || index >= data.length) return;

    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const dotRadius = Math.max(2, Math.min(5, Math.floor(width / 80)));

    const yScale = plotHeight / (data.length - 1 || 1);
    const yValue = padding + index * yScale;

    // Draw crosshair line if enabled
    if (crosshairSettings.show) {
      ctx.strokeStyle = crosshairSettings.color;
      ctx.lineWidth = crosshairSettings.lineWidth;
      if (crosshairSettings.style === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(padding, yValue);
      ctx.lineTo(plotWidth + padding, yValue);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    traces.forEach((trace) => {
      const { min: rawMin, max: rawMax } = getTraceDomain(trace, data, traces);

      const pad = 0;
      const xMin = minGraph(rawMin - pad);
      let xMax = maxGraph(rawMax + pad);
      if (xMin >= xMax) xMax = maxGraph(xMin + 1);
      const xScale = plotWidth / (xMax - xMin || 1);
      const value = parseFloat(data[index][trace.parameter]);
      if (!Number.isFinite(value) || value === -12345) return;
      const xValue = padding + (value - xMin) * xScale;

      ctx.beginPath();
      ctx.arc(xValue, yValue, dotRadius, 0, 2 * Math.PI);
      ctx.fillStyle = trace.color.code;
      ctx.fill();
    });
  };

  const drawGrid = (ctx, padding, plotWidth, plotHeight) => {
    // Skip if grid is disabled
    if (!gridSettings.show) return;

    ctx.strokeStyle = gridSettings.color || activeTheme.gridColor;
    ctx.lineWidth = gridSettings.lineWidth;
    
    // Set line style
    if (gridSettings.lineStyle === 'dashed') {
      ctx.setLineDash([4, 4]);
    } else if (gridSettings.lineStyle === 'dotted') {
      ctx.setLineDash([1, 3]);
    } else {
      ctx.setLineDash([]);
    }

    const numColumns = gridSettings.columns;
    const verticalLineSpacing = plotWidth / numColumns;
    
    // Draw vertical lines
    for (let i = 0; i <= numColumns; i++) {
      const x = Math.round(padding + i * verticalLineSpacing) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, Math.round(padding) + 0.5);
      ctx.lineTo(x, Math.round(plotHeight + padding) + 0.5);
      ctx.stroke();
    }
    
    // Calculate horizontal lines
    let numRows;
    if (gridSettings.rows === 'auto') {
      const horizontalLineSpacing = verticalLineSpacing;
      numRows = Math.floor(plotHeight / horizontalLineSpacing);
    } else {
      numRows = gridSettings.rows;
    }
    
    const horizontalLineSpacing = plotHeight / numRows;
    
    // Draw horizontal lines
    for (let i = 0; i <= numRows; i++) {
      const y = Math.round(padding + i * horizontalLineSpacing) + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.round(padding) + 0.5, y);
      ctx.lineTo(Math.round(plotWidth + padding) + 0.5, y);
      ctx.stroke();
    }
    
    // Draw bottom line if needed
    const bottomYExact = Math.round(padding + plotHeight) + 0.5;
    const lastDrawnY = Math.round(padding + numRows * horizontalLineSpacing) + 0.5;
    if (Math.abs(bottomYExact - lastDrawnY) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(Math.round(padding) + 0.5, bottomYExact);
      ctx.lineTo(Math.round(plotWidth + padding) + 0.5, bottomYExact);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  };

  const drawAxis = (ctx, padding, plotWidth, plotHeight) => {
    ctx.strokeStyle = axisSettings.color || activeTheme.textColor;
    ctx.lineWidth = axisSettings.lineWidth;
    ctx.setLineDash([]);

    // Draw left Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + plotHeight);
    ctx.stroke();

    // Draw bottom X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + plotHeight);
    ctx.lineTo(padding + plotWidth, padding + plotHeight);
    ctx.stroke();

    // Draw tick marks if specified
    if (axisSettings.tickSize > 0) {
      const tickSize = axisSettings.tickSize;
      
      // Y-axis ticks
      const numYTicks = 5;
      const yTickSpacing = plotHeight / numYTicks;
      for (let i = 0; i <= numYTicks; i++) {
        const y = padding + i * yTickSpacing;
        ctx.beginPath();
        ctx.moveTo(padding - tickSize, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
      }

      // X-axis ticks  
      const numXTicks = gridSettings.columns || 10;
      const xTickSpacing = plotWidth / numXTicks;
      for (let i = 0; i <= numXTicks; i++) {
        const x = padding + i * xTickSpacing;
        ctx.beginPath();
        ctx.moveTo(x, padding + plotHeight);
        ctx.lineTo(x, padding + plotHeight + tickSize);
        ctx.stroke();
      }
    }
  };

  const drawHistoricalLine = (ctx, data, padding, plotWidth, plotHeight) => {
    if (!liveBoundary) return;
    const index = data.findIndex((d) => d[tsKey] === liveBoundary);
    if (index === -1) return;
    const yScale = plotHeight / (data.length - 1 || 1);
    const y = padding + index * yScale;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(plotWidth + padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawTimelines = (ctx, data, padding, plotHeight, timelines) => {
    if (!timelines || timelines.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const plotWidth = ctx.canvas.width / dpr - padding * 2;
    const width = ctx.canvas.width / dpr;
    const baseFontSize = Math.max(8, Math.min(14, Math.floor(width / 18)));
    const smallFontSize = Math.max(6, Math.floor(baseFontSize * 1.8));

    timelines.forEach((timeline, i) => {
      const minute = dayjs(timeline).minute();
      const reminder = minute % 10;
      const reminder2 = minute % 2;
      ctx.strokeStyle = reminder === 0 ? '#616060' : '#e0e0e0';
      ctx.lineWidth = 1;
      const y = (i / timelines.length) * (ctx.canvas.height / dpr);
      const label = dayjs(timeline).format('HH:mm:00');
      const labelYPosition = reminder === 0 ? y + baseFontSize : reminder2 === 0 ? y + smallFontSize : 0;
      const labelFontSize = reminder === 0 ? `${baseFontSize}px` : reminder2 === 0 ? `${smallFontSize}px` : 0;
      const labelColor = reminder === 0 ? '#706f6f' : reminder2 === 0 ? '#7F7F7F' : 0;

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(plotWidth + padding, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = `${labelFontSize} Arial`;
      if (id === 'chart_1') ctx.fillText(label, padding + 4, labelYPosition);
    });
  };

  const drawAnnotations = (ctx, data, padding, plotHeight, annotations) => {
    if (!annotations || !annotations.length || !data.length || !ctx || !chartData?.length) return;

    const relevantAnnotations = annotations.filter((annotation) => {
      if (annotation?.chart && annotation.chart.length > 1 && annotation.chart !== id) return false;
      return true;
    });

    if (!relevantAnnotations.length) return;

    const globalTimes = chartData.map((d) => dayjs(d[tsKey]).valueOf());

    const findNearestGlobalIndex = (targetTime) => {
      let minDiff = Infinity;
      let bestIdx = 0;
      globalTimes.forEach((time, idx) => {
        const diff = Math.abs(time - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
        }
      });
      return bestIdx;
    };

    const [visStart, visEnd] = visibleDataRange;

    const groupsByGlobalIndex = new Map();
    relevantAnnotations.forEach((annotation) => {
      const annotationTime = dayjs(annotation.time).tz(dayjs.tz.guess()).valueOf();
      const globalIdx = findNearestGlobalIndex(annotationTime);

      if (globalIdx < visStart || globalIdx > visEnd) return;

      if (!groupsByGlobalIndex.has(globalIdx)) {
        groupsByGlobalIndex.set(globalIdx, []);
      }
      groupsByGlobalIndex.get(globalIdx).push(annotation);
    });

    if (!groupsByGlobalIndex.size) return;

    const sortedGlobalIndices = Array.from(groupsByGlobalIndex.keys()).sort((a, b) => a - b);

    const yScale = plotHeight / (data.length - 1 || 1);
    const chartWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
    const annotationFontSize = Math.max(8, Math.min(12, Math.floor(chartWidth / 20)));

    sortedGlobalIndices.forEach((globalIdx) => {
      const group = groupsByGlobalIndex.get(globalIdx);
      if (!group || !group.length) return;

      const localIdx = globalIdx - visStart;
      if (localIdx < 0 || localIdx >= data.length) return;

      const baseY = padding + localIdx * yScale;

      if (!isStatic) {
        ctx.strokeStyle = isDarkMode ? 'rgba(40, 40, 40, 0.0)' : 'rgba(255, 255, 255, 0.0)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padding, baseY);
        ctx.lineTo(chartWidth - padding, baseY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      group.sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());

      let verticalOffset = 0;
      group.forEach((annotation) => {
        const text = annotation.description || 'Annotation';
        ctx.font = `${annotationFontSize}px Arial`;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = annotationFontSize + 2;

        const y = baseY + verticalOffset;
        if (y < padding || y > plotHeight + padding) {
          verticalOffset += 18;
          return;
        }

        const rightX = chartWidth - padding - textWidth - 13;
        ctx.fillStyle = isDarkMode ? 'rgba(40, 40, 40, 0.0)' : 'rgba(255, 255, 255, 0.0)';
        ctx.fillRect(rightX, y - textHeight, textWidth + 8, textHeight + 4);

        ctx.strokeStyle = isDarkMode ? 'rgba(40, 40, 40, 0.0)' : 'rgba(40, 40, 40, 0.0)';
        ctx.lineWidth = 0.0000001;
        ctx.strokeRect(rightX, y - textHeight, textWidth + 8, textHeight + 4);

        ctx.fillStyle = activeTheme.annotationText;
        ctx.fillText(text, rightX + 4, y - 3);

        verticalOffset += 18;
      });
    });
  };

  // Format secondary field value for tooltip
  const formatSecondaryValue = useCallback((point) => {
    if (!secondaryField || !point) return null;
    const value = point[secondaryField.key];
    if (value === undefined || value === null) return 'N/A';
    if (secondaryField.format) {
      return secondaryField.format(value);
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  }, [secondaryField]);

  const handleMouseMove = useCallback(
    _.throttle((event) => {
      if (!context || !chartData?.length || isStatic) return;

      const { offsetX, offsetY } = event.nativeEvent;
      const dpr = window.devicePixelRatio || 1;
      const canvasHeight = context.canvas.height / dpr;
      const canvasWidth = context.canvas.width / dpr;
      const padding = 5;
      const plotHeight = canvasHeight - padding * 2;
      const plotWidth = canvasWidth - padding * 2;

      if (offsetX < padding || offsetX > plotWidth + padding || offsetY < padding || offsetY > plotHeight + padding) {
        setSharedTooltip?.(null);
        return;
      }

      const relativeY = offsetY - padding;
      const normalizedY = relativeY / plotHeight;
      const dataIndex = Math.round(normalizedY * (visibleData.length - 1));
      const boundedIndex = Math.max(0, Math.min(dataIndex, visibleData.length - 1));

      const point = visibleData[boundedIndex];
      const originalIndex = visibleDataRange[0] + boundedIndex;

      if (!point) return;

      const tooltipContent = traces.map((trace) => ({
        name: trace.name,
        value: formatTraceValue(trace, point),
        color: trace.color.code,
        unit: trace.unit?.symbol || '',
      }));

      const tooltipHeight = getEstimatedTooltipHeight(tooltipContent.length);
      const tooltipWidth = 200;
      const chartMidpoint = plotHeight / 2;
      const isInLowerHalf = offsetY - padding > chartMidpoint;
      const tooltipPadding = 20;

      let tooltipX = offsetX + 10;
      let tooltipY;

      if (isInLowerHalf) {
        tooltipY = padding + 10;
      } else {
        tooltipY = plotHeight + padding - tooltipHeight - 10;
      }
      if (tooltipX + tooltipWidth > canvasWidth) {
        tooltipX = offsetX - tooltipWidth - tooltipPadding;
      }
      tooltipX = Math.max(tooltipPadding, Math.min(tooltipX, canvasWidth - tooltipWidth - tooltipPadding));
      tooltipY = Math.max(tooltipPadding, Math.min(tooltipY, canvasHeight - tooltipHeight - tooltipPadding));
      
      setSharedTooltip?.({
        originalIndex,
        x: tooltipX,
        y: tooltipY,
        time: dayjs(point[tsKey]).format('MMM DD HH:mm:ss'),
        secondaryValue: formatSecondaryValue(point),
        content: tooltipContent,
        mouseX: offsetX,
        mouseY: offsetY,
        isInLowerHalf,
      });

      setLocalTooltipData(tooltipContent);
    }, 16),
    [context, chartData, visibleDataRange, visibleData, traces, isStatic, getEstimatedTooltipHeight, tsKey, formatSecondaryValue]
  );

  useEffect(() => {
    if (
      !sharedTooltip ||
      !sharedTooltip.mouseX ||
      !sharedTooltip.mouseY ||
      !context ||
      !chartData?.length ||
      isStatic
    )
      return;

    const dpr = window.devicePixelRatio || 1;
    const canvasHeight = context.canvas.height / dpr;
    const canvasWidth = context.canvas.width / dpr;
    const padding = 5;
    const plotHeight = canvasHeight - padding * 2;
    const plotWidth = canvasWidth - padding * 2;

    const { mouseX: offsetX, mouseY: offsetY } = sharedTooltip;

    if (offsetX < padding || offsetX > plotWidth + padding || offsetY < padding || offsetY > plotHeight + padding) {
      return;
    }

    const relativeY = offsetY - padding;
    const normalizedY = relativeY / plotHeight;
    const dataIndex = Math.round(normalizedY * (visibleData.length - 1));
    const boundedIndex = Math.max(0, Math.min(dataIndex, visibleData.length - 1));

    const point = visibleData[boundedIndex];
    const originalIndex = visibleDataRange[0] + boundedIndex;

    if (!point) return;

    const tooltipContent = traces.map((trace) => ({
      name: trace.name,
      value: formatTraceValue(trace, point),
      color: trace.color.code,
      unit: trace.unit?.symbol || '',
    }));

    const tooltipHeight = getEstimatedTooltipHeight(tooltipContent.length);
    const tooltipWidth = 200;
    const chartMidpoint = plotHeight / 2;
    const isInLowerHalf = offsetY - padding > chartMidpoint;

    let tooltipX = offsetX + 10;
    let tooltipY;

    if (isInLowerHalf) {
      tooltipY = padding + 10;
    } else {
      tooltipY = plotHeight + padding - tooltipHeight - 30;
    }

    if (tooltipX + tooltipWidth > canvasWidth) {
      tooltipX = offsetX - tooltipWidth - 10;
    }

    tooltipX = Math.max(10, Math.min(tooltipX, canvasWidth - tooltipWidth - 10));
    tooltipY = Math.max(10, Math.min(tooltipY, canvasHeight - tooltipHeight - 10));
    setSharedTooltip?.((prevTooltip) => ({
      ...prevTooltip,
      originalIndex,
      x: tooltipX,
      y: tooltipY,
      time: dayjs(point[tsKey]).format('MMM DD HH:mm:ss'),
      secondaryValue: formatSecondaryValue(point),
      content: tooltipContent,
      isInLowerHalf,
    }));

    setLocalTooltipData(tooltipContent);
  }, [
    chartData,
    visibleData,
    traces,
    context,
    sharedTooltip?.mouseX,
    sharedTooltip?.mouseY,
    visibleDataRange,
    isStatic,
    getEstimatedTooltipHeight,
    tsKey,
    formatSecondaryValue,
  ]);

  const handleMouseLeave = useCallback(() => {
    setSharedTooltip?.(null);
    setLocalTooltipData(null);
  }, []);

  useEffect(() => {
    if (!hasTooltip || !sharedTooltip || !dataPoint) return;

    const container = containerRef.current;
    const tooltipEl = tooltipRef.current;

    if (!container || !tooltipEl) {
      setTooltipPosition((prev) => {
        const nextLeft = sharedTooltip.x || 10;
        const nextTop = sharedTooltip.y || 10;
        if (prev.left === nextLeft && prev.top === nextTop) return prev;
        return { left: nextLeft, top: nextTop };
      });
      return;
    }

    const padding = 10;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const tooltipWidth = tooltipEl.offsetWidth || 200;
    const tooltipHeight = tooltipEl.offsetHeight || 100;

    let nextLeft = sharedTooltip.x || 10;
    let nextTop = sharedTooltip.y || 10;

    // Keep tooltip within container bounds
    if (nextLeft + tooltipWidth + padding > containerWidth) {
      nextLeft = containerWidth - tooltipWidth - padding;
    }
    if (nextLeft < padding) {
      nextLeft = padding;
    }
    if (nextTop + tooltipHeight + padding > containerHeight) {
      nextTop = containerHeight - tooltipHeight - padding;
    }
    if (nextTop < padding) {
      nextTop = padding;
    }

    setTooltipPosition((prev) => {
      if (prev.left === nextLeft && prev.top === nextTop) return prev;
      return { left: nextLeft, top: nextTop };
    });
  }, [hasTooltip, sharedTooltip, dataPoint, traces]);

  const handleMouseDown = (event) => {
    setIsPanning(true);
    setStartPan(event.nativeEvent.offsetY);
  };

  const handleMouseUp = useCallback(() => {
    if (isPanning && onRangeChange && chartData?.length) {
      const [start, end] = sharedZoom || visibleDataRange;
      if (chartData[start] && chartData[end]) {
        const firstVisibleDatetime = dayjs(chartData[start][tsKey])
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        const lastVisibleDatetime = dayjs(chartData[end][tsKey])
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        onRangeChange({ firstVisibleDatetime, lastVisibleDatetime });
      }
    }
    setIsPanning(false);
  }, [isPanning, onRangeChange, chartData, sharedZoom, visibleDataRange, tsKey]);

  const handleMouseMovePan = useCallback(
    _.debounce((event) => {
      if (!isPanning || isStatic || !chartData?.length) return;

      const { offsetY } = event.nativeEvent;
      const delta = offsetY - startPan;

      if (Math.abs(delta) <= 3) return;

      const sensitivity = Math.max(1, Math.floor(chartData.length / 1000));
      const moveBy = Math.floor(delta / (15 / sensitivity));

      setStartPan(offsetY);

      setVisibleDataRange((prevRange) => {
        const [start, end] = prevRange;
        const rangeSize = end - start;
        let newStart = start - moveBy;
        let newEnd = end - moveBy;

        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(chartData.length - 1, rangeSize);
        }
        if (newEnd >= chartData.length) {
          newEnd = chartData.length - 1;
          newStart = Math.max(0, newEnd - rangeSize);
        }

        if (newEnd - newStart < 10) {
          const adjustment = 10 - (newEnd - newStart);
          if (moveBy > 0) {
            newEnd = Math.min(chartData.length - 1, newEnd + adjustment);
          } else {
            newStart = Math.max(0, newStart - adjustment);
          }
        }

        setSharedZoom?.([newStart, newEnd]);

        if (chartData[newStart] && chartData[newEnd] && onRangeChange) {
          const firstVisibleDatetime = dayjs(chartData[newStart][tsKey])
            .tz(dayjs.tz.guess())
            .format('YYYY-MM-DDTHH:mm:ssZ');
          const lastVisibleDatetime = dayjs(chartData[newEnd][tsKey])
            .tz(dayjs.tz.guess())
            .format('YYYY-MM-DDTHH:mm:ssZ');

          onRangeChange({ firstVisibleDatetime, lastVisibleDatetime });
        }

        return [newStart, newEnd];
      });
    }, 30),
    [isPanning, startPan, chartData, isStatic, onRangeChange, tsKey]
  );

  const handleMouseMoveHandler = isPanning && hasTooltip ? handleMouseMovePan : handleMouseMove;
  const handleMouseLeaveHandler = hasTooltip ? handleMouseLeave : null;
  const handleMouseDownHandler = hasTooltip ? handleMouseDown : null;
  const handleMouseUpHandler = hasZoom ? handleMouseUp : null;
  const handleWheelHandler = hasZoom ? handleWheel : null;

  const simulateMouseEvent = (event, type) => {
    const touch = event.touches[0] || event.changedTouches[0];
    const simulatedEvent = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    event.target.dispatchEvent(simulatedEvent);
  };

  const handleTouchStart = (event) => {
    event.preventDefault();
    if (event.touches.length === 1) {
      simulateMouseEvent(event, 'mousedown');
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches;
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setStartPan(distance);
    }
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    if (event.touches.length === 0) simulateMouseEvent(event, 'mouseup');
  };

  useEffect(() => {
    const preventBrowserZoom = (e) => e.preventDefault();
    document.addEventListener('gesturestart', preventBrowserZoom);
    document.addEventListener('gesturechange', preventBrowserZoom);
    return () => {
      document.removeEventListener('gesturestart', preventBrowserZoom);
      document.removeEventListener('gesturechange', preventBrowserZoom);
    };
  }, []);

  const disableBrowserZoom = () => (document.body.style.touchAction = 'none');
  const enableBrowserZoom = () => (document.body.style.touchAction = '');
  useEffect(() => {
    disableBrowserZoom();
    return enableBrowserZoom;
  }, []);

  const tooltipStyles = useMemo(() => {
    if (!hasTooltip || !sharedTooltip || !dataPoint) return { display: 'none' };

    return {
      left: tooltipPosition.left,
      top: tooltipPosition.top,
      display: 'block',
    };
  }, [hasTooltip, sharedTooltip, dataPoint, tooltipPosition]);

  const tooltipClasses = useMemo(() => {
    const baseClass = 'timechart-tooltip';
    const legacyClass = 'costume-chart-tooltip'; // backwards compat
    const themeClass = isDarkMode ? '' : 'tooltip-light';
    const positionClass = sharedTooltip?.isInLowerHalf ? 'tooltip-fixed-top' : 'tooltip-fixed-bottom';

    return [baseClass, legacyClass, themeClass, positionClass].filter(Boolean).join(' ');
  }, [isDarkMode, sharedTooltip?.isInLowerHalf]);

  const formatTraceValue = (trace, point) => {
    if (!point) return '-';
    const raw = point[trace.parameter];
    const num = Number(raw);
    if (!Number.isFinite(num)) return '-';
    const converted = convertToCurrentUnit(num, trace?.unit?.id, 'chart');
    if (!Number.isFinite(converted)) return '-';
    const absVal = Math.abs(converted);
    const desiredDecimals = typeof trace?.unit?.to_fixed === 'number' ? trace.unit.to_fixed : 2;
    const decimals = absVal > 1000 ? 0 : Math.min(4, desiredDecimals);
    return converted.toFixed(decimals);
  };

  return (
    <div className="flex w-full h-full relative">
      <div
        className="timechart-container costume-chart-container flex-1"
        data-theme={isDarkMode ? 'dark' : 'light'}
        style={{ position: 'relative', height: '100%', width: '100%' }}
        ref={containerRef}
        onMouseMove={handleMouseMoveHandler}
        onMouseLeave={handleMouseLeaveHandler}
        onMouseDown={handleMouseDownHandler}
        onMouseUp={handleMouseUpHandler}
        onWheel={handleWheelHandler}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="timechart-canvas costume-chart-canvas" style={{ width: '100%', height: '100%' }} />
        {hasTooltip && sharedTooltip && dataPoint && (
          <div ref={tooltipRef} className={tooltipClasses} data-theme={isDarkMode ? 'dark' : 'light'} style={tooltipStyles}>
            <div className="font-semibold border-b border-gray-300 pb-1 mb-2">{sharedTooltip.time}</div>
            {secondaryField && (
              <div className="mb-2">
                <span className="font-medium">{secondaryField.label}:</span> {sharedTooltip?.secondaryValue} {secondaryField.unit || ''}
              </div>
            )}
            <div className="space-y-1">
              {traces.map((trace) => {
                const displayValue = formatTraceValue(trace, dataPoint);
                return (
                  <div key={trace.parameter} className="flex justify-between items-center gap-2 w-full overflow-hidden">
                    <span
                      style={{ color: trace.color.code }}
                      className="font-medium flex-shrink overflow-hidden text-ellipsis pr-2 max-w-[93%] sm:max-w-[93%]"
                      title={trace.name || trace.parameter}
                    >
                      {trace.name || trace.parameter}:
                    </span>

                    <span className="flex-shrink-0 text-right whitespace-nowrap">
                      {displayValue}
                      {trace.unit?.symbol && ` ${trace.unit.symbol}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Also export as CostumeLineChart for backwards compatibility
export { TimeChart as CostumeLineChart };
export default TimeChart;
