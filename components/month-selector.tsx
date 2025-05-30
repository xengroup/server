"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
  currentYear: number
  currentMonth: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthSelector({ currentYear, currentMonth, onMonthChange }: MonthSelectorProps) {
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)

  const handlePreviousMonth = () => {
    let newMonth = month - 1
    let newYear = year

    if (newMonth < 1) {
      newMonth = 12
      newYear = year - 1
    }

    setMonth(newMonth)
    setYear(newYear)
    onMonthChange(newYear, newMonth)
  }

  const handleNextMonth = () => {
    let newMonth = month + 1
    let newYear = year

    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }

    setMonth(newMonth)
    setYear(newYear)
    onMonthChange(newYear, newMonth)
  }

  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return date.toLocaleString("pt-BR", { month: "long" })
  }

  return (
    <div className="flex items-center justify-between bg-card rounded-lg p-4 mb-6">
      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-xl font-bold">
        {getMonthName(month)} {year}
      </div>
      <Button variant="outline" size="icon" onClick={handleNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
