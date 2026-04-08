import React, { createContext, useState } from 'react';

/**
 * Context for synchronizing zoom, pan, and tooltip state across multiple charts.
 * Wrap your charts with ChartProvider to enable multi-chart sync.
 */
const ChartContext = createContext(null);

/**
 * Provider component that enables shared state between multiple TimeChart instances.
 * 
 * @example
 * <ChartProvider>
 *   <TimeChart {...chart1Props} />
 *   <TimeChart {...chart2Props} />
 * </ChartProvider>
 */
export const ChartProvider = ({ children }) => {
  // Initialize to null - each chart will set its own full range on mount
  const [sharedZoom, setSharedZoom] = useState(null);
  const [sharedTooltip, setSharedTooltip] = useState(null);
  const [sharedPan, setSharedPan] = useState(0);

  return (
    <ChartContext.Provider
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
    </ChartContext.Provider>
  );
};

// Also export as CostumeLineChartContext for backwards compatibility
export { ChartContext as CostumeLineChartContext };
export default ChartContext;
