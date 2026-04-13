import { Button } from "@/components/ui/button"
import { fromKWh100km, toKWh100km, type EVUnit } from "@/lib/calculator"

export type EVPreset = {
  label: string
  efficiencyWhPerKm: number
}

export function EVPresetChip({
  label,
  efficiencyWhPerKm,
  unit,
  onSelect,
}: {
  label: string
  efficiencyWhPerKm: number
  unit: EVUnit
  onSelect: (value: number) => void
}) {
  // convert Wh/km → kWh/100km → user unit
  const kWh100km = toKWh100km(efficiencyWhPerKm, "Wh/km")
  const displayValue = fromKWh100km(kWh100km, unit)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="flex h-auto flex-col items-start px-3 py-2"
      onClick={() => onSelect(displayValue)}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {displayValue.toFixed(1)} {unit}
      </span>
    </Button>
  )
}
