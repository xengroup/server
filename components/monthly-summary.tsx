import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, Calendar, CheckCircle, XCircle } from "lucide-react"

interface MonthlySummaryProps {
  totalOperations: number
  profitDays: number
  lossDays: number
  totalProfit: number
  profitPercent: number
  averageDailyProfit: number
  bestDay: {
    day: number
    profit: number
  }
  worstDay: {
    day: number
    profit: number
  }
}

export function MonthlySummary({
  totalOperations,
  profitDays,
  lossDays,
  totalProfit,
  profitPercent,
  averageDailyProfit,
  bestDay,
  worstDay,
}: MonthlySummaryProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Resumo Mensal</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Operações</p>
                <p className="text-2xl font-bold">{totalOperations}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{profitDays}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{lossDays}</span>
                  </div>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  R$ {totalProfit.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{profitPercent.toFixed(2)}% no mês</p>
              </div>
              {totalProfit >= 0 ? (
                <ArrowUpRight className="h-8 w-8 text-green-500" />
              ) : (
                <ArrowDownRight className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Média Diária</p>
                <p className={`text-2xl font-bold ${averageDailyProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  R$ {averageDailyProfit.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">por dia operado</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-accent flex items-center justify-center text-white font-bold">
                M
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Melhor/Pior Dia</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-sm">Dia {bestDay.day}:</span>
                <span className="text-sm font-bold text-green-500">R$ {bestDay.profit.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                <span className="text-sm">Dia {worstDay.day}:</span>
                <span className="text-sm font-bold text-red-500">R$ {worstDay.profit.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
