import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type DistanceUnit,
  type EVExpense,
  type EVUnit,
  type FuelPriceUnit,
  type GasExpense,
  type GasUnit,
  calculateBreakEven,
  fromKWh100km,
  fromL100km,
  toKWh100km,
  toL100km,
} from "@/lib/calculator"
import * as Cronitor from "@cronitorio/cronitor-rum"
import {
  Calendar,
  CheckCircle2,
  Coins,
  Fuel,
  Globe,
  Heart,
  Info,
  TrendingUp,
  Zap,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { Label } from "@/components/ui/label"
import { AnimatePresence, motion } from "motion/react"
import { useLocalStorage } from "@uidotdev/usehooks"
import Expenses from "./components/expenses"
import { NumberInput } from "@/components/ui/number-input"
import { getNumberFormatParts } from "@/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { FaGithub } from "react-icons/fa"
import { ShareButton } from "@/components/share-button"
import { ImportAlert } from "@/components/import-alert"
import { Switch } from "@/components/ui/switch"
import TireDegradation from "@/components/tire-degradation"
import { EVPresetChip, type EVPreset } from "@/components/ev-preset-chip"

const EV_PRESETS: EVPreset[] = [
  {
    label: "BMW iX3 M50 xDrive (2026)",
    efficiencyWhPerKm: 178,
  },
  {
    label: "Tesla Model 3 RWD Highland",
    efficiencyWhPerKm: 135,
  },
  {
    label: "Fiat 500e 42kWh",
    efficiencyWhPerKm: 159,
  },
]

export default function App() {
  const isCronitorLoaded = useRef(false)

  useEffect(() => {
    if (import.meta.env.PROD && !isCronitorLoaded.current) {
      Cronitor.load("949c1af1c3c9b4b2922a1b73c7fcf84d", {
        debug: false,
        trackMode: "history",
      })
      isCronitorLoaded.current = true
    }
  }, [isCronitorLoaded])

  const [groupSeparator, decimalSeparator] = getNumberFormatParts()

  // Gas Vehicle State
  const [gasPrice, setGasPrice] = useLocalStorage("gasPrice", 30000)
  const [gasEfficiency, setGasEfficiency] = useLocalStorage("gasEfficiency", 25)
  const [gasEfficiencyUnit, setGasEfficiencyUnit] = useLocalStorage<GasUnit>(
    "gasEfficiencyUnit",
    "mpg (US)"
  )
  const [gasFuelPrice, setGasFuelPrice] = useLocalStorage("gasFuelPrice", 3.5)
  const [gasFuelPriceUnit, setGasFuelPriceUnit] =
    useLocalStorage<FuelPriceUnit>("gasFuelPriceUnit", "Per Gal (US)")
  const [gasExpenses, setGasExpenses] = useLocalStorage<GasExpense[]>(
    "gasExpenses",
    []
  )
  const [gasTireCost, setGasTireCost] = useLocalStorage("gasTireCost", 500)
  const [gasTireLifespan, setGasTireLifespan] = useLocalStorage(
    "gasTireLifespan",
    40000
  )

  // EV State
  const [evPrice, setEvPrice] = useLocalStorage("evPrice", 45000)
  const [evEfficiency, setEvEfficiency] = useLocalStorage("evEfficiency", 3.5)
  const [evEfficiencyUnit, setEvEfficiencyUnit] = useLocalStorage<EVUnit>(
    "evEfficiencyUnit",
    "mi/kWh"
  )
  const [elecPrice, setElecPrice] = useLocalStorage("elecPrice", 0.15)
  const [evExpenses, setEvExpenses] = useLocalStorage<EVExpense[]>(
    "evExpenses",
    []
  )
  const [evTireCost, setEvTireCost] = useLocalStorage("evTireCost", 500)
  const [evTireLifespan, setEvTireLifespan] = useLocalStorage(
    "evTireLifespan",
    30000
  )

  // General State
  const [annualDistance, setAnnualDistance] = useLocalStorage(
    "annualDistance",
    12000
  )
  const [distanceUnit, setDistanceUnit] = useLocalStorage<DistanceUnit>(
    "distanceUnit",
    "Miles"
  )
  const [currency, setCurrency] = useLocalStorage("currency", "$")

  const [showBreakdown, setShowBreakdown] = useState(false)

  const results = useMemo(() => {
    return calculateBreakEven({
      gasPrice,
      gasFuelPrice,
      gasEfficiency,
      gasEfficiencyUnit,
      gasFuelPriceUnit,
      gasExpenses,
      gasTireCost,
      gasTireLifespan,
      evPrice,
      evEfficiency,
      evEfficiencyUnit,
      elecPrice,
      evExpenses,
      evTireCost,
      evTireLifespan,
      annualDistance,
      distanceUnit,
    })
  }, [
    gasPrice,
    gasFuelPrice,
    gasEfficiency,
    gasEfficiencyUnit,
    gasFuelPriceUnit,
    gasExpenses,
    gasTireCost,
    gasTireLifespan,
    evPrice,
    evEfficiency,
    evEfficiencyUnit,
    elecPrice,
    evExpenses,
    evTireCost,
    evTireLifespan,
    annualDistance,
    distanceUnit,
  ])

  const handleGasEfficiencyUnitChange = (newUnit: GasUnit) => {
    const l100 = toL100km(gasEfficiency, gasEfficiencyUnit)
    const newVal = fromL100km(l100, newUnit)
    setGasEfficiency(Number(newVal.toFixed(2)))
    setGasEfficiencyUnit(newUnit)
  }

  const handleEvEfficiencyUnitChange = (newUnit: EVUnit) => {
    const kwh100 = toKWh100km(evEfficiency, evEfficiencyUnit)
    const newVal = fromKWh100km(kwh100, newUnit)
    setEvEfficiency(Number(newVal.toFixed(2)))
    setEvEfficiencyUnit(newUnit)
  }

  const handleGasFuelPriceUnitChange = (newUnit: FuelPriceUnit) => {
    const L_PER_GAL_US = 3.78541
    const L_PER_GAL_UK = 4.54609

    let pricePerL = gasFuelPrice
    if (gasFuelPriceUnit === "Per Gal (US)")
      pricePerL = gasFuelPrice / L_PER_GAL_US
    if (gasFuelPriceUnit === "Per Gal (UK)")
      pricePerL = gasFuelPrice / L_PER_GAL_UK

    let newPrice = pricePerL
    if (newUnit === "Per Gal (US)") newPrice = pricePerL * L_PER_GAL_US
    if (newUnit === "Per Gal (UK)") newPrice = pricePerL * L_PER_GAL_UK

    setGasFuelPrice(Number(newPrice.toFixed(2)))
    setGasFuelPriceUnit(newUnit)
  }

  const formatCurrency = (val: number) => {
    return `${currency}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  const formatDistance = (val: number) => {
    const unit = distanceUnit === "Miles" ? "mi" : "km"
    return `${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 font-sans text-foreground md:p-8">
        <main className="mx-auto max-w-6xl space-y-8">
          <ImportAlert />

          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="mr-auto">
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                <Zap className="h-8 w-8 text-green-600" />
                EV Break-Even Calculator
              </h1>
              <p className="mt-1 text-muted-foreground">
                Compare the long-term costs of switching to electric.
              </p>
            </div>

            <ShareButton
              params={{
                gasPrice,
                gasEfficiency,
                gasEfficiencyUnit,
                gasFuelPrice,
                gasFuelPriceUnit,
                gasExpenses,

                evPrice,
                evEfficiency,
                evEfficiencyUnit,
                elecPrice,
                evExpenses,

                annualDistance,
                distanceUnit,
                currency,
              }}
            />

            <div className="flex items-center gap-2 self-start rounded-lg border bg-white p-1 shadow-sm md:self-center">
              <Globe className="ml-2 h-4 w-4 text-slate-400" />
              <Select
                value={currency}
                onValueChange={(val) => val && setCurrency(val)}
              >
                <SelectTrigger className="w-24 border-none shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Currency</SelectLabel>
                    <SelectItem value="$">$ USD</SelectItem>
                    <SelectItem value="€">€ EUR</SelectItem>
                    <SelectItem value="£">£ GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="¥">¥ JPY</SelectItem>
                    <SelectItem value="₹">₹ INR</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Inputs Column */}
            <div className="space-y-6 lg:col-span-5">
              {/* Distance & General */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Usage Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Annual Distance</Label>
                      <NumberInput
                        min={0}
                        stepper={1000}
                        value={annualDistance}
                        onValueChange={(v) => v && setAnnualDistance(v)}
                        thousandSeparator={groupSeparator}
                        decimalSeparator={decimalSeparator}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={distanceUnit}
                        onValueChange={(v) =>
                          setDistanceUnit(v as DistanceUnit)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Distance Unit</SelectLabel>
                            <SelectItem value="Miles">Miles</SelectItem>
                            <SelectItem value="Kilometers">
                              Kilometers
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gas Vehicle */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fuel className="h-5 w-5 text-orange-500" />
                    Gas Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Purchase Price ({currency})</Label>
                    <NumberInput
                      min={0}
                      stepper={500}
                      value={gasPrice}
                      onValueChange={(v) => v && setGasPrice(v)}
                      thousandSeparator={groupSeparator}
                      decimalSeparator={decimalSeparator}
                      prefix={currency + ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Efficiency</Label>
                      <NumberInput
                        min={0}
                        stepper={0.1}
                        value={gasEfficiency}
                        onValueChange={(v) => v && setGasEfficiency(v)}
                        thousandSeparator={groupSeparator}
                        decimalSeparator={decimalSeparator}
                        decimalScale={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={gasEfficiencyUnit}
                        onValueChange={(v) =>
                          handleGasEfficiencyUnitChange(v as GasUnit)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Efficiency Unit</SelectLabel>
                            <SelectItem value="mpg (US)">mpg (US)</SelectItem>
                            <SelectItem value="mpg (UK)">mpg (UK)</SelectItem>
                            <SelectItem value="l/100km">l/100km</SelectItem>
                            <SelectItem value="km/l">km/l</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fuel Price</Label>
                      <NumberInput
                        min={0}
                        stepper={0.01}
                        value={gasFuelPrice}
                        onValueChange={(v) => v && setGasFuelPrice(v)}
                        thousandSeparator={groupSeparator}
                        decimalSeparator={decimalSeparator}
                        decimalScale={2}
                        prefix={currency + ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Unit</Label>
                      <Select
                        value={gasFuelPriceUnit}
                        onValueChange={(v) =>
                          handleGasFuelPriceUnitChange(v as FuelPriceUnit)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Price Unit</SelectLabel>
                            <SelectItem value="Per Liter">
                              {currency}/l
                            </SelectItem>
                            <SelectItem value="Per Gal (US)">
                              {currency}/gal (US)
                            </SelectItem>
                            <SelectItem value="Per Gal (UK)">
                              {currency}/gal (UK)
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Expenses
                    expenses={gasExpenses}
                    setExpenses={setGasExpenses}
                    defaultExpenseType="Maintenance"
                    expenseTypes={[
                      "Insurance",
                      "Taxes",
                      "Maintenance",
                      "Tires",
                      "Registration",
                      "Parking",
                      "Repairs",
                      "Depreciation",
                      "Other",
                    ]}
                  />
                  <TireDegradation
                    tireCost={gasTireCost}
                    setTireCost={setGasTireCost}
                    tireLifespan={gasTireLifespan}
                    setTireLifespan={setGasTireLifespan}
                  />
                </CardContent>
              </Card>

              {/* Electric Vehicle */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-green-500" />
                    Electric Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Purchase Price ({currency})</Label>
                    <NumberInput
                      min={0}
                      stepper={5000}
                      value={evPrice}
                      onValueChange={(v) => v && setEvPrice(v)}
                      thousandSeparator={groupSeparator}
                      decimalSeparator={decimalSeparator}
                      prefix={currency + ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Efficiency</Label>
                      <NumberInput
                        min={0}
                        stepper={5}
                        value={evEfficiency}
                        onValueChange={(v) => v && setEvEfficiency(v)}
                        thousandSeparator={groupSeparator}
                        decimalSeparator={decimalSeparator}
                        decimalScale={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={evEfficiencyUnit}
                        onValueChange={(v) =>
                          handleEvEfficiencyUnitChange(v as EVUnit)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Efficiency Unit</SelectLabel>
                            <SelectItem value="mi/kWh">mi/kWh</SelectItem>
                            <SelectItem value="km/kWh">km/kWh</SelectItem>
                            <SelectItem value="kWh/100km">kWh/100km</SelectItem>
                            <SelectItem value="Wh/km">Wh/km</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="text-muted-foreground">
                        Popular EVs
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {EV_PRESETS.map((preset) => (
                          <EVPresetChip
                            key={preset.label}
                            label={preset.label}
                            efficiencyWhPerKm={preset.efficiencyWhPerKm}
                            unit={evEfficiencyUnit}
                            onSelect={(value) =>
                              setEvEfficiency(Number(value.toFixed(2)))
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Electricity Price
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Average residential rate in your area
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <NumberInput
                      min={0}
                      stepper={0.01}
                      value={elecPrice}
                      onValueChange={(v) => v && setElecPrice(v)}
                      thousandSeparator={groupSeparator}
                      decimalSeparator={decimalSeparator}
                      decimalScale={2}
                      suffix={" " + currency + "/kWh"}
                    />
                  </div>
                  <Expenses
                    expenses={evExpenses}
                    setExpenses={setEvExpenses}
                    defaultExpenseType="Maintenance"
                    expenseTypes={[
                      "Insurance",
                      "Taxes",
                      "Maintenance",
                      "Tires",
                      "Registration",
                      "Charging Equipment",
                      "Public Charging Premium",
                      "Battery Degradation Reserve",
                      "Parking",
                      "Repairs",
                      "Depreciation",
                      "Software / Subscription",
                      "Other",
                    ]}
                  />
                  <TireDegradation
                    tireCost={evTireCost}
                    setTireCost={setEvTireCost}
                    tireLifespan={evTireLifespan}
                    setTireLifespan={setEvTireLifespan}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Results Column */}
            <div className="space-y-6 lg:col-span-7">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="overflow-hidden border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Annual Savings
                    </p>
                    <p className="font-mono text-2xl font-bold text-green-600">
                      <AnimatedNumber
                        value={results.savingsPerYear}
                        format={(v) => formatCurrency(v)}
                      />
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Compared to gas vehicle
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Break-Even Time
                    </p>
                    <p className="font-mono text-2xl font-bold text-blue-600">
                      {results.breakEvenYears === Infinity ? (
                        "Never"
                      ) : (
                        <AnimatedNumber
                          value={results.breakEvenYears}
                          format={(v) => `${v.toFixed(1)} Years`}
                        />
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Based on current usage
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Break-Even Distance
                    </p>
                    <p className="font-mono text-2xl font-bold text-orange-600">
                      {results.breakEvenDistance === Infinity ? (
                        "N/A"
                      ) : (
                        <AnimatedNumber
                          value={results.breakEvenDistance}
                          format={(v) => formatDistance(v)}
                        />
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Total mileage required
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Total Cost Over Time
                    </CardTitle>
                    <CardDescription>
                      Includes purchase price and cumulative fuel/energy costs.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="breakdown"
                      checked={showBreakdown}
                      onCheckedChange={setShowBreakdown}
                    />
                    <Label
                      htmlFor="breakdown"
                      className="text-sm text-muted-foreground"
                    >
                      Breakdown
                    </Label>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto overflow-y-hidden">
                  <div className="aspect-video min-w-175 md:min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={results.chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="year"
                          label={{
                            value: "Years",
                            position: "insideBottomRight",
                            offset: -10,
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `${currency}${value / 1000}k`
                          }
                          tick={{ fontSize: 12 }}
                        />

                        <Legend
                          formatter={(value) => {
                            if (value.includes("EV")) return `⚡ ${value}`
                            if (value.includes("Gas")) return `⛽ ${value}`
                            return value
                          }}
                        />

                        <RechartsTooltip
                          formatter={(value, name) => [
                            typeof value === "number" && formatCurrency(value),
                            typeof name === "string"
                              ? name.replace("Total", "").trim()
                              : name,
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />

                        <Line
                          name="Gas Total"
                          dataKey="gasTotal"
                          stroke="var(--color-destructive)"
                          strokeWidth={3}
                          dot={false}
                        />

                        <Line
                          name="EV Total"
                          dataKey="evTotal"
                          stroke="var(--color-primary)"
                          strokeWidth={3}
                          dot={false}
                        />

                        <AnimatePresence>
                          {showBreakdown && (
                            <motion.g
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {/* GAS */}
                              <Line
                                name="Gas Base (Purchase)"
                                dataKey="gasBase"
                                stroke="#fed7aa"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                dot={false}
                              />

                              <Line
                                name="Gas Fuel"
                                dataKey="gasEnergy"
                                stroke="#fb923c"
                                strokeWidth={2}
                                dot={false}
                              />

                              <Line
                                name="Gas Expenses"
                                dataKey="gasFixed"
                                stroke="#c2410c"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                              />

                              {/* EV */}
                              <Line
                                name="EV Base (Purchase)"
                                dataKey="evBase"
                                stroke="#bbf7d0"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                dot={false}
                              />

                              <Line
                                name="EV Electricity"
                                dataKey="evEnergy"
                                stroke="#4ade80"
                                strokeWidth={2}
                                dot={false}
                              />

                              <Line
                                name="EV Expenses"
                                dataKey="evFixed"
                                stroke="#15803d"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                              />
                            </motion.g>
                          )}
                        </AnimatePresence>

                        <ReferenceLine
                          x={results.breakEvenYears}
                          stroke="var(--color-primary)"
                          strokeDasharray="3 3"
                          label="Break-even"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Tip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-primary bg-primary/10 shadow-none">
                  <CardContent className="flex gap-4 p-6">
                    <div className="mt-1 h-fit rounded-full bg-primary p-2">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2 text-primary">
                      <h4 className="font-semibold">
                        Pro Tip: Maintenance Savings
                      </h4>
                      <p className="text-sm leading-relaxed">
                        Electric vehicles typically have much lower maintenance
                        costs. With fewer moving parts and regenerative braking,
                        you could reach your break-even point{" "}
                        <span className="font-bold">significantly faster</span>{" "}
                        than the fuel savings alone suggest.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5 text-yellow-600" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Price difference */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">
                        Initial Price Premium
                      </span>
                      <span className="font-mono font-medium text-destructive">
                        +{formatCurrency(results.priceDifference)}
                      </span>
                    </div>

                    {/* GAS */}
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-semibold">Gas Vehicle</p>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Fuel (annual)
                        </span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.gas.energy)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Ownership costs
                        </span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.gas.expenses)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.gas.total)}
                        </span>
                      </div>
                    </div>

                    {/* EV */}
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-semibold">Electric Vehicle</p>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Electricity (annual)
                        </span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.ev.energy)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Ownership costs
                        </span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.ev.expenses)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span className="font-mono">
                          {formatCurrency(results.breakdown.ev.total)}
                        </span>
                      </div>
                    </div>

                    {/* Savings */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="font-semibold">
                        Estimated Monthly Savings
                      </span>
                      <span className="font-mono font-bold text-green-600">
                        {formatCurrency(results.savingsPerYear / 12)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <footer className="mt-12 border border-t py-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            {/* Credit */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>by</span>

              <a
                href="https://reddit.com/u/Dan6erbond2"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-700 hover:underline"
              >
                u/Dan6erbond2
              </a>
            </div>

            {/* Revline (primary secondary action) */}
            <a
              href="https://revline.one/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-slate-800 transition-colors hover:text-black"
            >
              Revline — track, manage and understand your vehicles
            </a>

            {/* GitHub (tertiary) */}
            <a
              href="https://github.com/Dan6erbond/ev-break-even-calculator"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <FaGithub className="h-3 w-3" />
              View source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
