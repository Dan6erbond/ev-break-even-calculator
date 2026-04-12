"use client"

import { Check, Copy, Share2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  DistanceUnit,
  EVExpense,
  EVUnit,
  FuelPriceUnit,
  GasExpense,
  GasUnit,
} from "@/lib/calculator"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

function buildShareUrl(params: {
  gasPrice: number
  gasEfficiency: number
  gasEfficiencyUnit: GasUnit
  gasFuelPrice: number
  gasFuelPriceUnit: FuelPriceUnit
  gasExpenses: GasExpense[]

  evPrice: number
  evEfficiency: number
  evEfficiencyUnit: EVUnit
  elecPrice: number
  evExpenses: EVExpense[]

  annualDistance: number
  distanceUnit: DistanceUnit
  currency: string
}) {
  const url = new URL(window.location.href)

  const data = {
    ...params,
    gasExpenses: JSON.stringify(params.gasExpenses),
    evExpenses: JSON.stringify(params.evExpenses),
  }

  Object.entries(data).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

export function ShareButton({
  params,
}: {
  params: {
    gasPrice: number
    gasEfficiency: number
    gasEfficiencyUnit: GasUnit
    gasFuelPrice: number
    gasFuelPriceUnit: FuelPriceUnit
    gasExpenses: GasExpense[]

    evPrice: number
    evEfficiency: number
    evEfficiencyUnit: EVUnit
    elecPrice: number
    evExpenses: EVExpense[]

    annualDistance: number
    distanceUnit: DistanceUnit
    currency: string
  }
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = buildShareUrl(params)

  const handleShare = async () => {
    // 1. Native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EV Break-Even Comparison",
          text: "Check out this EV vs gas comparison",
          url,
        })
        return
      } catch {
        // user cancelled → fallback
      }
    }

    // 2. Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 3. Final fallback → dialog
      setOpen(true)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {/* Manual dialog fallback */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this comparison</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Input value={url} readOnly />
            <Button
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
