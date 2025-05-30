"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpRight, BarChart3, DollarSign, Edit, LogOut, RefreshCw, User } from "lucide-react"
import { MonthSelector } from "@/components/month-selector"
import { Footer } from "@/components/footer"
import { MonthlySummary } from "@/components/monthly-summary"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"
import {
  type TradeDay as TradeDayType,
  type MonthlySummary as MonthlySummaryType,
  getUserSettings,
  createOrUpdateUserSettings,
  getTradeDays,
  createOrUpdateTradeDay,
  createOrUpdateMonthlySummary,
} from "@/lib/supabase"

interface TradeDay {
  id: number
  date: string
  day: number
  capital: number
  initial: string
  final: string
  profitPercent: number
  profitAmount: number
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [capital, setCapital] = useState(100)
  const [totalProfit, setTotalProfit] = useState(0)
  const [profitPercent, setProfitPercent] = useState(0)
  const [accumulatedCapital, setAccumulatedCapital] = useState(100)
  const [target, setTarget] = useState(6)
  const [entry, setEntry] = useState(5)
  const [tradeDays, setTradeDays] = useState<TradeDay[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [monthlySummary, setMonthlySummary] = useState({
    totalOperations: 0,
    profitDays: 0,
    lossDays: 0,
    totalProfit: 0,
    profitPercent: 0,
    averageDailyProfit: 0,
    bestDay: { day: 0, profit: 0 },
    worstDay: { day: 0, profit: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Carregar configurações do usuário
  useEffect(() => {
    if (!user) return

    const loadUserSettings = async () => {
      const settings = await getUserSettings(user.id)
      if (settings) {
        setCapital(settings.capital)
        setEntry(settings.entry)
        setTarget(settings.target)
      }
    }

    loadUserSettings()
  }, [user])

  // Carregar dias de trade para o mês selecionado
  useEffect(() => {
    if (!user) return

    const loadTradeDays = async () => {
      setLoading(true)

      // Buscar dias de trade do Supabase
      const dbTradeDays = await getTradeDays(user.id, month, year)

      // Se não houver dias de trade para este mês, inicializar com valores padrão
      if (dbTradeDays.length === 0) {
        initializeTradeDays(year, month)
      } else {
        // Converter os dias de trade do banco para o formato da UI
        const uiTradeDays: TradeDay[] = dbTradeDays.map((day) => ({
          id: day.day,
          day: day.day,
          date: day.date,
          capital: day.capital,
          initial: day.initial_value?.toString() || "",
          final: day.final_value?.toString() || "",
          profitAmount: day.profit_amount || 0,
          profitPercent: day.profit_percent || 0,
        }))

        setTradeDays(uiTradeDays)
        calculateTotals(uiTradeDays)
      }

      setLoading(false)
    }

    loadTradeDays()
  }, [user, year, month])

  const initializeTradeDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const initialDays: TradeDay[] = []

    for (let i = 1; i <= daysInMonth; i++) {
      const day = i < 10 ? `0${i}` : `${i}`
      const monthStr = month < 10 ? `0${month}` : `${month}`

      initialDays.push({
        id: i,
        day: i,
        date: `${day}/${monthStr}/${year}`,
        capital: capital,
        initial: "",
        final: "",
        profitPercent: 0,
        profitAmount: 0,
      })
    }

    setTradeDays(initialDays)
    calculateTotals(initialDays)
    calculateMonthlySummary(initialDays)
  }

  const updateTradeDay = async (id: number, field: string, value: string) => {
    if (!user) return

    setTradeDays((prevDays) => {
      const newDays = [...prevDays]
      const dayIndex = newDays.findIndex((day) => day.id === id)

      if (dayIndex !== -1) {
        const day = { ...newDays[dayIndex] }

        if (field === "initial" || field === "final") {
          day[field] = value

          // Calcular lucro se ambos os valores estiverem preenchidos
          if (day.initial && day.final) {
            const initialValue = Number.parseFloat(day.initial) || 0
            const finalValue = Number.parseFloat(day.final) || 0

            day.profitAmount = finalValue - initialValue
            day.profitPercent = initialValue !== 0 ? (day.profitAmount / initialValue) * 100 : 0
          }
        }

        newDays[dayIndex] = day

        // Recalcular totais
        calculateTotals(newDays)
        calculateMonthlySummary(newDays)

        // Salvar no Supabase
        saveTradeDay(day)
      }

      return newDays
    })
  }

  const saveTradeDay = async (day: TradeDay) => {
    if (!user) return

    setSaving(true)

    try {
      // Converter para o formato do banco
      const dbTradeDay: TradeDayType = {
        user_id: user.id,
        day: day.day,
        month: month,
        year: year,
        date: day.date,
        capital: day.capital,
        initial_value: day.initial ? Number.parseFloat(day.initial) : null,
        final_value: day.final ? Number.parseFloat(day.final) : null,
        profit_amount: day.profitAmount,
        profit_percent: day.profitPercent,
      }

      await createOrUpdateTradeDay(dbTradeDay)
    } catch (error) {
      console.error("Erro ao salvar dia de trade:", error)
    } finally {
      setSaving(false)
    }
  }

  const calculateTotals = (days: TradeDay[]) => {
    let totalProfitValue = 0

    days.forEach((day) => {
      totalProfitValue += day.profitAmount
    })

    setTotalProfit(totalProfitValue)
    setProfitPercent(capital !== 0 ? (totalProfitValue / capital) * 100 : 0)
    setAccumulatedCapital(capital + totalProfitValue)
  }

  const calculateMonthlySummary = async (days: TradeDay[]) => {
    if (!user) return

    // Filtrar apenas dias com operações (que têm valores inicial e final)
    const operatedDays = days.filter((day) => day.initial && day.final)

    if (operatedDays.length === 0) {
      setMonthlySummary({
        totalOperations: 0,
        profitDays: 0,
        lossDays: 0,
        totalProfit: 0,
        profitPercent: 0,
        averageDailyProfit: 0,
        bestDay: { day: 0, profit: 0 },
        worstDay: { day: 0, profit: 0 },
      })

      // Não salvar resumo mensal se não houver operações
      return
    }

    const profitDays = operatedDays.filter((day) => day.profitAmount > 0).length
    const lossDays = operatedDays.filter((day) => day.profitAmount < 0).length

    let totalProfit = 0
    operatedDays.forEach((day) => {
      totalProfit += day.profitAmount
    })

    // Encontrar o melhor e o pior dia
    let bestDay = { day: 0, profit: Number.NEGATIVE_INFINITY }
    let worstDay = { day: 0, profit: Number.POSITIVE_INFINITY }

    operatedDays.forEach((day) => {
      if (day.profitAmount > bestDay.profit) {
        bestDay = { day: day.day, profit: day.profitAmount }
      }
      if (day.profitAmount < worstDay.profit) {
        worstDay = { day: day.day, profit: day.profitAmount }
      }
    })

    // Se não houver dias com lucro ou prejuízo, definir valores padrão
    if (bestDay.profit === Number.NEGATIVE_INFINITY) bestDay = { day: 0, profit: 0 }
    if (worstDay.profit === Number.POSITIVE_INFINITY) worstDay = { day: 0, profit: 0 }

    const summary = {
      totalOperations: operatedDays.length,
      profitDays,
      lossDays,
      totalProfit,
      profitPercent: capital !== 0 ? (totalProfit / capital) * 100 : 0,
      averageDailyProfit: operatedDays.length > 0 ? totalProfit / operatedDays.length : 0,
      bestDay,
      worstDay,
    }

    setMonthlySummary(summary)

    // Salvar resumo mensal no Supabase
    try {
      const dbSummary: MonthlySummaryType = {
        user_id: user.id,
        month: month,
        year: year,
        total_operations: summary.totalOperations,
        profit_days: summary.profitDays,
        loss_days: summary.lossDays,
        total_profit: summary.totalProfit,
        profit_percent: summary.profitPercent,
        average_daily_profit: summary.averageDailyProfit,
        best_day_number: summary.bestDay.day,
        best_day_profit: summary.bestDay.profit,
        worst_day_number: summary.worstDay.day,
        worst_day_profit: summary.worstDay.profit,
      }

      await createOrUpdateMonthlySummary(dbSummary)
    } catch (error) {
      console.error("Erro ao salvar resumo mensal:", error)
    }
  }

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }

  const handleReset = () => {
    initializeTradeDays(year, month)
  }

  const updateCapital = async (newCapital: number) => {
    if (!user) return

    setCapital(newCapital)

    // Atualizar configurações do usuário
    try {
      await createOrUpdateUserSettings({
        user_id: user.id,
        capital: newCapital,
        entry,
        target,
      })

      // Reinicializar dias de trade com o novo capital
      initializeTradeDays(year, month)
    } catch (error) {
      console.error("Erro ao atualizar capital:", error)
    }
  }

  const handleCapitalEdit = () => {
    const newCapital = prompt("Digite o novo valor do capital:", capital.toString())
    if (newCapital) {
      const value = Number.parseFloat(newCapital)
      if (!isNaN(value) && value > 0) {
        updateCapital(value)
      }
    }
  }

  const goToProfile = () => {
    router.push("/profile")
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen dark:bg-[#020818] bg-white">
        <header className="p-4 flex justify-between items-center border-b shadow-sm">
          <div className="flex items-center gap-2">
            <Logo width={150} height={150} className="ml-2" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Perfil do usuário" onClick={goToProfile}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Sair" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Resumo Financeiro</h2>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              Redefinir
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <span>Capital</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={handleCapitalEdit}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold">R$ {capital.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-accent opacity-70" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Lucro Total</div>
                  <p className="text-2xl font-bold">R$ {totalProfit.toFixed(2)}</p>
                </div>
                <ArrowUpRight className={`h-8 w-8 ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">% de Lucro</div>
                  <p className="text-2xl font-bold">{profitPercent.toFixed(2)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Capital Acumulado</div>
                  <p className="text-2xl font-bold">R$ {accumulatedCapital.toFixed(2)}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
          </div>

          <MonthSelector currentYear={year} currentMonth={month} onMonthChange={handleMonthChange} />

          <MonthlySummary {...monthlySummary} />

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-accent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground text-sm">
                    <th className="p-2">DIA</th>
                    <th className="p-2">DATA</th>
                    <th className="p-2">CAPITAL</th>
                    <th className="p-2">INICIAL</th>
                    <th className="p-2">FINAL</th>
                    <th className="p-2">% LUCRO</th>
                    <th className="p-2">R$ LUCRO</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeDays.map((day) => (
                    <tr key={day.id} className="border-t">
                      <td className="p-2">{day.day}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">{day.date}</div>
                      </td>
                      <td className="p-2">R$ {day.capital.toFixed(2)}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={day.initial}
                          onChange={(e) => updateTradeDay(day.id, "initial", e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={day.final}
                          onChange={(e) => updateTradeDay(day.id, "final", e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td
                        className={`p-2 ${day.profitPercent > 0 ? "text-green-500" : day.profitPercent < 0 ? "text-red-500" : ""}`}
                      >
                        {day.profitPercent.toFixed(2)}%
                      </td>
                      <td
                        className={`p-2 ${day.profitAmount > 0 ? "text-green-500" : day.profitAmount < 0 ? "text-red-500" : ""}`}
                      >
                        R$ {day.profitAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {saving && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
              Salvando...
            </div>
          )}

          <Footer />
        </div>
      </main>
    </ProtectedRoute>
  )
}
