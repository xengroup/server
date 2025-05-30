import { createClient } from "@supabase/supabase-js"

// Obter as variáveis de ambiente ou usar valores padrão para desenvolvimento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verificar se estamos em ambiente de desenvolvimento sem Supabase configurado
const isDevWithoutSupabase = process.env.NODE_ENV === "development" && (!supabaseUrl || !supabaseAnonKey)

// Criar cliente Supabase ou um mock para desenvolvimento
export const supabase = isDevWithoutSupabase ? createMockSupabaseClient() : createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do Supabase
export interface TradeDay {
  id?: string
  user_id: string
  day: number
  month: number
  year: number
  date: string
  capital: number
  initial_value: number | null
  final_value: number | null
  profit_amount: number | null
  profit_percent: number | null
  created_at?: string
  updated_at?: string
}

export interface UserSettings {
  id?: string
  user_id: string
  capital: number
  entry: number
  target: number
  name?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

export interface MonthlySummary {
  id?: string
  user_id: string
  month: number
  year: number
  total_operations: number
  profit_days: number
  loss_days: number
  total_profit: number
  profit_percent: number
  average_daily_profit: number
  best_day_number: number | null
  best_day_profit: number | null
  worst_day_number: number | null
  worst_day_profit: number | null
  created_at?: string
  updated_at?: string
}

// Atualizar a função getUserSettings para tentar criar configurações via API se não encontrar

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

