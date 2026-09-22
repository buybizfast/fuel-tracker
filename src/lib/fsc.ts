/**
 * Fuel Surcharge (FSC) & Intermodal (IML) Calculator
 *
 * Based on the DOE/EIA weekly U.S. national average on-highway diesel price.
 *
 * DISCLAIMER: These tables represent a generalized industry reference.
 * Actual fuel surcharges vary by carrier, contract, and negotiated terms.
 * Always confirm rates directly with your carrier or broker.
 */

// ── FSC (Linehaul) ────────────────────────────────────────────────────────────

export interface FscEntry {
  minPrice: number;
  maxPrice: number | null;
  /** Linehaul surcharge in dollars per mile */
  linehaulSurcharge: number;
}

const FSC_RAW: [number, number, number][] = [
  // [minPrice, maxPrice, $/mile]
  [1.200, 1.259, 0.01], [1.260, 1.319, 0.02], [1.320, 1.379, 0.03],
  [1.380, 1.439, 0.04], [1.440, 1.499, 0.05], [1.500, 1.559, 0.06],
  [1.560, 1.619, 0.07], [1.620, 1.679, 0.08], [1.680, 1.739, 0.09],
  [1.740, 1.799, 0.10], [1.800, 1.859, 0.11], [1.860, 1.919, 0.12],
  [1.920, 1.979, 0.13], [1.980, 2.039, 0.14], [2.040, 2.099, 0.15],
  [2.100, 2.159, 0.16], [2.160, 2.219, 0.17], [2.220, 2.279, 0.18],
  [2.280, 2.339, 0.19], [2.340, 2.399, 0.20], [2.400, 2.459, 0.21],
  [2.460, 2.519, 0.22], [2.520, 2.579, 0.23], [2.580, 2.639, 0.24],
  [2.640, 2.699, 0.25], [2.700, 2.759, 0.26], [2.760, 2.819, 0.27],
  [2.820, 2.879, 0.28], [2.880, 2.939, 0.29], [2.940, 2.999, 0.30],
  [3.000, 3.059, 0.31], [3.060, 3.119, 0.32], [3.120, 3.179, 0.33],
  [3.180, 3.239, 0.34], [3.240, 3.299, 0.35], [3.300, 3.359, 0.36],
  [3.360, 3.419, 0.37], [3.420, 3.479, 0.38], [3.480, 3.539, 0.39],
  [3.540, 3.599, 0.40], [3.600, 3.659, 0.41], [3.660, 3.719, 0.42],
  [3.720, 3.779, 0.43], [3.780, 3.839, 0.44], [3.840, 3.899, 0.45],
  [3.900, 3.959, 0.46], [3.960, 4.019, 0.47], [4.020, 4.079, 0.48],
  [4.080, 4.139, 0.49], [4.140, 4.199, 0.50], [4.200, 4.259, 0.51],
  [4.260, 4.319, 0.52], [4.320, 4.379, 0.53], [4.380, 4.439, 0.54],
  [4.440, 4.499, 0.55], [4.500, 4.559, 0.56], [4.560, 4.619, 0.57],
  [4.620, 4.679, 0.58], [4.680, 4.739, 0.59], [4.740, 4.799, 0.60],
  [4.800, 4.859, 0.61], [4.860, 4.919, 0.62], [4.920, 4.979, 0.63],
  [4.980, 5.039, 0.64], [5.040, 5.099, 0.65], [5.100, 5.159, 0.66],
  [5.160, 5.219, 0.67], [5.220, 5.279, 0.68], [5.280, 5.339, 0.69],
  [5.340, 5.399, 0.70], [5.400, 5.459, 0.71], [5.460, 5.519, 0.72],
  [5.520, 5.579, 0.73], [5.580, 5.639, 0.74], [5.640, 5.699, 0.75],
  [5.700, 5.759, 0.76], [5.760, 5.819, 0.77], [5.820, 5.879, 0.78],
  [5.880, 5.939, 0.79], [5.940, 5.999, 0.80], [6.000, 6.059, 0.81],
  [6.060, 6.119, 0.82], [6.120, 6.179, 0.83], [6.180, 6.239, 0.84],
  [6.240, 6.299, 0.85], [6.300, 6.359, 0.86], [6.360, 6.419, 0.87],
  [6.420, 6.479, 0.88], [6.480, 6.539, 0.89], [6.540, 6.599, 0.90],
  [6.600, 6.659, 0.91], [6.660, 6.719, 0.92],
];

