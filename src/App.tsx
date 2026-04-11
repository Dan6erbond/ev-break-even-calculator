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
  type EVUnit,
  type FuelPriceUnit,
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
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "motion/react"

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}

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

  // EV State
  const [evPrice, setEvPrice] = useLocalStorage("evPrice", 45000)
  const [evEfficiency, setEvEfficiency] = useLocalStorage("evEfficiency", 3.5)
  const [evEfficiencyUnit, setEvEfficiencyUnit] = useLocalStorage<EVUnit>(
    "evEfficiencyUnit",
    "mi/kWh"
  )
  const [elecPrice, setElecPrice] = useLocalStorage("elecPrice", 0.15)

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

  const results = useMemo(() => {
    return calculateBreakEven({
      gasPrice,
      gasFuelPrice,
      gasEfficiency,
      gasEfficiencyUnit,
      gasFuelPriceUnit,
      evPrice,
      evEfficiency,
      evEfficiencyUnit,
      elecPrice,
      annualDistance,
      distanceUnit,
    })
  }, [
    gasPrice,
    gasFuelPrice,
    gasEfficiency,
    gasEfficiencyUnit,
    gasFuelPriceUnit,
    evPrice,
    evEfficiency,
    evEfficiencyUnit,
    elecPrice,
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
      <div className="min-h-screen bg-slate-50/50 p-4 font-sans text-slate-900 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                <Zap className="h-8 w-8 text-green-600" />
                EV Break-Even Calculator
              </h1>
              <p className="mt-1 text-slate-500">
                Compare the long-term costs of switching to electric.
              </p>
            </div>
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
              <Card className="border-slate-200 shadow-sm">
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
                      <Input
                        type="number"
                        value={annualDistance}
                        onChange={(e) =>
                          setAnnualDistance(Number(e.target.value))
                        }
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
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fuel className="h-5 w-5 text-orange-500" />
                    Gas Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Purchase Price ({currency})</Label>
                    <Input
                      type="number"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Efficiency</Label>
                      <Input
                        type="number"
                        value={gasEfficiency}
                        onChange={(e) =>
                          setGasEfficiency(Number(e.target.value))
                        }
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
                      <Input
                        type="number"
                        value={gasFuelPrice}
                        onChange={(e) =>
                          setGasFuelPrice(Number(e.target.value))
                        }
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
                </CardContent>
              </Card>

              {/* Electric Vehicle */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-green-500" />
                    Electric Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Purchase Price ({currency})</Label>
                    <Input
                      type="number"
                      value={evPrice}
                      onChange={(e) => setEvPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Efficiency</Label>
                      <Input
                        type="number"
                        value={evEfficiency}
                        onChange={(e) =>
                          setEvEfficiency(Number(e.target.value))
                        }
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
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Electricity Price ({currency}/kWh)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Average residential rate in your area
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      value={elecPrice}
                      onChange={(e) => setElecPrice(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Column */}
            <div className="space-y-6 lg:col-span-7">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="overflow-hidden border-l-4 border-l-green-500 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Annual Savings
                    </p>
                    <p className="font-mono text-2xl font-bold text-green-600">
                      {formatCurrency(results.savingsPerYear)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Compared to gas vehicle
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-l-4 border-l-blue-500 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Break-Even Time
                    </p>
                    <p className="font-mono text-2xl font-bold text-blue-600">
                      {results.breakEvenYears === Infinity
                        ? "Never"
                        : `${results.breakEvenYears.toFixed(1)} Years`}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Based on current usage
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-l-4 border-l-orange-500 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Break-Even Distance
                    </p>
                    <p className="font-mono text-2xl font-bold text-orange-600">
                      {results.breakEvenDistance === Infinity
                        ? "N/A"
                        : formatDistance(results.breakEvenDistance)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Total mileage required
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Total Cost Over Time
                  </CardTitle>
                  <CardDescription>
                    Includes purchase price and cumulative fuel/energy costs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-87.5 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={results.chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                        <RechartsTooltip
                          formatter={(value) => [
                            typeof value === "number" && formatCurrency(value),
                            "",
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          name="Gas Vehicle"
                          type="monotone"
                          dataKey="gasTotal"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          name="Electric Vehicle"
                          type="monotone"
                          dataKey="evTotal"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
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
                <Card className="border-indigo-100 bg-indigo-50 shadow-none">
                  <CardContent className="flex gap-4 p-6">
                    <div className="mt-1 h-fit rounded-full bg-indigo-600 p-2">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-indigo-900">
                        Pro Tip: Maintenance Savings
                      </h4>
                      <p className="text-sm leading-relaxed text-indigo-800">
                        Electric vehicles typically have much lower maintenance
                        costs. With fewer moving parts and regenerative braking,
                        you could reach your break-even point{" "}
                        <span className="font-bold text-indigo-900">
                          significantly faster
                        </span>{" "}
                        than the fuel savings alone suggest.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Breakdown */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5 text-yellow-600" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-bottom flex items-center justify-between py-2">
                      <span className="text-slate-600">
                        Initial Price Premium
                      </span>
                      <span className="font-mono font-medium text-red-600">
                        +{formatCurrency(results.priceDifference)}
                      </span>
                    </div>
                    <div className="border-bottom flex items-center justify-between py-2">
                      <span className="text-slate-600">Gas Cost (Annual)</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(results.gasCostPerYear)}
                      </span>
                    </div>
                    <div className="border-bottom flex items-center justify-between py-2">
                      <span className="text-slate-600">
                        Electricity Cost (Annual)
                      </span>
                      <span className="font-mono font-medium">
                        {formatCurrency(results.evCostPerYear)}
                      </span>
                    </div>
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
        </div>
      </div>
    </TooltipProvider>
  )
}
