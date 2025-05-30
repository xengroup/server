import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Cliente Supabase com a chave de serviço (ignora RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Função para criar configurações iniciais de usuário
export async function createInitialUserSettings(userId: string) {
  try {
    // Verificar se já existem configurações para este usuário
    const { data: existingSettings } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingSettings) {
      return existingSettings
    }

    // Criar configurações iniciais
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .insert([
        {
          user_id: userId,
          capital: 100,
          entry: 5,
          target: 6,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar configurações iniciais do usuário:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("Exceção ao criar configurações iniciais:", err)
    return null
  }
}
