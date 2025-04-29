"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const handleUpdateEmailSettings = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/update-email-settings")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la configuración de correo electrónico")
      }

      setResult({
        success: true,
        message:
          "Configuración de correo electrónico actualizada correctamente. La confirmación por correo electrónico ya no es requerida.",
      })

      toast({
        title: "Configuración actualizada",
        description: "La configuración de correo electrónico ha sido actualizada correctamente.",
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })

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
    <div className="container flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración de Correo Electrónico</CardTitle>
          <CardDescription>
            Administra la configuración de correo electrónico para el registro de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Si los usuarios no están recibiendo correos electrónicos de confirmación, puedes desactivar este
              requisito. Esto permitirá que los usuarios se registren sin necesidad de confirmar su correo electrónico.
            </p>
          </div>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "bg-green-50 text-green-800 border-green-200" : ""}
            >
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateEmailSettings} disabled={loading} className="w-full">
            {loading ? "Actualizando..." : "Desactivar confirmación por correo"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
