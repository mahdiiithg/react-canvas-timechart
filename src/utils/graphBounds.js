/**
 * Calculate a "nice" maximum value for chart axis bounds.
 * Rounds up to the nearest significant digit boundary.
 * 
 * @example
 * maxGraph(347)  // → 400
 * maxGraph(2847) // → 3000
 * maxGraph(5)    // → 10
 * 
 * @param {number} max - The raw maximum value
 * @returns {number} A rounded-up "nice" maximum (minimum 10)
 */
export const maxGraph = (max) => Math.max(
  Math.ceil(Number(max) / 10 ** (parseInt(Number(max), 10).toString().length - 1)) *
    10 ** (parseInt(Number(max), 10).toString().length - 1),
  10
);

/**
 * Calculate a "nice" minimum value for chart axis bounds.
 * Rounds down to the nearest significant digit boundary.
 * 
 * @example
 * minGraph(347)  // → 340
 * minGraph(2847) // → 2800
 * minGraph(-50)  // → -50
 * 
 * @param {number} min - The raw minimum value
 * @returns {number} A rounded-down "nice" minimum (maximum 0)
 */
export const minGraph = (min) => Math.min(
  Math.floor(Number(min) / 10 ** (parseInt(Number(min), 10).toString().length - 2)) *
    10 ** (parseInt(Number(min), 10).toString().length - 2),
  0
);
