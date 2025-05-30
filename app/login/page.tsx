"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Tentar login direto
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Se o erro for de email não confirmado, tentar registrar o usuário via API
      if (
        signInError &&
        (signInError.message.includes("Email not confirmed") ||
          signInError.message.includes("Invalid login credentials"))
      ) {
        try {
          // Tentar registrar/confirmar via API
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, action: "register" }),
          })

          if (response.ok) {
            // Tentar login novamente após registro
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (retryError) {
              setError(retryError.message)
              setLoading(false)
              return
            }

            // Login bem-sucedido
            router.push("/dashboard")
            return
          }
        } catch (apiError) {
          console.error("Erro ao chamar API de registro:", apiError)
        }
      }

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Login bem-sucedido
      router.push("/dashboard")
    } catch (err) {
      setError("Ocorreu um erro ao fazer login. Tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020818]">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo width={180} height={180} />
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Login</CardTitle>
              <CardDescription className="text-center">Entre com sua conta para acessar o painel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

                <Button
                  type="submit"
                  className="w-full bg-primary-accent hover:bg-primary-accent/90"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-primary-accent hover:underline">
                  Registre-se
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
