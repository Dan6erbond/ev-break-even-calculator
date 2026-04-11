export type GasUnit = "mpg (US)" | "mpg (UK)" | "l/100km" | "km/l"
export type EVUnit = "kWh/100km" | "Wh/km" | "km/kWh" | "mi/kWh"
export type DistanceUnit = "Miles" | "Kilometers"
export type FuelPriceUnit = "Per Liter" | "Per Gal (US)" | "Per Gal (UK)"

const KM_PER_MILE = 1.609344
const L_PER_GAL_US = 3.78541
const L_PER_GAL_UK = 4.54609

/**
 * Converts gas efficiency to L/100km
 */
export function toL100km(value: number, unit: GasUnit): number {
  if (value <= 0) return 0
  switch (unit) {
    case "mpg (US)":
      return 235.215 / value
    case "mpg (UK)":
      return 282.481 / value
    case "km/l":
      return 100 / value
    case "l/100km":
      return value
    default:
      return value
  }
}

/**
 * Converts L/100km to other gas units
 */
export function fromL100km(value: number, unit: GasUnit): number {
  if (value <= 0) return 0
  switch (unit) {
    case "mpg (US)":
      return 235.215 / value
    case "mpg (UK)":
      return 282.481 / value
    case "km/l":
      return 100 / value
    case "l/100km":
      return value
    default:
      return value
  }
}

/**
 * Converts EV efficiency to kWh/100km
 */
export function toKWh100km(value: number, unit: EVUnit): number {
  if (value <= 0) return 0
  switch (unit) {
    case "Wh/km":
      return value / 10
    case "km/kWh":
      return 100 / value
    case "mi/kWh":
      return 100 / value / KM_PER_MILE
    case "kWh/100km":
      return value
    default:
      return value
  }
}

/**
 * Converts kWh/100km to other EV units
 */
export function fromKWh100km(value: number, unit: EVUnit): number {
  if (value <= 0) return 0
  switch (unit) {
    case "Wh/km":
      return value * 10
    case "km/kWh":
      return 100 / value
    case "mi/kWh":
      return 100 / value / KM_PER_MILE
    case "kWh/100km":
      return value
    default:
      return value
  }
}

/**
 * Converts fuel price to Price per Liter
 */
export function toPricePerL(value: number, unit: FuelPriceUnit): number {
  switch (unit) {
    case "Per Gal (US)":
      return value / L_PER_GAL_US
    case "Per Gal (UK)":
      return value / L_PER_GAL_UK
    case "Per Liter":
      return value
    default:
      return value
  }
}

/**
 * Converts distance to KM
 */
export function toKM(value: number, unit: DistanceUnit): number {
  return unit === "Miles" ? value * KM_PER_MILE : value
}

export interface CalculationResult {
  gasCostPerYear: number
  evCostPerYear: number
  savingsPerYear: number
  priceDifference: number
  breakEvenDistance: number // in KM
  breakEvenYears: number
  chartData: {
    year: number
    gasTotal: number
    evTotal: number
  }[]
}

export function calculateBreakEven(params: {
  gasPrice: number
  gasFuelPrice: number
  gasEfficiency: number
  gasEfficiencyUnit: GasUnit
  gasFuelPriceUnit: FuelPriceUnit
  evPrice: number
  evEfficiency: number
  evEfficiencyUnit: EVUnit
  elecPrice: number // per kWh
  annualDistance: number
  distanceUnit: DistanceUnit
}): CalculationResult {
  const annualKM = toKM(params.annualDistance, params.distanceUnit)
  const gasL100km = toL100km(params.gasEfficiency, params.gasEfficiencyUnit)
  const gasPricePerL = toPricePerL(params.gasFuelPrice, params.gasFuelPriceUnit)
  const evKWh100km = toKWh100km(params.evEfficiency, params.evEfficiencyUnit)

  const gasCostPerKM = (gasL100km / 100) * gasPricePerL
  const evCostPerKM = (evKWh100km / 100) * params.elecPrice

  const gasCostPerYear = gasCostPerKM * annualKM
  const evCostPerYear = evCostPerKM * annualKM
  const savingsPerYear = gasCostPerYear - evCostPerYear
  const priceDifference = params.evPrice - params.gasPrice

  let breakEvenYears = Infinity
  let breakEvenDistance = Infinity

  if (savingsPerYear > 0) {
    breakEvenYears = priceDifference / savingsPerYear
    breakEvenDistance = breakEvenYears * annualKM
  }

  const chartData = []
  const maxYears = Math.max(10, Math.ceil(breakEvenYears * 1.5) || 10)
  const cappedMaxYears = Math.min(maxYears, 25)

  for (let i = 0; i <= cappedMaxYears; i++) {
    chartData.push({
      year: i,
      gasTotal: params.gasPrice + gasCostPerYear * i,
      evTotal: params.evPrice + evCostPerYear * i,
    })
  }

  return {
    gasCostPerYear,
    evCostPerYear,
    savingsPerYear,
    priceDifference,
    breakEvenDistance,
    breakEvenYears,
    chartData,
  }
}
