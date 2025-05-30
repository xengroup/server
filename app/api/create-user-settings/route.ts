import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 })
    }

    // Verificar se já existem configurações para este usuário
    const { data: existingSettings } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingSettings) {
      return NextResponse.json({ success: true, message: "Configurações já existem" })
    }

    // Criar configurações iniciais
    const { data, error } = await supabaseAdmin.from("user_settings").insert([
      {
        user_id: userId,
        capital: 100,
        entry: 5,
        target: 6,
      },
    ])

    if (error) {
      console.error("Erro ao criar configurações iniciais:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