    if (error) {
      // Se não encontrou configurações, tentar criar via API
      if (error.code === "PGRST116") {
        try {
          // Chamar a API para criar configurações iniciais
          const response = await fetch("/api/create-user-settings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          })

          if (response.ok) {
            // Tentar buscar novamente após criar
            const { data: newData, error: newError } = await supabase
              .from("user_settings")
              .select("*")
              .eq("user_id", userId)
              .single()

            if (!newError) {
              return newData
            }
          }
        } catch (apiError) {
          console.error("Erro ao chamar API para criar configurações:", apiError)
        }

        // Se ainda não conseguiu, retornar configurações padrão
        return {
          user_id: userId,
          capital: 100,
          entry: 5,
          target: 6,
        }
      }

      console.error("Erro ao buscar configurações do usuário:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exceção ao buscar configurações:", error)
    return null
  }
}

export async function createOrUpdateUserSettings(settings: UserSettings): Promise<UserSettings | null> {
  try {
    // Verificar se já existem configurações para este usuário
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", settings.user_id)
      .single()

    if (existingSettings) {
      // Atualizar configurações existentes
      const { data, error } = await supabase
        .from("user_settings")
        .update({
          capital: settings.capital,
          entry: settings.entry,
          target: settings.target,
        })
        .eq("user_id", settings.user_id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar configurações do usuário:", error)
        return settings // Retornar as configurações originais mesmo com erro
      }

      return data
    } else {
      // Criar novas configurações
      const { data, error } = await supabase.from("user_settings").insert([settings]).select().single()

      if (error) {
        console.error("Erro ao criar configurações do usuário:", error)
        return settings // Retornar as configurações originais mesmo com erro
      }

      return data
    }
  } catch (error) {
    console.error("Exceção ao salvar configurações:", error)
    return settings
  }
}

export async function getTradeDays(userId: string, month: number, year: number): Promise<TradeDay[]> {
  try {
    const { data, error } = await supabase
      .from("trade_days")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year)
      .order("day", { ascending: true })

    if (error) {
      console.error("Erro ao buscar dias de trade:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exceção ao buscar dias de trade:", error)
    return []
  }
}

export async function createOrUpdateTradeDay(tradeDay: TradeDay): Promise<TradeDay | null> {
  try {
    // Verificar se já existe um registro para este dia, mês e ano
    const { data: existingDay } = await supabase
      .from("trade_days")
      .select("id")
      .eq("user_id", tradeDay.user_id)
      .eq("day", tradeDay.day)
      .eq("month", tradeDay.month)
      .eq("year", tradeDay.year)
      .single()

    if (existingDay) {
      // Atualizar dia existente
      const { data, error } = await supabase
        .from("trade_days")
        .update({
          capital: tradeDay.capital,
          initial_value: tradeDay.initial_value,
          final_value: tradeDay.final_value,
          profit_amount: tradeDay.profit_amount,
          profit_percent: tradeDay.profit_percent,
        })
        .eq("id", existingDay.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar dia de trade:", error)
        return tradeDay
      }

      return data
    } else {
      // Criar novo dia
      const { data, error } = await supabase.from("trade_days").insert([tradeDay]).select().single()

      if (error) {
        console.error("Erro ao criar dia de trade:", error)
        return tradeDay
      }

      return data
    }
  } catch (error) {
    console.error("Exceção ao salvar dia de trade:", error)
    return tradeDay
  }
}

export async function getMonthlySummary(userId: string, month: number, year: number): Promise<MonthlySummary | null> {
  try {
    const { data, error } = await supabase
      .from("monthly_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 é o código para "não encontrado"
      console.error("Erro ao buscar resumo mensal:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exceção ao buscar resumo mensal:", error)
    return null
  }
}

export async function createOrUpdateMonthlySummary(summary: MonthlySummary): Promise<MonthlySummary | null> {
  try {
    // Verificar se já existe um resumo para este mês e ano
    const { data: existingSummary } = await supabase
      .from("monthly_summaries")
      .select("id")
      .eq("user_id", summary.user_id)
      .eq("month", summary.month)
      .eq("year", summary.year)
      .single()

    if (existingSummary) {
      // Atualizar resumo existente
      const { data, error } = await supabase
        .from("monthly_summaries")
        .update({
          total_operations: summary.total_operations,
          profit_days: summary.profit_days,
          loss_days: summary.loss_days,
          total_profit: summary.total_profit,
          profit_percent: summary.profit_percent,
          average_daily_profit: summary.average_daily_profit,
          best_day_number: summary.best_day_number,
          best_day_profit: summary.best_day_profit,
          worst_day_number: summary.worst_day_number,
          worst_day_profit: summary.worst_day_profit,
        })
        .eq("id", existingSummary.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar resumo mensal:", error)
        return summary
      }

      return data
    } else {
      // Criar novo resumo
      const { data, error } = await supabase.from("monthly_summaries").insert([summary]).select().single()

      if (error) {
        console.error("Erro ao criar resumo mensal:", error)
        return summary
      }

      return data
    }
  } catch (error) {
    console.error("Exceção ao salvar resumo mensal:", error)
    return summary
  }
}

// Criar um cliente mock para ambientes sem Supabase configurado
function createMockSupabaseClient() {
  console.warn("Usando cliente Supabase mock devido à falta de variáveis de ambiente")

  // ID de usuário simulado para desenvolvimento
  const mockUserId = "mock-user-id"

  // Armazenamento em memória para dados simulados
  const mockStorage = {
    users: new Map(),
    settings: new Map(),
    tradeDays: new Map(),
    summaries: new Map(),
  }

  return {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            user: { id: mockUserId, email: "dev@example.com" },
          },
        },
        error: null,
      }),
      signInWithPassword: async ({ email }: { email: string }) => ({
        data: {
          user: { id: mockUserId, email },
          session: { user: { id: mockUserId, email } },
        },
        error: null,
      }),
      signUp: async ({ email }: { email: string }) => ({
        data: { user: { id: mockUserId, email } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: (field: string, value: any) => ({
          single: async () => {
            if (table === "user_settings") {
              return {
                data: {
                  id: "mock-settings-id",
                  user_id: mockUserId,
                  capital: 100,
                  entry: 5,
                  target: 6,
                },
                error: null,
              }
            }
            return { data: null, error: { code: "PGRST116" } }
          },
          order: () => ({
            data: [],
            error: null,
          }),
        }),
        single: async () => ({
          data: null,
          error: { code: "PGRST116" },
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: { id: "mock-id" },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: { id: "mock-id" },
              error: null,
            }),
          }),
        }),
      }),
    }),
  }
}
