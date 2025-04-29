"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Lock, Loader2, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@supadmin.com")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Verificar si hay mensajes de error en la URL
  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "unauthorized") {
      setErrorMessage("No tienes permisos para acceder al panel de administración")
    } else if (error === "database_error") {
      setErrorMessage("Hubo un error al verificar tus permisos. Por favor, intenta de nuevo más tarde.")
    }
  }, [searchParams])

  // Verificar si ya hay una sesión de administrador activa
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          // Verificar si el usuario es administrador
          const { data: userData, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.session.user.id)
            .single()

          if (!error && userData && userData.role === "admin") {
            // Si es administrador, redirigir al panel de administración
            router.push("/admin")
          }
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
      }
    }

    checkAdminSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      // Iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.session) {
        // Verificar si el usuario existe y es administrador
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", data.session.user.id)
          .single()

        if (userError) {
          // Si hay un error al buscar el usuario, mostrar mensaje
          setInfoMessage(
            "Tu cuenta existe pero no se pudo verificar tu rol. Intenta configurar el usuario administrador primero.",
          )
          throw new Error("Error al verificar rol de usuario")
        }

        if (!userData) {
          // Si el usuario no existe en la tabla users, mostrar mensaje
          setInfoMessage(
            "Tu cuenta existe pero no tiene un perfil en el sistema. Intenta configurar el usuario administrador primero.",
          )
          throw new Error("Usuario no encontrado en la base de datos")
        }

        if (userData.role !== "admin") {
          // Si el usuario no es administrador, mostrar mensaje
          await supabase.auth.signOut()
          throw new Error("No tienes permisos de administrador")
        }

        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al panel de administración",
        })

        // Redirigir al panel de administración
        router.push("/admin")
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Error al iniciar sesión. Verifica tus credenciales.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión como administrador</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {infoMessage && (
          <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Acceso Administrativo
            </CardTitle>
            <CardDescription>Ingresa tus credenciales de administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-xs text-muted-foreground text-center w-full">
              Este acceso está restringido solo para administradores del sistema.
            </p>
            <Link href="/admin/setup" className="w-full">
              <Button variant="outline" className="w-full text-sm">
                Configurar Usuario Administrador
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
