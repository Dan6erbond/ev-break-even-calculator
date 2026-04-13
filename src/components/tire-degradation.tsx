import { useEffect, useRef } from "react"

import type { DistanceUnit } from "@/lib/calculator"
import { Label } from "@/components/ui/label"
import { NumberInput } from "@/components/ui/number-input"
import { getNumberFormatParts } from "@/lib/utils"
import { useLocalStorage } from "@uidotdev/usehooks"

export default function TireDegradation({
  tireCost,
  setTireCost,
  tireLifespan,
  setTireLifespan,
}: {
  tireCost: number
  setTireCost: (v: number) => void
  tireLifespan: number
  setTireLifespan: (v: number) => void
}) {
  const [currency] = useLocalStorage("currency", "$")
  const [distanceUnit] = useLocalStorage<DistanceUnit>("distanceUnit", "Miles")
  const prevUnitRef = useRef<DistanceUnit>(distanceUnit)

  const [groupSeparator, decimalSeparator] = getNumberFormatParts()

  // Handle unit conversion when user switches between Miles/Kilometers
  useEffect(() => {
    const prevUnit = prevUnitRef.current

    if (prevUnit === distanceUnit) return

    let converted = tireLifespan

    if (prevUnit === "Miles" && distanceUnit === "Kilometers") {
      converted = tireLifespan * 1.60934
    } else if (prevUnit === "Kilometers" && distanceUnit === "Miles") {
      converted = tireLifespan / 1.60934
    }

    setTireLifespan(Number(converted.toFixed(0)))

    prevUnitRef.current = distanceUnit
  }, [distanceUnit, tireLifespan, setTireLifespan])

  return (
    <div className="space-y-3 border-t pt-4">
      <Label className="text-sm font-medium">Tire Costs</Label>

      <div className="grid grid-cols-2 gap-4">
        {/* Tire Cost */}
        <div className="space-y-2">
          <Label className="text-xs">Full Set Cost</Label>
          <NumberInput
            min={0}
            stepper={50}
            value={tireCost}
            onValueChange={(v) => v && setTireCost(v)}
            thousandSeparator={groupSeparator}
            decimalSeparator={decimalSeparator}
            decimalScale={2}
            prefix={currency + ""}
          />
        </div>

        {/* Tire Lifespan */}
        <div className="space-y-2">
          <Label className="text-xs">
            Lifespan ({distanceUnit === "Miles" ? "mi" : "km"})
          </Label>
          <NumberInput
            min={0}
            stepper={1000}
            value={tireLifespan}
            onValueChange={(v) => v && setTireLifespan(v)}
            thousandSeparator={groupSeparator}
            decimalSeparator={decimalSeparator}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Estimated tire lifespan based on driving distance. Used to calculate
        annual tire costs automatically.
      </p>
    </div>
  )
}
