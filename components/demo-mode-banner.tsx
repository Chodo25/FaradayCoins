"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface DemoModeBannerProps {
  error?: string | null
}

export function DemoModeBanner({ error }: DemoModeBannerProps) {
  return (
    <Alert variant="warning" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Problema de configuración detectado</AlertTitle>
      <AlertDescription>
        {error ? (
          <>
            <p className="mb-2">Se ha detectado un error: {error}</p>
            <p>
              Este error puede deberse a problemas con las políticas de seguridad (RLS) en Supabase. Para resolverlo,
              necesitas configurar correctamente las políticas de acceso en tu base de datos.
            </p>
          </>
        ) : (
          <>
            Si estás experimentando problemas con los permisos de Supabase, es posible que necesites configurar las
            políticas de seguridad (RLS) en tu base de datos. Consulta la documentación para más información.
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
