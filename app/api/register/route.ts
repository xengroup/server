import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Criar usuário com confirmação automática
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: name || "",
        phone: phone || "",
      },
    })

    if (error) {
      // Se o erro for de usuário já existente, tentar atualizar para confirmar o email
      if (error.message.includes("already exists")) {
        try {
          // Buscar usuários (limitado a 1) e filtrar pelo email
          const { data: users } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          })

          const existingUser = users.users.find((user) => user.email === email)

          if (existingUser) {
            // Atualizar usuário para confirmar email e adicionar metadados
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              email_confirm: true,
              user_metadata: {
                name: name || existingUser.user_metadata?.name || "",
                phone: phone || existingUser.user_metadata?.phone || "",
              },
            })

            // Verificar se já existem configurações para este usuário
            const { data: existingSettings } = await supabaseAdmin
              .from("user_settings")
              .select("id")
              .eq("user_id", existingUser.id)
              .single()

            if (!existingSettings) {
              // Criar configurações iniciais se não existirem
              await supabaseAdmin.from("user_settings").insert([
                {
                  user_id: existingUser.id,
                  capital: 100,
                  entry: 5,
                  target: 6,
                  name: name || "",
                  phone: phone || "",
                },
              ])
            } else {
              // Atualizar configurações existentes com os novos dados
              await supabaseAdmin
                .from("user_settings")
                .update({
                  name: name || "",
                  phone: phone || "",
                })
                .eq("user_id", existingUser.id)
            }

            return NextResponse.json({
              success: true,
              message: "Usuário atualizado com sucesso",
              userId: existingUser.id,
            })
          }
        } catch (updateError) {
          console.error("Erro ao atualizar usuário existente:", updateError)
        }
      }

      console.error("Erro ao criar usuário:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    // Criar configurações iniciais
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

    return NextResponse.json({
      success: true,
      userId: data.user.id,
    })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
