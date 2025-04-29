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

    if (userError || (userData?.role !== "teacher" && userData?.role !== "admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener datos del cuerpo de la solicitud
    const { email, password, fullName, courseId } = await request.json()

    if (!email || !password || !fullName || !courseId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    // Crear registro en la tabla users
    const { error: userInsertError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      course_id: courseId,
      role: "student",
    })

    if (userInsertError) {
      return NextResponse.json({ error: userInsertError.message }, { status: 500 })
    }

    // Crear balance inicial
    const { error: balanceError } = await supabase.from("balances").insert({
      user_id: authData.user.id,
      coins: 0,
    })

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
