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
import CostumeLineChartContext from './CostumeLineChartContext';

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
 * CostumeLineChart - A high-performance canvas-based line chart component
 * 
 * @param {Object} props
 * @param {Array} props.receivedData - Array of data points with received_at timestamp
 * @param {Array} props.traces - Array of trace configurations
 * @param {Object} props.workerMinMaxListScaled - Pre-calculated min/max values per trace
 * @param {Function} props.funcPromises - Callback when visible range changes
 * @param {boolean} props.isDarkMode - Theme mode (default: false)
 * @param {Function} props.convertToCurrentUnit - Unit conversion function
 * @param {Object} props.theme - Custom theme colors
 * @param {boolean} props.hasTooltip - Enable tooltip (default: true)
 * @param {boolean} props.hasZoom - Enable zoom interactions (default: true)
 * @param {boolean} props.isReportChart - Static mode, no interactions (default: false)
 * @param {boolean} props.focusMode - Focus mode styling
 * @param {boolean} props.inLiveMode - Auto-scroll to latest data
 * @param {boolean} props.shouldDrawTimeLines - Draw time labels on left
 * @param {boolean} props.fixedTopZoom - Anchor zoom at top
 * @param {boolean} props.fixedBottomZoom - Anchor zoom at bottom
 * @param {Array} props.annotations - Chart annotations
 * @param {Array} props.timesList - Time markers for horizontal lines
 * @param {string} props.chartNum - Chart identifier
 * @param {string} props.receivedDataLastHistoricaldate - Last historical data timestamp
 */
