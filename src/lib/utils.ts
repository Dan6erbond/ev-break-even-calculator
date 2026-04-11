import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getNumberFormatParts() {
  const parts = new Intl.NumberFormat(navigator.language).formatToParts(1000.1)

  const groupSeparator = parts.find((p) => p.type === "group")?.value
  const decimalSeparator = parts.find((p) => p.type === "decimal")?.value

  return [groupSeparator, decimalSeparator]
}
