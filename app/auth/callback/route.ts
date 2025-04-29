import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Después de intercambiar el código por una sesión, verificar si el usuario existe en la tabla users
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      // Verificar si el usuario existe en la tabla users
      const { data: userData, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle()

      // Si el usuario no existe en la tabla users, redirigir al login con error
      if (error || !userData) {
        return NextResponse.redirect(new URL("/login?error=user_not_registered", request.url))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
