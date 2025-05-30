"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Check, User, Mail, Lock, LogOut, Eye, EyeOff } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"
import { supabase } from "@/lib/supabase"
import { getUserSettings, createOrUpdateUserSettings } from "@/lib/supabase"

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Estados para controlar a visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || "")

      // Carregar dados do usuário do Supabase
      const loadUserData = async () => {
        try {
          // Carregar metadados do usuário
          const {
            data: { user: userData },
          } = await supabase.auth.getUser()
          if (userData?.user_metadata) {
            setName(userData.user_metadata.name || "")
            setPhone(userData.user_metadata.phone || "")
          }

          // Carregar configurações do usuário
          const settings = await getUserSettings(user.id)
          if (settings) {
            // Se não tiver nos metadados, usar das configurações
            if (!userData?.user_metadata?.name) {
              setName(settings.name || "")
            }
            if (!userData?.user_metadata?.phone) {
              setPhone(settings.phone || "")
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error)
        }
      }

      loadUserData()
    }
  }, [user])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(false)
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ email })

      if (error) {
        setEmailError(error.message)
      } else {
        setEmailSuccess(true)
        setTimeout(() => setEmailSuccess(false), 3000)
      }
    } catch (error) {
      setEmailError("Ocorreu um erro ao atualizar o email")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      // Primeiro, verificar a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      })

      if (signInError) {
        setPasswordError("Senha atual incorreta")
        setLoading(false)
        return
      }

      // Atualizar a senha
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch (error) {
      setPasswordError("Ocorreu um erro ao atualizar a senha")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setLoading(true)

    try {
      // Atualizar metadados do usuário
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { name, phone },
      })

      if (metadataError) {
        setProfileError(metadataError.message)
        setLoading(false)
        return
      }

      // Atualizar configurações do usuário
      if (user) {
        const settings = await getUserSettings(user.id)
        if (settings) {
          await createOrUpdateUserSettings({
            ...settings,
            name,
            phone,
          })
        }
      }

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      setProfileError("Ocorreu um erro ao atualizar o perfil")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar o número de telefone enquanto o usuário digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "") // Remove todos os caracteres não numéricos

    // Formata o número conforme o padrão brasileiro (XX) XXXXX-XXXX
    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`
      }
      if (value.length > 10) {
        value = `${value.slice(0, 10)}-${value.slice(10)}`
      }
    }

    setPhone(value)
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen dark:bg-[#020818] bg-white">
        <header className="p-4 flex justify-between items-center border-b shadow-sm">
          <div className="flex items-center gap-2">
            <Logo width={150} height={150} className="ml-2" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Perfil do usuário" onClick={() => router.push("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Sair" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="password">Senha</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription>Atualize suas informações pessoais.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Nome Completo
                        </label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-background"
                          placeholder="Digite seu nome completo"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Telefone
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="bg-background"
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      {profileError && <div className="text-red-500 text-sm">{profileError}</div>}
                      {profileSuccess && (
                        <div className="text-green-500 text-sm flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Informações atualizadas com sucesso!
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary-accent hover:bg-primary-accent/90"
                        disabled={loading}
                      >
                        {loading ? "Atualizando..." : "Atualizar Perfil"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="mr-2 h-5 w-5" />
                      Atualizar Email
                    </CardTitle>
                    <CardDescription>
                      Altere seu endereço de email. Você precisará confirmar o novo email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Novo Email
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

                      {emailError && <div className="text-red-500 text-sm">{emailError}</div>}
                      {emailSuccess && (
                        <div className="text-green-500 text-sm flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Email atualizado com sucesso! Verifique sua caixa de entrada para confirmar.
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary-accent hover:bg-primary-accent/90"
                        disabled={loading}
                      >
                        {loading ? "Atualizando..." : "Atualizar Email"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="mr-2 h-5 w-5" />
                      Alterar Senha
                    </CardTitle>
                    <CardDescription>Altere sua senha de acesso.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium">
                          Senha Atual
                        </label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium">
                          Nova Senha
                        </label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">
                          Confirmar Nova Senha
                        </label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
                      {passwordSuccess && (
                        <div className="text-green-500 text-sm flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Senha atualizada com sucesso!
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary-accent hover:bg-primary-accent/90"
                        disabled={loading}
                      >
                        {loading ? "Atualizando..." : "Atualizar Senha"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