const CostumeLineChart = ({
  funcPromises,
  traces,
  receivedData,
  workerMinMaxListScaled,
  hasTooltip = true,
  hasZoom = true,
  isReportChart = false,
  focusMode = false,
  annotations = [],
  timesList = [],
  chartNum = '',
  receivedDataLastHistoricaldate,
  inLiveMode = false,
  shouldDrawTimeLines = false,
  fixedTopZoom = false,
  fixedBottomZoom = false,
  // NEW PROPS - externalized from hooks
  isDarkMode = false,
  convertToCurrentUnit = defaultConvertToCurrentUnit,
  theme = null,
}) => {
  // Merge custom theme with defaults
  const activeTheme = useMemo(() => {
    const base = isDarkMode ? defaultTheme.dark : defaultTheme.light;
    return theme ? { ...base, ...theme } : base;
  }, [isDarkMode, theme]);

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

  const { sharedZoom, setSharedZoom, sharedTooltip, setSharedTooltip } = useContext(CostumeLineChartContext);

  const [visibleDataRange, setVisibleDataRange] = useState(() => {
    if (!receivedData || receivedData.length === 0) return [0, 0];
    return [0, Math.max(0, receivedData.length - 1)];
  });

  const [zoomLevel, setZoomLevel] = useState(100);

  const getEstimatedTooltipHeight = useCallback((rowsCount = 0) => {
    const headerAndDepth = 56;
    const perRow = 16;
    const basePadding = 20;
    return headerAndDepth + rowsCount * perRow + basePadding;
  }, []);

  const visibleData = useMemo(() => {
    if (!receivedData || receivedData.length === 0) return [];
    const [start, end] = visibleDataRange;
    const safeStart = Math.max(0, Math.min(start, receivedData.length - 1));
    const safeEnd = Math.max(safeStart, Math.min(end, receivedData.length - 1));
    return receivedData.slice(safeStart, safeEnd + 1);
  }, [receivedData, visibleDataRange]);

  const currentIndex = sharedTooltip?.originalIndex;
  const dataPoint = receivedData && receivedData[currentIndex] ? receivedData[currentIndex] : null;

  useEffect(() => {
    if (receivedData && receivedData.length > 0) {
      setVisibleDataRange((prev) => {
        const newLength = receivedData.length;
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
  }, [receivedData?.length]);

  useEffect(() => {
    if (!isReportChart && sharedZoom && Array.isArray(sharedZoom) && sharedZoom.length === 2) {
      const [start, end] = sharedZoom;
      if (receivedData && receivedData.length > 0) {
        const safeStart = Math.max(0, Math.min(start, receivedData.length - 1));
        const safeEnd = Math.max(safeStart, Math.min(end, receivedData.length - 1));
        setVisibleDataRange([safeStart, safeEnd]);
      }
    }
  }, [sharedZoom, isReportChart, receivedData?.length]);

  useEffect(() => {
    if (!receivedData?.length) return;
    if (manualZoomRef.current) {
      manualZoomRef.current = false;
      return;
    }
    const totalDataPoints = receivedData.length;
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
      setSharedZoom([newStart, newEnd]);
      return;
    }

    const center = Math.floor((curStart + curEnd) / 2);
    const newStart = Math.max(0, center - Math.floor(visiblePoints / 2));
    const newEnd = Math.min(totalDataPoints - 1, newStart + visiblePoints - 1);
    setVisibleDataRange([newStart, newEnd]);
    setSharedZoom([newStart, newEnd]);
  }, [zoomLevel, receivedData?.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !receivedData?.length) return;

    const traceContainerHeight = document.getElementsByClassName('containerButtonTraces')?.[0]?.clientHeight;
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
    const data = visibleData;
    drawStaticChart(offscreenCtx, data, traces, annotations, width);
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    drawDynamicChart(ctx, data);
  }, [
    visibleDataRange,
    receivedData,
    traces,
    annotations,
    workerMinMaxListScaled,
    focusMode,
    shouldDrawTimeLines,
    timesList,
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
      if (!receivedData || receivedData.length === 0) return;

      const totalDataPoints = receivedData.length;
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

      if (inLiveMode && anchorGlobalIndex == null) {
        const newStart = Math.max(0, totalDataPoints - visiblePoints);
        const newEnd = totalDataPoints - 1;
        setVisibleDataRange([newStart, newEnd]);
        setSharedZoom([newStart, newEnd]);
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
      setSharedZoom([newStart, newEnd]);

      if (funcPromises && receivedData[newStart] && receivedData[newEnd]) {
        const firstVisibleDatetime = dayjs(receivedData[newStart].received_at)
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        const lastVisibleDatetime = dayjs(receivedData[newEnd].received_at)
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        funcPromises({ firstVisibleDatetime, lastVisibleDatetime });
      }
    },
    [receivedData, visibleDataRange, inLiveMode, setSharedZoom, funcPromises]
  );

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (isReportChart || !receivedData?.length) return;

      if (event.shiftKey) {
        const delta = Math.sign(event.deltaY) * 5;
        setVisibleDataRange((prevRange) => {
          const [start, end] = prevRange;
          const rangeSize = end - start;
          let newStart = start - delta;
          let newEnd = end - delta;

          if (newStart < 0) {
            newStart = 0;
            newEnd = Math.min(receivedData.length - 1, rangeSize);
          }
          if (newEnd >= receivedData.length) {
            newEnd = receivedData.length - 1;
            newStart = Math.max(0, newEnd - rangeSize);
          }

          if (newEnd - newStart < 10) {
            if (delta > 0) newEnd = Math.min(receivedData.length - 1, newStart + 10);
            else newStart = Math.max(0, newEnd - 10);
          }

          setSharedZoom([newStart, newEnd]);

          if (funcPromises && receivedData[newStart] && receivedData[newEnd]) {
            const firstVisibleDatetime = dayjs(receivedData[newStart].received_at)
              .tz(dayjs.tz.guess())
              .format('YYYY-MM-DDTHH:mm:ssZ');
            const lastVisibleDatetime = dayjs(receivedData[newEnd].received_at)
              .tz(dayjs.tz.guess())
              .format('YYYY-MM-DDTHH:mm:ssZ');
            funcPromises({ firstVisibleDatetime, lastVisibleDatetime });
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
    [updateZoom, zoomLevel, isReportChart, receivedData, setSharedZoom, context, visibleDataRange, funcPromises, fixedTopZoom, fixedBottomZoom]
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
      let rawMin;
      let rawMax;
      const domain = _.find(workerMinMaxListScaled?.minAndMaxList, (item) => item?.[trace.parameter]);
      if (domain && domain[trace.parameter]) {
        rawMin = parseFloat(domain[trace.parameter].min);
        rawMax = parseFloat(domain[trace.parameter].max);
      } else {
        rawMin = Math.min(...data.map((d) => parseFloat(d[trace.parameter]) || 0));
        rawMax = Math.max(...data.map((d) => parseFloat(d[trace.parameter]) || 0));
      }
      if (!Number.isFinite(rawMin)) rawMin = 0;
      if (!Number.isFinite(rawMax)) rawMax = rawMin + 1;
      if (rawMin === rawMax) rawMax = rawMin + 1;

      const pad = 0;
      const xMin = minGraph(rawMin - pad);
      let xMax = maxGraph(rawMax + pad);
      if (xMin >= xMax) xMax = maxGraph(xMin + 1);

      const xScale = plotWidth / (xMax - xMin || 1);
      const yScale = plotHeight / (data.length - 1 || 1);

      const ts = data.map((p) => dayjs(p.received_at).valueOf());
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

    if (shouldDrawTimeLines) {
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
          const timeLabel = dayjs(data[index].received_at).format('HH:mm:ss');

          ctx.fillStyle = activeTheme.textColor;
          ctx.fillText(timeLabel, 5, y + 3);
        }
      }
    }

    if (shouldDrawTimeLines) {
      drawTimelines(ctx, data, padding, plotWidth, timesList);
    }
    drawAnnotations(ctx, data, padding, plotHeight, annotations);
    if (inLiveMode) drawHistoricalLine(ctx, data, padding, plotWidth, plotHeight);
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

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, yValue);
    ctx.lineTo(plotWidth + padding, yValue);
    ctx.stroke();

    traces.forEach((trace) => {
      let rawMin;
      let rawMax;
      const domain = _.find(workerMinMaxListScaled?.minAndMaxList, (item) => item?.[trace.parameter]);
      if (domain && domain[trace.parameter]) {
        rawMin = parseFloat(domain[trace.parameter].min);
        rawMax = parseFloat(domain[trace.parameter].max);
      } else {
        rawMin = Math.min(...data.map((d) => parseFloat(d[trace.parameter]) || 0));
        rawMax = Math.max(...data.map((d) => parseFloat(d[trace.parameter]) || 0));
      }
      if (!Number.isFinite(rawMin)) rawMin = 0;
      if (!Number.isFinite(rawMax)) rawMax = rawMin + 1;
      if (rawMin === rawMax) rawMax = rawMin + 1;

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
    ctx.strokeStyle = activeTheme.gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 1]);
    const H_SQUARES = 10;
    const verticalLineSpacing = plotWidth / H_SQUARES;
    for (let i = 0; i <= H_SQUARES; i++) {
      const x = Math.round(padding + i * verticalLineSpacing) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, Math.round(padding) + 0.5);
      ctx.lineTo(x, Math.round(plotHeight + padding) + 0.5);
      ctx.stroke();
    }
    const horizontalLineSpacing = verticalLineSpacing;
    const numHorizontalSquares = Math.floor(plotHeight / horizontalLineSpacing);
    for (let i = 0; i <= numHorizontalSquares; i++) {
      const y = Math.round(padding + i * horizontalLineSpacing) + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.round(padding) + 0.5, y);
      ctx.lineTo(Math.round(plotWidth + padding) + 0.5, y);
      ctx.stroke();
    }
    const bottomYExact = Math.round(padding + plotHeight) + 0.5;
    const lastDrawnY = Math.round(padding + numHorizontalSquares * horizontalLineSpacing) + 0.5;
    if (Math.abs(bottomYExact - lastDrawnY) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(Math.round(padding) + 0.5, bottomYExact);
      ctx.lineTo(Math.round(plotWidth + padding) + 0.5, bottomYExact);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  };

  const drawHistoricalLine = (ctx, data, padding, plotWidth, plotHeight) => {
    if (!receivedDataLastHistoricaldate) return;
    const index = data.findIndex((d) => d.received_at === receivedDataLastHistoricaldate);
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
      if (chartNum === 'chart_1') ctx.fillText(label, padding + 4, labelYPosition);
    });
  };

  const drawAnnotations = (ctx, data, padding, plotHeight, annotations) => {
    if (!annotations || !annotations.length || !data.length || !ctx || !receivedData?.length) return;

    const relevantAnnotations = annotations.filter((annotation) => {
      if (annotation?.chart && annotation.chart.length > 1 && annotation.chart !== chartNum) return false;
      return true;
    });

    if (!relevantAnnotations.length) return;

    const globalTimes = receivedData.map((d) => dayjs(d.received_at).valueOf());

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

      if (!isReportChart) {
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

  const handleMouseMove = useCallback(
    _.throttle((event) => {
      if (!context || !receivedData?.length || isReportChart) return;

      const { offsetX, offsetY } = event.nativeEvent;
      const dpr = window.devicePixelRatio || 1;
      const canvasHeight = context.canvas.height / dpr;
      const canvasWidth = context.canvas.width / dpr;
      const padding = 5;
      const plotHeight = canvasHeight - padding * 2;
      const plotWidth = canvasWidth - padding * 2;

      if (offsetX < padding || offsetX > plotWidth + padding || offsetY < padding || offsetY > plotHeight + padding) {
        setSharedTooltip(null);
        return;
      }

      const relativeY = offsetY - padding;
      const normalizedY = relativeY / plotHeight;
      const dataIndex = Math.round(normalizedY * (visibleData.length - 1));
      const boundedIndex = Math.max(0, Math.min(dataIndex, visibleData.length - 1));

      const dataPoint = visibleData[boundedIndex];
      const originalIndex = visibleDataRange[0] + boundedIndex;

      if (!dataPoint) return;

      const tooltipContent = traces.map((trace) => ({
        name: trace.name,
        value: formatTraceValue(trace, dataPoint),
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
      setSharedTooltip({
        originalIndex,
        x: tooltipX,
        y: tooltipY,
        time: dayjs(dataPoint.received_at).format('MMM DD HH:mm:ss'),
        depth: typeof dataPoint.depth === 'number' ? dataPoint.depth.toFixed(2) : dataPoint.depth || 'N/A',
        content: tooltipContent,
        mouseX: offsetX,
        mouseY: offsetY,
        isInLowerHalf,
      });

      setLocalTooltipData(tooltipContent);
    }, 16),
    [context, receivedData, visibleDataRange, visibleData, traces, isReportChart, setSharedTooltip, getEstimatedTooltipHeight]
  );

  useEffect(() => {
    if (
      !sharedTooltip ||
      !sharedTooltip.mouseX ||
      !sharedTooltip.mouseY ||
      !context ||
      !receivedData?.length ||
      isReportChart
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

    const dataPoint = visibleData[boundedIndex];
    const originalIndex = visibleDataRange[0] + boundedIndex;

    if (!dataPoint) return;

    const tooltipContent = traces.map((trace) => ({
      name: trace.name,
      value: formatTraceValue(trace, dataPoint),
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
    setSharedTooltip((prevTooltip) => ({
      ...prevTooltip,
      originalIndex,
      x: tooltipX,
      y: tooltipY,
      time: dayjs(dataPoint.received_at).format('MMM DD HH:mm:ss'),
      depth: typeof dataPoint.depth === 'number' ? dataPoint.depth.toFixed(2) : dataPoint.depth || 'N/A',
      content: tooltipContent,
      isInLowerHalf,
    }));

    setLocalTooltipData(tooltipContent);
  }, [
    receivedData,
    visibleData,
    traces,
    context,
    sharedTooltip?.mouseX,
    sharedTooltip?.mouseY,
    visibleDataRange,
    isReportChart,
    setSharedTooltip,
    getEstimatedTooltipHeight,
  ]);

  const handleMouseLeave = useCallback(() => {
    setSharedTooltip(null);
    setLocalTooltipData(null);
  }, [setSharedTooltip]);

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

    const padding = 8;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;

    const nextLeft = Math.max(padding, Math.min(sharedTooltip.x || 10, containerWidth - tooltipWidth - padding));
    const nextTop = Math.max(padding, Math.min(sharedTooltip.y || 10, containerHeight - tooltipHeight - padding));

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
    if (isPanning && funcPromises && receivedData?.length) {
      const [start, end] = sharedZoom || visibleDataRange;
      if (receivedData[start] && receivedData[end]) {
        const firstVisibleDatetime = dayjs(receivedData[start].received_at)
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        const lastVisibleDatetime = dayjs(receivedData[end].received_at)
          .tz(dayjs.tz.guess())
          .format('YYYY-MM-DDTHH:mm:ssZ');
        funcPromises({ firstVisibleDatetime, lastVisibleDatetime });
      }
    }
    setIsPanning(false);
  }, [isPanning, funcPromises, receivedData, sharedZoom, visibleDataRange]);

  const handleMouseMovePan = useCallback(
    _.debounce((event) => {
      if (!isPanning || isReportChart || !receivedData?.length) return;

      const { offsetY } = event.nativeEvent;
      const delta = offsetY - startPan;

      if (Math.abs(delta) <= 3) return;

      const sensitivity = Math.max(1, Math.floor(receivedData.length / 1000));
      const moveBy = Math.floor(delta / (15 / sensitivity));

      setStartPan(offsetY);

      setVisibleDataRange((prevRange) => {
        const [start, end] = prevRange;
        const rangeSize = end - start;
        let newStart = start - moveBy;
        let newEnd = end - moveBy;

        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(receivedData.length - 1, rangeSize);
        }
        if (newEnd >= receivedData.length) {
          newEnd = receivedData.length - 1;
          newStart = Math.max(0, newEnd - rangeSize);
        }

        if (newEnd - newStart < 10) {
          const adjustment = 10 - (newEnd - newStart);
          if (moveBy > 0) {
            newEnd = Math.min(receivedData.length - 1, newEnd + adjustment);
          } else {
            newStart = Math.max(0, newStart - adjustment);
          }
        }

        setSharedZoom([newStart, newEnd]);

        if (receivedData[newStart] && receivedData[newEnd] && funcPromises) {
          const firstVisibleDatetime = dayjs(receivedData[newStart].received_at)
            .tz(dayjs.tz.guess())
            .format('YYYY-MM-DDTHH:mm:ssZ');
          const lastVisibleDatetime = dayjs(receivedData[newEnd].received_at)
            .tz(dayjs.tz.guess())
            .format('YYYY-MM-DDTHH:mm:ssZ');

          funcPromises({ firstVisibleDatetime, lastVisibleDatetime });
        }

        return [newStart, newEnd];
      });
    }, 30),
    [isPanning, startPan, receivedData, isReportChart, setSharedZoom, funcPromises]
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
    const baseClass = 'costume-chart-tooltip';
    const themeClass = isDarkMode ? '' : 'tooltip-light';
    const positionClass = sharedTooltip?.isInLowerHalf ? 'tooltip-fixed-top' : 'tooltip-fixed-bottom';

    return [baseClass, themeClass, positionClass].filter(Boolean).join(' ');
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
        className="costume-chart-container flex-1"
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
        <canvas ref={canvasRef} className="costume-chart-canvas" style={{ width: '100%', height: '100%' }} />
        {hasTooltip && sharedTooltip && dataPoint && (
          <div ref={tooltipRef} className={tooltipClasses} data-theme={isDarkMode ? 'dark' : 'light'} style={tooltipStyles}>
            <div className="font-semibold border-b border-gray-300 pb-1 mb-2">{sharedTooltip.time}</div>
            <div className="mb-2">
              <span className="font-medium">Depth:</span> {Number(sharedTooltip?.depth)?.toFixed(4)} m
            </div>
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

export default CostumeLineChart;
