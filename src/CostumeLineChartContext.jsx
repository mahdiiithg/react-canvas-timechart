import React, { createContext, useState } from 'react';

/**
 * Context for synchronizing zoom, pan, and tooltip state across multiple charts.
 * Wrap your charts with ChartProvider to enable multi-chart sync.
 */
const CostumeLineChartContext = createContext(null);

/**
 * Provider component that enables shared state between multiple CostumeLineChart instances.
 * 
 * @example
 * <ChartProvider>
 *   <CostumeLineChart {...chart1Props} />
 *   <CostumeLineChart {...chart2Props} />
 * </ChartProvider>
 */
export const ChartProvider = ({ children }) => {
  // Initialize to null - each chart will set its own full range on mount
  const [sharedZoom, setSharedZoom] = useState(null);
  const [sharedTooltip, setSharedTooltip] = useState(null);
  const [sharedPan, setSharedPan] = useState(0);

  return (
    <CostumeLineChartContext.Provider
      value={{
        sharedZoom,
        setSharedZoom,
        sharedTooltip,
        setSharedTooltip,
        sharedPan,
        setSharedPan,
      }}
    >
      {children}
    </CostumeLineChartContext.Provider>
  );
};

export default CostumeLineChartContext;
