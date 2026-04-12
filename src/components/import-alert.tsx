"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2Icon, InfoIcon } from "lucide-react"
import type {
  DistanceUnit,
  EVExpense,
  EVUnit,
  FuelPriceUnit,
  GasExpense,
  GasUnit,
} from "@/lib/calculator"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@uidotdev/usehooks"

export function ImportAlert() {
  const [visible, setVisible] = useState(false)
  const [imported, setImported] = useState(false)

  // gas
  const [, setGasPrice] = useLocalStorage("gasPrice", 30000)
  const [, setGasEfficiency] = useLocalStorage("gasEfficiency", 25)
  const [, setGasEfficiencyUnit] = useLocalStorage<GasUnit>(
    "gasEfficiencyUnit",
    "mpg (US)"
  )
  const [, setGasFuelPrice] = useLocalStorage("gasFuelPrice", 3.5)
  const [, setGasFuelPriceUnit] = useLocalStorage<FuelPriceUnit>(
    "gasFuelPriceUnit",
    "Per Gal (US)"
  )
  const [, setGasExpenses] = useLocalStorage<GasExpense[]>("gasExpenses", [])

  // ev
  const [, setEvPrice] = useLocalStorage("evPrice", 45000)
  const [, setEvEfficiency] = useLocalStorage("evEfficiency", 3.5)
  const [, setEvEfficiencyUnit] = useLocalStorage<EVUnit>(
    "evEfficiencyUnit",
    "mi/kWh"
  )
  const [, setElecPrice] = useLocalStorage("elecPrice", 0.15)
  const [, setEvExpenses] = useLocalStorage<EVExpense[]>("evExpenses", [])

  // general
  const [, setAnnualDistance] = useLocalStorage("annualDistance", 12000)
  const [, setDistanceUnit] = useLocalStorage<DistanceUnit>(
    "distanceUnit",
    "Miles"
  )
  const [, setCurrency] = useLocalStorage("currency", "$")

  const params = useMemo(() => {
    if (typeof window === "undefined") return null
    const url = new URL(window.location.href)
    return url.searchParams
  }, [])

  useEffect(() => {
    if (!params) return

    // detect if any relevant param exists
    const hasParams =
      params.has("gasPrice") ||
      params.has("evPrice") ||
      params.has("annualDistance")

    if (hasParams) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
    }
  }, [params])

  const handleImport = () => {
    if (!params) return

    try {
      // gas
      if (params.get("gasPrice")) setGasPrice(Number(params.get("gasPrice")))
      if (params.get("gasEfficiency"))
        setGasEfficiency(Number(params.get("gasEfficiency")))
      if (params.get("gasEfficiencyUnit"))
        setGasEfficiencyUnit(params.get("gasEfficiencyUnit") as GasUnit)
      if (params.get("gasFuelPrice"))
        setGasFuelPrice(Number(params.get("gasFuelPrice")))
      if (params.get("gasFuelPriceUnit"))
        setGasFuelPriceUnit(params.get("gasFuelPriceUnit") as FuelPriceUnit)
      if (params.get("gasExpenses"))
        setGasExpenses(JSON.parse(params.get("gasExpenses")!))

      // ev
      if (params.get("evPrice")) setEvPrice(Number(params.get("evPrice")))
      if (params.get("evEfficiency"))
        setEvEfficiency(Number(params.get("evEfficiency")))
      if (params.get("evEfficiencyUnit"))
        setEvEfficiencyUnit(params.get("evEfficiencyUnit") as EVUnit)
      if (params.get("elecPrice")) setElecPrice(Number(params.get("elecPrice")))
      if (params.get("evExpenses"))
        setEvExpenses(JSON.parse(params.get("evExpenses")!))

      // general
      if (params.get("annualDistance"))
        setAnnualDistance(Number(params.get("annualDistance")))
      if (params.get("distanceUnit"))
        setDistanceUnit(params.get("distanceUnit") as DistanceUnit)
      if (params.get("currency")) setCurrency(params.get("currency")!)

      setImported(true)
      setTimeout(() => setVisible(false), 1_000)

      // optional: clean URL after import
      window.history.replaceState({}, "", window.location.pathname)
    } catch {
      // ignore bad input
    }
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="mb-4 overflow-hidden"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
        >
          <Alert>
            {imported ? <CheckCircle2Icon /> : <InfoIcon />}

            <AlertTitle>
              {imported ? "Values imported" : "Shared comparison detected"}
            </AlertTitle>

            <AlertDescription className="flex flex-col gap-2">
              {imported ? (
                <span>
                  Your calculator has been updated with shared values.
                </span>
              ) : (
                <span>
                  This link contains a saved EV vs gas comparison. You can
                  import the values to view it.
                </span>
              )}

              {!imported && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleImport}>
                    Import
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisible(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
