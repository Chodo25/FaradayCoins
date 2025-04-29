"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { ArrowLeft, Mail, Shield } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(true)
  const { toast } = useToast()

  const handleToggleEmailConfirmation = async () => {
    setLoading(true)

    try {
      // Esta es una llamada simulada - en producción necesitarías una API real
      // que use la API administrativa de Supabase para cambiar esta configuración
      const response = await fetch("/api/admin/update-email-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enableEmailConfirmation: !emailConfirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la configuración")
      }

      setEmailConfirmation(!emailConfirmation)
      toast({
        title: "Configuración actualizada",
        description: `La confirmación por correo electrónico ha sido ${
          !emailConfirmation ? "activada" : "desactivada"
        }`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Link href="/admin" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Configuración de Correo Electrónico
            </CardTitle>
            <CardDescription>Administra las opciones de correo electrónico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-confirmation" className="flex flex-col space-y-1">
                <span>Confirmación por correo</span>
                <span className="font-normal text-xs text-muted-foreground">
                  {emailConfirmation
                    ? "Los usuarios deben confirmar su correo al registrarse"
                    : "Los usuarios pueden iniciar sesión sin confirmar su correo"}
                </span>
              </Label>
              <Switch
                id="email-confirmation"
                checked={emailConfirmation}
                onCheckedChange={handleToggleEmailConfirmation}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Configura opciones de seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                <span>Autenticación de dos factores</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Requiere verificación adicional al iniciar sesión
                </span>
              </Label>
              <Switch id="two-factor" disabled />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="password-complexity" className="flex flex-col space-y-1">
                <span>Complejidad de contraseñas</span>
                <span className="font-normal text-xs text-muted-foreground">Requiere contraseñas más seguras</span>
              </Label>
              <Switch id="password-complexity" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