export const FSC_TABLE: FscEntry[] = [
  { minPrice: 0,    maxPrice: 1.199, linehaulSurcharge: 0 },
  ...FSC_RAW.map(([min, max, s]) => ({ minPrice: min, maxPrice: max, linehaulSurcharge: s })),
  { minPrice: 6.72, maxPrice: null,  linehaulSurcharge: 0.93 },
];

export function getFscRate(pricePerGallon: number): FscEntry {
  const price = Math.round(pricePerGallon * 1000) / 1000;
  return (
    FSC_TABLE.find((e) => price >= e.minPrice && (e.maxPrice === null || price <= e.maxPrice)) ??
    FSC_TABLE[FSC_TABLE.length - 1]
  );
}

// Keep getRates as an alias for backward compatibility
export const getRates = getFscRate;

// ── IML (Intermodal) ──────────────────────────────────────────────────────────

export interface ImlEntry {
  minPrice: number;
  maxPrice: number | null;
  /** IML surcharge as a percentage (e.g. 55.0 = 55.0%) */
  imlPct: number;
}

const IML_RAW: [number, number, number][] = [
  // [minPrice, maxPrice, pct]
  [1.541, 1.580, 6.5],  [1.581, 1.620, 7.0],  [1.621, 1.660, 7.5],
  [1.661, 1.700, 8.0],  [1.701, 1.740, 8.5],  [1.741, 1.780, 9.0],
  [1.781, 1.820, 9.5],  [1.821, 1.860, 10.0], [1.861, 1.900, 10.5],
  [1.901, 1.940, 11.0], [1.941, 1.980, 11.5], [1.981, 2.020, 12.0],
  [2.021, 2.060, 12.5], [2.061, 2.100, 13.0], [2.101, 2.140, 13.5],
  [2.141, 2.180, 14.0], [2.181, 2.220, 14.5], [2.221, 2.260, 15.0],
  [2.261, 2.300, 15.5], [2.301, 2.340, 16.0], [2.341, 2.380, 16.5],
  [2.381, 2.420, 17.0], [2.421, 2.460, 17.5], [2.461, 2.500, 18.0],
  [2.501, 2.540, 18.5], [2.541, 2.580, 19.0], [2.581, 2.620, 19.5],
  [2.621, 2.660, 20.0], [2.661, 2.700, 20.5], [2.701, 2.740, 21.0],
  [2.741, 2.780, 21.5], [2.781, 2.820, 22.0], [2.821, 2.860, 22.5],
  [2.861, 2.900, 23.0], [2.901, 2.940, 23.5], [2.941, 2.980, 24.0],
  [2.981, 3.020, 24.5], [3.021, 3.060, 25.0], [3.061, 3.100, 25.5],
  [3.101, 3.140, 26.0], [3.141, 3.180, 26.5], [3.181, 3.220, 27.0],
  [3.221, 3.260, 27.5], [3.261, 3.300, 28.0], [3.301, 3.340, 28.5],
  [3.341, 3.380, 29.0], [3.381, 3.420, 29.5], [3.421, 3.460, 30.0],
  [3.461, 3.500, 30.5], [3.501, 3.540, 31.0], [3.541, 3.580, 31.5],
  [3.581, 3.620, 32.0], [3.621, 3.660, 32.5], [3.661, 3.700, 33.0],
  [3.701, 3.740, 33.5], [3.741, 3.780, 34.0], [3.781, 3.820, 34.5],
  [3.821, 3.860, 35.0], [3.861, 3.900, 35.5], [3.901, 3.940, 36.0],
  [3.941, 3.980, 36.5], [3.981, 4.020, 37.0], [4.021, 4.060, 37.5],
  [4.061, 4.100, 38.0], [4.101, 4.140, 38.5], [4.141, 4.180, 39.0],
  [4.181, 4.220, 39.5], [4.221, 4.260, 40.0], [4.261, 4.300, 40.5],
  [4.301, 4.340, 41.0], [4.341, 4.380, 41.5], [4.381, 4.420, 42.0],
  [4.421, 4.460, 42.5], [4.461, 4.500, 43.0], [4.501, 4.540, 43.5],
  [4.541, 4.580, 44.0], [4.581, 4.620, 44.5], [4.621, 4.660, 45.0],
  [4.661, 4.700, 45.5], [4.701, 4.740, 46.0], [4.741, 4.780, 46.5],
  [4.781, 4.820, 47.0], [4.821, 4.860, 47.5], [4.861, 4.900, 48.0],
  [4.901, 4.940, 48.5], [4.941, 4.980, 49.0], [4.981, 5.020, 49.5],
  [5.021, 5.060, 50.0], [5.061, 5.100, 50.5], [5.101, 5.140, 51.0],
  [5.141, 5.180, 51.5], [5.181, 5.220, 52.0], [5.221, 5.260, 52.5],
  [5.261, 5.300, 53.0], [5.301, 5.340, 53.5], [5.341, 5.380, 54.0],
  [5.381, 5.420, 54.5], [5.421, 5.460, 55.0], [5.461, 5.500, 55.5],
  [5.501, 5.540, 56.0], [5.541, 5.580, 56.5], [5.581, 5.620, 57.0],
  [5.621, 5.660, 57.5], [5.661, 5.700, 58.0], [5.701, 5.740, 58.5],
  [5.741, 5.780, 59.0], [5.781, 5.820, 59.5], [5.821, 5.860, 60.0],
  [5.861, 5.900, 60.5], [5.901, 5.940, 61.0], [5.941, 5.980, 61.5],
  [5.981, 6.020, 62.0], [6.021, 6.060, 62.5], [6.061, 6.100, 63.0],
  [6.101, 6.140, 63.5], [6.141, 6.180, 64.0], [6.181, 6.220, 64.5],
  [6.221, 6.260, 65.0], [6.261, 6.300, 65.5], [6.301, 6.340, 66.0],
  [6.341, 6.380, 66.5], [6.381, 6.420, 67.0], [6.421, 6.460, 67.5],
];

