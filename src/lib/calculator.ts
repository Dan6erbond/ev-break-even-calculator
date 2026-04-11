export type GasUnit = "mpg (US)" | "mpg (UK)" | "l/100km" | "km/l"
export type EVUnit = "kWh/100km" | "Wh/km" | "km/kWh" | "mi/kWh"
export type DistanceUnit = "Miles" | "Kilometers"
export type FuelPriceUnit = "Per Liter" | "Per Gal (US)" | "Per Gal (UK)"

const KM_PER_MILE = 1.609344
const L_PER_GAL_US = 3.78541
const L_PER_GAL_UK = 4.54609

export type GasExpenseType =
  | "Insurance"
  | "Taxes"
  | "Maintenance"
  | "Tires"
  | "Registration"
  | "Parking"
  | "Repairs"
  | "Depreciation"
  | "Other"

export interface GasExpense {
  type: GasExpenseType
  amount: number // per year
}

export type EVExpenseType =
  | "Insurance"
  | "Taxes"
  | "Maintenance"
  | "Tires"
  | "Registration"
  | "Charging Equipment"
  | "Public Charging Premium"
  | "Battery Degradation Reserve"
  | "Parking"
  | "Repairs"
  | "Depreciation"
  | "Software / Subscription"
  | "Other"

export interface EVExpense {
  type: EVExpenseType
  amount: number // per year
}

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
  gasExpenses: GasExpense[]
  evPrice: number
  evEfficiency: number
  evEfficiencyUnit: EVUnit
  elecPrice: number // per kWh
  evExpenses: EVExpense[]
  annualDistance: number
  distanceUnit: DistanceUnit
}): CalculationResult {
  const annualKM = toKM(params.annualDistance, params.distanceUnit)
  const gasL100km = toL100km(params.gasEfficiency, params.gasEfficiencyUnit)
  const gasPricePerL = toPricePerL(params.gasFuelPrice, params.gasFuelPriceUnit)
  const evKWh100km = toKWh100km(params.evEfficiency, params.evEfficiencyUnit)

  const gasCostPerKM = (gasL100km / 100) * gasPricePerL
  const evCostPerKM = (evKWh100km / 100) * params.elecPrice

  const gasEnergyPerYear = gasCostPerKM * annualKM
  const totalGasExpensesPerYear = params.gasExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  )
  const gasFixedPerYear = totalGasExpensesPerYear

  const evEnergyPerYear = evCostPerKM * annualKM
  const totalEvExpensesPerYear = params.evExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  )
  const evFixedPerYear = totalEvExpensesPerYear

  const savingsPerYear = gasFixedPerYear - evFixedPerYear
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

      gasBase: params.gasPrice,
      gasEnergy: gasEnergyPerYear * i,
      gasFixed: gasFixedPerYear * i,
      gasTotal: params.gasPrice + gasEnergyPerYear * i + gasFixedPerYear * i,

      evBase: params.evPrice,
      evEnergy: evEnergyPerYear * i,
      evFixed: evFixedPerYear * i,
      evTotal: params.evPrice + evEnergyPerYear * i + evFixedPerYear * i,
    })
  }

  return {
    gasCostPerYear: gasFixedPerYear,
    evCostPerYear: evFixedPerYear,
    savingsPerYear,
    priceDifference,
    breakEvenDistance,
    breakEvenYears,
    chartData,
  }
}
