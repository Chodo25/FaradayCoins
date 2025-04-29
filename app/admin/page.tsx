"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateUserRole } from "../actions/update-role"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Users, UserPlus, Settings, BarChart } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [email, setEmail] = useState("m.chiodini25@gmail.com")
  const [role, setRole] = useState<"teacher" | "student">("teacher")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const handleUpdateRole = async () => {
    setLoading(true)
    setResult(null)

    try {
      const result = await updateUserRole(email, role)
      setResult(result)

      if (result.success) {
        toast({
          title: "Rol actualizado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message })
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
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra los usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Accede al panel completo de gestión de usuarios donde podrás crear, editar y eliminar usuarios.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/users" className="w-full">
              <Button className="w-full">Gestionar Usuarios</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Actualizar Rol
            </CardTitle>
            <CardDescription>Actualiza el rol de un usuario existente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "teacher" | "student")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher">Docente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student">Estudiante</Label>
                </div>
              </RadioGroup>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateRole} disabled={loading || !email} className="w-full">
              {loading ? "Actualizando..." : "Actualizar Rol"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription>Administra la configuración general del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configura parámetros generales del sistema, como correos electrónicos, notificaciones y más.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/settings" className="w-full">
              <Button variant="outline" className="w-full">
                Configuración
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Reportes y Estadísticas
            </CardTitle>
            <CardDescription>Visualiza estadísticas del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Accede a reportes detallados sobre el uso del sistema, actividad de usuarios y más.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/reports" className="w-full">
              <Button variant="outline" className="w-full">
                Ver Reportes
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
