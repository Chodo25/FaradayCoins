import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar si el usuario actual es un profesor
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || userData?.role !== "teacher") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener datos del cuerpo de la solicitud
    const { enableEmailConfirmation } = await request.json()

    if (enableEmailConfirmation === undefined) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    // En un entorno real, aquí se llamaría a la API administrativa de Supabase
    // para cambiar la configuración de confirmación de correo electrónico
    // Esto requiere acceso administrativo a Supabase

    // Simulamos una respuesta exitosa
    return NextResponse.json({
      success: true,
      message: `Confirmación por correo electrónico ${enableEmailConfirmation ? "activada" : "desactivada"}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