/** First band above the published IML table, in mils ($0.001) to avoid float drift. */
const IML_OPEN_MIN_MILS = 6461;
const IML_OPEN_PCT = 68.0;
/** Above the table, each additional $0.04 of fuel cost adds 0.5%. */
const IML_STEP_MILS = 40;
const IML_STEP_PCT = 0.5;

export const IML_TABLE: ImlEntry[] = [
  { minPrice: 0,    maxPrice: 1.540, imlPct: 0 },
  ...IML_RAW.map(([min, max, pct]) => ({ minPrice: min, maxPrice: max, imlPct: pct })),
  { minPrice: IML_OPEN_MIN_MILS / 1000, maxPrice: null, imlPct: IML_OPEN_PCT },
];

export function getImlRate(pricePerGallon: number): ImlEntry {
  const price = Math.round(pricePerGallon * 1000) / 1000;
  const mils = Math.round(price * 1000);

  if (mils >= IML_OPEN_MIN_MILS) {
    const steps = Math.floor((mils - IML_OPEN_MIN_MILS) / IML_STEP_MILS);
    const bandMin = IML_OPEN_MIN_MILS + steps * IML_STEP_MILS;
    return {
      minPrice: bandMin / 1000,
      maxPrice: (bandMin + IML_STEP_MILS - 1) / 1000,
      imlPct: IML_OPEN_PCT + steps * IML_STEP_PCT,
    };
  }

  return (
    IML_TABLE.find((e) => price >= e.minPrice && (e.maxPrice === null || price <= e.maxPrice)) ??
    IML_TABLE[IML_TABLE.length - 1]
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatSurcharge(val: number): string {
  return `$${val.toFixed(2)}/mi`;
}

export function formatIml(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "N/A";
  return `$${(Math.round(price * 1000) / 1000).toFixed(3)}`;
}

export function formatGasPrice(price: number | null | undefined): string {
  if (price == null) return "N/A";
  return `$${(Math.round(price * 100) / 100).toFixed(2)}`;
}

export function weeklyChange(current: number | null, prior: number | null): string {
  if (current == null || prior == null) return "";
  const diff = current - prior;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}$${diff.toFixed(3)}`;
}
