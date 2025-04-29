"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; userId?: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSetupAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/setup-admin")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al configurar el usuario administrador")
      }

      setResult({
        success: true,
        message: data.message || "Usuario administrador configurado correctamente",
        userId: data.userId,
      })

      toast({
        title: "Configuración exitosa",
        description: "El usuario administrador ha sido configurado correctamente",
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
          <CardTitle>Configuración de Administrador</CardTitle>
          <CardDescription>Configura el usuario administrador para acceder al panel de administración</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              Esta página creará o configurará el usuario administrador con las siguientes credenciales:
            </p>
            <div className="bg-gray-100 p-3 rounded-md">
              <p>
                <strong>Email:</strong> admin@supadmin.com
              </p>
              <p>
                <strong>Contraseña:</strong> Amerie24Orion
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Después de configurar el usuario, podrás iniciar sesión en el panel de administración.
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
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleSetupAdmin} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              "Configurar Usuario Administrador"
            )}
          </Button>
          {result && result.success && (
            <Link href="/admin/login" className="w-full">
              <Button variant="outline" className="w-full">
                Ir a Iniciar Sesión
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
