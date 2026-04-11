import type { Dispatch, SetStateAction } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocalStorage } from "@uidotdev/usehooks"

export default function Expenses<T extends string>({
  expenses,
  setExpenses,
  expenseTypes,
  defaultExpenseType,
}: {
  expenses: { type: T; amount: number }[]
  setExpenses: Dispatch<SetStateAction<{ type: T; amount: number }[]>>
  expenseTypes: T[]
  defaultExpenseType: T
}) {
  const [currency] = useLocalStorage("currency", "$")

  const addExpense = () => {
    setExpenses((prev) => [...prev, { type: defaultExpenseType, amount: 0 }])
  }

  const updateExpense = (
    index: number,
    key: "type" | "amount",
    value: T | number
  ) => {
    setExpenses((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [key]: value } : exp))
    )
  }

  const removeExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Additional Annual Expenses
        </Label>

        <Button type="button" variant="outline" size="sm" onClick={addExpense}>
          Add Expense
        </Button>
      </div>

      {expenses.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No additional expenses added
        </p>
      )}

      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <div key={index} className="grid grid-cols-6 items-end gap-2">
            {/* Type */}
            <div className="col-span-3 space-y-2">
              <Label className="text-xs">Type</Label>
              <Select
                value={expense.type}
                onValueChange={(v) => v && updateExpense(index, "type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="col-span-2 space-y-2">
              <Label className="text-xs">{currency}/year</Label>
              <Input
                type="number"
                value={expense.amount}
                onChange={(e) =>
                  updateExpense(index, "amount", Number(e.target.value))
                }
              />
            </div>

            {/* Remove */}
            <div className="col-span-1">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeExpense(index)}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
