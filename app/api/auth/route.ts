import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, action } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Ação de login
    if (action === "login") {
      // Não podemos fazer login diretamente com o admin, então retornamos sucesso
      // e o cliente fará o login com o cliente normal
      return NextResponse.json({ success: true, action: "login" })
    }

    // Ação de registro
    if (action === "register") {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.some((user) => user.email === email)

      if (userExists) {
        return NextResponse.json(
          {
            error: "Este email já está cadastrado. Por favor, faça login ou use outro email.",
            code: "email_exists",
          },
          { status: 409 },
        )
      }

      // Criar usuário com confirmação automática
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || "",
          phone: phone || "",
        },
      })

      if (error) {
        console.error("Erro ao criar usuário:", error)

        if (error.message.includes("already") || error.message.includes("exists")) {
          return NextResponse.json(
            {
              error: "Este email já está cadastrado. Por favor, faça login ou use outro email.",
              code: "email_exists",
            },
            { status: 409 },
          )
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!data.user) {
        return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
      }

      // Criar configurações iniciais
      try {
        await supabaseAdmin.from("user_settings").insert([
          {
            user_id: data.user.id,
            capital: 100,
            entry: 5,
            target: 6,
            name: name || "",
            phone: phone || "",
          },
        ])
      } catch (settingsError) {
        console.error("Erro ao criar configurações:", settingsError)
        // Continuar mesmo com erro nas configurações
      }

      return NextResponse.json({
        success: true,
        userId: data.user.id,
        action: "register_success",
      })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
